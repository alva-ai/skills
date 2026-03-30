# Secrets

Use these endpoints to manage user-scoped third-party secrets. Secrets are
stored encrypted at rest in `jagent`, and runtime code reads them through
`require("secret-manager")`.

These endpoints are authenticated and user-scoped. They work with the same
`X-Alva-Api-Key` header used elsewhere in this skill, or with an authenticated
website session. When a human is manually entering a sensitive secret, prefer
the web UI at <https://alva.ai/apikey>. Use the API flow when agent-managed
CRUD is explicitly needed.

## Create Secret

```
POST /api/v1/secrets
{"name":"OPENAI_API_KEY","value":"sk-..."}
```

Validation:

- `name` must be non-empty
- `value` must be non-empty
- Creating the same name twice returns `AlreadyExists`

Response: `201 Created` with empty JSON body (`{}`)

## List Secrets

```
GET /api/v1/secrets
→ {"secrets":[{"name":"OPENAI_API_KEY","keyVersion":1,"createdAt":"2026-03-20T08:00:00Z","updatedAt":"2026-03-20T08:00:00Z","valueLength":56,"keyPrefix":"sk-proj-abc12"}]}
```

List returns metadata only:

- `name`
- `keyVersion`
- `createdAt`
- `updatedAt`
- `valueLength`
- `keyPrefix`

## Get Secret

```
GET /api/v1/secrets/OPENAI_API_KEY
→ {"name":"OPENAI_API_KEY","value":"sk-...","createdAt":"2026-03-20T08:00:00Z","updatedAt":"2026-03-20T08:00:00Z"}
```

Returns the decrypted plaintext value for the current user. Missing secrets
return `NotFound`.

## Update Secret

```
PUT /api/v1/secrets/OPENAI_API_KEY
{"value":"sk-new-..."}
```

Overwrites the secret value in place. Missing secrets return `NotFound`.

Response: `200 OK` with empty JSON body (`{}`)

## Delete Secret

```
DELETE /api/v1/secrets/OPENAI_API_KEY
```

Deletes the secret for the current user. Missing secrets return `NotFound`.

Response: `200 OK` with empty JSON body (`{}`)

## Runtime Usage

Inside `/api/v1/run` JavaScript, load the secret by name:

```javascript
const secret = require("secret-manager");
const openaiApiKey = secret.loadPlaintext("OPENAI_API_KEY");

if (!openaiApiKey) {
  throw new Error(
    "Missing OPENAI_API_KEY. Upload it at https://alva.ai/apikey and retry.",
  );
}
```

Behavior:

- `loadPlaintext(name)` returns the plaintext string when present
- `loadPlaintext(name)` returns `null` when the secret does not exist
- calling it without an authenticated execution context throws an error
- do not log secret values or write them into ALFS or released assets
