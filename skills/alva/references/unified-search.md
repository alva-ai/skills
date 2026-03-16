# Unified Search Skill

A skill that guides the agent to search, filter, and return structured
unstructured-data results across multiple sources. All execution happens on the
Alva cloud runtime via `adk.agent()` — the local agent's job is to write the
feed script, not to perform search or ranking itself.

## When to Use

Use this skill when the agent needs **unstructured content** about a topic
(news, social posts, discussions, videos, etc.) and does NOT already know
specific accounts/channels to subscribe to. If the user explicitly wants to
subscribe to a specific account or channel, use the corresponding feed skill
instead (x-feed, reddit-feed, youtube-feed, news-feed, podcast-feed).

---

## Architecture

The feed script is a **thin shell** — it defines search tools and delegates the
entire pipeline to `adk.agent()`. The ADK agent (cloud LLM) autonomously
decides which sources to query, how to process results, and what to output.

```
Feed Script (.js) on Alva Runtime
│
├─ Define tools: searchGrokX, searchBrave
├─ Define system prompt (embed pipeline instructions)
├─ Call adk.agent({ system, prompt, tools })
│   │
│   │  ┌─ Step 1: Source Selection ──────────────┐
│   │  │  Agent decides which sources to query    │
│   │  │  based on prompt. Calls tools.           │
│   │  └──────────────────────────────────────────┘
│   │          │
│   │          ▼
│   │  ┌─ Step 2: Agent Processing ──────────────┐
│   │  │  Quality filter → Rank → Dedup           │
│   │  │  Not enough? → back to Step 1            │
│   │  └──────────────────────────────────────────┘
│   │          │
│   │          ▼
│   │  ┌─ Step 3: Output ───────────────────────-┐
│   │  │  Structured JSON (Feed Card schema)      │
│   │  │  OR prose/summary (agent decides)        │
│   │  └──────────────────────────────────────────┘
│   │
│   └─ Returns: result.content (JSON or text)
│
├─ Parse result → feed.append() per source type
└─ Done
```

---

## 3-Step Pipeline

These steps describe what the **ADK agent** does inside its ReAct loop. The
local agent embeds this as context in the ADK system prompt.

### Step 1: Source Selection + Search

The ADK agent decides which sources to query based on the prompt, then calls the
search tools. Not every query needs all sources.

**Available sources**:

| Target source | Query method | When to use |
| ------------- | ------------ | ----------- |
| X/Twitter | `searchGrokX({ query, from_date?, to_date?, max_search_results? })` | Social sentiment, opinions, real-time reactions |
| News | `searchSerper({ q, type: "news", tbs?, num? })` or `searchBrave({ query, result_filter: "news", freshness?, count? })` | News articles, market commentary |
| YouTube | `searchSerper({ q: "{topic} site:youtube.com", tbs?, num? })` or `searchBrave(...)` | Video content, analysis, tutorials |
| Reddit | `searchSerper({ q: "{topic} site:reddit.com", tbs?, num? })` | Community discussions. Serper (Google index) is the primary source — Brave's Reddit coverage is unreliable. |
| General Web | `searchSerper({ q, tbs?, num? })` or `searchBrave({ query, freshness?, count? })` | Fallback for anything not covered above |

**Available search backends**:
- **Serper** (`getSerperSearch`): Google Search results. Supports `tbs` time filter
  (`qdr:h`/`qdr:d`/`qdr:w`/`qdr:m`) and `type` (`search`/`news`/`videos`/`images`).
  Use `site:reddit.com` or `site:youtube.com` in query for platform-specific results.
- **Brave** (`searchBrave`): Independent search index. Use `result_filter` for
  news/discussions/web. Use `freshness` for time filtering.

**Query strategy**:
- Search both Serper and Brave for each source, then merge and deduplicate.
  Different indexes surface different results — combining gives better coverage.
- Use separate per-source queries — a single generic query misses sources.

**Grok X** (`@arrays/data/widget-scrap/search-grok-x:v1.0.0`):
- Returns AI summary + individual tweets with full metadata
- **Response**: `response.data` (array of tweets), `response.summary` (AI text)
- **Tweet fields**: `content`, `url`, `created_at` (ms), `author_username`,
  `author_name`, `author_avatar`, `author_verified`, `author_followers_count`,
  `like_count`, `retweet_count`, `reply_count`, `quote_count`, `id`
- **Not available**: `image_urls` (only via feed SDK subscription)

**Serper** (`@arrays/data/widget-scrap/serper-search:v1.0.0`):
- Google Search results via Serper.dev API
- `tbs`: `"qdr:h"` (past hour), `"qdr:d"` (past day), `"qdr:w"` (past week),
  `"qdr:m"` (past month), `"qdr:y"` (past year)
- `type`: `"search"` (default), `"news"`, `"videos"`, `"images"`
- `num`: number of results (default 10)
- Use `site:reddit.com` or `site:youtube.com` in query for platform-specific results
- **Response**: `response.data` (array of organic results), `response.knowledgeGraph`,
  `response.peopleAlsoAsk`, `response.relatedSearches`
- **Result fields**: `title`, `link`, `snippet`, `position`, `date` (observation time)

**Brave** (`@arrays/data/widget-scrap/search-brave:v1.0.0`):
- Independent search index (not Google). Fallback when Serper is unavailable.
- `freshness`: `"pd"` (past day), `"pw"` (past week), `"pm"` (past month),
  `"py"` (past year)
- `result_filter`: `"discussions"` | `"web"` | `"news"`
- **Response arrays**: `response.web_results`, `response.news_results`,
  `response.discussion_results`
- **Fields**: `title`, `url`, `description`, `age`

### Step 2: Agent Processing

After receiving raw results, the ADK agent curates them using LLM reasoning.

1. **Quality filter** -- remove off-topic, spam, promotional, SEO, generic
   portal pages, and outdated results.

2. **Rank** -- infer the ranking criteria from the user's prompt. The agent must
   understand what "best results" means for this specific request. Examples:
   - "hottest" / "most popular" → engagement (likes, score, views)
   - "latest" / "newest" → recency
   - "most discussed" / "controversial" → comment count, reply count
   - "most influential" → author followers, source authority
   - "most insightful" / "best analysis" → content depth, data density
   - No explicit preference → overall relevance to the prompt intent
   This is not an exhaustive list. The agent should reason about the user's
   intent from the full prompt context and rank accordingly.

3. **Deduplicate** -- same story from multiple outlets → keep the most
   authoritative source. Match by URL or content similarity.

4. **Assess sufficiency** -- if any source has too few quality results, loop back
   to Step 1 with broader/different keywords, alternative sources, or adjusted
   `freshness`.

### Step 3: Output

The ADK agent decides the output format:

- **Structured JSON** (default for playbooks) — per Feed Card schema below, each
  source type has its own flat schema (no nesting). Field names match the feed
  SDK output schemas so playbooks render feed data and search data with the same
  components.
- **Prose / summary** — when the request is narrative ("summarize market
  sentiment") or only one or two results are relevant.

**Formatting rules** (include in system prompt):
- **YouTube thumbnail**: construct from video ID in URL —
  `https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg` (regex:
  `/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/`)
- **News source_name**: infer from URL domain (e.g.
  `finance.yahoo.com` → "Yahoo Finance")

---

## Implementation

The feed script defines tools and calls `adk.agent()`. The ADK agent handles the
entire pipeline autonomously.

```javascript
const adk = require("@alva/adk");
const feed = require("@alva/feed");

// 1. Define search tools
const tools = [
  {
    name: "searchGrokX",
    description: `Search Twitter/X via Grok. Returns tweets with engagement metrics.
Response shape: { response: { data: [tweets], summary: string } }
Tweet fields: content, url, created_at (ms timestamp), author_username,
author_name, author_avatar, author_verified, author_followers_count,
like_count, retweet_count, reply_count, quote_count, id.`,
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        max_search_results: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
    fn: async (args) => {
      const { searchGrokX } = require("@arrays/data/widget-scrap/search-grok-x:v1.0.0");
      return await searchGrokX(args);
    },
  },
  {
    name: "searchSerper",
    description: `Google Search via Serper. Use alongside searchBrave for better coverage.
Use site:reddit.com or site:youtube.com in query for platform-specific results.
Use type "news" for dedicated news endpoint.
Response: response.data (array of {title, link, snippet, position}).
If a query returns 0, try different formulations in the next turn.`,
    parameters: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search query" },
        tbs: { type: "string", description: "Time filter: qdr:h (hour), qdr:d (day), qdr:w (week), qdr:m (month)" },
        type: { type: "string", description: "Search type: search (default), news, videos, images" },
        num: { type: "number", description: "Number of results (default 10)" },
      },
      required: ["q"],
    },
    fn: async (args) => {
      const { getSerperSearch } = require("@arrays/data/widget-scrap/serper-search:v1.0.0");
      return getSerperSearch(args);
    },
  },
  {
    name: "searchBrave",
    description: `Search via Brave (independent index). Use alongside searchSerper for better coverage.
Response arrays: response.web_results, response.news_results, response.discussion_results.`,
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        result_filter: { type: "string", enum: ["news", "discussions", "web"], description: "Result type filter" },
        freshness: { type: "string", description: "pd/pw/pm/py" },
        count: { type: "number", description: "Number of results (default 20)" },
      },
      required: ["query"],
    },
    fn: async (args) => {
      const { searchBrave } = require("@arrays/data/widget-scrap/search-brave:v1.0.0");
      return await searchBrave(args);
    },
  },
];

// 2. ADK agent runs the full 3-step pipeline
const result = await adk.agent({
  system: `You are a content curator. You MUST follow this exact loop:

STEP 1 — SEARCH: Call search tools for all requested sources. One call per source.
  Request count: 20 per source (over-fetch, then filter down).

STEP 2 — CHECK COUNTS: After receiving results, count quality items per source.
  If any source has fewer items than requested, GO BACK TO STEP 1 with different
  queries for that source. Try different formulations, keywords, or freshness values.
  Do NOT output until you have tried at least 2 different query strategies per
  underperforming source.

STEP 3 — CURATE: Filter low-quality/off-topic, deduplicate, then rank results.
  Infer what "best results" means from the user's prompt — e.g. "hottest" →
  engagement, "latest" → recency, "most discussed" → comments, "most influential"
  → author authority. If no explicit preference, rank by overall relevance to the
  prompt intent.

STEP 4 — OUTPUT: Return final curated results as JSON (no markdown, no explanation):
  { "twitter": [...], "news": [...], "youtube": [...], "reddit": [...] }
  If a source truly has 0 results after multiple retries, include an empty array
  and that is acceptable. But you must have TRIED at least 3 different queries first.

FIELD MAPPING (use exact field names):
- Twitter: content, author_name, author_username, author_avatar, created_at (ms), like_count, retweet_count, reply_count, url
- News: title, summary (from description), url, source_name (from URL domain), age
- YouTube: title, description, url, thumbnail (https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg), age
- Reddit: title, url, subreddit, selftext, score, num_comments, age`,
  prompt: "<the user's content request>",
  tools,
  maxTurns: 10,
});

// 3. Parse output → write to feeds
const curated = JSON.parse(result.content);
// ... feed.append() per source type
```

---

## Feed Card Schemas

### Twitter Feed Card

| Field | Type | Source |
| ----- | ---- | ------ |
| `content` | string | GrokX — tweet text |
| `author_name` | string | GrokX — display name |
| `author_username` | string | GrokX — Twitter handle |
| `author_avatar` | string | GrokX — profile image URL |
| `created_at` | number | GrokX — tweet creation timestamp (ms) |
| `like_count` | number | GrokX |
| `retweet_count` | number | GrokX |
| `reply_count` | number | GrokX |
| `url` | string | GrokX |
| `image_urls` | string | **Not available** (only via feed SDK subscription) |

### News Feed Card

| Field | Type | Source |
| ----- | ---- | ------ |
| `title` | string | Brave news_results |
| `summary` | string | Brave `description` |
| `url` | string | Brave |
| `source_name` | string | Agent-derived from URL domain |
| `age` | string | Brave |
| `banner_image` | string | **Not available** (sites block scraping) |
| `source_icon` | string | **Not available** |
| `authors` | string | **Not available** |

### Reddit Feed Card

| Field | Type | Source |
| ----- | ---- | ------ |
| `title` | string | Brave web_results (site:reddit.com) |
| `url` | string | Brave |
| `subreddit` | string | Agent-derived from URL path |
| `description` | string | Brave `description` |
| `age` | string | Brave |
| `score` | number | **Not available** (only via `result_filter: "discussions"`) |
| `num_comments` | number | **Not available** (only via `result_filter: "discussions"`) |

### YouTube Feed Card

| Field | Type | Source |
| ----- | ---- | ------ |
| `title` | string | Brave web_results |
| `description` | string | Brave |
| `url` | string | Brave |
| `thumbnail` | string | Constructed from video ID in URL |
| `age` | string | Brave |
| `channel_title` | string | **Not available** (needs YouTube Data API) |
| `length_in_seconds` | number | **Not available** (needs YouTube Data API) |

### Podcast Feed Card

> **Not included in unified search**. Podcast discovery via web search yields
> low-quality results. Use the **podcast-feed skill** (RSS subscription). Schema
> documented here for completeness since playbooks may render podcast feed data
> alongside search results.

| Field | Type | Source |
| ----- | ---- | ------ |
| `title` | string | — |
| `description` | string | — |
| `source_icon` | string | — |
| `date` | number | — |

---

## Field Coverage Summary

| Source | Available fields | Not available |
| ------ | ---------------- | ------------- |
| **Twitter** | content, author_name, author_username, author_avatar, like/retweet/reply_count, created_at, url | image_urls |
| **News** | title, summary, url, age + source_name (derived) | banner_image, source_icon, authors |
| **Reddit** | title, url, description, age + subreddit (derived from URL) | score, num_comments (only via discussions mode) |
| **YouTube** | title, description, url, age + thumbnail (derived) | channel_title, length_in_seconds, source_icon |

---

## Relationship to Feed Skills

| Scenario | Use |
| -------- | --- |
| "What's happening with TSLA" | **unified-search** |
| "Search for TSLA news this week" | **unified-search** |
| "Subscribe to @elonmusk tweets" | **x-feed skill** |
| "Follow r/wallstreetbets" | **reddit-feed skill** |
| "Monitor Tesla's YouTube channel" | **youtube-feed skill** |
| "What are people saying about TSLA on Twitter" | **unified-search** (Grok X) |
| "Track TSLA news continuously" | **news-feed skill** (subscribe symbol) |
| "Subscribe to a podcast about crypto" | **podcast-feed skill** |

The agent decides which path based on the user's intent: one-time discovery
(unified-search) vs. ongoing monitoring (feed skill).
