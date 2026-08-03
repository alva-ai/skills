# Feed Lifecycle

Feeds are persistent data pipelines. Use them whenever data needs freshness,
history, public reads, charts, playbook backing, alert outputs, or release.
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
   from deploy, and record the returned `feed_id`. Publish creates an ACTIVE
   owner alert binding and, by default, starts the producer once.
6. When a playbook or public user needs the feed, publish its visibility with
   `alva feed set-visibility --id <feed_id> --visibility public`.
7. Verify an unauthenticated read of a public feed path returns HTTP 200.

`automation publish` is create-only. Run it once to register a new automation;
do not treat it as create-or-update.

Choose exactly one first-run path:

- Default: let publish start the producer, and do not call `alva deploy
  trigger` again for the same verification.
- Controlled routing or manual verification: publish with
  `--skip-auto-trigger`, inspect or move the already-created owner alert
  binding, then trigger the producer at most once if a real run is required.

`--skip-auto-trigger` suppresses only the publish-time run. It does not suppress
the owner alert binding. Because the binding exists immediately after publish,
an explicit `deploy trigger` may deliver a real alert.

## Updating An Existing Automation

ALFS source writes take effect without republishing. Use an explicit ID-scoped
update only when the registered semantic version, producer cronjob,
description, changelog, or agent type must change:

```bash
alva automation inspect --id <feed_id>
alva automation update --id <feed_id> --description "..."
```

Run `alva automation update --help` before choosing flags. Omitted fields keep
their current values; an explicit empty metadata string clears that field.
The automation ID, visibility, and alert subscriptions remain intact.

Do not call `automation publish` again for the same name, and do not delete and
recreate an automation to work around `ALREADY_EXISTS`. If the ID is unknown,
find the exact owned automation with `alva automation list`, then inspect it
before updating.

<HARD-GATE id="before-automation-update">
Before `alva automation update`, verify:

1. The target numeric ID belongs to the intended owned automation.
2. The requested flags describe only the fields the user intends to change.
3. If changing the producer, the replacement cronjob exists, belongs to the
   same user, and its id is known.
4. The resulting producer's exact script ran successfully via `alva run` in
   this session and its output still matches the feed contract.

If any evidence is missing, inspect or test first; do not fall back to
delete-and-recreate.
</HARD-GATE>

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
6. The first-run path is explicit: either rely on publish's automatic run, or
   pass `--skip-auto-trigger` because the binding will be routed or the producer
   will be triggered manually afterward.

If any evidence is missing or stale, do not publish. Fix the feed, rerun, and
re-enter the gate.
</HARD-GATE>

After publish, when public access is required, verify:

1. `alva feed set-visibility --id <feed_id> --visibility public` succeeded for
   the `feed_id` returned by publish.
2. An unauthenticated public read returns HTTP 200.
3. Before building or releasing dependent HTML, at least one public `@last`
   path used by the HTML is non-empty.

For push-capable automations, also verify the owner alert binding created by
publish targets the intended destination. Move it with `alva alert enable`
before an explicit trigger when the publish request used `--skip-auto-trigger`.

## Alert Outputs

New push-capable feeds wrap the TypeDoc of each push-worthy output with
`alertOutput(typeDoc)`. The output source may be any valid, non-reserved
`group/output`; its root `body` field is required and `title` is optional.
Other declared fields remain available as ordinary ALFS data.

A top-level script execution may return at most one alert record per declared
source and at most 16 alert records in total, including when it calls multiple
successful `Feed.run()` callbacks. A quiet run appends nothing to the alert
output. `--push-notify` marks the cronjob publisher as capable of delivering
those records; that deploy flag alone does not create an alert binding or bypass
notification preferences. Creating a new automation with `alva automation
publish` does create an ACTIVE owner alert binding before its default first run.
Scheduled runs and `alva deploy trigger` use the same delivery semantics.

Existing `signal/targets` and `notify/message` producers remain compatible
through legacy fanout. They are reserved sources and must not be wrapped in
`alertOutput()`. Keep Altra-owned `signal/targets` unchanged. The
`<|SKIP_NOTIFICATION|>` sentinel applies only to legacy `notify/message`.

See [push-notifications.md](push-notifications.md) for alert destination and
verification workflows.
