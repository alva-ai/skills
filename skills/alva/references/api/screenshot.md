# Screenshot

Capture a full-page screenshot of any Alva page.

```bash
alva screenshot --url URL --out FILE [--selector CSS] [--xpath XPATH]
```

| Flag       | Type   | Required | Description                                    |
| ---------- | ------ | -------- | ---------------------------------------------- |
| --url      | string | yes      | Target URL (use `$ALVA_ENDPOINT` as the base)  |
| --out      | string | yes      | Local file path to save the PNG screenshot     |
| --selector | string | no       | CSS selector to capture a specific element     |
| --xpath    | string | no       | XPath expression to capture a specific element |

The CLI saves the screenshot directly to the specified file.

```bash
alva screenshot --url "$ALVA_ENDPOINT/playbook/alice/my-strategy" --out /tmp/screenshot.png
```

After saving, validate before reading:

```bash
head -c4 /tmp/screenshot.png | grep -q PNG || echo "SCREENSHOT_FAILED"
```

Only `Read` the file if it passes. A failed screenshot may save a JSON error
as `.png` — reading it corrupts the session history.
