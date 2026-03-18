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

## Phase 0: Entity Context (Code)

Code-maintained alias map. LLM does NOT invent aliases — it only expands
search angles.

```javascript
const entityContext = {
  canonical_name: "Zcash",
  ticker: "ZEC",                    // real trading symbol only; "" for non-ticker entities
  aliases: ["Zcash", "$ZEC", "ZCash"],
  related_terms: ["privacy coin", "zero-knowledge"],
  excludeDomains: [],               // optional: e.g. ["polymarket.com"]
};
```

---

## Phase 1: Query Planning (LLM)

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

let plan;
try {
  plan = JSON.parse(planResult.content);
} catch (e) {
  plan = {};
}
// Validate: ensure all source arrays exist, default to empty
const defaultSources = { twitter: [], news: [], reddit: [], youtube: [] };
plan.sources = { ...defaultSources, ...(plan.sources || {}) };
for (const key of Object.keys(defaultSources)) {
  if (!Array.isArray(plan.sources[key])) plan.sources[key] = [];
}
plan.intent = plan.intent || userIntent;
```

---

## Phase 2: Search Execution (Code)

Code controls the loop: per-source, per-query, with dedup and fallback.

### Configuration

```javascript
const SEARCH_CONFIG = {
  twitter:  { target: 15, min_unique: 5 },
  news:     { target: 15, min_unique: 5 },
  reddit:   { target: 15, min_unique: 3 },
  youtube:  { target: 10, min_unique: 2 },
};
```

### Time Window Mapping

Derive provider-specific time filters from the requested time window.

```javascript
function resolveTimeFilters(timeWindow) {
  const windowMs = {
    "24h": 86400000, "1d": 86400000, "today": 86400000,
    "3d": 3 * 86400000, "1w": 7 * 86400000, "week": 7 * 86400000,
    "2w": 14 * 86400000, "1m": 30 * 86400000, "month": 30 * 86400000,
  }[timeWindow] || 7 * 86400000;

  // When Serper/Brave can't represent the window exactly, use the next WIDER
  // bucket. Ranking handles the extra recall; missing items can't be recovered.
  const serperTbs = {
    "24h": "qdr:d", "1d": "qdr:d", "today": "qdr:d",
    "3d": "qdr:w",  "1w": "qdr:w", "week": "qdr:w",
    "2w": "qdr:m",  "1m": "qdr:m", "month": "qdr:m",
  }[timeWindow] || "qdr:w";

  const braveFreshness = {
    "24h": "pd", "1d": "pd", "today": "pd",
    "3d": "pw",  "1w": "pw", "week": "pw",
    "2w": "pm",  "1m": "pm", "month": "pm",
  }[timeWindow] || "pw";

  return { fromDate: new Date(Date.now() - windowMs).toISOString().slice(0, 10), tbs: serperTbs, freshness: braveFreshness, windowMs };
}
```

### URL Filters

```javascript
// Only accept enrichable detail pages, not channels/playlists/subreddit homepages
function isValidYouTubeUrl(url) {
  return /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)/.test(url);
}
function isValidRedditUrl(url) {
  return /reddit\.com\/r\/\w+\/comments\//.test(url);
}
```

### Execution Loop

```javascript
const { searchGrokX } = require("@arrays/data/widget-scrap/search-grok-x:v1.0.0");
const { getSerperSearch } = require("@arrays/data/widget-scrap/serper-search:v1.0.0");
const { searchBrave } = require("@arrays/data/widget-scrap/search-brave:v1.0.0");

function executeSearch(plan, entity, config, timeWindow) {
  const { fromDate, tbs, freshness } = resolveTimeFilters(timeWindow);
  const results = { twitter: [], news: [], youtube: [], reddit: [] };
  const seenUrls = new Set();

  // --- Twitter via GrokX ---
  const twQueries = expandQueries(plan.sources.twitter, entity);
  for (const q of twQueries) {
    if (results.twitter.length >= config.twitter.target) break;
    const r = searchGrokX({ query: q, from_date: fromDate, max_search_results: 15 });
    for (const t of r.response?.data || []) {
      if (!t.url || seenUrls.has(t.url)) continue;
      seenUrls.add(t.url);
      const ca = typeof t.created_at === "string" ? new Date(t.created_at).getTime() : (t.created_at || 0);
      results.twitter.push({
        content: t.content || "", author_name: t.author_name || "",
        author_username: t.author_username || "", author_avatar: t.author_avatar || "",
        published_at: ca, like_count: t.like_count || 0,
        retweet_count: t.retweet_count || 0, reply_count: t.reply_count || 0, url: t.url,
        _engagement_status: "ok", _time_confidence: ca > 0 ? "exact" : "missing",
      });
    }
  }

  // --- News via Serper + Brave ---
  const newsQueries = expandQueries(plan.sources.news, entity);
  for (const q of newsQueries) {
    if (results.news.length >= config.news.target) break;
    const r = getSerperSearch({ q, type: "news", tbs, num: 10 });
    classifyResults(r.response?.data || [], results, seenUrls, entity);
  }
  for (const q of newsQueries.slice(0, 2)) {
    if (results.news.length >= config.news.target) break;
    const r = searchBrave({ query: q, freshness, count: 10 });
    classifyResults(r.response?.data || [], results, seenUrls, entity);
  }

  // --- Reddit via Serper ---
  const rdQueries = expandQueries(plan.sources.reddit, entity).map(q =>
    q.includes("site:reddit.com") ? q : `${q} site:reddit.com`
  );
  for (const q of rdQueries) {
    if (results.reddit.length >= config.reddit.target) break;
    const r = getSerperSearch({ q, tbs, num: 10 });
    classifyResults(r.response?.data || [], results, seenUrls, entity);
  }

  // --- YouTube via Serper ---
  const ytQueries = expandQueries(plan.sources.youtube, entity).map(q =>
    q.includes("site:youtube.com") ? q : `${q} site:youtube.com`
  );
  for (const q of ytQueries) {
    if (results.youtube.length >= config.youtube.target) break;
    const r = getSerperSearch({ q, tbs, num: 10 });
    classifyResults(r.response?.data || [], results, seenUrls, entity);
  }

  // --- Fallback: if any source below min_unique ---
  for (const [source, cfg] of Object.entries(config)) {
    if (results[source].length < cfg.min_unique) {
      const fallbackQs = getFallbackQueries(source, entity);
      for (const q of fallbackQs) {
        if (results[source].length >= cfg.min_unique) break;
        runFallbackSearch(source, q, results, seenUrls, entity, fromDate, tbs);
      }
    }
  }

  // --- Reddit title-level dedup ---
  deduplicateByTitle(results.reddit);

  return results;
}
```

### Helper Functions

```javascript
// Expand planner queries with ticker, canonical name, and all aliases
function expandQueries(plannerQueries, entity) {
  const expanded = [...plannerQueries];
  for (const term of [entity.ticker, entity.canonical_name, ...entity.aliases]) {
    if (term && !expanded.includes(term)) expanded.push(term);
  }
  return expanded;
}

// Classify Serper/Brave results into source buckets by URL
// Serper fields: title, link, snippet, date (index time), source
// Brave fields: title, url, description (may have HTML), age, date (index time), source
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

// Deterministic fallback queries — no LLM involved
function getFallbackQueries(source, entity) {
  const { ticker, canonical_name, aliases } = entity;
  const allNames = [...new Set([ticker, canonical_name, ...aliases])].filter(Boolean);
  const base = {
    twitter: [...allNames, ...(ticker ? [`"$${ticker}"`, `${ticker} price`] : [])],
    news:    [...allNames.map(n => `${n} news`), `${canonical_name} latest`],
    reddit:  allNames.map(n => `${n} site:reddit.com`),
    youtube: allNames.map(n => `${n} site:youtube.com`),
  };
  return base[source] || [];
}

function runFallbackSearch(source, query, results, seenUrls, entity, fromDate, tbs) {
  if (source === "twitter") {
    const r = searchGrokX({ query, from_date: fromDate, max_search_results: 15 });
    for (const t of r.response?.data || []) {
      if (!t.url || seenUrls.has(t.url)) continue;
      seenUrls.add(t.url);
      const ca = typeof t.created_at === "string" ? new Date(t.created_at).getTime() : (t.created_at || 0);
      results.twitter.push({
        content: t.content || "", author_name: t.author_name || "",
        author_username: t.author_username || "", author_avatar: t.author_avatar || "",
        published_at: ca, like_count: t.like_count || 0,
        retweet_count: t.retweet_count || 0, reply_count: t.reply_count || 0, url: t.url,
        _engagement_status: "ok", _time_confidence: ca > 0 ? "exact" : "missing",
      });
    }
  } else if (source === "news") {
    const r = getSerperSearch({ q: query, type: "news", tbs, num: 10 });
    classifyResults(r.response?.data || [], results, seenUrls, entity);
  } else {
    const r = getSerperSearch({ q: query, tbs, num: 10 });
    classifyResults(r.response?.data || [], results, seenUrls, entity);
  }
}

// Reddit cross-post dedup: normalize title and drop near-duplicates
function deduplicateByTitle(items) {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const wordSet = (s) => new Set(normalize(s).split(/\s+/));
  const jaccard = (a, b) => {
    const inter = [...a].filter(x => b.has(x)).length;
    const union = new Set([...a, ...b]).size;
    return union === 0 ? 0 : inter / union;
  };
  const seen = [];
  for (let i = items.length - 1; i >= 0; i--) {
    const ws = wordSet(items[i].title);
    if (seen.some(s => jaccard(ws, s) > 0.8)) {
      items.splice(i, 1);
    } else {
      seen.push(ws);
    }
  }
}
```

---

## Phase 3: Enrich (Code)

Loop every Reddit/YouTube URL. Set `_engagement_status` based on result.

### Reddit

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

### YouTube

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

### Enrichment Loop

```javascript
for (const r of results.reddit) {
  const eng = await scrapeReddit(r.url);
  r.score = eng.score;
  r.num_comments = eng.num_comments;
  r._engagement_status = eng.ok ? "ok" : "failed";
  if (eng.created_utc > 0) {
    r.published_at = eng.created_utc;
    r._time_confidence = "exact";
  }
}

for (const y of results.youtube) {
  const eng = await scrapeYouTube(y.url);
  y.views = eng.views;
  y.likes = eng.likes;
  y._engagement_status = eng.ok ? "ok" : "failed";
  const vid = extractVideoId(y.url);
  if (vid) y.thumbnail = "https://img.youtube.com/vi/" + vid + "/mqdefault.jpg";
}
```

---

## Phase 4: Rank (Hybrid)

Two code-computed scores + two LLM-computed scores. Final formula in code.

### Internal Metadata (not in feed schema)

| Field | Values | Purpose |
| ----- | ------ | ------- |
| `_engagement_status` | `"ok"` / `"missing"` / `"failed"` | Distinguishes "real 0 engagement" from "scrape failed" |
| `_time_confidence` | `"exact"` / `"approx"` / `"missing"` | Controls freshness weight decay |

### Display Time

Computed before feed write. Frontend only reads this field.

```javascript
function computeDisplayTime(publishedAt, ageStr) {
  const now = Date.now();
  let diffMs = 0;
  if (publishedAt > 0) {
    diffMs = now - publishedAt;
  } else if (ageStr) {
    return ageStr; // already human-readable from Brave
  } else {
    return "";
  }
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
```

### Code Scores

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
      // Decay if time is approximate
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
    // News: no engagement metric available
    for (const item of items) item._engagement = 0.5;
  }

  return items;
}
```

### LLM Scores (Strict JSON)

```javascript
async function computeLLMScores(items, source, userIntent) {
  if (items.length === 0) return [];

  const rankResult = await adk.agent({
    system: `You are a content ranker. Score each item on two dimensions.
Return ONLY valid JSON matching this schema — no markdown, no prose:
{
  "items": [
    { "index": 0, "relevance": 0.0, "quality": 0.0 },
    ...
  ]
}

Scoring guide:
- relevance (0-1): How directly does this item address the user's intent?
- quality (0-1): Signal-to-noise ratio. Prefer original analysis over reposts, specific data over vague commentary.

Score ALL items. Use the full 0-1 range.`,
    prompt: `User intent: "${userIntent}"
Source: ${source}
Items: ${JSON.stringify(items.map((item, i) => ({
      index: i,
      title: item.title || item.content?.substring(0, 100) || "",
      description: item.summary || item.description || "",
      url: item.url,
    })))}`,
    tools: [],
    maxTurns: 1,
  });

  try {
    const parsed = JSON.parse(rankResult.content);
    const scoreMap = new Map(parsed.items.map(s => [s.index, s]));
    return items.map((item, i) => ({
      ...item,
      _relevance: scoreMap.get(i)?.relevance ?? 0.5,
      _quality: scoreMap.get(i)?.quality ?? 0.5,
    }));
  } catch (e) {
    return items.map(item => ({ ...item, _relevance: 0.5, _quality: 0.5 }));
  }
}
```

### Final Ranking

```javascript
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

// Usage per source — use original userIntent, not plan.intent
const { windowMs } = resolveTimeFilters(timeWindow);
for (const source of ["twitter", "news", "reddit", "youtube"]) {
  computeCodeScores(results[source], source, windowMs);
  results[source] = await computeLLMScores(results[source], source, userIntent);
  results[source] = rankItems(results[source], 10);
}

// Compute display_time for all items before feed write
for (const source of ["twitter", "news", "reddit", "youtube"]) {
  for (const item of results[source]) {
    item.display_time = computeDisplayTime(item.published_at, item._age_str);
  }
}
```

---

## Feed Card Schemas

Internal fields (`_engagement_status`, `_time_confidence`, `_age_str`, `_freshness`,
`_engagement`, `_relevance`, `_quality`, `_score`) are NOT written to the feed.
Only the fields listed below are persisted and exposed to frontends.

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
