# Filesystem

ALFS is a virual filesystem for Alva. All filesystem operations use the `alva fs` CLI. Always quote **ALFS** paths in the shell (e.g. `--path '~/feeds/...'`).

**Path conventions**:

- `'~/data/file.json'` — home-relative **ALFS** path; expands to
  `'/alva/home/<username>/data/file.json'`
- `'/alva/home/<username>/data/file.json'` — absolute **ALFS** path (required for public
  reads)
- `'~'` — your **ALFS** home directory

In documentation and shell examples, wrap **ALFS** path literals in single quotes so
they are not mistaken for paths on your **local** machine (e.g. `/Users/...`).

> **Important**: Always quote `~` paths (e.g. `--path '~/feeds/...'`) to
> prevent shell expansion. An unquoted `~` expands to your local home directory
> (e.g. `/Users/alice/`), not the ALFS home (`'/alva/home/alice/'`), causing
> `PERMISSION_DENIED`. Alternatively, use absolute ALFS paths (`'...'`).

## Read File

```
alva fs read --path PATH [--offset OFFSET] [--size SIZE]
```

| Parameter | Type   | Required | Description                             |
| --------- | ------ | -------- | --------------------------------------- |
| path      | string | yes      | File path (home-relative or absolute)   |
| offset    | int64  | no       | Byte offset (default: 0)                |
| size      | int64  | no       | Bytes to read (-1 for all, default: -1) |

Response: raw bytes. For time series paths (containing `@last`, `@range`, etc.),
response is JSON.

```
alva fs read --path '~/data/config.json'

alva fs read --path '/alva/home/alice/feeds/btc-ema/v1/data/prices/@last/10'  # public, no auth
```

## Write File

```
alva fs write --path PATH --data "content" [--mkdir-parents]
alva fs write --path PATH --file ./local-file.js [--mkdir-parents]
```

Set `--mkdir-parents` to auto-create parent directories if they don't exist
(like `mkdir -p` before write). Without it, writing to a path whose parent
doesn't exist returns an error.

Two modes:

```
# Mode 1: Inline data
alva fs write --path '~/data/config.json' --data '{"key":"value"}' --mkdir-parents

# Mode 2: File upload
alva fs write --path '~/data/config.json' --file ./config.json --mkdir-parents
```

## Stat

```
alva fs stat --path PATH
```

```
alva fs stat --path '~/data/config.json'
→ {"name":"config.json","size":15,"mode":420,"mod_time":...,"is_dir":false}
```

## List Directory

```
alva fs readdir --path PATH [--recursive]
```

| Parameter | Type   | Required | Description                                |
| --------- | ------ | -------- | ------------------------------------------ |
| path      | string | yes      | Directory path                             |
| recursive | bool   | no       | If true, list recursively (default: false) |

```
alva fs readdir --path '~/data'
→ {"entries":[{"name":"config.json","size":15,"is_dir":false,...},...]}
```

## Create Directory

```
alva fs mkdir --path PATH
```

Recursive by default (like `mkdir -p`).

```
alva fs mkdir --path '~/feeds/my-feed/v1/src'
```

## Remove

```
alva fs remove --path PATH [--recursive]
```

```
alva fs remove --path '~/data/old.json'
alva fs remove --path '~/data/output' --recursive
```

**Clearing feed data (synth mounts):** The remove command also works on synth
mount paths (feed data directories). Use `--recursive` to clear time series
data. **For development use only.**

```
# Clear a specific time series output
alva fs remove --path '~/feeds/my-feed/v1/data/market/ohlcv' --recursive

# Clear all outputs in a group
alva fs remove --path '~/feeds/my-feed/v1/data/market' --recursive

# Full feed reset: clear ALL data + KV state (removes the data mount, re-created on next run)
alva fs remove --path '~/feeds/my-feed/v1/data' --recursive
```

Clearing time series also removes the associated typedoc (schema metadata).

## Rename / Move

```
alva fs rename --old-path OLD --new-path NEW
```

```
alva fs rename --old-path '~/data/old.json' --new-path '~/data/new.json'
```

## Copy

```
alva fs copy --src-path SRC --dst-path DST
```

```
alva fs copy --src-path '~/data/source.json' --dst-path '~/data/dest.json'
```

## Symlink / Readlink

```
# Create symlink
alva fs symlink --target-path '~/feeds/my-feed/v1/output' --link-path '~/data/latest'

# Read symlink target
alva fs readlink --path '~/data/latest'
```

## Chmod

```
alva fs chmod --path PATH --mode MODE
```

```
alva fs chmod --path '~/data/config.json' --mode 644
```

## Permissions (Grant / Revoke)

```
# Make a path publicly readable (no auth needed for subsequent reads)
alva fs grant --path '~/feeds/btc-ema/v1' --subject "special:user:*" --permission read

# Grant read access to a specific user
alva fs grant --path '~/feeds/btc-ema/v1' --subject "user:2" --permission read

# Revoke a permission
alva fs revoke --path '~/feeds/btc-ema/v1' --subject "special:user:*" --permission read
```

Subject values: `special:user:*` (public/anyone), `special:user:+` (any
authenticated user), `user:<id>` (specific user).

> **Note**: You cannot grant permissions directly on a Feed synth `data/` path
> (e.g. `'~/feeds/my-feed/v1/data'`). This returns PERMISSION_DENIED. Grant on the
> parent feed directory instead — the permission is inherited by all child paths
> including the synth data mount:
>
> ```
> alva fs grant --path '~/feeds/my-feed' --subject "special:user:*" --permission read
> ```

## Time Series via Filesystem Paths

When a read path crosses a synth mount boundary (e.g.
`'~/feeds/my-feed/v1/data/'`), the filesystem returns structured JSON instead of
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
`{date, value}` wrapped format is no longer used. Reads return raw stored
values. For grouped records (multiple events per timestamp), the response
contains `{date, items: [...]}`. The Feed SDK auto-flattens these, but CLI
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
alva fs read --path '~/feeds/my-feed/v1/data/prices/btc/@last/100'
→ [{"date":1772658000000,"close":73309.72,"ema10":72447.65}, ...]
```
