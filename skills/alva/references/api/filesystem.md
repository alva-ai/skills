# Filesystem — extras not in CLI help

Run `alva fs --help` first for subcommands, flags, path conventions, and
grant subjects. This file adds synth-mount write/schema details and the
synth-mount grant gotcha.

## Synth-mount virtual suffixes (authoritative set)

These are the suffixes actually wired up at a feed data mount. Anything
not on this list is unsupported. In particular, do **not** use `@now`,
`@all`, `@at`, `@range/{duration}`, or `@range/@bounds`.

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

| Suffix                             | Description                                           | Example                                          |
| ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `@last/{n}`                        | Last N points (chronological)                         | `.../prices/@last/100`                           |
| `@count`                           | Data point count                                      | `.../prices/@count`                              |
| `@range/{start_ms}..{end_ms}`      | Between two timestamps (from..to only)                | `.../prices/@range/1735689600000..1740787200000` |
| `@before/{timestamp_ms}/{limit}`   | Up to `limit` points strictly before the timestamp    | `.../prices/@before/1737988200000/10`            |
| `@after/{timestamp_ms}/{limit}`    | Up to `limit` points strictly after the timestamp     | `.../prices/@after/1737988200000/10`             |

**Timestamp format**: Unix milliseconds only (`1737988200000`). RFC 3339
and Unix-second timestamps are not supported by feed synth mounts.

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

## Feed visibility

After deploying and publishing the automation, use the returned `feed_id` to
make the feed public:

```bash
alva feed set-visibility --id <feed_id> --visibility public
```

This keeps the feed visibility record and its inherited ALFS permission
projection consistent.

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
