# Operational Pitfalls

This file is mandatory and stepwise. Do not save it for debugging. Before each
execution step, read the matching section below, then do the step.

| Before you... | Read |
| --- | --- |
| Write or run jagent code | [Runtime](#runtime) |
| Touch ALFS paths, grants, feed paths, or public reads | [ALFS And Feed Paths](#alfs-and-feed-paths) |
| Wrap a new endpoint in feed logic | [Data And Runtime Debugging](#data-and-runtime-debugging) |
| Build or edit playbook HTML/charts | [Chart And HTML](#chart-and-html) |
| Mix sources with different cadences | [Watermarks](#watermarks) |
| Scale runtime, payload, HTTP, or cron behavior | [Resource Limits](#resource-limits) |

## Runtime

- No `process`, Node.js builtins, timer globals, global `fetch`, or top-level
  `await` in jagent runtime. Use [jagent-runtime.md](jagent-runtime.md).
- Use `require("net/http")` for HTTP.
- Use `require("alfs")` with absolute `/alva/home/<username>/...` paths.
- `FeedAltra.run()` is async; always `await` it.
- V8 heap is 256 MB by default. For memory-heavy `alva run`, use
  `--max-heap-size-mb <mb>` up to 2048.

## ALFS And Feed Paths

- Quote `~` paths in shell commands so local shell expansion does not rewrite
  them.
- Public reads require absolute paths such as `/alva/home/<username>/...`.
- `@last` returns chronological oldest-first order.
- `last(N)` limits unique timestamps, not records.
- Feed SDK mounts output under `<feedPath>/data/`; do not create a group named
  `data` unless you really want `data/data/...`.
- If ALFS returns `PERMISSION_DENIED` for all operations, provision home with
  `alva fs mkdir --path '~/'`.

## Data And Runtime Debugging

Before building a full feed around a new endpoint, run a small shape check via
`alva run` and print a short JSON slice. Verify actual response nesting before
writing parser logic.

### Reading `alva run` Output

- End the script with the value itself (an object or array), not
  `JSON.stringify(value)`. `alva run` already prints `result` as JSON; a
  stringified return only adds a layer of escaping to read back.
- Return only what the next step needs: a slice, counts, or the fields you are
  checking. Every printed byte stays in the conversation.
- When a result is large or you will inspect it more than once, run the script
  once with `--output` and query the file instead of re-running the script:

  ```bash
  alva run --local-file ./research.js --output ./research.json
  jq -c '.income[:4]' ./research.json
  jq -c '.balance | keys' ./research.json
  ```

  The command prints the file's path, size, and top-level shape instead of the
  result. Use `jq -c` so query output stays compact. `--output` writes a local
  file, so it is unavailable in the embedded Agent runtime.

Development-only reset examples:

```bash
alva fs remove --path '~/feeds/my-feed/v1/data/market/ohlcv' --recursive
alva fs remove --path '~/feeds/my-feed/v1/data/market' --recursive
alva fs remove --path '~/feeds/my-feed/v1/data' --recursive
```

Do not use destructive resets in production.

## Chart And HTML

- Covered US equities and crypto latest/realtime price answers need intraday
  klines; daily-level bars and closes are not current-price sources.
- ECharts date axes should use `type: 'time'`, not raw epoch values as category
  labels.
- ECharts in tabs or hidden containers must initialize/resize through
  `requestAnimationFrame`; the design contract checks this.
- Graph series need validated node names, unique nodes, and edges whose
  `source`/`target` match existing node names.
- Allocate enough chart height. Heatmaps need at least `max(300px, rows * 40px)`;
  primary overview charts should usually be at least 400px.

## Watermarks

Use separate `ctx.kv` watermarks for sources with different update cadences
such as ETF OHLCV, VIX, and CPI. A shared watermark can permanently filter out
slower sources after the first run.

## Resource Limits

| Resource | Limit |
| --- | --- |
| V8 heap per execution | 256 MB default; `--max-heap-size-mb` up to 2048 MB |
| Write payload | 10 MB per request |
| HTTP response body | 128 MB |
| Minimum cron interval | 1 minute |
