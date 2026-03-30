# Deploy Cron Job

Create and manage cron jobs for scheduled execution. All endpoints are under
`/api/v1/deploy/`.

See [deployment.md](../deployment.md) for a comprehensive workflow guide.

## Create Cronjob

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
| cron_expression | string | yes      | Standard cron expression (min interval: 1 minute)      |
| name            | string | yes      | Job name (1–63 lowercase alphanumeric or hyphens, no leading/trailing hyphen) |
| args            | object | no       | JSON passed to `require("env").args` on each execution |
| push_notify     | bool   | no       | Enable push notifications for playbook followers       |

When `push_notify` is `true`, every successful execution reads the feed's
`/data/signal/targets/@last/1` and pushes it to playbook followers (Telegram).

Response:

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

## List Cronjobs

```
GET /api/v1/deploy/cronjobs?limit={limit}&cursor={cursor}
```

| Parameter | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| limit     | int    | no       | Max results (default: 20)                |
| cursor    | string | no       | Pagination cursor from previous response |

```
GET /api/v1/deploy/cronjobs
→ {"cronjobs":[...],"next_cursor":"..."}
```

## Get Cronjob

```
GET /api/v1/deploy/cronjob/:id
```

```
GET /api/v1/deploy/cronjob/42
```

## Update Cronjob

```
PATCH /api/v1/deploy/cronjob/:id
```

Partial update -- only include fields you want to change.

```
PATCH /api/v1/deploy/cronjob/42
{"cron_expression":"0 */2 * * *"}
```

| Field           | Type   | Description                      |
| --------------- | ------ | -------------------------------- |
| name            | string | Update job name                  |
| cron_expression | string | Update schedule                  |
| args            | object | Update arguments                 |
| push_notify     | bool   | Enable/disable push notification |

## Delete Cronjob

```
DELETE /api/v1/deploy/cronjob/:id
```

```
DELETE /api/v1/deploy/cronjob/42
```

## Pause / Resume Cronjob

```
POST /api/v1/deploy/cronjob/42/pause
POST /api/v1/deploy/cronjob/42/resume
```
