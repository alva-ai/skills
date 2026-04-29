# Push Subscriptions

Personal opt-in for DM/web push. Independent of social follow:
subscribe ≠ follow, unsubscribe ≠ unfollow. Following a playbook
elsewhere compound-subscribes (and revives a previously-unsubscribed
row).

Two target types:

- **PLAYBOOK** — fires for any feed of that playbook.
- **FEED** — fires for that one feed; if it's used by multiple
  playbooks (remix), one push per playbook context.

Auth: caller must be able to read the target (gated upstream).

## Subscribe / Unsubscribe

```bash
alva push-subscriptions subscribe-playbook   --username USER --name NAME
alva push-subscriptions unsubscribe-playbook --username USER --name NAME
alva push-subscriptions subscribe-feed       --username USER --name NAME
alva push-subscriptions unsubscribe-feed     --username USER --name NAME
```

| Flag       | Required | Description                              |
| ---------- | -------- | ---------------------------------------- |
| --username | yes      | Target owner's username                  |
| --name     | yes      | URL-safe playbook or feed name           |

All idempotent. Unsubscribe is soft (row preserved, `subscribed: false`)
so re-subscribe restores seniority. Subscribe response includes the
canonical alfs path (`playbook_path` or `feed_path`).

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

## List

```bash
alva push-subscriptions list [--include-history]
```

`--include-history` also returns rows the caller previously
unsubscribed (default: active rows only).

Row shape: `{ target: {type, id}, subscribed, created_at_ms, updated_at_ms }`.

## Notes

- `NOT_FOUND` covers both "doesn't exist" and "exists but caller can't
  read it" (no namespace enumeration).
- Push delivery requires a connected channel (e.g. Telegram). Without
  `telegram_username` on the user record, push silently no-ops.
- Producer side (making a feed *capable* of pushing) is separate — see
  Section 9 of SKILL.md and `--push-notify` on `alva deploy`.
