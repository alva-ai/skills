# Deployment Guide

Deploy scripts as cronjobs for scheduled, automated execution. A deploy cronjob
is the subordinate producer for a feed: it runs the source script, creates or
refreshes feed data, and exposes run history/logs. The feed's lifecycle is
managed through `alva automation`; see [feed-lifecycle.md](feed-lifecycle.md).

The deploy CLI manages producer cronjobs:

| Group         | Manages                                                         | Common commands                                                                                 |
| ------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `alva deploy` | Cronjob producers (schedule + entry script + run status/logs)   | `create`, `list`, `get`, `update`, `delete`, `pause`, `resume`, `trigger`, `run-status`, `runs`, `run-logs` |
| `alva loop`   | Self-scheduled in-channel goal loops (sugar over `alva deploy`) | `create`                                                                                        |

---

## Overview

The deployment workflow:

1. **Write** a script (feed or task) to ALFS
2. **Test** it manually via `alva run`
3. **Deploy** it as a cronjob via `alva deploy create`
4. **Verify** the deployment via `alva deploy trigger` (one out-of-schedule run)
5. **Monitor** the cronjob status via `alva deploy list` / `alva deploy get`
6. **Debug** execution history via `alva deploy runs` / `alva deploy run-logs`

Cronjobs execute the script through the same jagent runtime as `alva run`. The
script receives the same environment (`require("env").args` contains the
cronjob's args).

---

## Cronjob CLI

All cronjob operations use `alva deploy <subcommand>`.

### Create Cronjob

```bash
alva deploy create --name btc-ema-update --path '~/feeds/btc-ema/v1/src/index.js' --cron "0 */4 * * *" --args '{"symbol": "BTC"}' --push-notify
```

| Flag          | Type   | Required | Description                                                                   |
| ------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| --path        | string | yes      | Path to entry script (home-relative or absolute)                              |
| --cron        | string | yes      | Standard cron expression                                                      |
| --name        | string | yes      | Job name (1–63 lowercase alphanumeric or hyphens, no leading/trailing hyphen) |
| --args        | JSON   | no       | JSON passed to `require("env").args` on each execution                        |
| --push-notify | flag   | no       | Let this cronjob emit feed alert events after successful feed runs            |

When `--push-notify` is set, every successful cronjob execution checks the
feed's push sidecars. `signal/targets` and `notify/message` both dispatch the
canonical `feed_alert_ready` event with different feed-alert sources. The push
body is read from the _published_ automation: a cronjob with `--push-notify` but
no `alva automation publish` dispatches an empty body. Delivery also requires an
explicit personal alert or group subscription to the automation's feed.
Following a playbook that references the feed does not enable alerts;
`--push-notify` does not subscribe the owner, any user, or any group. For
`notify/message`, `<|SKIP_NOTIFICATION|>` in `body`/`text` skips the user-visible
push while advancing fanout.

The CLI validates that the entry path exists on the filesystem before creating
the cronjob.

**Response**:

```json
{
  "id": 42,
  "name": "btc-ema-update",
  "path": "/feeds/btc-ema/v1/src/index.js",
  "cron_expression": "0 */4 * * *",
  "status": "active",
  "args": { "symbol": "BTC" },
  "push_notify": true,
  "created_at": "2026-03-04T12:00:00Z",
  "updated_at": "2026-03-04T12:00:00Z"
}
```

### List Cronjobs

```bash
alva deploy list [--limit 10] [--cursor CURSOR]
```

| Flag     | Type   | Default | Description                              |
| -------- | ------ | ------- | ---------------------------------------- |
| --limit  | int    | 20      | Max results per page                     |
| --cursor | string |         | Pagination cursor from previous response |

### Get Cronjob

```bash
alva deploy get --id 42
```

### Update Cronjob

Partial update -- only include flags you want to change.

```bash
alva deploy update --id 42 --cron "0 */2 * * *" --args '{"symbol":"ETH"}'
```

Updatable fields: `--name`, `--cron`, `--args`, `--push-notify` /
`--no-push-notify`.

### Delete Cronjob

```bash
alva deploy delete --id 42
```

### Pause / Resume

```bash
alva deploy pause --id 42
alva deploy resume --id 42
```

Both return the updated cronjob object.

### Trigger an Out-of-Schedule Run

Fire the cronjob once, immediately. Returns the Hatchet workflow run id at
enqueue — async; the `cronjob_runs` row may appear as `DISPATCHED` or `RUNNING`
before the run reaches a terminal state.

```bash
alva deploy trigger --id 42
# { "workflow_run_id": "hatchet-wf-..." }
```

To verify completion, poll `run-status` with the returned `workflow_run_id` and
a caller-owned timeout:

```bash
WF=$(alva deploy trigger --id 42 | jq -r .workflow_run_id)
for _ in {1..60}; do
  STATUS_JSON=$(alva deploy run-status --id 42 --workflow-run-id "$WF")
  STATE=$(echo "$STATUS_JSON" | jq -r .state)
  case "$STATE" in PENDING|DISPATCHED|RUNNING) ;; *) break ;; esac
  sleep 5
done
case "$STATE" in
  PENDING|DISPATCHED|RUNNING) echo "Timed out waiting for run completion" >&2; exit 1 ;;
esac
echo "$STATUS_JSON" | jq '{state, run: (.run // null)}'
```

`PENDING` means the workflow was accepted but no `cronjob_runs` row exists yet.
It can also mean the workflow id was wrong, belongs to another cronjob, or the
workflow failed before persistence; it is not proof that a row will eventually
appear. `DISPATCHED` and `RUNNING` mean an in-flight row exists, but callers
still need their own deadline in case the run never reaches a terminal state.
Terminal states are `COMPLETED`, `FAILED`, and `SKIPPED`; when a terminal
response includes `.run.id`, use `alva deploy run-logs --id 42 --run-id <rid>`
for execution output.

Use _after_ deploy to confirm the full cronjob path is wired correctly. For
iterating on script logic without Hatchet, use `alva run` instead.

### Debugging Runs

When a cronjob fails or produces unexpected output, use `runs` and `run-logs` to
diagnose the problem.

**List run history** — shows each execution's status, duration, and error
message. The response also includes aggregate stats (total/success/fail counts).

```bash
alva deploy runs --id 42                # recent runs
alva deploy runs --id 42 --first 10     # paginate
```

**Get logs for a specific run** — returns the full stdout/stderr from that
execution, useful for tracing errors or verifying output.

```bash
alva deploy run-logs --id 42 --run-id 123
```

---

## Channel Loops

A **loop** is a cronjob that each tick runs one fire-and-forget agent turn on a
channel's main session (via `@alva/loop`), driving that channel toward a goal.
`alva loop create` is sugar over `alva deploy create`: it seeds a shared
loop-runner and packs your goal/channel into the args, so you write no script.

```bash
alva loop create \
  --channel-id 12345 \
  --name nvda-premarket-setup \
  --goal 'Watch NVDA pre-market for a break above the pre-market high with 5-minute volume at least 2x the prior five-bar average. If confirmed, post one alert here with price, time, and evidence, then delete this loop by name. Otherwise finish this tick without an alert.' \
  --cron '*/15 * * * *' \
  --start now \
  --until '2026-07-15T09:30:00-04:00'
```

Or start at a future time and stop after an exact number of admitted runs:

```bash
alva loop create \
  --goal 'Check the next 12 hourly intervals and post only material changes.' \
  --cron '0 * * * *' \
  --start '2026-07-15T08:00:00-04:00' \
  --runs 12
```

The relay wraps the goal in an automated user-turn wake each tick, with
platform-owned context before it and loop policy after it. Keep `--goal`
focused on the business objective, including concrete stop conditions and the
stop action.

| Flag         | Required    | Description                                                                 |
| ------------ | ----------- | --------------------------------------------------------------------------- |
| --goal       | yes         | Instruction run each tick                                                   |
| --cron       | yes         | Cron expression                                                             |
| --channel-id | no          | Target channel. Omit ⇒ your DM / Alva Agent channel                        |
| --start      | no          | Inclusive start: `now` (default, resolved by backend clock) or RFC3339       |
| --until      | conditional | Exclusive RFC3339 cutoff; required when `--runs` is absent                   |
| --runs       | conditional | Positive maximum admitted runs after start; required when `--until` is absent |
| --name       | no          | Stable job name; recommended when the goal may stop its own loop early      |

At least one of `--until` or `--runs` is required. When both are present, the
first exhausted bound completes the loop. RFC3339 timestamps must include a
timezone (`Z` or `±HH:MM`). `--expires-in` is removed with no compatibility
alias; express the real cutoff with `--until` or the exact count with `--runs`.

Only admitted runs increment `run_count`: attempts before `--start`, at or
after `--until`, or beyond `--runs` do not dispatch an Agent turn. The final
admitted run still executes. Natural exhaustion removes the scheduler trigger
and preserves the cronjob row with status `completed` for inspection.

**Channel id**: read `channel-id` from the
`<session-prefill-channel-memory channel-id="…">` block in your context — that
is the current channel's id. There is no slug→id lookup.

**Stopping a loop**: the platform bounds are the hard stop. For success that
can happen earlier, make the goal self-terminating: tell the Agent to run
`alva deploy list`, match the loop by its `--name`, and run
`alva deploy delete --id <id>`. There is no `alva loop stop` or list command;
use `alva deploy` for lifecycle inspection and cleanup. `pause` also stops
future ticks without deleting the row.

---

## Automation / Playbook Lifecycle — Extras Not In CLI Help

Run `alva automation --help` and `alva playbook --help` for subcommands, flags,
and response shapes. This section only covers the conceptual boundaries and the
deletion gotcha — the help text is authoritative on flags.

**What each group manages.**

- `alva deploy` — the **cronjob** (schedule + entry script + args). Lives in the
  `cronjobs` table and belongs to a feed.
- `alva automation` — the product-facing lifecycle CLI for the same underlying
  feed object; ids are feed ids, and `stop` / `resume` delegate to the feed's
  producer cronjob. Feed publication state lives in `feeds` / `feed_majors`.
- `alva playbook` — the **published playbook** (rendered HTML + display_name +
  visibility + ACL). Lives in `playbooks` and is surfaced at
  `https://alva.ai/u/<username>/playbooks/<name>`.

Creation usually moves in order (`alva deploy create` →
`alva automation publish` → `alva release playbook`), but the producer
cronjob, feed publication rows, and playbook row are stored separately.
Deleting one does **not** automatically delete the others — see the cascade
notes in each `--help`.

`alva automation publish` also accepts `--agent-type alpi` to mark a feed whose
alpi agent appends the owner's editable `AGENTS.md` instructions — see
[api/release.md](api/release.md#agent-type).

**Don't use `alva fs remove` to delete a feed or playbook.** It clears the ALFS
files (the rendered HTML, the data mount), but the `playbooks` / `feeds` DB row
stays alive. The platform still:

- counts the playbook against the free-tier 1-playbook cap
- serves the (now empty) public URL with stale metadata
- fires push fanout for the (now empty) feed

The cap-gate symptom is "the platform still has a playbook record for me even
after I cleaned the ALFS files". The fix is `alva playbook delete --name <X>`
(or `alva automation delete --id <X>`), which soft-deletes the DB row and frees
the quota / ACL immediately.

---

## Cron Expression Format

Standard 5-field cron format: `minute hour day-of-month month day-of-week`

| Expression    | Schedule                        |
| ------------- | ------------------------------- |
| `* * * * *`   | Every minute (minimum interval) |
| `*/5 * * * *` | Every 5 minutes                 |
| `0 * * * *`   | Every hour (at minute 0)        |
| `0 */4 * * *` | Every 4 hours                   |
| `0 0 * * *`   | Daily at midnight UTC           |
| `0 9 * * 1-5` | Weekdays at 9:00 UTC            |
| `0 0 1 * *`   | First day of each month         |

**Minimum interval**: 1 minute. Expressions that would fire more frequently are
rejected.

---

## Execution Model

When a cronjob triggers:

1. The scheduler reads the cronjob config
2. It executes the script with the configured `entry_path` and `args`
3. The script runs in the same environment as a manual `alva run` call

The script has full access to:

- All `require()` modules (alfs, env, net/http, runtime libraries, @alva/feed,
  etc.)
- `require("env").args` contains the args from the cronjob configuration
- Filesystem read/write
- HTTP requests

---

## Limits

| Limit              | Value              |
| ------------------ | ------------------ |
| Min cron interval  | 1 minute           |
| Execution timeout  | Same as `alva run` |
| Heap per execution | 2 GB               |

---

## Complete Workflow Example

This example creates a BTC price feed that runs every 4 hours.

### 1. Write the feed script

```bash
alva fs mkdir --path '~/feeds/btc-hourly/v1/src'
```

Write the script to ALFS. Prefer ALFS-native write/edit tools when available;
the `--file` form is for shell-only CLI sessions:

```bash
alva fs write --path '~/feeds/btc-hourly/v1/src/index.js' --file ./index.js --mkdir-parents
```

Where `index.js` contains:

```javascript
const { Feed, feedPath, makeDoc, num } = require("@alva/feed");
const { getCryptoKline } = require("@arrays/crypto/ohlcv:v1.0.0");

const feed = new Feed({ path: feedPath("btc-hourly") });

feed.def("market", {
  ohlcv: makeDoc("BTC OHLCV", "Hourly BTC price data", [
    num("open"),
    num("high"),
    num("low"),
    num("close"),
    num("volume"),
  ]),
});

(async () => {
  const now = Math.floor(Date.now() / 1000);

  await feed.run(async (ctx) => {
    const raw = await ctx.kv.load("lastDate");
    const lastDate = raw ? Number(raw) : 0;
    const start = lastDate > 0 ? Math.floor(lastDate / 1000) : now - 7 * 86400;

    const result = getCryptoKline({
      symbol: "BTCUSDT",
      start_time: start,
      end_time: now,
      interval: "1h",
    });

    if (!result.success)
      throw new Error("Failed to fetch: " + JSON.stringify(result));

    const records = result.response.data
      .slice()
      .reverse()
      .map((b) => ({
        date: b.date,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume,
      }));

    if (records.length > 0) {
      await ctx.self.ts("market", "ohlcv").append(records);
      await ctx.kv.put("lastDate", String(records[records.length - 1].date));
    }
  });
})();
```

### 2. Test the script manually

```bash
alva run --entry-path '~/feeds/btc-hourly/v1/src/index.js'
```

### 3. Make the output public

```bash
# Grant the non-versioned base: inherited by all versions + data/.
alva fs grant --path '~/feeds/btc-hourly' --subject "special:user:*" --permission read
```

### 4. Deploy as a cronjob

```bash
alva deploy create --name btc-hourly-price-feed --path '~/feeds/btc-hourly/v1/src/index.js' --cron "0 */4 * * *"
```

### 5. Verify the cronjob

```bash
alva deploy list
```

### 6. Read the data (from anywhere)

```bash
alva fs read --path '/alva/home/alice/feeds/btc-hourly/v1/data/market/ohlcv/@last/24'
```

---

## Tips

- **Use `ctx.kv` for incremental processing**: Track the last processed
  timestamp with `ctx.kv.put()`/`ctx.kv.load()` to avoid re-fetching all
  historical data on each run.
- **Test thoroughly before deploying**: Run the script manually via `alva run`
  and verify the output before creating a cronjob.
- **Use descriptive names**: The cronjob name helps you identify jobs when
  listing them.
- **Pause before updating**: If you need to update the script, pause the cronjob
  first, update the script file, test it, then resume.
- **Debug failed runs**: `alva deploy runs --id <id>` shows execution history
  and stats; `alva deploy run-logs --id <id> --run-id <rid>` shows the full log
  output from a specific run.
