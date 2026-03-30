# Run (JavaScript Execution)

Execute JavaScript in a V8 isolate with access to the filesystem, SDKs, and
HTTP.

```
POST /api/v1/run
```

## Request Fields

| Field       | Type   | Required | Description                                        |
| ----------- | ------ | -------- | -------------------------------------------------- |
| code        | string | \*       | Inline JavaScript to execute                       |
| entry_path  | string | \*       | Path to script on filesystem (home-relative)       |
| working_dir | string | no       | Working directory for require() (inline code only) |
| args        | object | no       | JSON accessible via `require("env").args`          |

\*Exactly one of `code` or `entry_path` must be provided.

## Response Fields

| Field  | Type   | Description                             |
| ------ | ------ | --------------------------------------- |
| result | string | JSON-encoded return value               |
| logs   | string | Captured stderr output                  |
| stats  | object | `duration_ms` (int64)                   |
| status | string | `"completed"` or `"failed"`             |
| error  | string | Error message when status is `"failed"` |

## Examples

```
# Inline code
POST /api/v1/run
{"code":"1 + 2 + 3;"}
→ {"result":"6","logs":"","stats":{"duration_ms":24},"status":"completed","error":null}

# Inline code with arguments
POST /api/v1/run
{"code":"const env = require(\"env\"); JSON.stringify(env.args);","args":{"symbol":"ETH","limit":50}}

# Execute script from filesystem
POST /api/v1/run
{"entry_path":"~/tasks/my-task/src/index.js","args":{"n":42}}
```
