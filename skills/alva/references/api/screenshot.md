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

Response: **raw image data** (`Content-Type: image/png`). **Never use the
Read tool on screenshot files** — they are binary images that cannot be
processed in conversation.

```bash
source ~/.alva.env && curl -s -o /tmp/screenshot.png \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  "$ALVA_ENDPOINT/api/v1/screenshot?url=<target-url>"
```

---

## Render Verification

Full-page screenshot to verify the playbook renders correctly. Used in
the release flow (Step 3) after writing HTML and creating the draft.

```bash
source ~/.alva.env && curl -s -o /tmp/playbook-verify.png \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  "$ALVA_ENDPOINT/api/v1/screenshot?url=$ALVA_ENDPOINT/u/<username>/playbooks/<playbook_name>"
```

Check the result with `file /tmp/playbook-verify.png`:
- `PNG image data` → rendering is fine, proceed.
- Anything else → `cat` the file to read the error, fix the HTML, and
  retry.

---

## Highlight Preview

Pick the single most visually compelling section of the playbook
(e.g. primary chart, key metric cards) and upload it to ALFS as a
preview image. The frontend reads this automatically. Used in the
release flow (Step 4).

Choose the element that best tells the playbook's story at a glance.
Use the `selector` parameter to target it. Aim for 16:9 aspect ratio.

```bash
# 1. Screenshot the highlight
source ~/.alva.env && curl -s -o /tmp/preview.png \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  "$ALVA_ENDPOINT/api/v1/screenshot?url=$ALVA_ENDPOINT/u/<username>/playbooks/<playbook_name>&selector=<css-selector>"

# 2. Upload to ALFS
source ~/.alva.env && curl -s -X POST \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  --data-binary @/tmp/preview.png \
  "$ALVA_ENDPOINT/api/v1/fs/write?path=~/playbooks/<name>/previews/highlight.png&mkdir_parents=true"

# 3. Grant public read
source ~/.alva.env && curl -s -X POST \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/json" \
  "$ALVA_ENDPOINT/api/v1/fs/grant" \
  -d '{"path":"~/playbooks/<name>/previews","subject":"special:user:*","permission":"read"}'
```
