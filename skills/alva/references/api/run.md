# Run (JavaScript Execution)

Execute JavaScript in a V8 isolate with access to the filesystem, SDKs, and
HTTP.

```
alva run [flags]
```

## Flags

| Flag             | Type   | Required | Description                                        |
| ---------------- | ------ | -------- | -------------------------------------------------- |
| `--code`         | string | \*       | Inline JavaScript to execute                       |
| `--entry-path`   | string | \*       | Path to script on filesystem (home-relative)       |
| `--working-dir`  | string | no       | Working directory for require() (inline code only) |
| `--args`         | JSON   | no       | JSON accessible via `require("env").args`          |

\*Exactly one of `--code` or `--entry-path` must be provided.

> **Warning**: `--code` expects inline JavaScript, not a file path.
> `alva run --code /tmp/script.js` passes the string as code and fails with
> `SyntaxError`. To execute a local file: upload it first with
> `alva fs write --path '~/path/to/script.js' --file /tmp/script.js`, then run
> with `alva run --entry-path '~/path/to/script.js'`.

## Response Fields

| Field  | Type   | Description                             |
| ------ | ------ | --------------------------------------- |
| result | string | JSON-encoded return value               |
| logs   | string | Captured stderr output                  |
| stats  | object | `duration_ms` (int64)                   |
| status | string | `"completed"` or `"failed"`             |
| error  | string | Error message when status is `"failed"` |

## Examples

```bash
# Inline code
alva run --code '1 + 2 + 3;'
# → {"result":"6","logs":"","stats":{"duration_ms":24},"status":"completed","error":null}

# Inline code with arguments
alva run --code 'const env = require("env"); JSON.stringify(env.args);' --args '{"symbol":"ETH","limit":50}'

# Execute script from ALFS (quote ~ to prevent shell expansion)
alva run --entry-path '~/tasks/my-task/src/index.js' --args '{"n":42}'

# Upload a local file to ALFS, then execute it
alva fs write --path '~/feeds/my-feed/v1/src/index.js' --file ./index.js --mkdir-parents
alva run --entry-path '~/feeds/my-feed/v1/src/index.js'
```
