# Remix

Record parent-child dependency when a playbook is remixed from an existing one.

## Save Remix Lineage

```
POST /api/v1/remix
```

| Field   | Type   | Required | Description                                           |
| ------- | ------ | -------- | ----------------------------------------------------- |
| child   | object | yes      | `{username, name}` — the new playbook (must be yours) |
| parents | array  | yes      | `[{username, name}]` — source playbook(s)             |

```
POST /api/v1/remix
{
  "child": {"username": "bob", "name": "my-btc-strategy"},
  "parents": [{"username": "alice", "name": "btc-momentum"}]
}
```
