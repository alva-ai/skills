# Release

Register feeds and playbooks for public hosting. All endpoints are under
`/api/v1/release/`.

## Release Feed

```
POST /api/v1/release/feed
```

Register a feed in the database after deploying its cronjob. **Must be called
after** `POST /api/v1/deploy/cronjob` -- the `cronjob_id` comes from the
cronjob response.

**Name uniqueness**: The `name` must be unique within your user space. Use
`GET /api/v1/fs/readdir?path=~/feeds` to check existing feed names before
releasing.

| Field       | Type   | Required | Description                                                  |
| ----------- | ------ | -------- | ------------------------------------------------------------ |
| name        | string | yes      | URL-safe feed name (e.g. `btc-ema`), must be unique per user |
| version     | string | yes      | SemVer (e.g. `1.0.0`)                                        |
| cronjob_id  | int64  | yes      | Cronjob ID from deploy/cronjob response                      |
| view_json   | object | no       | View configuration JSON                                      |
| description | string | no       | Feed description                                             |

```
POST /api/v1/release/feed
{
  "name": "btc-ema",
  "version": "1.0.0",
  "cronjob_id": 42,
  "description": "BTC exponential moving average"
}
→ {"feed_id": 100, "name": "btc-ema", "feed_major": 1}
```

## Release Playbook

## Create Playbook Draft

```
POST /api/v1/draft/playbook
```

Create a new playbook with a draft version.

Requires both a URL-safe `name` and a human-readable `display_name`.

| Field           | Type     | Required | Description                                                                                                                 |
| --------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| name            | string   | yes      | URL-safe playbook name (e.g. `btc-dashboard`), must be unique per user                                                     |
| display_name    | string   | yes      | Human-readable playbook title, max 40 chars                                                                                |
| description     | string   | no       | Short description of the playbook                                                                                          |
| feeds           | array    | yes      | Feed references `[{feed_id, feed_major?}]`                                                                                 |
| trading_symbols | string[] | no       | Base asset tickers (e.g. `["BTC","ETH"]`). Resolved server-side to full trading pairs, stored in playbook metadata. Max 50. |

`display_name` conventions:

- Format: `[subject/theme] [analysis angle/strategy logic]`
- Max 40 characters
- Avoid personal markers such as `My`, `Test`, or `V2`
- Avoid generic-only titles such as `Stock Dashboard` or `Trading Bot`
- If the user provides `display_name`, use it and normalize any non-compliant parts

```
POST /api/v1/draft/playbook
{
  "name": "btc-dashboard",
  "display_name": "BTC Trend Dashboard",
  "description": "BTC market dashboard with price, technicals, and volume",
  "feeds": [{"feed_id": 100}],
  "trading_symbols": ["BTC"]
}
→ {"playbook_id": 99, "playbook_version_id": 200}
```

## Release Playbook

```
POST /api/v1/release/playbook
```

Release an existing playbook for public hosting. Reads the playbook HTML from
`~/playbooks/{name}/index.html` and uploads it to CDN.

| Field     | Type   | Required | Description                                 |
| --------- | ------ | -------- | ------------------------------------------- |
| name      | string | yes      | URL-safe playbook name (must already exist) |
| version   | string | yes      | SemVer (e.g. `v1.0.0`)                      |
| feeds     | array  | yes      | Feed references `[{feed_id, feed_major?}]`  |
| changelog | string | yes      | Release changelog                           |

Feed reference fields:

| Field      | Type  | Required | Description                              |
| ---------- | ----- | -------- | ---------------------------------------- |
| feed_id    | int64 | yes      | Feed ID (own or others' feed)            |
| feed_major | int32 | no       | Major version (defaults to feed default) |

```
POST /api/v1/release/playbook
{
  "name": "btc-dashboard",
  "version": "v1.0.0",
  "feeds": [{"feed_id": 100, "feed_major": 1}],
  "changelog": "Initial release"
}
→ {"playbook_id": 99, "version": "v1.0.0", "published_url": "https://alice.playbook.alva.ai/btc-dashboard/v1.0.0/index.html"}
```

After a successful release, output the alva.ai playbook link to the user:
`https://alva.ai/u/<username>/playbooks/<playbook_name>`
(use the playbook `name` and the username from `GET /api/v1/me`)
