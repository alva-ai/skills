# Operational Pitfalls

Read this when debugging stale data, path problems, runtime failures, release
quota surprises, or chart rendering issues. It is the canonical home for
cross-cutting gotchas that do not belong to one API file.

## Filesystem Layout

| ALFS path | Purpose |
| --- | --- |
| `~/tasks/<name>/src/` | Task source code |
| `~/feeds/<name>/v1/src/` | Feed script source code |
| `~/feeds/<name>/v1/data/` | Feed synth mount, auto-created by Feed SDK |
| `~/playbooks/<name>/` | Playbook web app assets |
| `~/data/` | General data storage |
| `~/library/` | Shared code modules |

Prefer Feed SDK storage for data organization, including point-in-time
snapshots. Store snapshots as single-record time series rather than raw JSON via
`alfs.writeFile()`.

## Path and feed data gotchas

- @last returns chronological oldest-first order, consistent with `@first`
  and `@range`.
- Time-series reads return flat JSON records. Regular paths return file content
  with `Content-Type: application/octet-stream`.
- `last(N)` limits unique timestamps, not records. Grouped timestamps can
  expand to more than N records.
- `data/` in feed paths is the synth mount. Do not name a feed group `data`,
  or you will create `data/data/...`.
- Public reads require absolute paths such as
  `/alva/home/<username>/feeds/<name>/v1/data/...`, not `~/...`.
- Quote ~ paths in shell commands. Bare `~` expands to the local machine's
  home directory, not ALFS.
- Inside the V8 runtime, `require("alfs")` uses absolute ALFS paths. Build them
  with `require("env").username`.
- If all ALFS operations fail with `PERMISSION_DENIED`, even on `~/`, the home
  directory may not be provisioned. `alva fs mkdir --path '~/'` is idempotent.
- `alva fs remove` deletes ALFS files but not feed/playbook DB rows. Use
  `alva feed delete` or `alva playbook delete` for lifecycle records. See
  [deployment.md](deployment.md#feed--playbook-lifecycle--extras-not-in-cli-help).

Read [api/filesystem.md](api/filesystem.md) for authoritative synth-mount
suffixes and grant rules.

## Common Pitfalls

The sections below collect the highest-frequency mistakes. Read the owning
reference after this file points you to the likely subsystem.

## Runtime gotchas

- No top-level `await`; wrap async code in `(async () => { ... })();`.
- No Node.js builtins such as `fs`, `path`, `http`, or `crypto`.
- No `process` object. Use `console.log`, Secret Manager, and thrown errors.
- No timer globals such as `setTimeout` or `setInterval`.
- No global `fetch`; require `net/http` and call `http.fetch`.
- Module exports are frozen; do not mutate them.
- `FeedAltra.run()` returns a Promise. Always `await` it.

Read [jagent-runtime.md](jagent-runtime.md) for the module system, built-ins,
async model, and runtime limits.

## Altra and data pitfalls

- Always use Altra for backtests, strategies, portfolio simulation, signal
  targets, drawdown/equity/Sharpe computation, position tracking, and
  rebalancing.
- Feature lookback controls feature computation history; strategy lookback
  controls records delivered to the strategy and may extend upstream ranges.
- Live-price answers must come from intraday klines. `interval=1d` can be the
  previous session close during trading hours.
- Use separate `ctx.kv` watermarks per data source when update frequencies
  differ. A shared `lastDate` can permanently filter out slow sources.
- For fundamentals, read [fundamentals-periods.md](fundamentals-periods.md)
  before period comparisons or YoY/QoQ.

## Playbook and chart pitfalls

- Create new playbooks from scratch unless doing a version update. Only version
  updates may refer to an existing playbook; use
  [remix-workflow.md](remix-workflow.md) for user-requested remixes.
- ECharts date axes should use `type: "time"` for epoch values.
- For ECharts graph series with `layout: "none"`, validate node/edge names,
  duplicate nodes, and source/target references before initialization.
- Allocate enough chart height. Heatmaps need
  `max(300px, row_count * 40px)`. Primary overview charts should usually be at
  least 400px tall.

Read [design-system.md](design-system.md) first, then widget/component-specific
references.

## Resource limits

| Resource | Limit |
| --- | --- |
| V8 heap per execution | 2 GB |
| Write payload | 10 MB max per request |
| HTTP response body | 128 MB max |
| Minimum cron interval | 1 minute |
