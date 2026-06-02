# Playbook UDF Runtime

User-defined functions (UDFs) are functions registered by a playbook creator and
made available for viewers to invoke from the playbook UI. A UDF flow always has
two parts:

1. **Registration**: the creator registers a named function, its entry script,
   and its parameter schema against a playbook.
2. **Use**: the playbook HTML lists or invokes registered functions through the
   browser SDK.

Use this reference only when the user strictly asks for a registerable or
shareable interactive function, such as "register a UDF", "let viewers run this
analysis", or "add a button that calls my function". Do not use UDFs for
ordinary dashboards, scheduled data refresh, feed-backed charts, local-only
helpers, static filters, or interactions that can run entirely in browser state.

## Trigger Boundary

Before adding UDFs, confirm the request needs a user-registered function that
other users can call from the released playbook. If the request only asks for
fresh data, recurring computation, or visual interactivity, use feeds and
browser UI instead.

If the trigger is met, implement both sides:

- register or update the creator function with the service API
- load the toolkit browser SDK and invoke the function with `window.alva.udf`

Do not build only the browser button without registering the function, and do
not register a function without wiring the intended viewer-facing use.

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

These transport headers are informational only. Do not implement them manually
in playbook HTML.

This is a hard request-method rule for generated playbook HTML: do not use raw
browser `fetch()` or hand-written auth headers for PBSV-protected service
calls. Use the toolkit request wrapper. For UDFs, prefer `window.alva.udf`,
which is built on the runtime. For custom service calls, instantiate
`AlvaToolkit.AlvaClient({ pbsvToken })` with the token from
`window.alva.udf.getViewerToken()` and use SDK resource methods or
`client._request(...)`. Keep raw `fetch()` only for public feed reads through
the ALFS read gateway.

## Browser API

The browser API is the viewer-side use surface. It assumes the function has
already been registered for the playbook.

```html
<script src="https://unpkg.com/@alva-ai/toolkit/dist/browser.global.js"></script>
<script>
  const functions = await window.alva.udf.list();
  const result = await window.alva.udf.call('analyze', { ticker: 'AAPL' });
</script>
```

Use this replacement pattern when wiring UDF UI or custom service calls:

```javascript
// Good: high-level UDF API delegates PBSV transport to the toolkit runtime.
const functions = await window.alva.udf.list();
const result = await window.alva.udf.call("analyze", { ticker: "AAPL" });

// Good: custom service calls use the SDK request wrapper, not raw fetch.
const pbsvToken = window.alva.udf.getViewerToken();
if (!pbsvToken) throw new Error("Sign in to run this action.");
const client = new AlvaToolkit.AlvaClient({ pbsvToken });
const response = await client._request("GET", "/api/v1/service/custom", {
  query: { playbook_id: playbookId },
});
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
