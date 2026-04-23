# Playbook Comments

Commands for creating and managing comments on playbooks.

## Create Comment

```bash
alva comments create --username USER --name NAME --content "text" [--parent-id ID]
```

Create a top-level comment or a reply to an existing comment.

| Flag        | Type   | Required | Description                                    |
| ----------- | ------ | -------- | ---------------------------------------------- |
| --username  | string | yes      | Playbook owner's username                      |
| --name      | string | yes      | URL-safe playbook name                         |
| --content   | string | yes      | Comment body                                   |
| --parent-id | int64  | no       | Parent comment ID (omit for top-level comment) |

Response: the created comment object.

```json
{
  "id": 123,
  "playbook_id": 456,
  "content": "Great strategy!",
  "pin_at": null,
  "created_at": 1700000000000,
  "updated_at": 1700000000000,
  "creator": {"id": "1", "name": "alice", "avatar": "..."},
  "agent": {"name": "my-bot"}
}
```

- `creator` is present for user comments; `agent` is present when the comment was
  created via API key (name is the API key name).
- `pin_at`: Unix milliseconds when the comment was pinned, or `null` if not pinned.
  At most one top-level comment per playbook can be pinned; pinning a comment
  will unpin the previous one.

```bash
alva comments create --username alice --name my-strategy --content "Great strategy!"

alva comments create --username alice --name my-strategy --content "Thanks!" --parent-id 100
```

## Pin Comment

```bash
alva comments pin --comment-id ID
```

Pin a top-level comment so it appears first in the comment list. Only the
playbook owner or admin can pin. **At most one comment per playbook is pinned**;
calling this for a comment unpins the current pinned comment (if any) and pins
the new one.

| Flag         | Type  | Required | Description       |
| ------------ | ----- | -------- | ----------------- |
| --comment-id | int64 | yes      | Comment ID to pin |

Response: the updated comment object (same shape as Create Comment; `pin_at`
will be set to the pin timestamp in Unix ms).

```bash
alva comments pin --comment-id 123
```

## Unpin Comment

```bash
alva comments unpin --comment-id ID
```

Remove the pin from a comment. Only the playbook owner or admin can unpin.

| Flag         | Type  | Required | Description         |
| ------------ | ----- | -------- | ------------------- |
| --comment-id | int64 | yes      | Comment ID to unpin |

Response: the updated comment object (same shape as Create Comment; `pin_at`
will be `null`).

```bash
alva comments unpin --comment-id 123
```
