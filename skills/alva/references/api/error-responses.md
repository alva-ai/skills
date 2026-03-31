# Error Responses

All errors return: `{"error":{"code":"...","message":"..."}}`

| HTTP Status | Code              | Meaning                            |
| ----------- | ----------------- | ---------------------------------- |
| 400         | INVALID_ARGUMENT  | Bad request or invalid path        |
| 401         | UNAUTHENTICATED   | Missing or invalid API key         |
| 403         | PERMISSION_DENIED | Access denied                      |
| 404         | NOT_FOUND         | File/directory not found           |
| 429         | RATE_LIMITED      | Rate limit / runner pool exhausted |
| 500         | INTERNAL          | Server error                       |
