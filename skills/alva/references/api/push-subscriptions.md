# Push Subscriptions

Personal opt-in for DM/web push notifications on a target. Independent
of social follow:

- Subscribing does **not** start following.
- Unsubscribing does **not** unfollow.
- Following a playbook elsewhere will compound-subscribe automatically
  (the row is restored if previously unsubscribed).

`PLAYBOOK` is the only target type supported today; `FEED` is reserved
for a future phase. Auth gating (public/paid/private) happens upstream
in the gRPC layer — callers must be able to read the playbook.

## Subscribe to a Playbook

```bash
alva push-subscriptions subscribe-playbook --username USER --name NAME
```

| Flag       | Type   | Required | Description               |
| ---------- | ------ | -------- | ------------------------- |
| --username | string | yes      | Playbook owner's username |
| --name     | string | yes      | URL-safe playbook name    |

Idempotent. Returns the subscription row plus the canonical alfs path.

```bash
alva push-subscriptions subscribe-playbook --username alice --name btc-dashboard
# → {
#     "subscription": {
#       "target": {"type": "PLAYBOOK", "id": "8421"},
#       "subscribed": true,
#       "created_at_ms": 1777355703123,
#       "updated_at_ms": 1777355703123
#     },
#     "playbook_path": "/alva/home/alice/playbooks/btc-dashboard"
#   }
```

## Unsubscribe from a Playbook

```bash
alva push-subscriptions unsubscribe-playbook --username USER --name NAME
```

Soft-disable: the row is preserved with `subscribed: false` so a
subsequent re-subscribe restores seniority. Idempotent.

```bash
alva push-subscriptions unsubscribe-playbook --username alice --name btc-dashboard
# → {"ok": true}
```

## List My Subscriptions

```bash
alva push-subscriptions list [--include-history]
```

Returns the caller's personal push subscriptions across all targets.

| Flag              | Type    | Required | Description                                                                  |
| ----------------- | ------- | -------- | ---------------------------------------------------------------------------- |
| --include-history | boolean | no       | Default `false`. When `true`, also include rows with `subscribed: false`. |

Each row:

| Field         | Type    | Description                                                          |
| ------------- | ------- | -------------------------------------------------------------------- |
| target.type   | string  | `"PLAYBOOK"` (or `"FEED"` once supported)                            |
| target.id     | string  | Numeric id of the target as a string                                 |
| subscribed    | boolean | `true` if active. `false` only when `include_history=true` is passed |
| created_at_ms | int64   | Milliseconds since epoch when first subscribed                       |
| updated_at_ms | int64   | Milliseconds since epoch of last state change                        |

```bash
alva push-subscriptions list
# → {
#     "items": [
#       {"target": {"type": "PLAYBOOK", "id": "8421"},
#        "subscribed": true, "created_at_ms": 1777355703123, "updated_at_ms": 1777355703123},
#       ...
#     ]
#   }
```

## Notes

- `NOT_FOUND` covers both "playbook does not exist" and "exists but the
  caller cannot read it" — by design (no namespace enumeration).
- Push delivery still depends on the user having a connected channel
  (e.g. Telegram). If `telegram_username` is null on the user record
  (`alva user info`), push will silently no-op even when subscribed.
- Producer-side configuration (making a feed *capable* of pushing) is
  separate — see the "Post-release push notification flow" section of
  the main skill and `--push-notify` on `alva deploy`.
