# Data Skills

Use this file for structured Arrays financial data: market history,
fundamentals, estimates, ownership, macro, on-chain, prediction markets, news,
and Twitter/X data tracked by Arrays.

## Discovery Pipeline

Run the live discovery pipeline in order for every endpoint used in a session:

```bash
alva data-skills list
alva data-skills summary <skill>
alva data-skills endpoint <skill> <file>
```

Rules:

- Skill ids are namespaced `arrays-data-api-*` and are not predictable from
  concept words.
- `<file>` comes from the `File` column in `summary`, not from the path or your
  memory.
- Fetch endpoint detail before writing code that calls it.
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

## Coverage

Data Skills cover spot and derivatives markets across stocks, ETFs, options,
and crypto; equity fundamentals, estimates, events, ownership flows; on-chain
metrics and exchange flows; macro indicators; semiconductor spot prices;
prediction markets; news; and Twitter/X feeds.

Twitter/X routing:

- Use Data Skills for per-handle history, URL lookup, and full-text search over
  the X accounts Arrays tracks.
- Use `unified_search` / Grok when you need global X search beyond the tracked
  index.

Direct latest-price routing:

- Covered US equities and crypto: latest/realtime price answers must use
  structured intraday kline data. Do not use daily-level bars or daily closes as
  current prices.
- Non-US equities (dotted-suffix tickers like `0700.HK`, `000660.KS`): try Data
  Skills first for daily (`1d`) kline and company detail. Coverage is a curated,
  daily-only subset, so fall back to `searchPerplexityFinance` when the ticker
  isn't covered or you need an intraday / live price. See [search.md](search.md).
- Forex, major index levels, and commodity futures prices (gold, oil, etc.)
  are covered via the macro Data Skills (historical and real-time) — route
  there. For asset classes genuinely outside the catalog, state the limitation
  and use
  `searchPerplexityFinance`
  before suggesting BYOD.

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

When an endpoint returns 403, 404, empty, or irrelevant data:

1. Re-check `summary` for a semantically equivalent endpoint in the same skill.
2. If the skill id was guessed, rerun `list` and recover the correct id.
3. If the error is Pro-gated or subscription-gated, say which module is
   unavailable and give exactly two paths: the user upgrades or provides
   access, or the user provides a custom data source URL / BYOD source for the
   agent to wire.
4. Report BYOD only after same-domain Alva endpoints cannot answer the task.
5. Never stop with zero useful output when a reduced-scope artifact can still
   be built from available endpoints.
6. Never replace a missing data source with LLM-fabricated values.
