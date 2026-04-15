# Deployment Guide

Deploy scripts as cronjobs for scheduled, automated execution. This is essential
for feeds that need regular updates (e.g. hourly price data) and recurring
tasks.

---

## Overview

The deployment workflow:

1. **Write** a script (feed or task) and upload it to the filesystem
2. **Test** it manually via `alva run`
3. **Deploy** it as a cronjob via `alva deploy create`
4. **Monitor** the cronjob status via `alva deploy list` / `alva deploy get`
5. **Debug** execution history via `alva deploy runs` / `alva deploy run-logs`

Cronjobs execute the script through the same jagent runtime as `alva run`.
The script receives the same environment (`require("env").args` contains the
cronjob's args).

---

## Cronjob CLI

All cronjob operations use `alva deploy <subcommand>`.

### Create Cronjob

```bash
alva deploy create --name btc-ema-update --path '~/feeds/btc-ema/v1/src/index.js' --cron "0 */4 * * *" --args '{"symbol": "BTC"}' --push-notify
```

| Flag            | Type   | Required | Description                                            |
| --------------- | ------ | -------- | ------------------------------------------------------ |
| --path          | string | yes      | Path to entry script (home-relative or absolute)       |
| --cron          | string | yes      | Standard cron expression                               |
| --name          | string | yes      | Job name (1–63 lowercase alphanumeric or hyphens, no leading/trailing hyphen) |
| --args          | JSON   | no       | JSON passed to `require("env").args` on each execution |
| --push-notify   | flag   | no       | Enable push notifications for playbook followers       |

When `--push-notify` is set, every successful cronjob execution triggers a
notification fan-out: the platform reads the feed's
`/data/signal/targets/@last/1`, and pushes the signal content to all playbook
followers who have enabled Telegram notifications.

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

Updatable fields: `--name`, `--cron`, `--args`, `--push-notify` / `--no-push-notify`.

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

When a cronjob fails or produces unexpected output, use `runs` and `run-logs`
to diagnose the problem.

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

- All `require()` modules (alfs, env, net/http, SDKHub modules, @alva/feed,
  etc.)
- `require("env").args` contains the args from the cronjob configuration
- Filesystem read/write
- HTTP requests

---

## Limits

| Limit                 | Value                 |
| --------------------- | --------------------- |
| Max cronjobs per user | 20                    |
| Min cron interval     | 1 minute              |
| Execution timeout     | Same as `alva run`    |
| Heap per execution    | 2 GB                  |

---

## Complete Workflow Example

This example creates a BTC price feed that runs every 4 hours.

### 1. Write the feed script

```bash
alva fs mkdir --path '~/feeds/btc-hourly/v1/src'
```

Write the script (upload from local file):

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
    num("open"), num("high"), num("low"), num("close"), num("volume"),
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

    if (!result.success) throw new Error("Failed to fetch: " + JSON.stringify(result));

    const records = result.response.data.slice().reverse().map(b => ({
      date: b.date,
      open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume,
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
alva fs grant --path '~/feeds/btc-hourly/v1' --subject "special:user:*" --permission read
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
- **Test thoroughly before deploying**: Run the script manually via
  `alva run` and verify the output before creating a cronjob.
- **Use descriptive names**: The cronjob name helps you identify jobs when
  listing them.
- **Pause before updating**: If you need to update the script, pause the cronjob
  first, update the script file, test it, then resume.
- **Debug failed runs**: `alva deploy runs --id <id>` shows execution history
  and stats; `alva deploy run-logs --id <id> --run-id <rid>` shows the full
  log output from a specific run.
