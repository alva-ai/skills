# Error Responses

All `alva` CLI errors surface the underlying API error as JSON:
`{"error":{"code":"...","message":"..."}}`

| HTTP Status | Code              | Meaning                            |
| ----------- | ----------------- | ---------------------------------- |
| 400         | INVALID_ARGUMENT  | Bad request or invalid path        |
| 401         | UNAUTHENTICATED   | Missing or invalid API key         |
| 403         | PERMISSION_DENIED | Access denied                      |
| 404         | NOT_FOUND         | File/directory not found           |
| 429         | RATE_LIMITED      | Rate limit / runner pool exhausted |
| 500         | INTERNAL          | Server error                       |

The HTTP status codes reflect the underlying API errors that the CLI surfaces.
The error code and message fields are the primary values to check when handling
errors programmatically.
