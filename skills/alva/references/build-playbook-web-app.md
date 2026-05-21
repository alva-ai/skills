# Build Playbook Web App

Use this reference before writing or rewriting playbook HTML. It owns the
HTML-build gate, live-data requirement, and browser-safe ALFS read pattern for
published playbooks.

## Before HTML Work

<HARD-GATE id="before-build-html">
Before writing or rewriting playbook HTML, read the applicable design guidance
for this session.

Required evidence:

- [design-system.md](design-system.md) has been read first.
- The relevant companion reference has been read when applicable:
  [design-widgets.md](design-widgets.md) for widget layouts,
  [design-components.md](design-components.md) for component details, and
  [design-playbook-trading-strategy.md](design-playbook-trading-strategy.md)
  for strategy/backtest playbooks.
- If a `/use-skill:` blueprint or template is active, its layout and data
  contract have been read before HTML work starts.

If this evidence is missing, stop and read the required design/reference file
before creating or editing HTML. Do not rely on memory of prior sessions.
</HARD-GATE>

## Build Rules

After your data pipelines are deployed and producing data, build the
playbook's web interface. Create HTML5 pages with Alva Design System that read
from Alva's data gateway and visualize the results. Follow the Alva Design
System for styling, layout, and component guidelines. Unless the user
explicitly asks for a static snapshot, default to a live playbook.

Apply the [Content Legitimacy Rules](../SKILL.md#content-legitimacy-rules)
when building the UI. All quantitative data in charts, tables, or metric cards
must come from feed outputs read at runtime. Never hardcode quantitative data
as inline JavaScript literals in playbook HTML.

## Browser-Safe Feed Reads

Use this helper for published playbook HTML:

```javascript
const PUBLIC_ALFS_READ_URL = "https://api-llm.prd.alva.ai/api/v1/fs/read?path=";

async function readAlfsJson(path) {
  const resp = await fetch(PUBLIC_ALFS_READ_URL + encodeURIComponent(path));
  if (!resp.ok) {
    throw new Error(`Failed to load ${path}: HTTP ${resp.status}`);
  }
  return resp.json();
}
```

`$ALVA_ENDPOINT` is available to sandbox scripts and CLI verification only. Do
not emit it into browser HTML; published HTML must call the public read gateway
above so anonymous viewers can load feed output without authentication.
