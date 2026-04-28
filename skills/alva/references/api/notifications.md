# Notifications

Read the caller's notification history scoped to a playbook or feed.
Cursor pagination over `(created_at, id)`.

## List Playbook Notifications

```bash
alva notifications list-playbook --username USER --name NAME [--channel C] [--status S] [--since SEC] [--first N] [--cursor TOKEN]
```

Returns notifications sent to the caller for `(username, name)`. The
playbook must be `public` or `paid`.

| Flag       | Type   | Required | Description                                |
| ---------- | ------ | -------- | ------------------------------------------ |
| --username | string | yes      | Playbook owner's username                  |
| --name     | string | yes      | URL-safe playbook name                     |
| --channel  | string | no       | `telegram` / `web` / ...                   |
| --status   | string | no       | `sent` / `failed` / `filtered`             |
| --since    | int64  | no       | Unix seconds; only newer than this         |
| --first    | int32  | no       | Page size, default 50, max 200             |
| --cursor   | string | no       | Token from previous page's `next_cursor`   |

Response:

| Field         | Type   | Description                                                |
| ------------- | ------ | ---------------------------------------------------------- |
| items         | array  | Notification rows                                          |
| next_cursor   | string | Token for the next page; empty when done                   |
| playbook_path | string | `/alva/home/<username>/playbooks/<name>`                   |

Each row:

| Field       | Type   | Description                                          |
| ----------- | ------ | ---------------------------------------------------- |
| id          | string | Notification ID                                      |
| event_type  | string | E.g. `playbook_data_ready`, `feed_run_complete`      |
| user_id     | string | Recipient user ID                                    |
| channel     | string | Delivery channel                                     |
| status      | string | `sent` / `failed` / `filtered`                       |
| created_at  | int64  | Unix seconds                                         |
| message     | string | Rendered body (omitted if empty)                     |
| error_msg   | string | Delivery error (only when `status == "failed"`)      |
| playbook_id | string | Present when notification is playbook-scoped         |
| feed_id     | string | Present when notification is feed-scoped             |

```bash
alva notifications list-playbook --username alice --name btc-dashboard --first 5
# → {
#     "items": [{"id":"24463","event_type":"feed_run_complete","status":"sent",
#                "created_at":1777355703,"message":"...","feed_id":"8117", ...}, ...],
#     "next_cursor": "MTc3NzM1NTU4MjIzOTc5NzoyNDQ1OA==",
#     "playbook_path": "/alva/home/alice/playbooks/btc-dashboard"
#   }
```

## List Feed Notifications

```bash
alva notifications list-feed --username USER --name NAME [--channel C] [--status S] [--since SEC] [--first N] [--cursor TOKEN]
```

Same shape as above, scoped to a feed. Authorization is alfs read on
`/alva/home/<username>/feeds/<name>`. Response uses `feed_path`
instead of `playbook_path`.

```bash
alva notifications list-feed --username alice --name btc-ema --first 5 --status sent
# → {"items": [...], "next_cursor": "...", "feed_path": "/alva/home/alice/feeds/btc-ema"}
```

`NOT_FOUND` covers both "slug doesn't exist" and "slug exists but
caller can't see it" — by design (no namespace enumeration).
