# Release

Register feeds and playbooks for public hosting. All commands are under
`alva release`.

## Release Feed

```
alva release feed --name NAME --version VERSION --cronjob-id ID [--description TEXT] [--view-json 'JSON']
```

Register a feed in the database after deploying its cronjob. **Must be called
after** `alva deploy create` -- the `cronjob-id` comes from the
cronjob response.

**Name uniqueness**: The `name` must be unique within your user space. Use
`alva fs readdir --path '~/feeds'` to check existing feed names before
releasing.

| Flag          | Type   | Required | Description                                                  |
| ------------- | ------ | -------- | ------------------------------------------------------------ |
| --name        | string | yes      | URL-safe feed name (e.g. `btc-ema`), must be unique per user |
| --version     | string | yes      | SemVer (e.g. `1.0.0`)                                        |
| --cronjob-id  | int64  | yes      | Cronjob ID from deploy create response                       |
| --view-json   | object | no       | View configuration JSON                                      |
| --description | string | no       | Feed description                                             |

```
alva release feed --name btc-ema --version 1.0.0 --cronjob-id 42 --description "BTC exponential moving average"
→ {"feed_id": 100, "name": "btc-ema", "feed_major": 1}
```

## Release Playbook

## Create Playbook Draft

```
alva release playbook-draft --name NAME --display-name "Title" --feeds '[{"feed_id":100}]' [--description TEXT] [--trading-symbols '["BTC"]']
```

Create a new playbook with a draft version.

Requires both a URL-safe `name` and a human-readable `display-name`.

| Flag | Type | Required | Description |
| --- | --- | --- | --- |
| --name | string | yes | URL-safe playbook name (e.g. `btc-dashboard`), must be unique per user |
| --display-name | string | yes | Human-readable playbook title, max 40 chars |
| --description | string | no | Short description of the playbook |
| --feeds | array | yes | Feed references `[{feed_id, feed_major?}]` |
| --trading-symbols | string[] | no | Base asset tickers (e.g. `["BTC","ETH"]`). Resolved server-side to full trading pairs, stored in playbook metadata. Max 50. |

`display-name` conventions:

- Format: `[subject/theme] [analysis angle/strategy logic]`
- Max 40 characters
- Avoid personal markers such as `My`, `Test`, or `V2`
- Avoid generic-only titles such as `Stock Dashboard` or `Trading Bot`
- If the user provides `display-name`, use it and normalize any non-compliant parts

```
alva release playbook-draft --name btc-dashboard --display-name "BTC Trend Dashboard" --description "BTC market dashboard with price, technicals, and volume" --feeds '[{"feed_id": 100}]' --trading-symbols '["BTC"]'
→ {"playbook_id": 99, "playbook_version_id": 200}
```

## Release Playbook

```
alva release playbook --name NAME --version VERSION --feeds '[{"feed_id":100}]' --changelog "text"
```

Release an existing playbook for public hosting. Reads the playbook HTML from
`'~/playbooks/{name}/index.html'` (ALFS — quote in CLI) and uploads it to CDN.

| Flag        | Type   | Required | Description                                 |
| ----------- | ------ | -------- | ------------------------------------------- |
| --name      | string | yes      | URL-safe playbook name (must already exist) |
| --version   | string | yes      | SemVer (e.g. `v1.0.0`)                      |
| --feeds     | array  | yes      | Feed references `[{feed_id, feed_major?}]`  |
| --changelog | string | yes      | Release changelog                           |

Feed reference fields:

| Field      | Type  | Required | Description                              |
| ---------- | ----- | -------- | ---------------------------------------- |
| feed_id    | int64 | yes      | Feed ID (own or others' feed)            |
| feed_major | int32 | no       | Major version (defaults to feed default) |

```
alva release playbook --name btc-dashboard --version v1.0.0 --feeds '[{"feed_id": 100, "feed_major": 1}]' --changelog "Initial release"
→ {"playbook_id": 99, "version": "v1.0.0", "published_url": "https://alice.playbook.alva.ai/btc-dashboard/v1.0.0/index.html"}
```

After a successful release, output the alva.ai playbook link to the user:
`https://alva.ai/u/<username>/playbooks/<playbook_name>`
(use the playbook `name` and the username from `alva whoami`)
