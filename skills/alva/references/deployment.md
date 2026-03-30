# Deployment Guide

> API examples use HTTP notation (`METHOD /path`). See SKILL.md Setup for curl
> templates.

Deploy scripts as cronjobs for scheduled, automated execution. This is essential
for feeds that need regular updates (e.g. hourly price data) and recurring
tasks.

---

## Overview

The deployment workflow:

1. **Write** a script (feed or task) and upload it to the filesystem
2. **Test** it manually via `POST /api/v1/run`
3. **Deploy** it as a cronjob via `POST /api/v1/deploy/cronjob`
4. **Monitor** the cronjob status via the deploy API

Cronjobs execute the script through the same jagent runtime as `/api/v1/run`.
The script receives the same environment (`require("env").args` contains the
cronjob's args).

---

## Cronjob API

All endpoints are under `/api/v1/deploy/` and require `X-Alva-Api-Key`
authentication.

### Create Cronjob

```
POST /api/v1/deploy/cronjob
```

```
POST /api/v1/deploy/cronjob
{
  "path": "~/feeds/btc-ema/v1/src/index.js",
  "cron_expression": "0 */4 * * *",
  "name": "btc-ema-update",
  "args": {"symbol": "BTC"},
  "push_notify": true
}
```

| Field           | Type   | Required | Description                                            |
| --------------- | ------ | -------- | ------------------------------------------------------ |
| path            | string | yes      | Path to entry script (home-relative or absolute)       |
| cron_expression | string | yes      | Standard cron expression                               |
| name            | string | yes      | Job name (1–63 lowercase alphanumeric or hyphens, no leading/trailing hyphen) |
| args            | object | no       | JSON passed to `require("env").args` on each execution |
| push_notify     | bool   | no       | Enable push notifications for playbook followers       |

When `push_notify` is `true`, every successful cronjob execution triggers a
notification fan-out: the platform reads the feed's
`/data/signal/targets/@last/1`, and pushes the signal content to all playbook
followers who have enabled Telegram notifications. Defaults to `false`.

The API validates that the entry_path exists on the filesystem before creating
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

```
GET /api/v1/deploy/cronjobs?limit={limit}&cursor={cursor}
```

```
GET /api/v1/deploy/cronjobs
→ {"cronjobs":[...],"next_cursor":"..."}
```

| Parameter | Type   | Default | Description                              |
| --------- | ------ | ------- | ---------------------------------------- |
| limit     | int    | 20      | Max results per page                     |
| cursor    | string |         | Pagination cursor from previous response |

### Get Cronjob

```
GET /api/v1/deploy/cronjob/:id
```

```
GET /api/v1/deploy/cronjob/42
```

### Update Cronjob

```
PATCH /api/v1/deploy/cronjob/:id
```

Partial update -- only include fields you want to change.

```
PATCH /api/v1/deploy/cronjob/42
{"cron_expression":"0 */2 * * *","args":{"symbol":"ETH"}}
```

Updatable fields: `name`, `cron_expression`, `args`, `push_notify`.

### Delete Cronjob

```
DELETE /api/v1/deploy/cronjob/:id
```

```
DELETE /api/v1/deploy/cronjob/42
```

### Pause / Resume

```
POST /api/v1/deploy/cronjob/42/pause
POST /api/v1/deploy/cronjob/42/resume
```

Both return the updated cronjob object.

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
3. The script runs in the same environment as a manual `/api/v1/run` call

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
| Execution timeout     | Same as `/api/v1/run` |
| Heap per execution    | 2 GB                  |

---

## Complete Workflow Example

This example creates a BTC price feed that runs every 4 hours.

### 1. Write the feed script

```
POST /api/v1/fs/mkdir
{"path":"~/feeds/btc-hourly/v1/src"}
```

Write the script (raw body upload):

```bash
curl -s -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/octet-stream" \
  "$ALVA_ENDPOINT/api/v1/fs/write?path=~/feeds/btc-hourly/v1/src/index.js" \
  --data-binary @- <<'JS'
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
JS
```

### 2. Test the script manually

```
POST /api/v1/run
{"entry_path":"~/feeds/btc-hourly/v1/src/index.js"}
```

### 3. Make the output public

```
POST /api/v1/fs/grant
{"path":"~/feeds/btc-hourly/v1","subject":"special:user:*","permission":"read"}
```

### 4. Deploy as a cronjob

```
POST /api/v1/deploy/cronjob
{
  "path": "~/feeds/btc-hourly/v1/src/index.js",
  "cron_expression": "0 */4 * * *",
  "name": "btc-hourly-price-feed"
}
```

### 5. Verify the cronjob

```
GET /api/v1/deploy/cronjobs
```

### 6. Read the data (from anywhere)

```
GET /api/v1/fs/read?path=/alva/home/alice/feeds/btc-hourly/v1/data/market/ohlcv/@last/24  (public, no auth)
```

---

## Tips

- **Use `ctx.kv` for incremental processing**: Track the last processed
  timestamp with `ctx.kv.put()`/`ctx.kv.load()` to avoid re-fetching all
  historical data on each run.
- **Test thoroughly before deploying**: Run the script manually via
  `/api/v1/run` and verify the output before creating a cronjob.
- **Use descriptive names**: The cronjob name helps you identify jobs when
  listing them.
- **Pause before updating**: If you need to update the script, pause the cronjob
  first, update the script file, test it, then resume.
- **Check execution results**: Read the feed's time series data to verify the
  cronjob is producing expected output.
