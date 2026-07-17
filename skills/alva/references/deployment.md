# Deployment Guide

Deploy scripts as cronjobs for scheduled, automated execution. A deploy cronjob
is the subordinate producer for a feed: it runs the source script, creates or
refreshes feed data, and exposes run history/logs. The feed's lifecycle is
managed through `alva automation`; see [feed-lifecycle.md](feed-lifecycle.md).

The deploy CLI manages producer cronjobs:

| Group         | Manages                                                       | Common commands                                                                                             |
| ------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `alva deploy` | Cronjob producers (schedule + entry script + run status/logs) | `create`, `list`, `get`, `update`, `delete`, `pause`, `resume`, `trigger`, `run-status`, `runs`, `run-logs` |

---

## Overview

The deployment workflow:

1. **Write** a script (feed or task) to ALFS
2. **Test** it manually via `alva run`
3. **Deploy** it as a cronjob via `alva deploy create`
4. **Monitor** the cronjob status via `alva deploy list` / `alva deploy get`
5. **Debug** execution history via `alva deploy runs` / `alva deploy run-logs`

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
explicit personal or group alert to the automation's feed.
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

### 3. Deploy as a cronjob

```bash
alva deploy create --name btc-hourly-price-feed --path '~/feeds/btc-hourly/v1/src/index.js' --cron "0 */4 * * *"
```

### 4. Publish the automation and visibility

```bash
alva automation publish --name btc-hourly --version 1.0.0 --cronjob-id <cronjob_id>
alva feed set-visibility --id <feed_id_from_publish> --visibility public
```

Do not use `alva fs grant` to publish a feed. `feed set-visibility` keeps the
feed record and inherited ALFS public-read projection consistent.

### 5. Confirm cronjob registration

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
