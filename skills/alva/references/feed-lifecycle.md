# Feed Lifecycle

Read this before creating, modifying, deploying, releasing, or debugging a
feed. This file owns the six-step lifecycle and the `before-feed-release` hard
gate. API details live in [feed-sdk.md](feed-sdk.md),
[deployment.md](deployment.md), and [api/filesystem.md](api/filesystem.md).

## Lifecycle

Every new or recreated feed follows these steps:

1. **Design**: choose the data source, schema, data modeling pattern, freshness
   cadence, and feed path. Read [content-legitimacy.md](content-legitimacy.md)
   first for data-source rules.
2. **Write**: implement with `@alva/feed`, `feed.def()`,
   `ctx.self.ts().append()`, and `ctx.kv` for incremental state. Do not use
   `alfs.writeFile()` for feed output data. See [feed-sdk.md](feed-sdk.md).
3. **Upload**: write the script to `~/feeds/<name>/v1/src/index.js`.
4. **Test**: run `alva run --entry-path '~/feeds/<name>/v1/src/index.js'` and
   verify output shape. The Output shape check compares actual groups, fields,
   and sample records with the schema and HTML parser. `alva run` is a test
   step; it does not replace deploy.
5. **Grant**: grant public read on the feed root, not the synth `data/` path:

   ```bash
   alva fs grant --path '~/feeds/<name>' --subject "special:user:*" --permission read
   ```

   Read [api/filesystem.md](api/filesystem.md) before feed-data suffixes or
   grants. The Public-read check must confirm a public unauthenticated feed
   data path returns HTTP 200 before release.

6. **Deploy**: create a cronjob with `alva deploy create`. Read
   [deployment.md](deployment.md) for cron syntax, run verification, debugging,
   and lifecycle cleanup.
7. **Release**: register the feed with `alva release feed` after the hard gate
   below passes. Read [api/release.md](api/release.md) for description rules.

## Data modeling patterns

Canonical examples and API surface live in [feed-sdk.md](feed-sdk.md). Use:

- Snapshot/latest-wins for current state such as company detail, ratings, and
  price-target consensus. Stamp with start-of-day and read `@last/1`.
- Event log for timestamped events such as insider trades, news, or filings.
- Versioned tabular batch for whole-set refreshes such as holders and
  estimates.
- `signal/targets` for actionable trading targets.
- `notify/message` for digest, monitor, heartbeat, or AlvaAsk push text.

`append()` deduplicates by `date`; same-date records are grouped and
auto-flattened by the SDK. CLI/REST reads return grouped rows. `@last` returns
chronological oldest-first data.

## Error handling

Feed scripts should fail fast on unexpected failures. Do not catch and continue
with empty arrays, nulls, partial outputs, or fallback records after data
fetches, upstream reads, LLM parsing, or feed writes.

Use conditionals only for expected business states such as "no new records."
For required inputs, validate shape and throw a meaningful error:

```javascript
if (!rows.length) throw new Error("ohlcv empty for BTCUSDT 1h");
```

Cryptic `TypeError: Cannot read properties of undefined` is not actionable
enough for operations.

## Shape checks

For SDK or Data Skills modules you have not used in the session, run a compact
shape check before writing a full feed:

```javascript
const r = await mod.someFunction({ symbol: "AAPL" });
console.log(JSON.stringify(r).slice(0, 500));
```

Verify the actual response nesting before proceeding. If a run throws, returns
an error, produces empty output when records were expected, or reveals a
mismatched parser, fix the script before grant, deploy, or release. Do not
proceed to later lifecycle steps with broken or empty required output.

## Hard gate: before feed release

<HARD-GATE id="before-feed-release">

Before running `alva release feed`, verify the exact script that will be
released has run successfully in this session.

Required evidence:

1. `alva run --entry-path '~/feeds/<name>/v1/src/index.js'` completed
   successfully after the latest source write.
2. The run produced expected output groups and fields.
3. The evidence is fresh; if the script changed after the run, rerun it.
4. `special:user:*` read permission exists on the feed root. If missing, grant
   it now.
5. A public unauthenticated read of a feed data path returns HTTP 200, not 403.
6. If the feed backs HTML, at least one public `@last` path the HTML will read
   has a non-empty result after grant.

If any evidence is missing or stale, do not run `alva release feed`. Re-run the
feed, inspect the output, and only then proceed. If a run failed or required
output is empty, do not proceed.

</HARD-GATE>

If a build was interrupted and resumed, re-enter this gate from the top.

## Schedules

| Data type | Typical schedule | Rationale |
| --- | --- | --- |
| Stock OHLCV + technicals | `0 */4 * * *` | Markets update during trading hours |
| Company detail / price targets | `0 8 * * *` | Changes infrequently |
| Insider / senator trades | `0 8 * * *` | Filings are daily |
| Earnings estimates | `0 8 * * *` | Updated periodically |

## Resetting development data

During development only, clear stale data with `alva fs remove --recursive`.
Do not use this in production. The authoritative command examples live in
[api/filesystem.md](api/filesystem.md#clearing-feed-data-development-only).
