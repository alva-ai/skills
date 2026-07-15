# Feed Lifecycle

Feeds are persistent data pipelines. Use them whenever data needs freshness,
history, public reads, charts, playbook backing, push sidecars, or release.
The feed is the object and identity; `alva automation` is the product-facing
lifecycle CLI for that same feed, while an `alva deploy` cronjob is its
subordinate data producer.

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
   from deploy, and record the returned `feed_id`.
6. When a playbook or public user needs the feed, publish its visibility with
   `alva feed set-visibility --id <feed_id> --visibility public`.
7. Verify an unauthenticated read of a public feed path returns HTTP 200.

Do not use `alva fs grant` or `alva fs revoke` to change a feed's public
visibility. Feed visibility must update the feed record and its ALFS projection
together; direct filesystem grants are rejected to prevent those states from
drifting.

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

1. The applicable [Alva Knowledge](alva-knowledge.md) requirements passed
   consecutive-run checks: longitudinal or decision automations compare bounded
   history, and push-capable automations suppress non-material repeats.
2. The exact feed script ran successfully in this session after the latest
   source write.
3. Output groups and fields match the feed contract.
4. Evidence is fresh; if source changed after the run, rerun.
5. The producer cronjob exists and its id is known.

If any evidence is missing or stale, do not publish. Fix the feed, rerun, and
re-enter the gate.
</HARD-GATE>

After publish, when public access is required, verify:

1. `alva feed set-visibility --id <feed_id> --visibility public` succeeded for
   the `feed_id` returned by publish.
2. An unauthenticated public read returns HTTP 200.
3. Before building or releasing dependent HTML, at least one public `@last`
   path used by the HTML is non-empty.

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
