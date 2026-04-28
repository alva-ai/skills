# Release

Register feeds and playbooks for public hosting. All commands are under
`alva release`.

## Release Feed

```
alva release feed --name NAME --version VERSION --cronjob-id ID --description TEXT [--view-json 'JSON']
```

Register a feed in the database after deploying its cronjob. **Must be called
after** `alva deploy create` -- the `cronjob-id` comes from the
cronjob response.

**Name uniqueness**: The `name` must be unique within your user space. Use
`alva fs readdir --path '~/feeds'` to check existing feed names before
releasing.

| Flag | Type | Required | Description |
| --- | --- | --- | --- |
| --name | string | yes | URL-safe feed name (e.g. `btc-ema`), must be unique per user |
| --version | string | yes | SemVer (e.g. `1.0.0`) |
| --cronjob-id | int64 | yes | Cronjob ID from deploy create response |
| --view-json | object | no | View configuration JSON |
| --description | string | yes | Complete statement of what the feed does (see below) |

`description` conventions:

- Write a complete statement covering the feed's **data source**, **what
  it computes**, and the **output it produces**.
- Prefer concrete specifics (symbol, interval, exchange, indicator
  parameters) over vague labels.
- Avoid bare labels like `"BTC EMA"` — they read as names, not
  descriptions.

```
alva release feed --name btc-ema --version 1.0.0 --cronjob-id 42 \
  --description "Fetches BTC/USDT 1h klines from Binance and emits the 20-period EMA as a time series"
→ {"feed_id": 100, "name": "btc-ema", "feed_major": 1, "feed_path": "/alva/home/alice/feeds/btc-ema"}
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
| --feeds | array | yes | Feed references `[{feed_id, feed_major?}]` |
| --description | string | no | Short description of the playbook |
| --trading-symbols | string[] | no | Base asset tickers (e.g. `["BTC","ETH"]`). Resolved server-side to full trading pairs, stored in playbook metadata. Max 50. |

`display-name` conventions:

- Format: `[subject/theme] [analysis angle/strategy logic]`
- Max 40 characters
- Avoid personal markers such as `My`, `Test`, or `V2`
- Avoid generic-only titles such as `Stock Dashboard` or `Trading Bot`
- If the user provides `display-name`, use it and normalize any non-compliant parts

``` bash
alva release playbook-draft --name btc-dashboard --display-name "BTC Trend Dashboard" --description "BTC market dashboard with price, technicals, and volume" --feeds '[{"feed_id": 100}]' --trading-symbols '["BTC"]'
→ {"playbook_id": 99, "playbook_version_id": 200, "playbook_path": "/alva/home/alice/playbooks/btc-dashboard"}
```

## Release Playbook

```
alva release playbook --name NAME --version VERSION --feeds '[{"feed_id":100}]' --changelog "text"
```

Release an existing playbook for public hosting. Reads the playbook HTML from
`'~/playbooks/{name}/index.html'` (ALFS — quote in CLI) and uploads it to CDN.

Changelog lives on the release, not the draft — set it when publishing.

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
→ {"playbook_id": 99, "version": "v1.0.0", "published_url": "https://alice.playbook.alva.ai/btc-dashboard/v1.0.0/index.html", "playbook_path": "/alva/home/alice/playbooks/btc-dashboard"}
```

After a successful release, output the alva.ai playbook link to the user:
`https://alva.ai/u/<username>/playbooks/<playbook_name>`
(use the playbook `name` and the username from `alva whoami`)
