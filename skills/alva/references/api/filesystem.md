# Filesystem

All filesystem endpoints are under `/api/v1/fs/`.

**Path conventions**:

- `~/data/file.json` -- home-relative, expands to
  `/alva/home/<username>/data/file.json`
- `/alva/home/<username>/data/file.json` -- absolute path (required for public
  reads)
- `~` -- your home directory

## Read File

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

## Write File

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

> **Warning**: In Mode 2, the file content field is `"data"` — **not**
> `"content"`. An incorrect field name is silently ignored, resulting in
> `bytes_written: 0` and an empty file. When in doubt, prefer Mode 1.

Response: `{"bytes_written":15}`

## Stat

```
GET /api/v1/fs/stat?path={path}
```

```
GET /api/v1/fs/stat?path=~/data/config.json
→ {"name":"config.json","size":15,"mode":420,"mod_time":...,"is_dir":false}
```

## List Directory

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

## Create Directory

```
POST /api/v1/fs/mkdir
```

Recursive by default (like `mkdir -p`).

```
POST /api/v1/fs/mkdir
{"path":"~/feeds/my-feed/v1/src"}
```

## Remove

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

## Rename / Move

```
POST /api/v1/fs/rename
```

```
POST /api/v1/fs/rename
{"old_path":"~/data/old.json","new_path":"~/data/new.json"}
```

## Copy

```
POST /api/v1/fs/copy
```

```
POST /api/v1/fs/copy
{"src_path":"~/data/source.json","dst_path":"~/data/dest.json"}
```

## Symlink / Readlink

```
# Create symlink
POST /api/v1/fs/symlink
{"target_path":"~/feeds/my-feed/v1/output","link_path":"~/data/latest"}

# Read symlink target
GET /api/v1/fs/readlink?path=~/data/latest
```

## Chmod

```
POST /api/v1/fs/chmod
```

```
POST /api/v1/fs/chmod
{"path":"~/data/config.json","mode":420}
```

## Permissions (Grant / Revoke)

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
> (e.g. `~/feeds/my-feed/v1/data`). This returns PERMISSION_DENIED. Grant on the
> parent feed directory instead — the permission is inherited by all child paths
> including the synth data mount:
>
> ```
> POST /api/v1/fs/grant
> {"path":"~/feeds/my-feed","subject":"special:user:*","permission":"read"}
> ```

> **Note**: `/api/v1/fs/read` only supports GET — HEAD requests return 404 even
> when the file exists. Use GET to check file existence.

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

~/feeds/my-feed/v1 / data / metrics / prices / @last/100 |--- feedPath ---|
|mount pt| | group | |output| | query |

```

```

GET /api/v1/fs/read?path=~/feeds/my-feed/v1/data/prices/btc/@last/100 →
[{"date":1772658000000,"close":73309.72,"ema10":72447.65}, ...]

```
