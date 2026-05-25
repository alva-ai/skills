# Data Skills

Read this before discovering or calling structured Alva financial-data
endpoints. It owns Arrays endpoint discovery, token handling, coverage routing,
and failure fallback.

## What Data Skills cover

Data Skills are structured endpoints served by the Arrays backend
(`$ARRAYS_ENDPOINT`, default `https://data-tools.prd.space.id`). They cover
financial markets, on-chain analytics, macro indicators, news, prediction
markets, and per-handle Twitter/X feeds for history and rolling updates.

Use [search.md](search.md) for unstructured topic or keyword search across
Twitter/X, news, Reddit, YouTube, podcasts, web, non-US finance search, and
off-catalog assets. Prefer Data Skills first for US equities, crypto, and
deterministic time-series or fundamental data.

## Mandatory discovery pipeline

Before any Arrays HTTP call, or any `alva run` that makes one, complete this
pipeline in the current session:

1. List candidate skills:

   ```bash
   alva data-skills list
   alva data-skills list | grep -i <topic>
   ```

   Skill ids are namespaced and not predictable from concept words.

2. Read the endpoint table:

   ```bash
   alva data-skills summary <skill>
   ```

   `<file>` slugs come from the `File` column, not the `Path` column.

3. Read endpoint details:

   ```bash
   alva data-skills endpoint <skill> <file>
   ```

   This is mandatory before writing code. It gives parameters, response fields,
   examples, and shape.

4. Call Arrays endpoints with:

   ```text
   Authorization: Bearer <ARRAYS_JWT>
   ```

   In runtime code:

   ```javascript
   const secret = require("secret-manager");
   const jwt = secret.loadPlaintext("ARRAYS_JWT");
   ```

   Do not use X-API-Key. Do not use an `X-API-Key` header. If a call returns
   401, rerun `alva arrays token ensure`.

Never guess endpoint paths, parameter names, response shapes, skill ids, or file
slugs from memory.

## Source routing

| Need | Surface |
| --- | --- |
| Financial data: markets, fundamentals, on-chain, macro, news, prediction markets | `alva data-skills` |
| Twitter/X by handle, history and rolling updates | `alva data-skills` |
| Handle/channel subscriptions for news, YouTube, Reddit, podcasts | runtime-library `feed_widgets` |
| Topic or keyword search across social/news/web | runtime-library `unified_search`; see [search.md](search.md) |
| Pure calculation helpers | runtime-library `technical_indicator_calculation_helpers` |

Discover runtime libraries with:

```bash
alva sdk partitions
alva sdk partition-summary --partition <name>
alva sdk doc --name <module>
```

## Response-shape checks

Before writing a full feed around an unfamiliar endpoint, run a small
`alva run` shape check and print a compact sample. Verify actual nesting and
field names before coding the parser.

If a call fails with an unexpected shape, re-fetch the endpoint detail before
changing code.

## Failure and fallback guardrail

If an Arrays endpoint returns 403, 404, empty, or irrelevant results:

1. Re-check `alva data-skills summary <skill>` for another endpoint in the same
   skill.
2. If the skill id was guessed or weakly matched, rerun `list`.
3. Try a semantically equivalent same-domain Alva endpoint.
4. Report BYOD as the final fallback only after same-domain Alva endpoints
   cannot answer the question.

Do not immediately tell the user to upgrade or use BYOD. For subscription-gated
modules, follow [content-legitimacy.md](content-legitimacy.md#coverage-gaps-and-fallbacks).

## Direct answers

When answering a data query directly, every financial figure must come from a
fresh Data Skills, SDK, published-feed, or validated BYOD fetch and be
attributed to the source. If a required value cannot be fetched, say the value
could not be fetched and explain the blocker. Do not answer financial figures,
including current market data, ratios, fundamentals, or screens, from memory
with an estimate caveat.
