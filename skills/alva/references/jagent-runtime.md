# Jagent Runtime Guide

The jagent runtime executes JavaScript inside a V8 isolate. Scripts are invoked
via `alva run` (inline code or filesystem entry path) or triggered by cronjobs.

---

## Runtime Overview

- **Engine**: V8 with strict mode enabled
- **Isolation**: Each execution runs in a separate subprocess with its own V8
  isolate
- **Heap**: 256 MB per execution by default, overridable per run via
  `max_heap_size_mb` (1–2048 MB) — `--max-heap-size-mb <mb>` on `alva run`,
  `max_heap_size_mb` in the `/api/v1/run` body / SDK
- **Native API boundary**: no Node built-ins, shell, local files, global
  `fetch`, top-level `await`, or timer globals; in short, no timer globals
- **No persistent state between executions**: each `alva run` call starts
  fresh (use `alfs` for persistence)

If a run exceeds its heap it is killed with an explicit out-of-memory error;
retry with a higher `max_heap_size_mb` (up to 2048 MB).

---

## Module System

### require() Resolution Order

1. **ALFS files** -- paths ending in `.js` that don't start with `@` (e.g.
   `require("./helper.js")`) -- resolved from the filesystem on ALFS
2. **Official/system modules** -- `alfs`, `env`, `secret-manager`,
   `net/http`, `@alva/algorithm`, `@alva/feed`, `@alva/pi`, `@alva/onnx`
3. **Runtime library modules** -- versioned modules like
   `require("@alva/technical-indicators/rsi:v1.0.0")`

### Version Handling

```javascript
require("@alva/pi:v1.0.0"); // explicit version
require("@alva/pi"); // defaults to v1.0.0
```

The `:v1.0.0` suffix is optional. When omitted, it defaults to `v1.0.0`.

### Relative Imports

When using `entry_path`, relative imports resolve from the entry script's
directory:

```javascript
// Entry on ALFS: '~/tasks/my-task/src/index.js'
const helper = require("./helper.js"); // resolves './helper.js' on ALFS under that directory
const utils = require("./lib/utils.js"); // resolves './lib/utils.js' on ALFS under that directory
```

---

## Built-in Modules

### alfs -- Filesystem Access

Provides filesystem operations using **absolute ALFS paths** (not home-relative
like the REST API).

```javascript
const alfs = require("alfs");
const env = require("env");
const home = "/alva/home/" + env.username; // absolute ALFS prefix (e.g. '/alva/home/alice')
```

| Method           | Signature                                     | Description                                             |
| ---------------- | --------------------------------------------- | ------------------------------------------------------- |
| readFile         | `readFile(path) → string`                     | Read file content as string                             |
| readFileBytes    | `readFileBytes(path) → string`                | Read file bytes as base64 string                        |
| writeFile        | `writeFile(path, content)`                    | Write string content to file (auto-creates parent dirs) |
| stat             | `stat(path) → {exists, isDir, size}`          | Get file metadata                                       |
| readDir          | `readDir(path) → [{name, isDir, size}, ...]`  | List directory                                          |
| mkdir            | `mkdir(path)`                                 | Create directory (recursive)                            |
| remove           | `remove(path)`                                | Remove file                                             |
| removeAll        | `removeAll(path)`                             | Remove directory recursively                            |
| rename           | `rename(oldPath, newPath)`                    | Rename/move                                             |
| copy             | `copy(src, dst)`                              | Copy file                                               |
| symlink          | `symlink(target, link)`                       | Create symlink                                          |
| readlink         | `readlink(path) → string`                     | Read symlink target                                     |
| chmod            | `chmod(path, mode)`                           | Change permissions                                      |
| grantPermission  | `grantPermission(path, subject, permission)`  | Grant access                                            |
| revokePermission | `revokePermission(path, subject, permission)` | Revoke access                                           |
| setPublicRead    | `setPublicRead(path)`                         | Shorthand: grant `special:user:*` read                  |
| mountSynth       | `mountSynth(path)`                            | Mount synth filesystem at path                          |

All methods return Promises (async). Construct paths with your user ID:

```javascript
const content = await alfs.readFile(home + "/data/config.json");
await alfs.writeFile(home + "/data/output.json", JSON.stringify(result));
const entries = await alfs.readDir(home + "/data");
```

### env -- Environment

```javascript
const env = require("env");
env.userId; // "1" (string) -- your numeric user ID
env.callerUserId; // "2" (string) -- invoking user's ID for UDF calls, when present
env.username; // "alice" (string) -- your username, used in ALFS paths
env.args; // parsed JSON from the request's "args" field
```

For UDF executions, `env.userId` / `env.username` identify the execution owner
whose ALFS context runs the script. `env.callerUserId` identifies the caller who
invoked the UDF and may differ from the owner. It is absent when no caller ID is
available.

### secret-manager -- Third-Party Secrets

Use this built-in module for user-scoped third-party credentials that were
uploaded to Alva Secret Manager.

```javascript
const secret = require("secret-manager");
const braveApiKey = secret.loadPlaintext("BRAVE_API_KEY");

if (!braveApiKey) {
  throw new Error(
    "Missing BRAVE_API_KEY. Upload it at https://alva.ai/apikey and retry.",
  );
}
```

Behavior:

- `loadPlaintext(name)` returns the plaintext string when the secret exists
- `loadPlaintext(name)` returns `null` when the secret is missing
- calling it without an authenticated execution context throws an error
- the module is read-only from JS; writes happen through the web UI or
  `alva secrets`
- do not log the returned value or write it into ALFS / released assets

### net/http -- HTTP Requests

```javascript
const http = require("net/http");

const resp = await http.fetch("https://api.example.com/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "BTC" }),
});
resp.status; // HTTP status code (number)
resp.ok; // true if status 200-299
resp.text(); // raw response body as string
resp.json(); // parsed JSON
resp.headers; // response headers
```

`fetch` returns a Promise. Request `init` fields: `method`, `headers`, `body`.
Max response body: 128 MB.

### @alva/algorithm -- Statistics and Indicators

```javascript
const { jStat, indicators, backtest } = require("@alva/algorithm");
```

**jStat** -- statistics library:

```javascript
jStat.mean([1, 2, 3, 4, 5]); // 3
jStat.stdev([1, 2, 3, 4, 5]); // standard deviation
jStat.median([1, 2, 3, 4, 5]); // 3
```

**indicators** -- 50+ technical indicators:

```javascript
const emaValues = indicators.ema(closePrices, 20);
const macdResult = indicators.macd(closePrices);
const rsiValues = indicators.rsi(closePrices, 14);
const bbands = indicators.bb(closePrices, 20, 2);
```

Categories: trend (SMA, EMA, DEMA, TEMA, MACD, Parabolic SAR, etc.), momentum
(RSI, Stochastic, Williams %R, etc.), volatility (ATR, Bollinger Bands, Keltner
Channel, etc.), volume (OBV, MFI, VWAP, etc.).

### @alva/onnx -- ONNX Inference

```javascript
const { InferenceSession, Tensor, TensorDataType } = require("@alva/onnx");
```

Use this module for supplied/exported `.onnx` model artifacts. Read binary model
artifacts with `InferenceSession.createFromAlfs({ alfs, path })`, build typed
input tensors, and await `session.run(...)`.

```javascript
const alfs = require("alfs");
const env = require("env");
const { InferenceSession, Tensor, TensorDataType } = require("@alva/onnx");

(async () => {
  let session;
  try {
    session = await InferenceSession.createFromAlfs({
      alfs,
      path: `/alva/home/${env.username}/models/my-model/v1/model.onnx`,
    });
    const outputs = await session.run({
      input: new Tensor(TensorDataType.Float32, new Float32Array([1, 2, 3]), [
        1,
        3,
      ]),
    });
    console.log(outputs.score.data[0]);
  } finally {
    if (session) await session.release();
  }
})();
```

See [onnx.md](onnx.md) for the model-playbook contract, FeedAltra session
lifecycle, output convention, and release checks.

### @test/suite -- Testing

```javascript
const {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  runTests,
} = require("@test/suite:v1.0.0");

describe("my tests", () => {
  it("should add numbers", () => {
    expect(1 + 2).toBe(3);
  });

  it("should compare objects", () => {
    expect({ a: 1 }).toEqual({ a: 1 });
  });
});

runTests({ verbose: true, timeout: 60000 });
```

**Assertions**: `toBe`, `toEqual`, `toBeDefined`, `toBeNull`, `toBeTruthy`,
`toBeFalsy`, `toBeGreaterThan`, `toBeLessThan`, `toBeCloseTo`, `toContain`,
`toHaveProperty`, `toThrow`.

---

## Async Model

**No top-level `await`**. The runtime does not support top-level await. Wrap
async code in an immediately-invoked async function:

```javascript
(async () => {
  const resp = await http.fetch("https://api.example.com/data");
  const data = await resp.json();
  // ...
})();
```

When the main script exits, the runtime drains the microtask queue and async
scheduler until all Promises settle. Promises that never resolve or reject cause
an error.

**Concurrency limits**: max 128 concurrent async HTTP requests, max 8192 pending
requests.

---

## Runtime Library Modules

Built-in computation and utility modules available via `require()` in the
V8 runtime. These are **not** data APIs — they run locally in the isolate.

```javascript
const { rsi } = require("@alva/technical-indicators/relative-strength-index-rsi:v1.0.0");
```

**Naming convention**: `@org/[namespace]*/module_name:v1.0.0`

- `@alva/technical-indicators/...` -- 50+ pure calculation helpers (RSI, MACD, Bollinger, etc.)
- `@alva/...` -- Alva-maintained modules (algorithm, feed, pi)
- `@test/...` -- Testing utilities

**Common response pattern**:

```javascript
const { getRSI } = require("@alva/technical-indicators/relative-strength-index-rsi:v1.0.0");
const result = getRSI({ prices: closePrices, period: 14 });
```

Most runtime library functions are **synchronous**.

To discover function signatures and response shapes, use the SDK doc API
(`alva sdk doc --name "..."`).

**Data APIs** (crypto, stock, macro, ETF) are now served by Arrays via HTTP
endpoints — see the Data Skills section in SKILL.md. They are **not**
loaded via `require()`.

---

## Constraints and Limits

| Constraint          | Details                                                 |
| ------------------- | ------------------------------------------------------- |
| Max require depth   | 64                                                      |
| No Node.js builtins | `fs`, `path`, `http`, `crypto` etc. are NOT available   |
| Strict mode         | V8 runs in strict mode (`"use strict"` implicit)        |
| Frozen exports      | Module exports are Object.freeze'd -- cannot be mutated |
| No circular deps    | Circular require() is detected and rejected             |
| HTTP response body  | 128 MB max                                              |
| No top-level await  | Wrap async code in `(async () => { ... })();`           |
