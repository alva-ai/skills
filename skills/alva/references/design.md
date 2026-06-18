# Alva Design System

> ⚠️ **The ```css blocks in this file — together with design-components.md and
> design-widgets.md — are the source of truth for
> [css/design-system.css](./css/design-system.css) (published to CDN).**
> When you edit any ```css block in any of those three files, commit the matching
> regenerated `design-system.css` alongside your `.md` edit. CI doc-sync catches
> drift.

This file is the global entry point for Alva design rules — tokens, typography,
theme, and page-level layout. Read this first, then follow the reading path at
the bottom for widget and component specs.

## Design Tokens

- **Generating playbook HTML** → put this in `<head>`. It loads tokens + global
  rules + components + widgets, so no per-playbook CSS is needed:

  ```html
  <link rel="stylesheet" href="https://alva-ai-static.b-cdn.net/design-system/v1/design-system.css" />
  ```

- **Need a token's exact value** (px / hex) → Read
  [design-tokens.css](./design-tokens.css). It is an authoring-time lookup
  reference only — never `<link>` it into the page.
- **Always** style via `var(--token-name)` — never hardcode hex or rgba values.

(Legacy playbooks that link only the old `design-tokens.css` URL still pass the
linter, but new ones use the v1 bundle above.)

Token quick reference:

| Category     | Tokens                                         | Notes                                   |
| ------------ | ---------------------------------------------- | --------------------------------------- |
| Brand        | `--main-m1` ~ `--main-m7`                      | m3=Bullish, m4=Bearish                  |
| Chart colors | `--chart-{color}-main/1/2`                     | Grey only when ≥ 3 series               |
| Text         | `--text-n9/n7/n5/n3/n2`                        | n9=primary, n7=secondary, n5=supporting |
| Background   | `--b0-page`, `--grey-g01`~`g7`                 | g01 for card backgrounds                |
| Line         | `--line-l05/l07/l12/l2/l3/l9`                  | l12=default (0.5px), l9=hover/active     |
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
if any error-severity finding fires. See
[playbook-creation.md - Release](./playbook-creation.md#release).

## Typography & Font

The v1 bundle already ships all font wiring — `@font-face`, the global `body`
font-family, and anti-aliasing. **If you `<link>` the bundle, do not rewrite any
of it.** The fenced CSS blocks in this section are the bundle's generation source
(and a fallback reference for legacy inline playbooks), not snippets to paste
into a new playbook.

You only need to follow these rules:

1. **Font** — Delight is the default; backups `-apple-system`, `OPPO Sans 4.0`,
   `BlinkMacSystemFont`, `sans-serif`.
2. **Weight** — Regular (400) and Medium (500) only; Semibold (600) and Bold
   (700) are prohibited. At **≥ 24px use Regular (400) only** (see table):

| Font Size  | Font Weight                 | Font File Path                                                                                                                                                       |
| ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| < 24px     | Regular(400) or Medium(500) | [Delight-Regular.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Regular.ttf) or [Delight-Medium.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Medium.ttf) |
| **≥ 24px** | **Regular(400) only**       | [Delight-Regular.ttf](https://alva-ai-static.b-cdn.net/fonts/Delight-Regular.ttf)                                                                                    |

### What the bundle ships (reference — don't hand-copy)

`@font-face` for the Delight TTFs (served from the CDN):

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

A global `body` font-family, so bare `<div>` / `<p>` / headings outside
components also inherit Delight:

```css
body {
  font-family: "Delight", -apple-system, "OPPO Sans 4.0",
    BlinkMacSystemFont, sans-serif;
}
```

Anti-aliasing on `body`:

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

## Links

**Every `<a>` tag must include `target="_blank"` and `rel="noopener noreferrer"`.**

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Example</a>
```

## Theme

**The page background color must use `--b0-page`**

**Light mode only**

## One-Off Chat Chart Artifacts

For Ask / answer-only chart HTML embedded in chat, keep the artifact compact —
do not build a miniature playbook. Put the analysis in the chat answer; keep the
HTML focused on the chart.

**Default shape:** one [Chart Card](./design-widgets.md#chart-card), optionally
1-2 KPI chips, and a short source/as-of note.

- **Include** — Alva tokens, Delight typography, Chart Card styling, source/as-of
  labeling, and the required `.alva-watermark` (both per
  [design-widgets.md](./design-widgets.md#chart-card)).
- **Omit** — app headers, hero sections, long descriptions, methodology blocks,
  creator notes, footers, share/subscribe CTAs.

## Playbook Container

### Hosted Shell Boundary

**Do not render app-level chrome inside the iframe.** The hosted shell already
provides the playbook title, description, last-updated metadata, automation entry
points, and share/open controls — repeating them duplicates the shell.

- **Start** with the first useful in-playbook region: tabs, filters, KPIs,
  charts, tables, status rows, or analysis sections.
- **Keep** section/widget titles and scoped freshness labels — those are fine.
- **Add custom chrome only** when the user explicitly asks, or a blueprint
  requires a distinct app-level header.

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
