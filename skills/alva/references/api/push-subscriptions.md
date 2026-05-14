# Push Subscriptions

Personal opt-in for DM/web push. Notification preferences are the source of
truth for delivery. Independent of social follow: subscribe ≠ follow,
unsubscribe ≠ unfollow. Following a playbook does not create or revive a push
subscription.

Two target types:

- **PLAYBOOK** — fires for alerts from feeds referenced by that playbook.
- **FEED** — fires for that one feed; if it's used by multiple
  playbooks (remix), the caller still receives one push per feed alert.

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

All commands are idempotent. Subscribe response includes the subscription row
and canonical ALFS path (`playbook_path` or `feed_path`).

```bash
alva push-subscriptions subscribe-feed --username alice --name btc-ema-cross
# → {
#     "subscription": {
#       "target": {"type": "FEED", "id": "8117"},
#       "created_at_ms": 1777355703123,
#       "updated_at_ms": 1777355703123
#     },
#     "feed_path": "/alva/home/alice/feeds/btc-ema-cross"
#   }
```

## List

```bash
alva push-subscriptions list [--first N] [--cursor TOKEN]
```

Returns the caller's currently active personal feed push subscriptions. Use
`--first` and `--cursor` for cursor pagination.

Row shape includes `target`, `created_at_ms`, `updated_at_ms`, `cursor`, and
feed metadata when available (`feed_name`, `feed_status`, `last_pushed_at_ms`,
`used_by`, `used_by_total`).

## Notes

- `NOT_FOUND` covers both "doesn't exist" and "exists but caller can't
  read it" (no namespace enumeration).
- Push delivery always supports Alva web notifications. External DM delivery
  requires `active_channel` to be `telegram` or `discord` with the matching
  `telegram_username` or `discord_username` set.
- Producer side (making a feed *capable* of pushing) is separate — see
  Section 9 of SKILL.md and `--push-notify` on `alva deploy`. Enabling
  `--push-notify` does not subscribe any user or group.
