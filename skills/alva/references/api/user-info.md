# User Info

```bash
alva whoami
```

Returns the authenticated user's profile.

| Field               | Type   | Description                                                    |
| ------------------- | ------ | -------------------------------------------------------------- |
| id                  | int64  | User ID                                                        |
| username            | string | Username                                                       |
| subscription_tier   | string | `"free"` or `"pro"`. Determines release flow and feature gates |
| telegram_username   | string | Telegram username if connected, otherwise `null`               |

```bash
alva whoami
# → {"id":1, "subscription_tier":"free", "telegram_username":"alice_tg", "username":"alice"}
```
