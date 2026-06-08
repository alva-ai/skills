# Filesystem — extras not in CLI help

Run `alva fs --help` first for subcommands, flags, path conventions, and
grant subjects. This file only covers the supported synth-mount suffixes
(the help text is partly wrong / incomplete here) plus the synth-mount
grant gotcha.

## Synth-mount virtual suffixes (authoritative set)

These are the suffixes actually wired up at a feed data mount. Anything
not on this list is unsupported even if older docs or `alva fs --help`
mention it (e.g. `@now`, `@all`, `@at`, `@range/{duration}`,
`@range/@bounds` — do **not** use those).

Common ALFS layout:

| Path | Purpose |
| --- | --- |
| `~/tasks/<name>/src/` | Task source code |
| `~/feeds/<name>/v1/src/` | Feed script source code |
| `~/feeds/<name>/v1/data/` | Feed synth mount created by Feed SDK |
| `~/playbooks/<name>/` | Playbook web app assets |
| `~/data/` | General data storage |
| `~/library/` | Shared code modules |

### Time-series reads

| Suffix                  | Description                                  | Example                                                        |
| ----------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| `@last/{n}`             | Last N points (chronological)                | `.../prices/@last/100`                                         |
| `@count`                | Data point count                             | `.../prices/@count`                                            |
| `@range/{start}..{end}` | Between two timestamps (from..to only)       | `.../prices/@range/2026-01-01T00:00:00Z..2026-03-01T00:00:00Z` |
| `@before/{ts}/{limit}`  | Up to `limit` points strictly before `ts`    | `.../prices/@before/1737988200/10`                             |
| `@after/{ts}/{limit}`   | Up to `limit` points strictly after `ts`     | `.../prices/@after/1737988200/10`                              |

**Timestamp formats**: RFC 3339 (`2026-01-15T14:30:00Z`), Unix seconds
(`1737988200`), Unix milliseconds (`1737988200000`).

For grouped records (multiple events appended at the same timestamp), the
response is `{date, items: [...]}`. The Feed SDK auto-flattens, CLI
consumers don't.

### Time-series writes

| Suffix    | Description                                          | Example                          |
| --------- | ---------------------------------------------------- | -------------------------------- |
| `@append` | Append data points; expects flat records like `[{"date":1000,"close":100}]` | `.../prices/@append` |

### Schema / state

| Suffix     | Description                                              | Example                |
| ---------- | -------------------------------------------------------- | ---------------------- |
| `@typedoc` | Read or write a time series' typedoc (schema metadata)   | `.../prices/@typedoc`  |
| `@kv`      | Read/write the feed's KV state (`ctx.kv` namespace)      | `.../@kv/lastDate`     |

### Path anatomy

```
~/feeds/my-feed/v1 / data / metrics / prices / @last/100
|--- feedPath ---| |mount pt| | group | |output| | query |
```

`@kv` lives at the mount root (`~/feeds/<name>/v1/data/@kv/<key>`), not
under a group/output.

## Synth-mount grant gotcha

You **cannot** grant permissions directly on a Feed synth `data/` path —
it returns `PERMISSION_DENIED`. Grant on the parent feed directory; the
permission is inherited by every child path including the synth data mount:

```bash
# Wrong — errors
alva fs grant --path '~/feeds/my-feed/v1/data' --subject "special:user:*" --permission read

# Right — grant on the feed root
alva fs grant --path '~/feeds/my-feed' --subject "special:user:*" --permission read
```

## Clearing feed data (development only)

`alva fs remove --recursive` works on synth mounts. Useful for resetting
stale or wrong feed data during development.

```bash
# Clear a specific time series output
alva fs remove --path '~/feeds/my-feed/v1/data/market/ohlcv' --recursive

# Clear all outputs in a group
alva fs remove --path '~/feeds/my-feed/v1/data/market' --recursive

# Full feed reset: clear ALL data + KV state (data mount is re-created on next run)
alva fs remove --path '~/feeds/my-feed/v1/data' --recursive
```

Clearing a time series also removes its typedoc.
