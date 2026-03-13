# Alva API Reference

**Base URL**: `$ALVA_ENDPOINT` (defaults to `https://api-llm.prd.alva.ai`).

Examples use HTTP notation (`METHOD /path`). Auth (`X-Alva-Api-Key` header) is
required on every request unless marked **(public, no auth)**. See SKILL.md
Setup for curl templates.

---

## User Info

```
GET /api/v1/me
```

Returns the authenticated user's id and username.

```
GET /api/v1/me
→ {"id":1,"username":"alice"}
```

---

## Filesystem API

All filesystem endpoints are under `/api/v1/fs/`.

**Path conventions**:

- `~/data/file.json` -- home-relative, expands to
  `/alva/home/<username>/data/file.json`
- `/alva/home/<username>/data/file.json` -- absolute path (required for public reads)
- `~` -- your home directory

### Read File

```
GET /api/v1/fs/read?path={path}&offset={offset}&size={size}
```

| Parameter | Type   | Required | Description                             |
| --------- | ------ | -------- | --------------------------------------- |
| path      | string | yes      | File path (home-relative or absolute)   |
| offset    | int64  | no       | Byte offset (default: 0)                |
| size      | int64  | no       | Bytes to read (-1 for all, default: -1) |

Response: raw bytes with `Content-Type: application/octet-stream`. For time
series paths (containing `@last`, `@range`, etc.), response is JSON.

```
GET /api/v1/fs/read?path=~/data/config.json

GET /api/v1/fs/read?path=/alva/home/alice/feeds/btc-ema/v1/data/prices/@last/10  (public, no auth)
```

### Write File

```
POST /api/v1/fs/write
```

Set `mkdir_parents` to auto-create parent directories if they don't exist (like
`mkdir -p` before write). Without it, writing to a path whose parent doesn't
exist returns 404.

Two modes:

```
# Mode 1: Raw body (preferred for text files)
POST /api/v1/fs/write?path=~/data/config.json&mkdir_parents=true
Content-Type: application/octet-stream
Body: {"key":"value"}

# Mode 2: JSON body (useful when you need offset/flags)
POST /api/v1/fs/write
{"path":"~/data/config.json","data":"{\"key\":\"value\"}","mkdir_parents":true}
```

> **Warning**: In Mode 2, the file content field is `"data"` — **not** `"content"`.
> An incorrect field name is silently ignored, resulting in `bytes_written: 0`
> and an empty file. When in doubt, prefer Mode 1.

Response: `{"bytes_written":15}`

### Stat

```
GET /api/v1/fs/stat?path={path}
```

```
GET /api/v1/fs/stat?path=~/data/config.json
→ {"name":"config.json","size":15,"mode":420,"mod_time":...,"is_dir":false}
```

### List Directory

```
GET /api/v1/fs/readdir?path={path}&recursive={recursive}
```

| Parameter | Type   | Required | Description                                |
| --------- | ------ | -------- | ------------------------------------------ |
| path      | string | yes      | Directory path                             |
| recursive | bool   | no       | If true, list recursively (default: false) |

```
GET /api/v1/fs/readdir?path=~/data
→ {"entries":[{"name":"config.json","size":15,"is_dir":false,...},...]}
```

### Create Directory

```
POST /api/v1/fs/mkdir
```

Recursive by default (like `mkdir -p`).

```
POST /api/v1/fs/mkdir
{"path":"~/feeds/my-feed/v1/src"}
```

### Remove

```
DELETE /api/v1/fs/remove?path={path}&recursive={recursive}
```

```
DELETE /api/v1/fs/remove?path=~/data/old.json
DELETE /api/v1/fs/remove?path=~/data/output&recursive=true
```

**Clearing feed data (synth mounts):** The remove endpoint also works on synth
mount paths (feed data directories). Use `recursive=true` to clear time series
data. **For development use only.**

```
# Clear a specific time series output
DELETE /api/v1/fs/remove?path=~/feeds/my-feed/v1/data/market/ohlcv&recursive=true

# Clear all outputs in a group
DELETE /api/v1/fs/remove?path=~/feeds/my-feed/v1/data/market&recursive=true

# Full feed reset: clear ALL data + KV state (removes the data mount, re-created on next run)
DELETE /api/v1/fs/remove?path=~/feeds/my-feed/v1/data&recursive=true
```

Clearing time series also removes the associated typedoc (schema metadata).

### Rename / Move

```
POST /api/v1/fs/rename
```

```
POST /api/v1/fs/rename
{"old_path":"~/data/old.json","new_path":"~/data/new.json"}
```

### Copy

```
POST /api/v1/fs/copy
```

```
POST /api/v1/fs/copy
{"src_path":"~/data/source.json","dst_path":"~/data/dest.json"}
```

### Symlink / Readlink

```
# Create symlink
POST /api/v1/fs/symlink
{"target_path":"~/feeds/my-feed/v1/output","link_path":"~/data/latest"}

# Read symlink target
GET /api/v1/fs/readlink?path=~/data/latest
```

### Chmod

```
POST /api/v1/fs/chmod
```

```
POST /api/v1/fs/chmod
{"path":"~/data/config.json","mode":420}
```

### Permissions (Grant / Revoke)

```
# Make a path publicly readable (no API key needed for subsequent reads)
POST /api/v1/fs/grant
{"path":"~/feeds/btc-ema/v1","subject":"special:user:*","permission":"read"}

# Grant read access to a specific user
POST /api/v1/fs/grant
{"path":"~/feeds/btc-ema/v1","subject":"user:2","permission":"read"}

# Revoke a permission
POST /api/v1/fs/revoke
{"path":"~/feeds/btc-ema/v1","subject":"special:user:*","permission":"read"}
```

Subject values: `special:user:*` (public/anyone), `special:user:+` (any
authenticated user), `user:<id>` (specific user).

> **Note**: You cannot grant permissions directly on a Feed synth `data/` path
> (e.g. `~/feeds/my-feed/v1/data`). This returns PERMISSION_DENIED. Grant on
> the parent feed directory instead — the permission is inherited by all child
> paths including the synth data mount:
> ```
> POST /api/v1/fs/grant
> {"path":"~/feeds/my-feed","subject":"special:user:*","permission":"read"}
> ```

> **Note**: `/api/v1/fs/read` only supports GET — HEAD requests return 404 even
> when the file exists. Use GET to check file existence.

---

## Run API (JavaScript Execution)

Execute JavaScript in a V8 isolate with access to the filesystem, SDKs, and
HTTP.

```
POST /api/v1/run
```

### Request Fields

| Field       | Type   | Required | Description                                        |
| ----------- | ------ | -------- | -------------------------------------------------- |
| code        | string | \*       | Inline JavaScript to execute                       |
| entry_path  | string | \*       | Path to script on filesystem (home-relative)       |
| working_dir | string | no       | Working directory for require() (inline code only) |
| args        | object | no       | JSON accessible via `require("env").args`          |

\*Exactly one of `code` or `entry_path` must be provided.

### Response Fields

| Field  | Type   | Description                             |
| ------ | ------ | --------------------------------------- |
| result | string | JSON-encoded return value               |
| logs   | string | Captured stderr output                  |
| stats  | object | `duration_ms` (int64)                   |
| status | string | `"completed"` or `"failed"`             |
| error  | string | Error message when status is `"failed"` |

### Examples

```
# Inline code
POST /api/v1/run
{"code":"1 + 2 + 3;"}
→ {"result":"6","logs":"","stats":{"duration_ms":24},"status":"completed","error":null}

# Inline code with arguments
POST /api/v1/run
{"code":"const env = require(\"env\"); JSON.stringify(env.args);","args":{"symbol":"ETH","limit":50}}

# Execute script from filesystem
POST /api/v1/run
{"entry_path":"~/tasks/my-task/src/index.js","args":{"n":42}}
```

---

## Deploy API (Cronjobs)

Schedule scripts as cronjobs for automated execution. All endpoints are under
`/api/v1/deploy/`.

See [deployment.md](deployment.md) for a comprehensive workflow guide.

### Create Cronjob

```
POST /api/v1/deploy/cronjob
```

```
POST /api/v1/deploy/cronjob
{
  "path": "~/feeds/btc-ema/v1/src/index.js",
  "cron_expression": "0 */4 * * *",
  "name": "BTC EMA Update",
  "args": {"symbol": "BTC"}
}
```

| Field           | Type   | Required | Description                                            |
| --------------- | ------ | -------- | ------------------------------------------------------ |
| path            | string | yes      | Path to entry script (home-relative or absolute)       |
| cron_expression | string | yes      | Standard cron expression (min interval: 1 minute)      |
| name            | string | yes      | Human-readable job name                                |
| args            | object | no       | JSON passed to `require("env").args` on each execution |

Response:

```json
{
  "id": 42,
  "name": "BTC EMA Update",
  "path": "/feeds/btc-ema/v1/src/index.js",
  "cron_expression": "0 */4 * * *",
  "status": "active",
  "args": { "symbol": "BTC" },
  "created_at": "2026-03-04T12:00:00Z",
  "updated_at": "2026-03-04T12:00:00Z"
}
```

### List Cronjobs

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
{"cron_expression":"0 */2 * * *"}
```

| Field           | Type   | Description      |
| --------------- | ------ | ---------------- |
| name            | string | Update job name  |
| cron_expression | string | Update schedule  |
| args            | object | Update arguments |

### Delete Cronjob

```
DELETE /api/v1/deploy/cronjob/:id
```

```
DELETE /api/v1/deploy/cronjob/42
```

### Pause / Resume Cronjob

```
POST /api/v1/deploy/cronjob/42/pause
POST /api/v1/deploy/cronjob/42/resume
```

---

## Release API

Register feeds and playbooks for public hosting. All endpoints are under
`/api/v1/release/`.

### Release Feed

```
POST /api/v1/release/feed
```

Register a feed in the database after deploying its cronjob. **Must be called
after** `POST /api/v1/deploy/cronjob` -- the `task_id` comes from the cronjob
response.

**Name uniqueness**: The `name` must be unique within your user space. Use
`GET /api/v1/fs/readdir?path=~/feeds` to check existing feed names before
releasing.

| Field       | Type   | Required | Description                             |
| ----------- | ------ | -------- | --------------------------------------- |
| name        | string | yes      | URL-safe feed name (e.g. `btc-ema`), must be unique per user |
| version     | string | yes      | SemVer (e.g. `1.0.0`)                   |
| task_id     | int64  | yes      | Cronjob task ID from deploy/cronjob     |
| view_json   | object | no       | View configuration JSON                 |
| description | string | no       | Feed description                        |

```
POST /api/v1/release/feed
{
  "name": "btc-ema",
  "version": "1.0.0",
  "task_id": 42,
  "description": "BTC exponential moving average"
}
→ {"feed_id": 100, "name": "btc-ema", "feed_major": 1}
```

### Release Playbook

### Create Playbook Draft

```
POST /api/v1/draft/playbook
```

Create a new playbook with a draft version.

| Field       | Type   | Required | Description                                  |
| ----------- | ------ | -------- | -------------------------------------------- |
| name        | string | yes      | URL-safe playbook name (e.g. `btc-dashboard`), must be unique per user |
| type        | string | no       | `"dashboard"` or `"strategy"` (default: `"dashboard"`). Controls frontend routing |
| description | string | no       | Short description of the playbook             |
| feeds       | array  | yes      | Feed references `[{feed_id, feed_major?}]`   |

```
POST /api/v1/draft/playbook
{
  "name": "btc-dashboard",
  "type": "dashboard",
  "description": "BTC market dashboard with price, technicals, and volume",
  "feeds": [{"feed_id": 100}]
}
→ {"playbook_id": 99, "playbook_version_id": 200}
```

### Release Playbook

```
POST /api/v1/release/playbook
```

Release an existing playbook for public hosting. Reads the playbook HTML from
`~/playbooks/{name}/index.html` and uploads it to CDN.

| Field     | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| name      | string | yes      | URL-safe playbook name (must already exist)  |
| version   | string | yes      | SemVer (e.g. `v1.0.0`)                       |
| feeds     | array  | yes      | Feed references `[{feed_id, feed_major?}]`   |
| changelog | string | no       | Release changelog                            |

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

---

## SDK API

Browse the 250+ SDK modules available in the runtime — covering crypto/equity/ETF market data (OHLCV, fundamentals, on-chain metrics), 60+ technical indicators (SMA, RSI, MACD, Bollinger Bands…), macro & economic series (GDP, CPI, Treasury yields), and alternative data (news, social sentiment, DeFi). All endpoints are under `/api/v1/sdk/`.

### Get SDK Doc

```
GET /api/v1/sdk/doc?name={module_name}
```

| Parameter | Type   | Required | Description                                      |
| --------- | ------ | -------- | ------------------------------------------------ |
| name      | string | yes      | Full module name (e.g. `@arrays/crypto/ohlcv:v1.0.0`) |

```
GET /api/v1/sdk/doc?name=@arrays/crypto/ohlcv:v1.0.0
→ {"name":"@arrays/crypto/ohlcv:v1.0.0","doc":"..."}
```

### List SDK Partitions

```
GET /api/v1/sdk/partitions
```

```
GET /api/v1/sdk/partitions
→ {"partitions":["spot_market_price_and_volume","crypto_onchain_and_derivatives",...]}
```

### Get Partition Summary

```
GET /api/v1/sdk/partitions/:partition/summary
```

| Parameter | Type   | Required | Description                                        |
| --------- | ------ | -------- | -------------------------------------------------- |
| partition | string | yes      | Partition name (URL-encoded if contains `/`)       |

```
GET /api/v1/sdk/partitions/spot_market_price_and_volume/summary
→ {"summary":"@arrays/crypto/ohlcv:v1.0.0 — Spot OHLCV for crypto\n@arrays/data/stock/ohlcv:v1.0.0 — Spot OHLCV for equities\n..."}

---

## Chat Completions API (Ask Agent)

Ask the Alva AI agent a question via SSE streaming. The ask agent can answer
questions about crypto/stock markets, macro trends, on-chain data, protocol
metrics, social sentiment, and general financial topics. It has access to
real-time web data, 250+ financial data SDKs, and code execution.

```
POST /v1/chat/completions
```

### Request Fields

| Field      | Type   | Required | Description                             |
| ---------- | ------ | -------- | --------------------------------------- |
| message    | string | yes      | The question to ask                     |
| session_id | string | no       | Resume an existing conversation session |

### SSE Events

| Event   | Data                                       | Description                        |
| ------- | ------------------------------------------ | ---------------------------------- |
| `meta`  | `{"type":"META_TYPE_SESSION","value":"…"}` | Session ID for conversation resume |
| `delta` | `{"v":"…"}`                                | Streaming content chunk            |
| `error` | `{"code":429,"message":"…"}`               | Error from the agent               |
| `done`  | `{}`                                       | Stream complete                    |

### Example

```
POST /v1/chat/completions
Accept: text/event-stream
{"message":"What is the current BTC funding rate?"}
```

---

## Time Series via Filesystem Paths

When a read path crosses a synth mount boundary (e.g.
`~/feeds/my-feed/v1/data/`), the filesystem returns structured JSON instead of
raw bytes. Virtual path suffixes:

| Suffix                  | Description                    | Example                                                        |
| ----------------------- | ------------------------------ | -------------------------------------------------------------- |
| `@last/{n}`             | Last N points (chronological)  | `.../prices/@last/100`                                         |
| `@range/{start}..{end}` | Between timestamps             | `.../prices/@range/2026-01-01T00:00:00Z..2026-03-01T00:00:00Z` |
| `@range/{duration}`     | Recent data within duration    | `.../prices/@range/7d`                                         |
| `@count`                | Data point count               | `.../prices/@count`                                            |
| `@append`               | Append data points (write)     | `.../prices/@append`                                           |
| `@now`                  | Latest single data point       | `.../prices/@now`                                              |
| `@all`                  | All data points (paginated)    | `.../prices/@all`                                              |
| `@at/{ts}`              | Single point nearest timestamp | `.../prices/@at/1737988200`                                    |
| `@before/{ts}/{limit}`  | Points before timestamp        | `.../prices/@before/1737988200/10`                             |
| `@after/{ts}/{limit}`   | Points after timestamp         | `.../prices/@after/1737988200/10`                              |
| `@range/@bounds`        | Time boundaries of data        | `.../prices/@range/@bounds`                                    |

`@append` now accepts flat records like `[{"date":1000,"close":100}]`; the old
`{date, value}` wrapped format is no longer used. REST reads return raw stored
values. For grouped records (multiple events per timestamp), the response
contains `{date, items: [...]}`. The Feed SDK auto-flattens these, but REST
consumers handle them directly.

**Timestamp formats**: RFC 3339 (`2026-01-15T14:30:00Z`), Unix seconds
(`1737988200`), Unix milliseconds (`1737988200000`).

**Duration formats**: `1h`, `30m`, `7d`, `2w`.

**Path anatomy**:

```
~/feeds/my-feed/v1 / data      / metrics / prices / @last/100
|--- feedPath ---| |mount pt| | group | |output| | query |
```

```
GET /api/v1/fs/read?path=~/feeds/my-feed/v1/data/prices/btc/@last/100
→ [{"date":1772658000000,"close":73309.72,"ema10":72447.65}, ...]
```

---

## Error Responses

All errors return: `{"error":{"code":"...","message":"..."}}`

| HTTP Status | Code              | Meaning                            |
| ----------- | ----------------- | ---------------------------------- |
| 400         | INVALID_ARGUMENT  | Bad request or invalid path        |
| 401         | UNAUTHENTICATED   | Missing or invalid API key         |
| 403         | PERMISSION_DENIED | Access denied                      |
| 404         | NOT_FOUND         | File/directory not found           |
| 429         | RATE_LIMITED      | Rate limit / runner pool exhausted |
| 500         | INTERNAL          | Server error                       |

---
