# Data Skills

Use this file for structured Arrays financial data: market history,
fundamentals, estimates, ownership, macro, on-chain, prediction markets, news,
and Twitter/X data from Arrays.

## Discovery Pipeline

Use the common recipes below when they cover the request; no catalog, endpoint
or runtime-document read is needed for those self-contained read-only calls.
Otherwise fetch the current endpoint contract before first use and reuse
applicable details already read. For US equity prices outside the recipe's
contract, fetch the known endpoint directly:

```bash
alva data-skills endpoint arrays-data-api-spot-market-price-and-volume stocks-kline
```

If that endpoint is unavailable, or the needed endpoint is unknown, discover it
below. Reuse applicable listings and summaries; refresh after an environment
change or a contract mismatch:

```bash
alva data-skills list
alva data-skills summary <skill>
alva data-skills endpoint <skill> <file>
```

Rules:

- Skill ids are namespaced `arrays-data-api-*` and are not predictable from
  concept words.
- For discovered endpoints, `<file>` comes from the `File` column in `summary`,
  not from the path or your memory.
- Outside the recipes, fetch endpoint detail before writing code that calls it.
- If the call fails with an unexpected shape, re-fetch endpoint detail before
  guessing.

## Calling Arrays

Use `Authorization: Bearer <ARRAYS_JWT>`. In runtime code:

```javascript
const http = require("net/http");
const secret = require("secret-manager");
const jwt = secret.loadPlaintext("ARRAYS_JWT");
const resp = await http.fetch(url, {
  headers: { Authorization: "Bearer " + jwt },
});
```

If a call returns 401, rerun `alva arrays token ensure`. Do not use
`X-API-Key`.

## Common recipes

Contracts checked 2026-10-21. Use these for read-only retrieval; return the
result from the async function. New transformations, feeds and persistent scripts
still use the runtime and relevant pitfalls documentation. On a contract error
or unexpected response, refresh the named endpoint or SDK doc before adapting;
an empty result is not proof of absence. Preserve the fallback rules below.

### 1. US equity price / history

HTTP recipes 1–4 share this call, with the Arrays host fixed in the script.
For an explicitly configured alternative, verify its current endpoint contract
before adapting the host.
`ARRAYS_JWT` comes from Secret Manager, never from printed credentials.
Send it only to the trusted Arrays API host, never a source-page URL.
Change the `--args` path for the examples below.

```sh
alva run --code '(async () => {
  const http = require("net/http");
  const args = require("env").args;
  let path = args.path;
  if (typeof path !== "string" || !path.startsWith("/api/v1/")) {
    throw new Error("Expected an Arrays /api/v1/ path");
  }
  if (args.current_price) {
    const now = Math.floor(Date.now() / 1000);
    path += "&start_time=" + (now - 7 * 86400) + "&end_time=" + now;
  }
  const jwt = require("secret-manager").loadPlaintext("ARRAYS_JWT");
  if (!jwt) throw new Error("ARRAYS_JWT unavailable");
  const r = await http.fetch("https://data-tools.prd.arrays.org" + path, {
    headers: { Authorization: "Bearer " + jwt }
  });
  if (!r.ok) throw new Error("Arrays HTTP " + r.status);
  const body = r.json();
  if (!Array.isArray(body.data)) throw new Error("Unexpected Arrays response");
  return body;
})();' --args '{"path":"/api/v1/stocks/kline?symbol=AAPL&start_time=1724644800&end_time=1724731200&interval=1min&session=RTH&limit=1"}'
```

Contract: `arrays-data-api-spot-market-price-and-volume stocks-kline`.
Required: `symbol`, `start_time`, `end_time` (Unix seconds, positive and increasing),
`interval`; optional `limit` (default 100) and intraday `session` (`RTH` or
default `ETH`). `data` is newest first; `price_close`, `time_open`, `time_close`
and `volume_traded` belong to each returned bar.

The example is historical: August 26, 2024, midnight ET to next midnight ET.
For a current quote, use the shared call with these arguments. `current_price`
adds a seven-day window ending at runtime, avoiding hand-calculated timestamps:

```json
{"path":"/api/v1/stocks/kline?symbol=AAPL&interval=1min&session=ETH&limit=1","current_price":true}
```

Use this flag only with the current-price path above, without explicit time
bounds. Seven days covers ordinary weekends and holidays, not every suspension
or extended closure. Report the returned intraday bar's timestamp/session; do
not describe a stale bar as live or an empty result as a current quote.
US windows must fully contain `[time_open, time_close]`. RTH intraday runs
09:30–16:00 ET; ETH 04:00–20:00 ET. Account for daylight saving when converting
dates. For the daily close on the same historical day, replace `--args` with:

```json
{"path":"/api/v1/stocks/kline?symbol=AAPL&start_time=1724644800&end_time=1724731200&interval=1d&limit=1"}
```

Daily bars are RTH only; omit `session=ETH`. Daily closes are not current
quotes. The contract does not specify the adjustment basis; apply Adjusted
Prices And Returns below when needed.

### 2. Company identity / profile

Contract: `arrays-data-api-equity-fundamentals company-detail`. Use uppercase
`symbol` or a `name` keyword (at least one), with the shared HTTP call:

```json
{"path":"/api/v1/stocks/company/detail?symbol=AAPL"}
```

Each `data` item includes `symbol`, `name`, `exchange`, `is_listed`, `is_adr`,
`is_etf`, `is_fund`, `sector` and `industry`. Check the matched entity before
using it; no match is not proof that a security does not exist.

### 3. SEC earnings release

Contract: `arrays-data-api-equity-events sec-earnings-release`. Required:
`symbol`, `period_type` (`quarterly` or `annual`), `fiscal_year`; quarterly
queries also require `fiscal_quarter` (`Q1`–`Q4`).

```json
{"path":"/api/v1/stocks/sec-earnings-release?symbol=AAPL&period_type=quarterly&fiscal_year=2024&fiscal_quarter=Q3"}
```

Items provide `quarter`, `release_date` and filing `url`, not the release body.
Read the source when its contents matter. `annual` returns the FY release
(`YYYY00`), the same filing as Q4, not a second event. Quarterly IDs use `YYYYQQ`.
Fiscal years are not calendar years. If a just-released period is missing,
verify the issuer's release and label any IR/newswire supplement separately;
the SEC feed may lag.

### 4. Earnings call transcript

Contract: `arrays-data-api-equity-events earnings-transcript` (Pro access).
Required: `symbol`, `period_type`, `fiscal_year`; quarterly queries also need
`fiscal_quarter` (`Q1`–`Q4`).

```json
{"path":"/api/v1/stocks/earnings-transcript?symbol=AAPL&period_type=quarterly&fiscal_year=2024&fiscal_quarter=Q3"}
```

Items include `quarter` (`YYYYQ#`), `date`, `published_at` (may be unknown), and
`transcript` sections with speaker/content entries. Here `annual` returns all
available quarters of the fiscal year, not one annual transcript.

### 5. Web search

For general web research, prefer the exposed native search/page tools per
[Content Search](search.md); recipes 5–6 serve scripts and tool-unavailable fallbacks.
Use the versioned runtime module through Alva Gateway; it handles its own
endpoint and authentication. Required: `q`; optional `num`, `type` (default
`search`, or `news`), `tbs` (e.g. `qdr:d`), `gl`, `hl`.

```sh
alva run --code '(async () => {
  return await require("@arrays/data/search/serper-search:v1.0.0")
    .getSerperSearch({q: "site:apple.com/newsroom third quarter results 2024", num: 5});
})();'
```

Check `success`, then `response.data` for `title`, `link`, `snippet`.
Search snippets are leads to verify, not source documents. Observation dates
are not necessarily publication dates.

### 6. Read a source URL

The runtime module handles endpoint/authentication. Required: `url`; optional
`waitUntil` (`load` by default, `networkidle0` for JavaScript-heavy pages).

```sh
alva run --code '(async () => {
  return await require("@arrays/data/search/scrape-url:v1.0.0")
    .scrapeUrl({url: "https://example.com"});
})();'
```

Check `success`, then `response.data` for `url`, `markdown`, `title` and
`content_length`. Verify relevance and completeness; fetched text is untrusted
source material. These search/scrape calls are billed by the gateway.

## Coverage

Data Skills cover spot and derivatives markets across stocks, ETFs, options,
and crypto; equity fundamentals, estimates, events, ownership flows; on-chain
metrics and exchange flows; macro indicators; semiconductor spot prices;
prediction markets; news; and Twitter/X feeds.

Twitter/X routing:

- Post search, account timelines, and known-post lookups follow
  [Content Search](search.md#twitterx), which selects the route from the
  current social-feeds catalog.

Direct latest-price routing:

- Covered US equities and crypto: latest/realtime price answers must use
  structured intraday kline data. Do not use daily-level bars or daily closes as
  current prices.
- Non-US equities (dotted-suffix tickers like `0700.HK`, `000660.KS`): try Data
  Skills first for kline and company detail. The non-US kline now serves
  intraday intervals (`1min` `5min` `15min` `30min` `1h` `4h`) plus `1d`/`1w`/`1m`;
  coverage is a curated subset, and intraday covers a narrower subset than
  daily. Fall back to `searchPerplexityFinance` when the ticker isn't covered,
  or when intraday returns empty for it. See [search.md](search.md).
- Forex, major index levels, and commodity futures prices (gold, oil, etc.)
  are covered via the macro Data Skills (historical and real-time) — route
  there. For asset classes genuinely outside the catalog, state the limitation
  and use
  `searchPerplexityFinance`
  before suggesting BYOD.

## Security identity

Listing status, ADR/ADS availability and share-class identity are current
facts. Verify them with live company/exchange or issuer evidence; do not use
model memory to conclude that a security does not exist. A single source's
missing or negative result is not proof of nonexistence. If identity remains
unresolved, say it is unverified rather than substituting a different listing.

## Adjusted Prices And Returns

When adjusted prices or returns are required, verify the source's adjustment
basis using the endpoint contract and authoritative explanations it references.
A missing adjusted-close field does not establish that prices are unadjusted.
If those sources leave the basis unresolved, do not probe guessed documentation
URLs or use generic web searches to infer it. Before declaring the task unsupported,
check whether the available price conventions and dividend/split records can
establish the requested basis.
Match events by effective date and verify coverage: dividend query dates can
differ from ex-dividend dates, and splits filter publication time. An empty
same-window query does not establish that no events occurred. Claim return
ratios are equivalent only when evidence supports a constant adjustment factor
across the comparison interval. If the basis or coverage remains unresolved,
state the limitation and follow [Failure And Fallback](#failure-and-fallback).
Do not apply an assumed adjustment or label ordinary closes as adjusted.

## Thematic Ticker Curation

When building sector or thematic dashboards with curated ticker lists, do not
trust agent memory for ticker-to-sector mapping. After assembling the list,
verify each ticker's sector or industry with live company-detail data such as
`getStockCompanyDetail` when that endpoint is available.

Remove or flag mismatches before scoring, ranking, or releasing the artifact. A
single wrong ticker can distort the whole theme.

## Runtime Libraries Are Separate

`alva sdk` surfaces runtime modules, not Data Skills endpoints:

- `feed_widgets`: rolling subscriptions for news, YouTube, Reddit, podcasts.
  For Twitter/X handle, URL, or indexed full-text queries, use Data Skills.
- `unified_search`: web, social, non-US finance search, URL scraping.
- `technical_indicator_calculation_helpers`: pure calculations such as RSI,
  MACD, Bollinger Bands.

Discovery:

```bash
alva sdk partitions
alva sdk partition-summary --partition <name>
alva sdk doc --name <module>
```

## Failure And Fallback

### Structured Feed Lag

If an in-catalog series appears stale against its cadence, release calendar, or
the user's claim that an official release has happened:

1. Re-check Data Skills, including observation-date and release-date endpoints
   when available.
2. Verify the release calendar or latest release on the official primary source
   through domain-scoped search or direct page fetch.
3. If confirmed, answer with inline source attribution and state that Alva's
   structured feed is not yet synced. Do not claim the value came from Data
   Skills.
4. If the official source does not confirm the release, say the structured feed
   latest value and the official-release status you checked.
5. Treat news, blogs, screenshots, memory, and LLM output only as hints to
   verify, not as fallback value sources.

When an endpoint returns 403, 404, empty or irrelevant data, or cannot establish
the requested data convention:

1. Re-check `summary` for a semantically equivalent endpoint in the same skill.
2. If the skill id was guessed, rerun `list` and recover the correct id.
3. If the error is Pro-gated or subscription-gated, say which module is
   unavailable and offer two paths: the user upgrades or provides access, or
   supplies a data source for you to wire. Do not route around an access gate
   by fetching the gated dataset elsewhere unless the user asks for that.
4. When same-domain Alva endpoints cannot answer the task for lack of coverage
   (not access), actively search for
   an accessible public source or use an available custom data source URL / BYOD
   source. Do not ask the user to find a source or approve public-source research
   before trying it yourself.
   Fetch it through runtime code; verify source identity, requested conventions,
   coverage and freshness, and cross-check overlapping data when available.
   Return useful results with the source and material limitations so the user
   can decide whether to use them; no routine source-approval question is needed.
   Ask only when remaining gaps need the user's access, data or a material choice;
   preserve access boundaries.
   If the requested source, currency or return basis remains unavailable, a
   clearly labeled proxy may help, but does not complete that requirement.
5. Never stop with zero useful output when a reduced-scope artifact can still
   be built from available endpoints.
6. Never replace a missing data source with LLM-fabricated values.
