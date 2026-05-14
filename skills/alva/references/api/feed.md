# Feed

Lifecycle management for already-released feeds. Use `alva release feed`
to create them ([release.md](release.md)); use the commands here for the
rest of the lifecycle. All commands are under `alva feed`.

## Delete Feed

```
alva feed delete --id FEED_ID
```

Soft-delete a feed and all its active majors. Returns the deleted feed
id on success.

| Flag | Type | Required | Description |
| --- | --- | --- | --- |
| --id | int64 | yes | Numeric feed id (positive integer) |

Cascade behavior:

- All active `feed_majors` for the feed are soft-deleted in the same
  database transaction as the feed row.
- The producer cronjob attached to each major is removed best-effort
  (Hatchet trigger removal is not transactional). If the cronjob removal
  fails, the cronjob scavenger reconciles the leftover row on its next
  sweep — no manual cleanup needed.

Auth: the caller must own the feed (uid match), enforced by the
backend. Calling on a feed you do not own returns
`{"error":{"code":"PERMISSION_DENIED",...}}`.

```
alva feed delete --id 100
→ {"id": "100"}
```

Error responses follow the shared envelope in
[error-responses.md](error-responses.md). Common cases:

| HTTP | code | When |
| --- | --- | --- |
| 400 | `INVALID_ARGUMENT` | `--id` missing, non-numeric, zero, or negative |
| 403 | `PERMISSION_DENIED` | feed exists but is owned by another user |
| 404 | `NOT_FOUND` | no feed with that id exists |
