# Content Search

Use the runtime's exposed web search tool first for unstructured research:
news, public statements, source documents, and public X discussion. Inspect
relevant originals with its page-reading tools; follow the exposed tool schema.
In ALPI, `web_search` accepts `search_query` and `open`/`click`/`find` using
returned reference IDs. If native search is unavailable, or a plain Feed/Automation
script needs search, use the SDKs below. Do not invent a tool or call the managed
search transport directly.

Prices, financial datasets, exact account history and engagement metrics retain
their [Data Skills](data-skills.md) routes. News, YouTube, Reddit and podcast
handle subscriptions remain in `feed_widgets`; search SDKs are in `unified_search`.
Apply [content-legitimacy.md](content-legitimacy.md): finding a page is not
verification of its contents, and a source's opinion remains an attributed claim.

## Worldline supplement

Worldline searches Alva's collected material. For company events, people or
investment arguments, use it alongside primary search when likely to add useful
evidence; run independent lookups in parallel where supported. It is optional:
do not query it for every question or delay an adequately supported answer for
it. Empty, failed or slow retrieval does not block the main search path. For an
existing Thesis's progress, use [Signals](thesis.md#thesis-tracking) first.

Use the existing authenticated Jagent SDK through `alva run`; no extra credential
or Agent session is needed. This read-only example searches a seven-day indexing
window; choose a window appropriate to the question:

```sh
alva run --code '(() => {
  const sdk = require("@alva/worldline");
  const since = Date.now() - 7 * 86400000;
  return sdk.createWorldlineClient().recall({
    query: "NVIDIA Blackwell data center demand",
    indexedAfter: sdk.recallTimeFromMs(since),
    publishedFromMs: since,
    limit: 5
  });
})();'
```

`recall` defaults to semantic search; `mode: "keyword"` matches any query term,
`"keyword_all"` requires all terms. For a company or author, resolve its ID with
`searchEntities({query, entityTypes, limit})`, then use `entityIds` for mentions
or `attribution: {partyIds: [...]}` for credited statements, not both. Without a
query, these filters list newest first. Reuse returned IDs; do not guess them.

Hits carry text, source metadata, author attributions and, when available,
`sourceEvidence`. `contentMode: "generated"` is synthesized text, not a quotation;
check the source excerpts for material claims. For more context, call
`getContributions({ids: [hit.contributionId]})` or
`getObservations({ids: [hit.observationId]})` and check each lookup outcome. Preserve
fact/opinion/forecast/rumor distinctions and actual source links; library
membership or similarity does not establish truth. Multiple Contributions can
come from one original: group them rather than count independent corroboration.

`indexedAfter` is indexing time; `publishedFromMs` still admits unknown publication
times. `limitExceeded` means only top matches were returned; `budgetExceeded`
means only part of the window was searched (continue older ranges with
`indexedBefore: scannedFrom` when needed). Filter-only listings continue with
`pageToken: nextPageToken` and the same conditions. Deduplicate by contributionId.
Describe partial coverage honestly; absence is not proof that nothing happened.
Older deployments may lack these options: on contract failure use primary search,
without bypassing access through internal services.

## SDK Modules

| SDK | Module | Best for |
| --- | ------ | -------- |
| `searchPerplexityFinance` | `@arrays/data/search/search-perplexity-finance:v1.0.0` | Non-US equities outside the curated Data Skills set (and market breadth); fallback for off-catalog asset classes and other structured-SDK gaps |
| `searchSerper` | `@arrays/data/search/serper-search:v1.0.0` | Google index: News, YouTube, Reddit, Web |
| `searchBrave` | `@arrays/data/search/search-brave:v1.0.0` | Independent index, good Reddit coverage |
| `scrapeUrl` | `@arrays/data/search/scrape-url:v1.0.0` | Scrape any page to markdown for enrichment |

## SDK source patterns

These patterns serve scripts and native-search fallbacks; they do not require
repeating a search already completed with the exposed native tool.

### Finance Search

- **Data Skills first**: Data Skills (the structured Alva data) cover US and non-US equities, fundamentals (earnings, filings), options, crypto, macro (forex, index levels, commodity futures like gold/oil), on-chain, and prediction markets — route all of these there. `searchPerplexityFinance` is the fallback ONLY for non-US tickers outside the curated set (or when their intraday is empty) and asset classes genuinely outside the catalog.
- **Search**: `searchPerplexityFinance` — a live, source-cited finance answer engine (quotes, profiles, statements/ratios, valuation, earnings, estimates, KPI metrics, market movers, ownership/corporate actions); current context or source-backed enrichment, not a historical time series.
- **Non-US disambiguation**: name the local ticker + exchange or the full company name (e.g. "Toyota 7203 on the Tokyo Stock Exchange", "HSBC on the LSE"), and verify against the `sources` it returns. Coverage is web-backed and best-effort — depth and freshness track how well a market is reported online.
- **Query scoping**: state the business question first, then the ticker, then a time window (`latest quarter`, `last 30 days`).
- **Fields**: `summary`, `data`/`arrays` result blocks, `tickers`, `sources`, and provider `usage` when available.

### Twitter/X

For recent public discussion, use native search (or Serper/Brave with `site:x.com`
when unavailable), then inspect the original posts. Worldline may add collected
statements in parallel. Neither route guarantees full X coverage or engagement
counts. For an exact handle history, known post lookup or interaction metrics,
use Arrays Data Skills where covered. Verify author and publication time; search
snippets and a quoted or reposted view are not automatically the poster's own view.

### News

- **Search**: `searchSerper` with `type:"news"` or `searchBrave` with a `freshness` filter; add the other when coverage is insufficient
- **Enrich**: Optional — `scrapeUrl` for full article text
- **Signals**: Freshness (time-based), source authority (domain)
- **Gotcha**: Serper `date` is index/observed time, NOT publish time — do not use as published_at. Brave `description` may contain `<strong>` HTML tags — strip before display. Brave `age` field (e.g. "18 hours ago") is more reliable for recency.
- **Fields (Serper)**: `title`, `link`, `snippet`, `date` (ms, index time), `imageUrl`
- **Fields (Brave)**: `title`, `url`, `description`, `age` (string), `date` (ms, index time)

### Reddit

- **Search**: `searchSerper` or `searchBrave` with `site:reddit.com`
- **Enrich**: Append `.json` to post URL → `scrapeUrl` → regex extract `score`, `num_comments`, `created_utc`
- **Signals**: `score`, `num_comments`, `created_utc` (real publish time, seconds → ×1000 for ms)
- **URL filter**: Only accept `/r/{sub}/comments/` URLs (detail pages). Drop subreddit homepages, user profiles.
- **Gotcha**: `searchBrave` with `result_filter:"discussions"` returns 0 results — do not use. Cross-posts produce duplicate titles — dedup by Jaccard similarity on title if needed.

### YouTube

- **Search**: `searchSerper` or `searchBrave` with `site:youtube.com`
- **Enrich**: `scrapeUrl` the watch page → regex extract views/likes. Thumbnails: `https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg`
- **Signals**: `views`, `likes`
- **URL filter**: Only accept `/watch?v=`, `/shorts/`, `youtu.be/{id}`. Drop channel pages, playlists.
- **Video ID extraction**: `url.match(/(?:v=|shorts\/)([\w-]{11})/)`
- **Transcript / "what's this video about"**: to read a video's spoken content, use the bundled `yt-dlp` CLI from **Bash** (a local sandbox binary, not a Cloud SDK module). It fetches captions without downloading the video:

  ```bash
  yt-dlp --skip-download --write-auto-subs --write-subs \
    --sub-langs "en.*,en" --sub-format json3 -o "/tmp/yt.%(ext)s" "<VIDEO_URL>"
  ```

  Then read `/tmp/yt.*.json3` and concatenate every `events[].segs[].utf8` into the transcript text (prefer the human `.en.json3` over the auto `.en-orig.json3` when both exist). For a long transcript, summarize first and offer to expand a section/time range. **Bot-block caveat**: if `yt-dlp` errors with `Sign in to confirm you're not a bot`, the sandbox IP is blocked by YouTube — tell the user the transcript is unavailable; do NOT fabricate one. `--write-auto-subs` only yields text when the video has captions; there is no audio-transcription fallback in the sandbox.

### Podcasts

- **Search**: Apple Podcasts Search API (free, no auth):
  `https://itunes.apple.com/search?term={query}&media=podcast&entity=podcastEpisode&limit=20`
- **Enrich**: Not needed — API returns full metadata
- **Signals**: `releaseDate`, podcast popularity (no direct metric)
- **Fields**: `trackName` (episode title), `collectionName` (podcast name), `description`, `releaseDate` (ISO 8601), `episodeUrl` (audio), `artworkUrl600`, `trackViewUrl` (Apple Podcasts link), `trackTimeMillis` (duration)
- **Note**: Limited source — best as supplementary, not primary. No engagement metrics.

### General Web

- **Search**: `searchSerper` or `searchBrave` (no site filter)
- **Enrich**: `scrapeUrl` for content extraction
- **Signals**: Search rank position, freshness

## Search Quality Patterns

Start with the sources needed to answer the question. Expand when evidence is
missing, contradictory, or broad coverage is requested; stop when the question
is adequately supported. The wider-search patterns below apply when needed:

- **Multiple queries > one broad query**: 3-5 queries with genuinely different angles (price action, fundamentals, sentiment, events, controversy) produce far better coverage than one keyword dump. Dedup results by URL across queries.
- **Oversample then rank**: Search for ~15 items per source, rank by engagement/freshness/relevance, keep top N. Never trust raw search order as quality order.
- **Entity alias expansion**: When coverage or identity is uncertain, search both the symbol (`$NVDA`, `NVDA`) and the company name (`NVIDIA`). For crypto, include common aliases (`BTC`, `Bitcoin`, `#BTC`). Code should handle this expansion — don't rely on a single query string to cover all variants.
- **Engagement as a secondary signal**: Prioritize source authority, relevance, and recency. Where available, likes, scores, or views may help rank results; zero engagement alone does not disqualify evidence.

## Time Filters by Provider

| Provider | Parameter | 1 day | 1 week | 1 month |
| -------- | --------- | ----- | ------ | ------- |
| Serper | `tbs` | `qdr:d` | `qdr:w` | `qdr:m` |
| Brave | `freshness` | `pd` | `pw` | `pm` |
