# Feed Lifecycle

Feeds are persistent data pipelines. Use them whenever data needs freshness,
history, public reads, charts, playbook backing, push sidecars, or release.

For API detail and examples, read [feed-sdk.md](feed-sdk.md). For scheduled
jobs, read [deployment.md](deployment.md). For runtime constraints, read
[jagent-runtime.md](jagent-runtime.md).

## Lifecycle

Every feed follows the same path:

1. Write schema and incremental logic with `feed.def()` and
   `ctx.self.ts().append()`.
2. Upload source to `'~/feeds/<name>/v1/src/index.js'`.
3. Test with `alva run --entry-path '~/feeds/<name>/v1/src/index.js'`.
4. Deploy the script with `alva deploy create`.
5. Publish the automation with `alva automation publish` using the cronjob id
   from deploy. This writes the `feeds` row, so the feed now has a numeric id.
6. Make the feed public when a playbook or public user needs it:
   `alva feed set-access --id <feed_id> --access public` (get `<feed_id>` from
   `alva feed list` — it only appears after step 5). This writes the feed's
   `is_public` intent and the ALFS read grant together. Do **not** grant
   `special:user:*` on the feed directory by hand — that drifts from
   `is_public` and can be reverted by reconciliation.

`alva run` is a test step. It does not replace deploy or release and does not
guarantee public `@last` data for a playbook.

## Modeling

Use the Feed SDK for output data. Do not use `alfs.writeFile()` for feed data.

- Snapshot/latest-wins: current company detail, ratings, price target consensus.
  Stamp start-of-day and read `@last/1`.
- Event log: insider trades, news, filings. Use each event's natural timestamp.
- Tabular batch: top holders, estimate tables, screen results. Stamp all rows
  with the run time; same-date records are grouped.
- Time series: OHLCV, indicators, equity curves. Use bar or event timestamps.

`@last` returns chronological oldest-first order. `last(N)` limits unique
timestamps, not necessarily individual records when a timestamp has grouped
rows.

## Error Handling

Fail fast. Do not wrap data fetches, upstream reads, LLM parsing, or
`ctx.self.ts().append()` in `catch` blocks that log and continue with empty
arrays, nulls, fallback records, or partial outputs. Use ordinary conditionals
only for expected business states such as "no new records".

Throw meaningful errors:

```javascript
if (!equityRecords.length) {
  throw new Error("equityRecords empty: no aligned bars across " + TICKERS);
}
```

If a run fails with out-of-memory, retry with a larger `--max-heap-size-mb` (up
to 2048) before editing logic.

## HARD-GATE: before-automation-publish

<HARD-GATE id="before-automation-publish">
Before `alva automation publish`, verify:

1. The exact feed script ran successfully in this session after the latest
   source write.
2. Output groups and fields match the feed contract.
3. Evidence is fresh; if source changed after the run, rerun.

If any evidence is missing or stale, do not publish. Fix the feed, rerun, and
re-enter the gate.

Publishing writes the `feeds` row and gives the feed its numeric id.
**Immediately after publish**, when public reads are needed:

4. Make the feed public with `alva feed set-access --id <feed_id> --access public`
   (id from `alva feed list`, which exists only after publish; this sets
   `is_public` and the ALFS read grant together — do not grant `special:user:*`
   by hand).
5. Confirm an unauthenticated public read returns HTTP 200, not 403.
6. If the feed backs HTML, confirm at least one public `@last` path the HTML
   reads has non-empty data after `set-access`.
</HARD-GATE>

## Push Sidecars

Push-capable feeds write one of these streams:

| Output stream    | Use                                                                |
| ---------------- | ------------------------------------------------------------------ |
| `signal/targets` | Playbook signals, trading targets, actionable alerts.              |
| `notify/message` | Feed results, AlvaAsk reports, heartbeat checks, proactive alerts. |

Both dispatch `feed_alert_ready`. Do not use legacy names such as
`playbook_data_ready` or `feed_run_complete` in new docs.

`--push-notify` marks the cronjob publisher as capable of emitting alerts. It
does not subscribe any user or group and does not bypass notification
preferences. For `notify/message`, `<|SKIP_NOTIFICATION|>` advances fanout
without sending a visible push.

See [push-notifications.md](push-notifications.md) for the personal alert,
group subscription, and verification workflow.
