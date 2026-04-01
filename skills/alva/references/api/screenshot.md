# Screenshot

Capture a screenshot of any Alva page.

```
GET /api/v1/screenshot?url={url}&selector={selector}
```

| Parameter | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| url       | string | yes      | Target URL (use `$ALVA_ENDPOINT` as the base) |
| selector  | string | no       | CSS selector to capture a specific element    |
| xpath     | string | no       | XPath expression to capture a specific element |

Auth: `X-Alva-Api-Key` header (required for authenticated content).

Response: **raw image data** (`Content-Type: image/png`). Save directly
to a file.

```
# Full-page screenshot
GET /api/v1/screenshot?url=$ALVA_ENDPOINT/u/alice/playbooks/btc-dashboard
→ (raw PNG bytes)

# Specific element
GET /api/v1/screenshot?url=$ALVA_ENDPOINT/u/alice/playbooks/btc-dashboard&selector=.chart-container
→ (raw PNG bytes)
```

Save to a file with `curl -s -o screenshot.png`, then view or present the path
to the user.
