# Deploy Cron Job

Create and manage cron jobs for scheduled execution using the `alva deploy`
CLI commands.

See [deployment.md](../deployment.md) for a comprehensive workflow guide.

## Create Cronjob

```
alva deploy create --name NAME --path PATH --cron "EXPR" [--args 'JSON'] [--push-notify]
```

```bash
alva deploy create \
  --name btc-ema-update \
  --path '~/feeds/btc-ema/v1/src/index.js' \
  --cron "0 */4 * * *" \
  --args '{"symbol": "BTC"}' \
  --push-notify
```

| Flag          | Type   | Required | Description                                                                   |
| ------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| --name        | string | yes      | Job name (1–63 lowercase alphanumeric or hyphens, no leading/trailing hyphen) |
| --path        | string | yes      | Path to entry script (home-relative or absolute)                              |
| --cron        | string | yes      | Standard cron expression (min interval: 1 minute)                             |
| --args        | JSON   | no       | JSON passed to `require("env").args` on each execution                        |
| --push-notify | flag   | no       | Enable push notifications for playbook followers                              |

When `--push-notify` is set, every successful execution reads the feed's
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
alva deploy list [--limit N] [--cursor CURSOR]
```

| Flag     | Type   | Required | Description                              |
| -------- | ------ | -------- | ---------------------------------------- |
| --limit  | int    | no       | Max results (default: 20)                |
| --cursor | string | no       | Pagination cursor from previous response |

```bash
alva deploy list
# → {"cronjobs":[...],"next_cursor":"..."}
```

## Get Cronjob

```
alva deploy get --id ID
```

```bash
alva deploy get --id 42
```

## Update Cronjob

```
alva deploy update --id ID [--cron "EXPR"] [--args 'JSON'] [--push-notify|--no-push-notify]
```

Partial update -- only include flags you want to change.

```bash
alva deploy update --id 42 --cron "0 */2 * * *"
```

| Flag              | Type   | Description                      |
| ----------------- | ------ | -------------------------------- |
| --cron            | string | Update schedule                  |
| --args            | JSON   | Update arguments                 |
| --push-notify     | flag   | Enable push notification         |
| --no-push-notify  | flag   | Disable push notification        |

## Delete Cronjob

```
alva deploy delete --id ID
```

```bash
alva deploy delete --id 42
```

## Pause / Resume Cronjob

```bash
alva deploy pause --id 42
alva deploy resume --id 42
```
