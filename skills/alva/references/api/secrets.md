# Secrets

Use these commands to manage user-scoped third-party secrets. Secrets are
stored encrypted at rest in `jagent`, and runtime code reads them through
`require("secret-manager")`.

The `alva` CLI handles authentication automatically. When a human is manually
entering a sensitive secret, prefer the web UI at <https://alva.ai/apikey>.
Use the CLI flow when agent-managed CRUD is explicitly needed.

## Create Secret

```
alva secrets create --name OPENAI_API_KEY --value "sk-..."
```

Validation:

- `name` must be non-empty
- `value` must be non-empty
- Creating the same name twice returns `AlreadyExists`

## List Secrets

```
alva secrets list
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
alva secrets get --name OPENAI_API_KEY
```

Returns the decrypted plaintext value for the current user. Missing secrets
return `NotFound`.

## Update Secret

```
alva secrets update --name OPENAI_API_KEY --value "sk-new-..."
```

Overwrites the secret value in place. Missing secrets return `NotFound`.

## Delete Secret

```
alva secrets delete --name OPENAI_API_KEY
```

Deletes the secret for the current user. Missing secrets return `NotFound`.

## Runtime Usage

Inside `alva run` JavaScript, load the secret by name:

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
