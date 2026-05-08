# User Info

```bash
alva whoami
```

Returns the authenticated user's profile.

| Field               | Type   | Description                                                       |
| ------------------- | ------ | ----------------------------------------------------------------- |
| id                  | int64  | User ID                                                           |
| username            | string | Username                                                          |
| subscription_tier   | string | `"free"` or `"pro"`. Determines release flow and feature gates    |
| active_channel      | string | `"telegram"`, `"discord"`, or null; controls external DM delivery |
| telegram_username   | string | Telegram display if connected, otherwise empty                    |
| discord_username    | string | Discord display if connected, otherwise empty                     |
| home_path           | string | Caller's alfs home directory (`/alva/home/<username>`)            |

```bash
alva whoami
# → {"id":1, "username":"alice", "subscription_tier":"free", "active_channel":"discord", "telegram_username":"alice_tg", "discord_username":"alice", "home_path":"/alva/home/alice"}
```
