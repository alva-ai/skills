# Alva Design System

This file is the global entry point for Alva design rules — tokens, typography,
theme, and page-level layout. Read this first, then follow the reading path at
the bottom for widget and component specs.

## Design Tokens

Full token definitions (colors, spacing, radius, theme) are in
[design-tokens.css](./design-tokens.css). Always read that file for exact
token values.

In generated HTML, link the canonical design-system stylesheet from the CDN.
**For new playbooks, use the v1 bundle** — one file contains tokens + global
rules + components + widgets:

```html
<link rel="stylesheet" href="https://alva-ai-static.b-cdn.net/design-system/v1/design-system.css" />
```

Existing playbooks that only link the legacy `design-tokens.css` URL continue
to work (the linter accepts both forms). For new playbooks, prefer the v1
bundle so component and widget CSS comes from the CDN instead of inlined per
playbook.

Always reference tokens via `var(--token-name)` — never hardcode hex or rgba
values. Below is a quick reference:

| Category     | Tokens                                         | Notes                                   |
| ------------ | ---------------------------------------------- | --------------------------------------- |
| Brand        | `--main-m1` ~ `--main-m7`                      | m3=Bullish, m4=Bearish                  |
| Chart colors | `--chart-{color}-main/1/2`                     | Grey only when ≥ 3 series               |
| Text         | `--text-n9/n7/n5/n3/n2`                        | n9=primary, n7=secondary, n5=supporting |
| Background   | `--b0-page`, `--grey-g01`~`g7`, `--b-r02`~`r1` | g01 for card backgrounds                |
| Line         | `--line-l05/l07/l12/l2/l3`                     | l07=default                             |
| Shadow       | `--shadow-xs/s/l`                              | Floating surfaces only (dropdown/tooltip) |
| Spacing      | `--spacing-xxxs`(2) ~ `--spacing-xxxxxxl`(56)  | Common: xs=8, m=16, xl=24               |
| Radius       | `--radius-ct-min`(2) ~ `--radius-ct-max`(960)  | min=Tag, s=Card, l=Page                 |

## Design Contract

The Alva design system is also expressed as a machine-readable contract for
the **design linter** that runs inside `alva release playbook`:

- [design-contract.yaml](./design-contract.yaml) — token-free contract: the
  required global container, scroll/typography/link rules, and the registered
  components (root class, variants, sizes, states, bindings).
- [css/design-system.css](./css/design-system.css) — the canonical CSS bundle
  (tokens + globals + components + widgets) generated from this doc's
  fenced CSS blocks plus design-components.md / design-widgets.md. Published
  to the CDN; new playbooks `<link>` it to get all canonical styling.

The linter is shipped in the `alva` CLI and runs as a hard gate. To pre-check
a playbook before release:

```bash
alva lint playbook ./index.html
```

`alva release playbook` runs the same lint internally and refuses to release
if any error-severity finding fires. See SKILL.md §7 Release.

## Typography & Font

### General Rules

1. **The default font for Alva must be Delight**;
2. Backup fonts: `-apple-system`, `OPPO Sans 4.0`, `BlinkMacSystemFont`, `sans-serif`;

### Font Weight

The font weight for Alva is limited to Regular (400) and Medium (500), and the
use of Semibold (600) or Bold (700) is prohibited.

| Font Size  | Font Weight                 | Font File Path                                                                                                                                                       |
| ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| < 24px     | Regular(400) or Medium(500) | [Delight-Regular.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Regular.ttf) or [Delight-Medium.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Medium.ttf) |
| **≥ 24px** | **Regular(400) only**       | [Delight-Regular.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Regular.ttf)                                                                                    |

### Font Loading

The Delight TTFs are served from the static CDN. The bundle ships
`@font-face` declarations so a single `<link>` to `design-system.css` is
enough — playbooks do not need to add their own `@font-face`:

```css
@font-face {
  font-family: "Delight";
  src: url("https://alva-ai-static.b-cdn.net/fonts/Delight-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Delight";
  src: url("https://alva-ai-static.b-cdn.net/fonts/Delight-Medium.ttf") format("truetype");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
```

### Global Font Family

The bundle sets `font-family` on registered component classes (e.g.
`.btn`, `.tab-item`, `.markdown-container`). Free-flowing HTML outside
components — bare `<div>`, `<p>`, ad-hoc headings — needs an explicit
`body` rule so the cascade carries Delight everywhere:

```css
body {
  font-family: "Delight", -apple-system, "OPPO Sans 4.0",
    BlinkMacSystemFont, sans-serif;
}
```

### Anti-aliasing Standards

Include these anti-aliasing declarations in generated styles (globally, or on
any text container):

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

- If the project already has a global reset or typography base class, ensure the
  above properties are included; no need to redeclare them within components.

## Links

**Every `<a>` tag must include `target="_blank"` and `rel="noopener noreferrer"`.**

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Example</a>
```

## Theme

**The page background color must use `--b0-page`**

**Default mode** → Light Mode

## Playbook Container

### Hosted Shell Boundary

Playbook HTML renders inside an iframe owned by the Alva hosted shell. The
outer shell already provides the playbook title, description, last-updated
metadata, automation entry points, and share/open controls. By default, do not
repeat that chrome inside the iframe; start with the first useful in-playbook
region such as tabs, filters, KPIs, charts, tables, status rows, or analysis
sections. Section/widget titles and scoped freshness labels are fine. Add
custom in-iframe chrome only when the user explicitly asks for it or a
blueprint requires a distinct app-level header.

### Page-Level Scroll Rule

Playbook HTML runs inside an iframe. The **only** element that may carry
page-level vertical scroll is `<body>`:

```css
html {
  height: 100%;
  overflow: hidden;
}
body {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
```

**Rules:**
1. `<body>` is the sole page-level scroll container — never add
   `overflow-y: auto/scroll` to `.playbook-container`, `.main-wrapper`, or any
   other outer wrapper.
2. Inner widget scroll (table/feed body) is allowed per widget spec, but must
   not compete with the page scroll.
3. `position: sticky` elements (e.g. `.tab-bar-wrapper`) anchor to the `<body>`
   scroll context — this only works when body is the scroller.

```css
* {
  box-sizing: border-box;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
*::-webkit-scrollbar {
  display: none;
}

.playbook-container {
  width: 100%;
  margin: 0 auto;
  padding: var(--spacing-s) var(--spacing-xxl) var(--spacing-xxxxl);
  /* max-width: 2048px; */
}

@media (max-width: 768px) {
  .playbook-container {
    padding: var(--spacing-m);
  }
}
```

## Usage — Read only what you need

1. **Generating a widget or chart** → read
   [design-widgets.md](./design-widgets.md)
2. **Using a component** (Button, Tag, Dropdown, Tab, etc.) → read
   [design-components.md](./design-components.md)
3. **Building a Trading Strategy Playbook** → read
   [design-playbook-trading-strategy.md](./design-playbook-trading-strategy.md).
   This spec defines the complete page structure, tab layout, module order,
   component usage, and data schema.
4. **Only need global rules** → stay in this file. Open
   [design-tokens.css](./design-tokens.css) only when you need exact token
   values.
