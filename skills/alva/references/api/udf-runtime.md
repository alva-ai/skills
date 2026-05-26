# Playbook Browser SDK/API

Use this reference when playbook browser HTML needs feed-backed data or
interactive browser-triggered functions. This is the current browser SDK/API
runtime contract.

## Runtime Model

Alva renders released playbooks inside an iframe. The parent Alva page mints a
playbook-scoped viewer token (PBSV) for signed-in viewers and appends these
query parameters to the iframe URL:

| Parameter       | Description                                                                    |
| --------------- | ------------------------------------------------------------------------------ |
| `_pbsv`         | Short-lived playbook-scoped viewer JWT. Scope is fixed to read + `udf:invoke`. |
| `parent_origin` | Origin allowed to send token refresh and consent messages.                     |
| `api_origin`    | Alva API origin for service calls.                                             |

Playbook HTML should load the browser bundle from `@alva-ai/toolkit`. The
runtime installs `window.alva.udf`, reads `_pbsv`, removes only `_pbsv` from the
visible URL, accepts parent token refreshes, and sends service requests with:

```http
Authorization: Bearer <pbsv-jwt>
X-Pbsv: 1
Content-Type: application/json
```

Browser HTML must not call ALFS/FS read endpoints directly, use
`$ALVA_ENDPOINT`, guess API origins, or load feed data through `client.fs`.
Expose feed-backed browser data through registered playbook UDFs and call them
with `window.alva.udf`.

## Browser SDK API

```html
<script src="https://unpkg.com/@alva-ai/toolkit/dist/browser.global.js"></script>
<script>
  const functions = await window.alva.udf.list();
  const result = await window.alva.udf.call('analyze', { ticker: 'AAPL' });
</script>
```

### `window.alva.udf.list()`

Fetches metadata for functions registered on the current playbook.

- Uses `GET /api/v1/service/functions?playbook_id=<id>`.
- Sends PBSV headers.
- Under PBSV, `entry_script_path` is intentionally hidden; only function
  metadata and `params_schema` are exposed to viewers.

### `window.alva.udf.call(functionName, params)`

Invokes a registered playbook function.

- Uses `POST /api/v1/service/invoke`.
- Request body:

```json
{
  "playbook_id": "<playbook-id>",
  "function_name": "analyze",
  "parameters_json": "{\"ticker\":\"AAPL\"}"
}
```

- Response body:

```json
{
  "result": {},
  "logs": [],
  "credits_used_total": 3,
  "credits_charged_owner": 0,
  "credits_charged_consumer": 3
}
```

### `window.alva.udf.renderButton(target, options)`

Mounts a simple `UdfButton` for one-click interactions.

```html
<div id="analysis-button"></div>
<pre id="analysis-output"></pre>
<script>
  const button = window.alva.udf.renderButton("#analysis-button", {
    functionName: "analyze",
    params: { ticker: "AAPL" },
    label: "Run analysis",
  });

  button.addEventListener("alva:udf-button:result", (event) => {
    document.querySelector("#analysis-output").textContent = JSON.stringify(
      event.detail.result,
      null,
      2,
    );
  });
</script>
```

The button disables itself when no PBSV token is present. It dispatches:

| Event                     | Meaning                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `alva:udf-button:loading` | Invocation started.                                        |
| `alva:udf-button:result`  | Invocation resolved; `event.detail.result` has the result. |
| `alva:udf-button:error`   | Invocation failed; `event.detail.error` has the error.     |

For richer forms, call `list()` to read `params_schema`, render your own inputs,
then call `call()`.

## Allowance Consent

If a viewer has not authorized enough credits for this playbook, the backend
returns `CONSENT_REQUIRED` as HTTP 402. The gateway body uses:

```json
{
  "error": {
    "code": "CONSENT_REQUIRED",
    "message": "..."
  },
  "details": {
    "metadata": {
      "playbook_id": "<playbook-id>",
      "min_allowance_suggested": 3
    }
  }
}
```

The SDK posts an `alva:udf:consent-request` message to the parent Alva page. The
parent shows the product allowance modal, creates or updates the allowance, then
responds with `alva:udf:consent-response`. If granted, the SDK retries the
invocation once.

Do not implement a custom credit authorization modal inside the playbook iframe.

## Creator Function Registration

Browser HTML calls functions already registered on the current playbook. Do not
create, update, or delete functions from the iframe. When a playbook needs a new
function, ensure creator-side registration exists before release.

Creators register or update UDF functions through the service API:

```http
POST /api/v1/service/functions
Content-Type: application/json
Authorization: Bearer <creator-session-token>
```

```json
{
  "playbook_id": "<playbook-id>",
  "function_name": "analyze",
  "entry_script_path": "~/playbooks/my-playbook/udf/analyze.js",
  "params_schema": {
    "type": "object",
    "properties": {
      "ticker": { "type": "string" }
    },
    "required": ["ticker"]
  }
}
```

Delete a function with:

```http
DELETE /api/v1/service/functions?playbook_id=<playbook-id>&function_name=<name>
```

Function entry scripts should live in creator-controlled ALFS paths and should
validate `parameters_json` before doing expensive work.

## Allowance Management

Consumer allowance is managed by the Alva app. For product UI or session-user
tools, prefer GraphQL because timestamps are normalized:

```graphql
query {
  allowance(playbookId: "...")
  myAllowances
}

mutation {
  createAllowance(input: { playbookId: "...", amount: 25 }) {
    allowance {
      id
      playbookId
      amount
      used
      remaining
      createdAtMs
      updatedAtMs
    }
  }
}

mutation {
  revokeAllowance(playbookId: "...") {
    ok
  }
}
```

PBSV is explicitly rejected from allowance-management APIs. Only signed-in
session users can create, edit, or revoke allowances.

## Pre-Release Checklist

- The playbook HTML loads `@alva-ai/toolkit` before calling `window.alva.udf`.
- UDF controls handle unauthenticated viewers by disabling controls or showing a
  sign-in prompt; do not expose raw tokens.
- `params_schema` matches the UI inputs and server-side validation.
- Error UI handles auth, consent denied, insufficient credits, function not
  found, disabled function, rate limit, and execution failures.
- Viewer-facing copy explains that allowance is a cap, not an immediate charge.
