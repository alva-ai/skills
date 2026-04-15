# Jagent Runtime Guide

The jagent runtime executes JavaScript inside a V8 isolate. Scripts are invoked
via `alva run` (inline code or filesystem entry path) or triggered by cronjobs.

---

## Runtime Overview

- **Engine**: V8 with strict mode enabled
- **Isolation**: Each execution runs in a separate subprocess with its own V8
  isolate
- **Heap**: 2 GB per execution
- **No persistent state between executions**: each `alva run` call starts
  fresh (use `alfs` for persistence)

---

## Module System

### require() Resolution Order

1. **ALFS files** -- paths ending in `.js` that don't start with `@` (e.g.
   `require("./helper.js")`) -- resolved from the filesystem on ALFS
2. **Official/system modules** -- `alfs`, `env`, `secret-manager`,
   `net/http`, `@alva/algorithm`, `@alva/feed`, `@alva/adk`
3. **SDKHub modules** -- versioned modules like
   `require("@arrays/crypto/ohlcv:v1.0.0")`

### Version Handling

```javascript
require("@alva/adk:v1.0.0"); // explicit version
require("@alva/adk"); // defaults to v1.0.0
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
| readFileBytes    | `readFileBytes(path) → Uint8Array`            | Read file as bytes                                      |
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
const content = alfs.readFile(home + "/data/config.json");
alfs.writeFile(home + "/data/output.json", JSON.stringify(result));
const entries = alfs.readDir(home + "/data");
```

### env -- Environment

```javascript
const env = require("env");
env.userId; // "1" (string) -- your numeric user ID
env.username; // "alice" (string) -- your username, used in ALFS paths
env.args; // parsed JSON from the request's "args" field
```

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

## SDKHub Modules

250+ financial data modules are embedded in the runtime. They follow the
pattern:

```javascript
const { getXxx } = require("@org/namespace/module:v1.0.0");
```

**Naming convention**: `@org/[namespace]*/module_name:v1.0.0`

- `@alva/...` -- Alva-maintained modules (indicators, data, LLM)
- `@arrays/...` -- Data provider modules (crypto, stock, macro, ETF)
- `@test/...` -- Testing utilities

**Common response pattern**:

```javascript
const { getCryptoKline } = require("@arrays/crypto/ohlcv:v1.0.0");
const result = getCryptoKline({
  symbol: "BTCUSDT",
  start_time: startTimestamp,
  end_time: endTimestamp,
  interval: "1h",
});

if (!result.success) {
  throw new Error("API call failed: " + JSON.stringify(result));
}

const bars = result.response.data;
// bars = [{date, open, high, low, close, volume, ...}, ...]
```

Most SDK functions are **synchronous** and return
`{ success: boolean, response: { data: [...] } }`.

To discover function signatures and response shapes, use the SDK doc API
(`alva sdk doc --name "..."`).

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
