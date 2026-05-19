# Content Search

Search SDKs for discovering unstructured content across multiple sources.
For handle-first access (subscribe to an account, or — Twitter only —
backfill its history), use the `feed_widgets` partition instead. The search SDKs below live in the `unified_search` partition.

## SDK Modules

| SDK | Module | Best for |
| --- | ------ | -------- |
| `searchGrokX` | `@arrays/data/search/search-grok-x:v1.0.0` | Twitter/X — returns engagement directly |
| `searchPerplexityFinance` | `@arrays/data/search/search-perplexity-finance:v1.0.0` | Fallback live finance search for non-US equities and markets not covered well by structured Alva SDKs |
| `searchSerper` | `@arrays/data/search/serper-search:v1.0.0` | Google index: News, YouTube, Reddit, Web |
| `searchBrave` | `@arrays/data/search/search-brave:v1.0.0` | Independent index, good Reddit coverage |
| `scrapeUrl` | `@arrays/data/search/scrape-url:v1.0.0` | Scrape any page to markdown for enrichment |

## Sources

### Finance Search

- **Search**: `searchPerplexityFinance` — a live, source-cited finance answer engine covering quotes, company profiles, financial statements and ratios, valuation and pricing, earnings, analyst estimates, segment/KPI metrics, market movers, and ownership/corporate actions.
- **Intended role**: fallback for finance questions the structured Alva SDKs cannot answer — non-US equities, plus asset classes outside the Alva data catalog.
- **Non-US equities**: use this for listings on non-US exchanges — Japan, Korea, India, UK, Brazil, Netherlands, Hong Kong, China A-shares, and others — plus foreign-company ADRs, all of which the US-centric structured Alva SDKs cover poorly or not at all. Coverage is web-backed and best-effort, not a guaranteed dataset — depth and freshness track how well a market is reported online, so a large cap on a liquid exchange returns far more than a small cap on a thin one. Disambiguate the listing in the query — local ticker + exchange, or full company name (e.g. "Toyota 7203 on the Tokyo Stock Exchange", "HSBC on the LSE") — and verify the answer against the `sources` it returns.
- **Forex & traditional futures**: also the fallback for forex pairs and traditional index/commodity futures (e.g. S&P, crude, gold) — the structured Alva SDKs' derivatives coverage is crypto futures and equity/ETF options, not these. Crypto itself stays on the structured SDKs (`getCryptoKline`, perpetual-futures OHLCV, funding rates) — never route crypto to finance search.
- **Query scoping**: state the business question first, then the company or ticker, then an explicit time window (`latest quarter`, `last 30 days`); it answers best when the prompt names the outcome, not the data shape.
- **Fields**: `summary`, `data`/`arrays` result blocks, `tickers`, `sources`, and provider `usage` metadata when available.
- **Gotcha**: a live search/answer tool, not a historical time-series endpoint. For US equities and deterministic OHLCV, fundamentals, earnings, or macro series, prefer the structured Alva data SDKs first; use finance search only as a fallback for missing coverage, current context, or source-backed enrichment.

### Twitter/X

- **Search**: `searchGrokX` with `from_date`/`to_date` (YYYY-MM-DD format)
- **Enrich**: Not needed — GrokX returns engagement natively
- **Signals**: `like_count`, `retweet_count`, `reply_count`, `quote_count`
- **Fields**: `content`, `url`, `author_name`, `author_username`, `author_avatar`, `created_at` (ms — real publish time), `author_verified`, `author_followers_count`
- **Batch queries**: GrokX is AI-powered, not keyword-matching — multiple related entities can be combined into one call (e.g. "Why are $AAPL $TSLA $NVDA moving? Explain each"). The `summary` will segment by entity automatically. Returned tweets are mixed (not per-entity); only do per-entity individual searches when the use case requires raw per-entity source content.
- **Gotcha**: A single broad query returns mostly 0-engagement noise. Fix: (1) run 3-5 queries with different topical angles (e.g. "NVDA earnings", "NVDA AI chips", "NVDA stock price") plus entity aliases (`$NVDA`, `NVIDIA`); (2) filter results — tweets with `like_count == 0` AND `retweet_count == 0` are almost always noise; (3) `author_followers_count` and `author_verified` are strong quality signals for sorting survivors.

### News

- **Search**: `searchSerper` with `type:"news"` + `searchBrave` with `freshness` filter
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

These apply across all sources:

- **Multiple queries > one broad query**: 3-5 queries with genuinely different angles (price action, fundamentals, sentiment, events, controversy) produce far better coverage than one keyword dump. Dedup results by URL across queries.
- **Oversample then rank**: Search for ~15 items per source, rank by engagement/freshness/relevance, keep top N. Never trust raw search order as quality order.
- **Entity alias expansion**: For tickers, always search both the symbol (`$NVDA`, `NVDA`) and the company name (`NVIDIA`). For crypto, include common aliases (`BTC`, `Bitcoin`, `#BTC`). Code should handle this expansion — don't rely on a single query string to cover all variants.
- **Engagement as quality gate**: Every source has a native engagement signal (Twitter: likes/retweets, Reddit: score, YouTube: views). Items with zero engagement across all metrics are almost always noise — filter them out before presenting to the user.

## Time Filters by Provider

| Provider | Parameter | 1 day | 1 week | 1 month |
| -------- | --------- | ----- | ------ | ------- |
| GrokX | `from_date` / `to_date` | YYYY-MM-DD (1 day ago) | YYYY-MM-DD (7 days ago) | YYYY-MM-DD (30 days ago) |
| Serper | `tbs` | `qdr:d` | `qdr:w` | `qdr:m` |
| Brave | `freshness` | `pd` | `pw` | `pm` |
