# Screenshot

Capture a full-page screenshot of any Alva page.

```
GET /api/v1/screenshot?url={url}
```

| Parameter | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| url       | string | yes      | Target URL (use `$ALVA_ENDPOINT` as the base) |

Auth: `X-Alva-Api-Key` header (required for authenticated content).

Response: **raw image data** (`Content-Type: image/png`). Save directly
to a file.

```
# Full-page screenshot
GET /api/v1/screenshot?url=$ALVA_ENDPOINT/u/alice/playbooks/btc-dashboard
→ (raw PNG bytes)
```

Save to a file with `curl -sf -o screenshot.png` (`-f` fails on HTTP errors
instead of saving the error response as the file). Check the exit code before
reading the file.
