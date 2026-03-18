# Unified Search

4-phase pipeline: LLM plan → code execute → code enrich → hybrid rank.

Phase 1 and Phase 4 use `adk.agent()` from `@alva/adk` as structured
completion (no tools, maxTurns=1). See [adk.md](adk.md) for the full ADK API
reference.

Use for topic-based discovery. For subscriptions to specific accounts/channels,
use feed_widgets instead.

---

## SDK Modules

| SDK | Module | Purpose |
| --- | ------ | ------- |
| `searchGrokX` | `@arrays/data/widget-scrap/search-grok-x:v1.0.0` | Twitter/X — returns engagement directly. Supports `from_date`/`to_date` (YYYY-MM-DD). |
| `searchSerper` | `@arrays/data/widget-scrap/serper-search:v1.0.0` | Google index: News, YouTube, Reddit, Web. Use `tbs` for time, `site:` for platform. |
| `searchBrave` | `@arrays/data/widget-scrap/search-brave:v1.0.0` | Independent index. Use `freshness` for time. Do NOT use `result_filter:"discussions"` — returns 0. |
| `scrapeUrl` | `@arrays/data/widget-scrap/scrape-url:v1.0.0` | Enrichment only — scrape page to markdown. |

These are called directly by code, NOT exposed as ADK tools.

### SDK Return Field Reference (verified 2026-03-18)

**Serper** (`getSerperSearch`):
- `title`, `link`, `snippet`, `date` (ms — index/observed time, NOT publish time), `source` ("serper"), `observedAt` (ms)
- News also has: `imageUrl`
- Web/Reddit/YouTube also has: `position`

**Brave** (`searchBrave`):
- `title`, `url`, `description` (may contain HTML `<strong>` tags), `age` (string, e.g. "18 hours ago"), `date` (ms — index time), `result_type`, `source` ("brave_search")

**GrokX** (`searchGrokX`):
- `content`, `url`, `author_name`, `author_username`, `author_avatar`, `created_at` (ms or ISO string — real publish time), `like_count`, `retweet_count`, `reply_count`, `quote_count`, `author_verified`, `author_followers_count`

---

## Data Model

### Internal Metadata (not in feed schema)

| Field | Values | Purpose |
| ----- | ------ | ------- |
| `_engagement_status` | `"ok"` / `"missing"` / `"failed"` | Distinguishes "real 0 engagement" from "scrape failed" |
| `_time_confidence` | `"exact"` / `"approx"` / `"missing"` | Controls freshness weight decay |
| `_age_str` | string | Raw age string from Brave (e.g. "18 hours ago") for display fallback |

### Per-Source Defaults

| Source | `_engagement_status` | `_time_confidence` |
| ------ | -------------------- | ------------------- |
| Twitter | `"ok"` (GrokX provides engagement) | `"exact"` if `created_at > 0`, else `"missing"` |
| Reddit | `"ok"/"failed"` based on enrichment | `"exact"` if `created_utc` extracted, else `"approx"` from Brave age |
| YouTube | `"ok"/"failed"` based on enrichment | `"approx"` from Brave age, else `"missing"` |
| News | `"missing"` (no engagement metric) | `"approx"` from Brave age, else `"missing"` |

### Time Semantics

Only two time fields in feed schema:
- **`published_at`** (number, ms) — real publish time from source. 0 when unavailable.
- **`display_time`** (string) — computed before feed write. Frontend only reads this.

Display time format:

| Condition | Format |
| --------- | ------ |
| < 1 hour | `Nm ago` |
| < 24 hours | `Nh ago` |
| < 7 days | `Nd ago` |
| >= 7 days | `Mon DD` (e.g. "Mar 15") |
| No time info but has `_age_str` | Pass through Brave age string |

---

## Phase 0: Entity Context (Code)

Code-maintained alias map. LLM does NOT invent aliases — it only expands
search angles.

```javascript
const entityContext = {
  canonical_name: "NVIDIA",
  ticker: "NVDA",                   // real trading symbol only; "" for non-ticker entities
  aliases: ["NVIDIA", "$NVDA", "Nvidia"],
  related_terms: ["AI chips", "GPU", "data center"],
  excludeDomains: [],               // optional: e.g. ["polymarket.com"]
};
```

---

## Phase 1: Query Planning (LLM)

<!-- normative: planner prompt constraints are verified by ZEC/BTC cases -->

Single LLM call — no tools, no ReAct loop. Generates search angles per source.

```javascript
const planResult = await adk.agent({
  system: `You are a search query planner. Given an entity and user intent,
generate search queries for each source. Output ONLY valid JSON matching this
schema — no markdown, no prose:
{
  "intent": "one-line summary of what user wants",
  "sources": {
    "twitter": ["query1", "query2", "query3"],
    "news": ["query1", "query2"],
    "reddit": ["query1", "query2"],
    "youtube": ["query1", "query2"]
  }
}

Rules:
- Generate 2-3 queries per source with genuinely different angles
- Do NOT include entity aliases in queries — code handles alias expansion
- Focus on topical angles: price action, fundamentals, sentiment, events, controversy
- Queries should be concise keyword phrases, not full sentences`,
  prompt: `Entity: ${JSON.stringify(entityContext)}
User intent: ${userIntent}
Time window: ${timeWindow}`,
  tools: [],
  maxTurns: 1,
});
```

**Validation**: parse with try/catch, default all four source arrays to `[]`,
fallback `plan.intent` to `userIntent`.

---

## Phase 2: Search Execution (Code)

Code controls the loop: per-source, per-query, with dedup and fallback.

### Configuration

| Source | Target | Min Unique |
| ------ | ------ | ---------- |
| Twitter | 15 | 5 |
| News | 15 | 5 |
| Reddit | 15 | 3 |
| YouTube | 10 | 2 |

### Time Window Mapping

Derive provider-specific time filters from the requested window. When a
provider cannot represent the window exactly, use the **next wider** bucket —
ranking handles extra recall, but missing items can't be recovered.

| Window | `fromDate` | Serper `tbs` | Brave `freshness` |
| ------ | ---------- | ------------ | ----------------- |
| `24h` / `1d` / `today` | 1 day ago | `qdr:d` | `pd` |
| `3d` | 3 days ago | `qdr:w` (wider) | `pw` (wider) |
| `1w` / `week` | 7 days ago | `qdr:w` | `pw` |
| `2w` | 14 days ago | `qdr:m` (wider) | `pm` (wider) |
| `1m` / `month` | 30 days ago | `qdr:m` | `pm` |

Default (unrecognized): 7 days / `qdr:w` / `pw`.

### URL Whitelist

Only accept enrichable detail pages. Drop channel pages, playlists, subreddit homepages.

- **YouTube**: `/watch?v=`, `/shorts/`, `youtu.be/{id}`
- **Reddit**: `/r/{sub}/comments/`

### Execution Rules

```
resolve time filters from timeWindow
for each source in [twitter, news, reddit, youtube]:
  queries = expandQueries(plan.sources[source], entity)
  for each query:
    if source.length >= target: break
    call source-specific SDK with time filters
    classifyResults → dedup by URL → push to bucket
  // Brave supplement for news (first 2 queries)
  if source == news: also search Brave

if any source.length < min_unique:
  run deterministic fallback queries (no LLM)

deduplicateByTitle(reddit)  // cross-post dedup via Jaccard > 0.8
```

**Query expansion**: start with planner queries, then append `entity.ticker`,
`entity.canonical_name`, and all `entity.aliases` (skip empty strings).

**Fallback query templates** (deterministic, per source):

| Source | Templates |
| ------ | --------- |
| Twitter | `{each alias}`, `"${ticker}"`, `{ticker} price` |
| News | `{each alias} news`, `{canonical_name} latest` (with `type:"news"`) |
| Reddit | `{each alias} site:reddit.com` |
| YouTube | `{each alias} site:youtube.com` |

**Fallback preserves source-specific search mode**: news keeps `type:"news"`,
Twitter keeps `from_date`, all keep time window filters.

### classifyResults (normative)

<!-- normative: SDK field mapping verified against real Serper/Brave responses -->

```javascript
function classifyResults(data, results, seenUrls, entity) {
  const excludeDomains = entity.excludeDomains || [];
  for (const item of data) {
    const url = item.link || item.url || "";
    if (!url || seenUrls.has(url)) continue;

    // Check excludeDomains
    try {
      const domain = new URL(url).hostname.replace(/^www\./, "");
      if (excludeDomains.some(d => domain.includes(d))) continue;
    } catch (e) { continue; }

    seenUrls.add(url);
    const title = item.title || "";
    const snippet = item.snippet || (item.description || "").replace(/<[^>]*>/g, ""); // strip HTML from Brave
    const ageStr = item.age || ""; // only Brave has this
    // Serper date is index time, not publish time — don't trust it as published_at
    // Brave age is approximate publish time — usable as "approx"
    const timeConfidence = ageStr ? "approx" : "missing";

    if ((url.includes("youtube.com") || url.includes("youtu.be")) && isValidYouTubeUrl(url)) {
      results.youtube.push({
        title, description: snippet, url, published_at: 0,
        _engagement_status: "missing", _time_confidence: timeConfidence, _age_str: ageStr,
      });
    } else if (url.includes("reddit.com") && isValidRedditUrl(url)) {
      const m = url.match(/r\/(\w+)/);
      results.reddit.push({
        title, url, subreddit: m ? m[1] : "", description: snippet, published_at: 0,
        _engagement_status: "missing", _time_confidence: timeConfidence, _age_str: ageStr,
      });
    } else if (!url.includes("youtube.com") && !url.includes("reddit.com")) {
      const domain = new URL(url).hostname.replace(/^www\./, "");
      results.news.push({
        title, summary: snippet, url, source_name: domain, published_at: 0,
        _engagement_status: "missing", _time_confidence: timeConfidence, _age_str: ageStr,
      });
    }
    // URLs matching youtube/reddit domain but not detail page pattern are dropped
  }
}
```

---

## Phase 3: Enrich (Code)

Loop every Reddit/YouTube URL. Set `_engagement_status` based on result.

For each Reddit item: call `scrapeReddit` → write `score`, `num_comments`,
`published_at` (from `created_utc`), update `_engagement_status` and
`_time_confidence`. For each YouTube item: call `scrapeYouTube` → write
`views`, `likes`, `thumbnail`, update `_engagement_status`.

### scrapeReddit (normative)

<!-- normative: regex patterns verified against Reddit JSON endpoint -->

```javascript
async function scrapeReddit(url) {
  try {
    const cleaned = url.replace(/\/$/, "");
    const jsonUrl = cleaned.endsWith(".json") ? cleaned : cleaned + ".json";
    const r = await scrapeUrl({ url: jsonUrl });
    const md = r.response?.data?.[0]?.markdown || "";
    let score = 0, num_comments = 0, created_utc = 0;
    const scoreMatch = md.match(/"score"\s*:\s*(\d+)/);
    const commentsMatch = md.match(/"num_comments"\s*:\s*(\d+)/);
    const createdMatch = md.match(/"created_utc"\s*:\s*([\d.]+)/);
    if (scoreMatch) score = parseInt(scoreMatch[1]);
    if (commentsMatch) num_comments = parseInt(commentsMatch[1]);
    if (createdMatch) created_utc = Math.floor(parseFloat(createdMatch[1]) * 1000);
    return { score, num_comments, created_utc, ok: true };
  } catch (e) { return { score: 0, num_comments: 0, created_utc: 0, ok: false }; }
}
```

### scrapeYouTube (normative)

<!-- normative: regex patterns for views/likes parsing -->

```javascript
async function scrapeYouTube(url) {
  try {
    const r = await scrapeUrl({ url, waitUntil: "networkidle0" });
    const md = r.response?.data?.[0]?.markdown || "";
    let views = 0, likes = 0;
    const vm = md.match(/([\d,]+)\s*views/i) || md.match(/([\d.]+[MKB])\s*views/i);
    if (vm) {
      const raw = vm[1].replace(/,/g, "");
      views = raw.endsWith("M") ? Math.round(parseFloat(raw)*1e6)
            : raw.endsWith("K") ? Math.round(parseFloat(raw)*1e3)
            : parseInt(raw) || 0;
    }
    const lm = md.match(/([\d,]+)\s*likes/i) || md.match(/([\d.]+[MKB])\s*Likes/i);
    if (lm) {
      const raw = lm[1].replace(/,/g, "");
      likes = raw.endsWith("M") ? Math.round(parseFloat(raw)*1e6)
            : raw.endsWith("K") ? Math.round(parseFloat(raw)*1e3)
            : parseInt(raw) || 0;
    }
    return { views, likes, ok: (views > 0 || likes > 0) };
  } catch (e) { return { views: 0, likes: 0, ok: false }; }
}

function extractVideoId(url) {
  const m = url.match(/(?:v=|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
```

---

## Phase 4: Rank (Hybrid)

Two code-computed scores + two LLM-computed scores. Final formula in code.

### LLM Scoring

Call `adk.agent({ tools: [], maxTurns: 1 })` per source. Input: item titles +
descriptions + URLs. Output schema:

```json
{
  "items": [
    { "index": 0, "relevance": 0.0, "quality": 0.0 },
    ...
  ]
}
```

- **relevance** (0-1): how directly the item addresses the user's intent
- **quality** (0-1): signal-to-noise ratio; prefer original analysis over reposts

Use original `userIntent` for scoring, NOT `plan.intent`. Score ALL items (no
short-circuit for small sets). On parse failure, fall back to 0.5 for both.

### Scoring & Ranking (normative)

<!-- normative: weights, decay factors, and engagement_status handling -->

```javascript
// Parse Brave "age" strings ("2 days ago", "18 hours ago") into ms timestamp
function parseAge(ageStr) {
  if (!ageStr) return 0;
  const now = Date.now();
  const m = ageStr.match(/(\d+)\s*(second|minute|hour|day|week|month|year|h|d|w)/i);
  if (!m) return 0;
  const n = parseInt(m[1]);
  const unit = m[2].toLowerCase();
  const ms = { second: 1000, minute: 60000, hour: 3600000, h: 3600000,
    day: 86400000, d: 86400000, week: 604800000, w: 604800000,
    month: 2592000000, year: 31536000000 }[unit] || 0;
  return now - n * ms;
}

function computeCodeScores(items, source, windowMs) {
  if (!items.length) return items;
  const now = Date.now();
  const maxAge = windowMs || 7 * 86400000;

  // Freshness — with time_confidence decay
  for (const item of items) {
    let ts = item.published_at || 0;
    if (!ts && item._age_str) ts = parseAge(item._age_str);
    if (ts > 0) {
      const raw = Math.max(0, 1 - (now - ts) / maxAge);
      item._freshness = item._time_confidence === "approx" ? raw * 0.7 : raw;
    } else {
      item._freshness = 0.5; // unknown = neutral
    }
  }

  // Engagement — with engagement_status awareness
  const engKey = { twitter: "like_count", reddit: "score", youtube: "views", news: null };
  const key = engKey[source];
  if (key) {
    const maxEng = Math.max(...items.map(i => i[key] || 0), 1);
    for (const item of items) {
      if (item._engagement_status === "failed") {
        item._engagement = 0; // failed enrichment = bottom, not neutral
      } else {
        item._engagement = (item[key] || 0) / maxEng;
      }
    }
  } else {
    for (const item of items) item._engagement = 0.5; // news: no metric
  }
  return items;
}

const WEIGHTS = { freshness: 0.2, engagement: 0.4, relevance: 0.25, quality: 0.15 };

function rankItems(items, topN = 10) {
  for (const item of items) {
    item._score = WEIGHTS.freshness * (item._freshness || 0)
               + WEIGHTS.engagement * (item._engagement || 0)
               + WEIGHTS.relevance * (item._relevance || 0)
               + WEIGHTS.quality * (item._quality || 0);
  }
  items.sort((a, b) => b._score - a._score);
  return items.slice(0, topN);
}
```

After ranking, compute `display_time` for all items before feed write.

---

## Feed Card Schemas

Internal fields (`_engagement_status`, `_time_confidence`, `_age_str`,
`_freshness`, `_engagement`, `_relevance`, `_quality`, `_score`) are NOT
written to the feed. Only the fields below are persisted and exposed to
frontends.

### Twitter

| Field | Type | Source |
| ----- | ---- | ------ |
| `content` | string | GrokX |
| `author_name` | string | GrokX |
| `author_username` | string | GrokX |
| `author_avatar` | string | GrokX |
| `published_at` | number | GrokX `created_at` (ms timestamp) |
| `display_time` | string | Computed ("3h ago", "Mar 15") |
| `like_count` | number | GrokX |
| `retweet_count` | number | GrokX |
| `reply_count` | number | GrokX |
| `url` | string | GrokX |

### News

| Field | Type | Source |
| ----- | ---- | ------ |
| `title` | string | Serper `title` / Brave `title` |
| `summary` | string | Serper `snippet` / Brave `description` (HTML stripped) |
| `url` | string | Serper `link` / Brave `url` |
| `source_name` | string | Publisher domain (extracted from URL) |
| `published_at` | number | 0 (not reliably available from search APIs) |
| `display_time` | string | From Brave `age` if available, else empty |

### Reddit

| Field | Type | Source |
| ----- | ---- | ------ |
| `title` | string | Serper `title` |
| `url` | string | Serper `link` |
| `subreddit` | string | Extracted from URL path |
| `description` | string | Serper `snippet` |
| `published_at` | number | Reddit JSON `created_utc` × 1000 (from enrichment) |
| `display_time` | string | Computed from `published_at` |
| `score` | number | Phase 3 enrichment |
| `num_comments` | number | Phase 3 enrichment |

### YouTube

| Field | Type | Source |
| ----- | ---- | ------ |
| `title` | string | Serper `title` |
| `description` | string | Serper `snippet` |
| `url` | string | Serper `link` |
| `thumbnail` | string | `https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg` |
| `published_at` | number | 0 (not reliably available without page scrape) |
| `display_time` | string | From Brave `age` if available, else empty |
| `views` | number | Phase 3 enrichment |
| `likes` | number | Phase 3 enrichment |
