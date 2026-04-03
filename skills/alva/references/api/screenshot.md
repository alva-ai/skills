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

```bash
curl -sf -o /tmp/screenshot.png "$ALVA_ENDPOINT/api/v1/screenshot?url=..."
```

After saving, validate before reading:

```bash
head -c4 /tmp/screenshot.png | grep -q PNG || echo "SCREENSHOT_FAILED"
```

Only `Read` the file if it passes. A failed screenshot may save a JSON error
as `.png` — reading it corrupts the session history.
