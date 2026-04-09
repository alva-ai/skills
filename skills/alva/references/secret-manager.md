# Secret Manager

Use this reference when a task needs to upload, rotate, inspect, or consume a
third-party credential inside Alva Cloud.

---

## Mental Model

- `ALVA_API_KEY` authenticates the agent to the Alva platform itself.
- Alva Secret Manager stores **user-scoped third-party secrets** such as LLM API
  keys, search tokens, exchange credentials, and webhook secrets.
- Secrets are stored encrypted at rest in `jagent`.
- Runtime code reads them through the built-in JS module
  `require("secret-manager")`.

Do **not** confuse platform auth with vendor credentials. A task may need both:

- `ALVA_API_KEY` to call Alva APIs
- `OPENAI_API_KEY`, `BRAVE_API_KEY`, `EXCHANGE_SECRET`, etc. inside Secret
  Manager for runtime code

---

## Default Workflow

1. Prefer the web UI at <https://alva.ai/apikey> for initial upload or manual
   edits.
2. Avoid asking the user to paste a sensitive third-party secret into chat when
   the web upload flow is available.
3. Choose a stable secret name, usually uppercase with underscores, such as
   `OPENAI_API_KEY`, `BRAVE_API_KEY`, or `BINANCE_API_SECRET`.
4. Reference the secret by name in runtime code with
   `require("secret-manager").loadPlaintext("NAME")`.
5. If the runtime gets `null`, stop and tell the user exactly which secret name
   is missing and where to upload it.

Do not:

- hardcode secrets in source code
- save secrets into ALFS files
- embed secrets into released playbook HTML, JSON, or screenshots
- log secret values

---

## Runtime Usage

```javascript
const secret = require("secret-manager");
const openaiApiKey = secret.loadPlaintext("OPENAI_API_KEY");

if (!openaiApiKey) {
  throw new Error(
    "Missing OPENAI_API_KEY. Upload it at https://alva.ai/apikey and retry.",
  );
}
```

Behavior from the runtime implementation:

- `loadPlaintext(name)` returns the plaintext string when the secret exists
- `loadPlaintext(name)` returns `null` when the secret does not exist
- an authenticated execution context is required
- if the secret loader is not configured, the module throws a clear error
- the JS module is read-only; writes and updates happen outside the runtime

Use this whenever the code needs to call an external service from `alva run`
or from a deployed cronjob.

---

## Programmatic CRUD API

Authenticated CRUD is available via `alva secrets`. All operations are scoped
to the current user.

### Create

```bash
alva secrets create --name OPENAI_API_KEY --value "sk-..."
```

### List

```bash
alva secrets list
```

Returns metadata only (name, keyVersion, createdAt, updatedAt, valueLength,
keyPrefix).

### Get plaintext value

```bash
alva secrets get --name OPENAI_API_KEY
```

### Update

```bash
alva secrets update --name OPENAI_API_KEY --value "sk-new-..."
```

### Delete

```bash
alva secrets delete --name OPENAI_API_KEY
```

Validation and error behavior:

- empty `name` or `value` returns `INVALID_ARGUMENT`
- creating the same name twice returns `AlreadyExists`
- get/update/delete on a missing secret returns `NotFound`

Prefer the web UI over CRUD API when a human is manually entering a secret.
Prefer the API when the task explicitly needs agent-managed setup, migration, or
cleanup.

---

## Agent Guidance

When helping a user build with external providers:

- first identify the exact secret name the code will use
- tell the user where to upload it: <https://alva.ai/apikey>
- write runtime code that fails clearly when the secret is missing
- keep the secret name consistent across instructions, code, and deployment

Example:

```javascript
const secret = require("secret-manager");
const braveApiKey = secret.loadPlaintext("BRAVE_API_KEY");

if (!braveApiKey) {
  throw new Error("Missing BRAVE_API_KEY. Upload it at https://alva.ai/apikey.");
}

const http = require("net/http");

(async () => {
  const resp = await http.fetch("https://api.search.brave.com/res/v1/web/search?q=NVDA", {
    headers: {
      "X-Subscription-Token": braveApiKey,
    },
  });
  const data = await resp.json();
  return data;
})();
```
