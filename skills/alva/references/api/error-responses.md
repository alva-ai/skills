# Error Responses

All `alva` CLI errors surface the underlying API error as JSON:
`{"error":{"code":"...","message":"...","status":403,"requiredPermission":"..."}}`.
`requiredPermission`, `invalidParams` (the rejected parameters) and
`retryAfter` (seconds) appear only when the API sends them.

| HTTP Status | Code                    | Meaning                                   |
| ----------- | ----------------------- | ----------------------------------------- |
| 400         | INVALID_ARGUMENT        | Bad request, invalid path or malformed ID |
| 401         | UNAUTHENTICATED         | Missing or invalid API key                |
| 403         | INSUFFICIENT_PERMISSION | The credential lacks `requiredPermission` |
| 403         | PERMISSION_DENIED       | Access denied                             |
| 404         | NOT_FOUND               | Not found                                 |
| 409         | CONFLICT                | Changed or conflicting state              |
| 429         | RATE_LIMITED            | Rate limit / runner pool exhausted        |
| 500         | INTERNAL                | Server error                              |
| 503         | UNAVAILABLE             | Temporarily unavailable; retry later      |

The HTTP status codes reflect the underlying API errors that the CLI surfaces.
The error code and message fields are the primary values to check when handling
errors programmatically. `INSUFFICIENT_PERMISSION` does not change on retry: a
sandbox or runtime key never holds `trading_limits:write`, so raising or
lifting a trading risk limit must be done by the user in Alva. Report it
instead of retrying.
