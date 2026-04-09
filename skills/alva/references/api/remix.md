# Remix

Record parent-child dependency when a playbook is remixed from an existing one.

## Save Remix Lineage

```bash
alva remix --child-username USER --child-name NAME --parents '[{"username":"...","name":"..."}]'
```

| Flag             | Type   | Required | Description                                        |
| ---------------- | ------ | -------- | -------------------------------------------------- |
| --child-username | string | yes      | Username of the new playbook owner (must be yours) |
| --child-name     | string | yes      | URL-safe name of the new playbook                  |
| --parents        | JSON   | yes      | JSON array of `{username, name}` source playbooks  |

```bash
alva remix --child-username bob --child-name my-btc-strategy --parents '[{"username":"alice","name":"btc-momentum"}]'
```
