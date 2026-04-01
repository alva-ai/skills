# Screenshot

Capture a screenshot of any Alva page. The endpoint is under `/api/v1/`.

```
GET /api/v1/screenshot?url={url}&selector={selector}
```

| Parameter | Type   | Required | Description                                   |
| --------- | ------ | -------- | --------------------------------------------- |
| url       | string | yes      | Target URL (use `$ALVA_ENDPOINT` as the base)  |
| selector  | string | no       | CSS selector to capture a specific element     |
| xpath     | string | no       | XPath expression to capture a specific element |

Auth: pass `X-Alva-Api-Key` header so the screenshot service can render
authenticated content (dashboards, private playbooks, etc.).

Response:

```json
{"url":"https://alva-ai-static.b-cdn.net/prd/avatar/<id>.png","urls":["..."],"type":"fullpage"}
```

## Examples

```
# Screenshot a playbook page
GET /api/v1/screenshot?url=$ALVA_ENDPOINT/u/alice/playbooks/btc-dashboard

# Screenshot a specific chart element
GET /api/v1/screenshot?url=$ALVA_ENDPOINT/u/alice/playbooks/btc-dashboard&selector=.chart-container
```

```bash
# curl example
curl -s -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  "$ALVA_ENDPOINT/api/v1/screenshot?url=$ALVA_ENDPOINT/u/alice/playbooks/btc-dashboard"
```
