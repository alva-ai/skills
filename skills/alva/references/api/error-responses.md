# Error Responses

All `alva` CLI errors surface the underlying API error as JSON:
`{"error":{"code":"...","reason":"...","message":"...","status":409,"type":"https://alva.ai/problems/...","requiredPermission":"...","invalidParams":[{"name":"...","reason":"..."}],"retryAfter":30}}`.
On `/api/v2` the API answers a problem (`application/problem+json`) with
`type`, `title`, `status`, `detail` (the CLI's `message`), `code`, `reason`,
`requiredPermission`, `invalidParams` (the rejected parameters) and
`retryAfter` (seconds); the CLI leaves out the members the API sent as null.

`code` is coarse (table below). `reason`, when present, is the finer cause:
an UPPER_SNAKE value from the public list in the `Problem` schema of
`GET /api/v2/openapi.json`. Decide on `reason` first, then `code`; never on
`message` or `type`.

| HTTP Status | Code                    | Meaning                                   |
| ----------- | ----------------------- | ----------------------------------------- |
| 400         | INVALID_ARGUMENT        | Bad request, invalid path or malformed ID |
| 401         | UNAUTHENTICATED         | Missing or invalid API key                |
| 403         | INSUFFICIENT_PERMISSION | The credential lacks `requiredPermission` |
| 403         | PERMISSION_DENIED       | Access denied                             |
| 403         | CREDENTIAL_NOT_ACCEPTED | This credential cannot call the route     |
| 404         | NOT_FOUND               | Not found                                 |
| 409         | CONFLICT                | Changed or conflicting state              |
| 413         | REQUEST_TOO_LARGE       | Request body too large                    |
| 422         | INVALID_ARGUMENT        | Reason `IDEMPOTENCY_KEY_REUSED` (below)   |
| 429         | RATE_LIMITED            | Rate limit / runner pool exhausted        |
| 500         | INTERNAL                | Server error                              |
| 503         | UNAVAILABLE             | Temporarily unavailable; retry later      |
| 504         | DEADLINE_EXCEEDED       | The request timed out                     |

Reasons to act on:

- `INSUFFICIENT_CREDITS` (409): the balance does not cover the call. Tell the
  user; retrying does not help.
- `QUOTA_EXCEEDED` (429): a rate limit; wait at least `retryAfter` seconds.
  `CONCURRENCY_LIMIT_EXCEEDED` (429): too many runs at once; wait for one to
  finish.
- `IDEMPOTENCY_KEY_REUSED` (422): a request ID was sent again with a different
  payload. A changed intent needs a new request ID; nothing ran.
- `PAGE_TOKEN_INVALID` (400): a page token was sent with other filters, by
  another caller, or after 24 hours. Restart the list from its first page.
- `EXECUTION_DEPTH_EXCEEDED` (403): runs started by runs are nested too deep;
  do not start another nested run.
- `PAID_RENEWALS_END_CONFIRMATION_REQUIRED` (409): the change ends paid
  renewals. Ask the user; only with their confirmation repeat it with
  `--confirm-end-paid-renewals`.

The CLI already retries a network error, `IDEMPOTENCY_KEY_IN_USE`, a 429 with
a short `retryAfter` and 502-504, with the same request ID; do not loop on
them. `INSUFFICIENT_PERMISSION` does not change on retry: a sandbox or
runtime key never holds `trading_limits:write`, so raising or lifting a
trading risk limit must be done by the user in Alva. Report it
instead of retrying.
