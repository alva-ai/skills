# Push Subscriptions

Personal opt-in for DM/web push notifications on a target. Independent
of social follow:

- Subscribing does **not** start following.
- Unsubscribing does **not** unfollow.
- Following a playbook elsewhere will compound-subscribe automatically
  (the row is restored if previously unsubscribed).

Two target types are supported:

- **PLAYBOOK** — fires for any feed of that playbook.
- **FEED** — fires for the specified feed regardless of which
  playbook(s) consume it. When the feed is shared across playbooks
  (e.g. via remix), the subscriber receives one push per playbook
  context, rendered with that playbook's display name.

Auth gating (public/paid/private) happens upstream in the gRPC layer —
callers must be able to read the target.

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

## Subscribe to a Feed

```bash
alva push-subscriptions subscribe-feed --username USER --name NAME
```

| Flag       | Type   | Required | Description                |
| ---------- | ------ | -------- | -------------------------- |
| --username | string | yes      | Feed owner's username      |
| --name     | string | yes      | URL-safe feed name         |

Idempotent. Fires for that specific feed regardless of which
playbook(s) consume it; if the feed is shared across playbooks the
subscriber receives one push per playbook context.

```bash
alva push-subscriptions subscribe-feed --username alice --name btc-ema-cross
# → {
#     "subscription": {
#       "target": {"type": "FEED", "id": "8117"},
#       "subscribed": true,
#       "created_at_ms": 1777355703123,
#       "updated_at_ms": 1777355703123
#     },
#     "feed_path": "/alva/home/alice/feeds/btc-ema-cross"
#   }
```

## Unsubscribe from a Feed

```bash
alva push-subscriptions unsubscribe-feed --username USER --name NAME
```

Soft-disable; same semantics as the playbook variant.

```bash
alva push-subscriptions unsubscribe-feed --username alice --name btc-ema-cross
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
| target.type   | string  | `"PLAYBOOK"` or `"FEED"`                                              |
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

- `NOT_FOUND` covers both "target does not exist" and "exists but the
  caller cannot read it" — by design (no namespace enumeration). Same
  for both playbook and feed routes.
- Push delivery still depends on the user having a connected channel
  (e.g. Telegram). If `telegram_username` is null on the user record
  (`alva user info`), push will silently no-op even when subscribed.
- Producer-side configuration (making a feed *capable* of pushing) is
  separate — see the "Post-release push notification flow" section of
  the main skill and `--push-notify` on `alva deploy`.
