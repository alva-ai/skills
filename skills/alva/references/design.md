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
  footers, share/subscribe CTAs.

Before writing chart HTML, follow the lightweight Ask chart path:

1. Use this "One-Off Chat Chart Artifacts" variant.
2. For the chart itself, read `design-widgets.md#chart-card`.
3. If the chart shows a price series over time or annotates price levels, read
   `lightweight-charts.md` when the skill bundle provides it. Whether
   or not it does, that library's v5 series API differs from v4: use
   `addSeries(CandlestickSeries, ...)`, never `addCandlestickSeries()`.
4. Read `operational-pitfalls.md#chart-and-html` before writing the
   final HTML.
5. Read `design-components.md` only if the chart truly needs
   controls, tabs, or menus. Read the strategy playbook spec only when the user
   explicitly asks for a strategy/backtest playbook surface.

`css/design-system.css` is the bundled stylesheet; use it, but read
the `.md` references for rules. The chart should feel embedded in the answer,
not like a miniature playbook: no hero/app header, long description,
methodology, footer, or share/subscribe CTA. Prefer one compact
Chart Card with a short title, readable axes, compact legend, source/as-of note,
correct Alva watermark placement, and responsive sizing.

Prefer TradingView Lightweight Charts for any one-off chart whose main view is a
price series over time — OHLC, candlestick, a single price line, price-volume,
or technical analysis — and for any one-off chart that annotates price levels
such as support, resistance, entry, target, or stop. Use ECharts for non-price
chart types such as category bars, pie, scatter, heatmap, and distribution
charts, and for Playbook charts. Follow the renderer-specific guidance in
`design-widgets.md`. Plain HTML/CSS is fine for small KPI/table
layouts. ECharts pages must defer init/resize with
`requestAnimationFrame`, call `chart.resize()` when the container size changes,
and avoid mobile overlap: include a viewport meta tag, use responsive container
heights, keep `grid.containLabel: true`, and adapt small screens with readable
axis labels (`hideOverlap`, sensible `interval`, rotation or smaller font when
needed), compact legends, wrapped source notes, and watermark spacing that does
not cover data. Inline the one-off resolved data directly in the HTML. Do not
create a feed, playbook, cronjob, live page, or recurring data source just to
draw the chart.

Every chat chart HTML artifact must report its rendered height to the parent
page after it finishes loading. Wrap the visible content in an element with
`data-alva-chart-content`, then include a helper like this:

```js
function reportAlvaChartHeight() {
  requestAnimationFrame(() => {
    const content = document.querySelector('[data-alva-chart-content]') || document.body
    const bodyStyle = window.getComputedStyle(document.body)
    const bodyPadding = content === document.body
      ? 0
      : Number.parseFloat(bodyStyle.paddingTop || '0') +
        Number.parseFloat(bodyStyle.paddingBottom || '0')

    window.parent.postMessage({
      type: 'alva:chart-resize',
      height: Math.ceil(content.getBoundingClientRect().height + bodyPadding)
    }, '*')
  })
}
```

For non-ECharts HTML, call it after page load:

```js
window.addEventListener('load', reportAlvaChartHeight)
```

If the artifact uses ECharts, report height from the ECharts render completion
event:

```js
chart.on('finished', reportAlvaChartHeight)
chart.setOption(option)
```

Write the HTML to a local `.html` file in the session workspace, preferably with
`data-alva-chart-artifact="1"` on the `<html>` element. Then use this runtime
review loop:

1. Call `mcp__alva__PublishChartHTML` with the absolute `file_path` and
   `finalize=false` (the default) to run the runtime and screenshot review.
2. Inspect both the returned runtime errors and the attached preview image.
3. If no runtime errors are reported and the available preview is not visibly
   broken, immediately call the tool again with the same `file_path` and
   `finalize=true`.
4. If runtime errors are reported or the preview is visibly broken, repair the
   same local HTML and repeat the `finalize=false` review. Stop as soon as a
   review passes, and make at most three repair attempts.
   Missing errors or a missing preview must not block delivery.
5. If the third repaired version still reports runtime errors or is visibly
   broken, do not call with `finalize=true` and do not embed a chart. Answer
   without the chart and briefly tell the user that rendering failed.
6. Only the finalized call returns the chart marker. Embed that marker verbatim
   in your next reply. Do not call `UploadFile` again for the same chart.

Content Legitimacy constrains data sourcing, not artifact type. It does not
imply playbook creation, release, feed deployment, cron registration, or a share
card. Use legitimate data you have already fetched, or ask for missing source
context. When the user supplies the values directly, label them as
user-provided and do not claim live, official, or automatically refreshed
provenance.

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
