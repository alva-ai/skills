# Filesystem — extras not in CLI help

Run `alva fs --help` first for subcommands, flags, path conventions, and
grant subjects. This file adds ordinary-file append semantics that help cannot
fully express, the authoritative synth-mount suffixes, and the synth-mount
grant gotcha.

## Ordinary ALFS file append

For an ordinary ALFS file, `alva fs write --append` concatenates text or raw
file bytes to the existing content instead of replacing it:

```bash
alva fs write --path '~/notes.md' --data $'\n## Update\n- New note\n' --append
alva fs write --path '~/notes.md' --file ./new-note.md --append
```

The operation does not add a newline or Markdown structure; include separators
in `--data` or the local file. Without `--append`, `alva fs write` overwrites the
ordinary file.

Ordinary-file append is implemented as a read-modify-write by the backing file
provider and is not concurrency-safe. Simultaneous writers can lose an update.
Use it only for explicit manual or otherwise low-contention writes. A workflow
that must preserve concurrent edits should read, merge, and conditional-write
through a service that exposes the file ETag/version.

Do not confuse this flag with Synth `@append`: `--append` concatenates ordinary
file bytes, while `@append` writes structured time-series records to a Synth
mount and upserts records that reuse a timestamp.

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

`@append` is timestamp-keyed: writing a record with an existing timestamp is an
upsert, not a strictly immutable append.

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
