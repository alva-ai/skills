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
metrics and exchange flows; macro indicators; prediction markets; news; and
Twitter/X feeds.

Twitter/X routing:

- Use Data Skills for per-handle history, URL lookup, and full-text search over
  the X accounts Arrays tracks.
- Use `unified_search` / Grok when you need global X search beyond the tracked
  index.

Direct latest-price routing:

- Covered US equities and crypto: use structured intraday kline data, not daily
  bars during market hours.
- Non-US equities such as A-shares, HK stocks, and exchange-suffixed tickers:
  use `searchPerplexityFinance` first. See [search.md](search.md).
- Forex pairs and traditional index/commodity futures may be outside the
  structured catalog. State the limitation and use `searchPerplexityFinance`
  before suggesting BYOD.

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

When an endpoint returns 403, 404, empty, or irrelevant data:

1. Re-check `summary` for a semantically equivalent endpoint in the same skill.
2. If the skill id was guessed, rerun `list` and recover the correct id.
3. Report BYOD only after same-domain Alva endpoints cannot answer the task.
4. Never replace a missing data source with LLM-fabricated values.
