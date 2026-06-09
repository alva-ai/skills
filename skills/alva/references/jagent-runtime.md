# Jagent Runtime Guide

The jagent runtime executes JavaScript inside a V8 isolate. Use this reference
before writing code for `alva run`, filesystem entry paths, or deployed
cronjobs.

Boundary: this file covers runtime execution and modules only. For persistent
feed outputs and release lifecycle, read [feed-sdk.md](feed-sdk.md) and
[feed-lifecycle.md](feed-lifecycle.md); for browser/playbook HTML, read
[playbook-creation.md](playbook-creation.md).

## Runtime Contract

- **Engine**: V8 with strict mode enabled.
- **Isolation**: each execution runs in a separate subprocess with its own V8
  isolate.
- **State**: every `alva run` or cronjob execution starts fresh. Use `alfs` for
  persistence.
- **Heap**: 256 MB by default. Override with `--max-heap-size-mb <mb>` on
  `alva run`, or `max_heap_size_mb` in the `/api/v1/run` body / SDK. Valid
  range: 1-2048 MB. Exceeding the heap kills the run with an explicit
  out-of-memory error.
- **Native boundary**: no Node built-ins, shell, host-local files, `process`,
  global `fetch`, top-level `await`, and no timer globals. Use the runtime
  modules below instead.

## `alva run` Entry Points

Run `alva run --help` before use; it owns the current flag names. The gotchas:

- Exactly one of `--code`, `--local-file`, or `--entry-path` is required.
- `--local-file <path>` reads a local file client-side and sends its contents
  as code. The runtime still cannot read host-local files.
- `--entry-path <path>` points to an ALFS script. The CLI accepts home-relative
  paths like `~/tasks/name/src/index.js`; runtime code should still use
  absolute ALFS paths such as `/alva/home/${env.username}/...`.
- `--working-dir <dir>` only controls `require()` resolution for inline code.
- `--args <json>` becomes `require("env").args`.
- Responses include `result` (JSON-encoded return value), `logs` (captured
  stderr), `status`, and `error` when the run fails.

Minimal async shape:

```javascript
const alfs = require("alfs");
const env = require("env");
const http = require("net/http");
const home = "/alva/home/" + env.username;

(async () => {
  const resp = await http.fetch("https://api.example.com/data");
  if (!resp.ok) throw new Error("HTTP " + resp.status);
  await alfs.writeFile(home + "/data/output.json", await resp.text());
})();
```

## Module System

`require()` resolves in this order:

1. ALFS `.js` files that do not start with `@`, such as
   `require("./helper.js")`.
2. Official/system modules: `alfs`, `env`, `secret-manager`, `net/http`,
   `@alva/algorithm`, `@alva/feed`, `@alva/pi`, `@alva/onnx`.
3. Runtime library modules, such as
   `require("@alva/technical-indicators/rsi:v1.0.0")` or
   `require("@test/suite:v1.0.0")`.

Version suffixes default to `:v1.0.0` when omitted:

```javascript
require("@alva/pi:v1.0.0");
require("@alva/pi"); // same default version
```

When using `entry_path`, relative imports resolve from the entry script's ALFS
directory. The runtime rejects circular imports, freezes module exports, and
limits require depth to 64.

`alva run --help` may list broad module families such as `@arrays/...` and
legacy surfaces such as `@alva/adk`. Do not infer data routing or new LLM
patterns from the help summary alone: use `alva sdk ...` to discover runtime
SDK modules, [data-skills.md](data-skills.md) for structured Arrays endpoints,
and [alpi.md](alpi.md) for new scheduled LLM reasoning work.

## Built-In Modules

| Module | Use | Runtime rule |
| --- | --- | --- |
| `alfs` | ALFS file access. | Use absolute paths like `/alva/home/${env.username}/...`, not the home-relative paths used by the REST API. Methods are async. |
| `env` | Execution identity and args. | `env.userId`, `env.username`, and `env.args` describe the execution owner. `env.callerUserId` may be present for UDF calls and can differ from the owner. |
| `secret-manager` | User-scoped third-party credentials. | `loadPlaintext(name)` returns a string or `null`, requires authenticated execution context, is read-only from JS, and must never be logged or written to ALFS. See [secret-manager.md](secret-manager.md). |
| `net/http` | HTTP requests. | Use `http.fetch(url, { method, headers, body })`; response has `status`, `ok`, `text()`, `json()`, and `headers`. Max response body is 128 MB. |
| `@alva/algorithm` | Local statistics, indicators, and backtest helpers. | Calculation module, not a data source. Import `jStat`, `indicators`, or `backtest`. |
| `@alva/feed` | Persistent feed outputs. | Use for released feed data; see [feed-sdk.md](feed-sdk.md). |
| `@alva/pi` | Scheduled LLM reasoning/tool loops. | Use `Agent.ask()` for result-only reasoning paths; see [alpi.md](alpi.md). |
| `@alva/onnx` | ONNX inference. | Load models with `InferenceSession.createFromAlfs({ alfs, path })`, create tensors from the model contract, and release sessions in `finally`. See [onnx.md](onnx.md). |
| `@test/suite` | Runtime unit tests. | Import `describe`, `it`, `expect`, and `runTests`; common assertions include `toBe`, `toEqual`, `toBeDefined`, `toBeNull`, `toBeTruthy`, `toBeFalsy`, `toBeGreaterThan`, `toBeLessThan`, `toBeCloseTo`, `toContain`, `toHaveProperty`, and `toThrow`. |

Runtime `alfs` methods all return Promises:

| Method | Signature | Behavior |
| --- | --- | --- |
| `readFile` | `readFile(path) -> string` | Read text content. |
| `readFileBytes` | `readFileBytes(path) -> string` | Read bytes as a base64 string. |
| `writeFile` | `writeFile(path, content)` | Write string content and auto-create parent directories. |
| `stat` | `stat(path) -> {exists, isDir, size}` | Read file metadata. |
| `readDir` | `readDir(path) -> [{name, isDir, size}, ...]` | List directory entries. |
| `mkdir` | `mkdir(path)` | Create a directory recursively. |
| `remove` | `remove(path)` | Remove one file. |
| `removeAll` | `removeAll(path)` | Remove a directory recursively. |
| `rename` | `rename(oldPath, newPath)` | Rename or move a file or directory. |
| `copy` | `copy(src, dst)` | Copy a file. |
| `symlink` | `symlink(target, link)` | Create a symlink. |
| `readlink` | `readlink(path) -> string` | Read a symlink target. |
| `chmod` | `chmod(path, mode)` | Change permissions. |
| `grantPermission` | `grantPermission(path, subject, permission)` | Grant access. |
| `revokePermission` | `revokePermission(path, subject, permission)` | Revoke access. |
| `setPublicRead` | `setPublicRead(path)` | Shorthand for granting `special:user:*` read. |
| `mountSynth` | `mountSynth(path)` | Mount a synth filesystem at a path. |

## Computation Modules

`@alva/algorithm` is the broad local computation bundle:

```javascript
const { jStat, indicators, backtest } = require("@alva/algorithm");

const mean = jStat.mean([1, 2, 3]);
const ema = indicators.ema(closePrices, { period: 20 });
const macd = indicators.macd(closePrices);
const rsi = indicators.rsi(closePrices, { period: 14 });
```

Use it for local statistics, common indicators, and backtest helpers. It is not
a data source.

Standalone technical-indicator modules are versioned runtime libraries. Discover
them with `alva sdk partition-summary --partition technical_indicator_calculation_helpers`
and open the exact signature with `alva sdk doc --name <module>`.

```javascript
const { rsi } = require("@alva/technical-indicators/relative-strength-index-rsi:v1.0.0");
const values = rsi(closePrices, { period: 9 });
```

The standalone modules are pure calculations and usually synchronous. Do not
guess export names from module names; use `alva sdk doc` because names vary.

## Async Model

The runtime does not support top-level `await`. Wrap async work in an async IIFE
or another async function invoked from the entry script.

When the main script exits, the runtime drains the microtask queue and async
scheduler until all Promises settle. Promises that never resolve or reject cause
an error.

Concurrency limits:

- max 128 concurrent async HTTP requests
- max 8192 pending requests

## Runtime Library Modules

`alva sdk` surfaces runtime modules, not Data Skills endpoints:

```bash
alva sdk partitions
alva sdk partition-summary --partition <name>
alva sdk doc --name <module>
```

Use `alva sdk doc --name "..."` to discover exact function signatures and
response shapes. Most runtime library functions are synchronous and loaded via
`require("@org/[namespace]*/module_name:v1.0.0")`.

Data APIs for crypto, stocks, macro, ETF, news, and similar financial data are
served by Arrays over HTTP. Discover and call them through
[data-skills.md](data-skills.md); do not load them with `require()`.

## Common Fixes

| Symptom | Fix |
| --- | --- |
| `ReferenceError: fetch is not defined` | Use `require("net/http").fetch(...)`. |
| `ReferenceError: require is not defined` in browser HTML | Runtime modules are server-side only; browser code must use browser-safe APIs. |
| Top-level `await` fails | Wrap async code in `(async () => { ... })();`. |
| Host-local file access fails | Upload/read through ALFS and use absolute `/alva/home/<username>/...` paths. |
| Missing secret returns `null` | Stop with the exact secret name and upload URL; do not invent a fallback credential. |
| Run dies with out-of-memory | Retry with a larger `max_heap_size_mb`, up to 2048 MB. |
