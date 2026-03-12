# Widget Design Guideline

## Widget Types

- [Critical Rules (TL;DR)](#critical-rules-tldr)
- [Widget General Guideline](#widget-general-guideline)
- [Free Text Card](#free-text-card)
- [Chart Card](#chart-card)
- [KPI Card](#kpi-card)
- [Table Card](#table-card)
- [Feed Card](#feed-card)
- [Group Title](#group-title)

## Critical Rules (TL;DR)

> These are the most common sources of error. Read before generating any widget
> code.

1. **Widget-internal layout must use `flex-wrap`** — KPI rows, metric groups,
   side-by-side elements inside a widget use `display: flex; flex-wrap: wrap` +
   `min-width`. **Never use `grid-cols-N` for widget-internal layout.** Grid is
   only for page-level widget placement (the 8-column `.widget-grid`). →
   [Details](#content-reflow)
2. **No border/outline on widgets or cards** — Use background color
   (`--grey-g01`) or dividers (`--line-l05`) for visual separation. Only Tag
   elements may have borders. → [Details](#widget-background)
3. **Widget dividers must not span full width** — Both ends align with content
   padding via `my` / `mx` margin. → [Details](#divider)
4. **Chart Card uses dotted background** — All other widgets use `--grey-g01`
   (`#fafafa`). Table Card has no background. → [Details](#widget-background)
5. **Same-row widgets must equal height** — `.widget-grid` uses
   `align-items: stretch`; add `flex: 1` to the widget body so shorter widgets
   fill the row height. ECharts containers need
   `height: 100%; min-height: 180px`. → [Details](#equal-height-fill)

---

## Widget General Guideline

### Shared Structure

All Widgets share a consistent outer structure and container.

```html
<div class="widget-card">
  <div class="widget-title">
    <span class="widget-title-text">Title</span>
    <span class="widget-timestamp">12:30</span>
  </div>
  <div class="widget-body">
    <!-- content -->
    <div class="alva-watermark">
      <img
        src="https://alva-ai-static.b-cdn.net/icons/alva-watermark.svg"
        alt="Alva"
      />
    </div>
  </div>
</div>
```

> **Watermark SVG**: Use the CDN URL
> `https://alva-ai-static.b-cdn.net/icons/alva-watermark.svg` via `<img>` tag.
> Do not inline the SVG path data.

```css
.widget-card {
  background: transparent;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.widget-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-m);
}

.widget-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: var(--radius-ct-s);
}

.widget-title-text {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-n9);
  letter-spacing: 0.14px;
  line-height: 22px;
}

.widget-timestamp {
  display: flex;
  align-items: center;
  gap: var(--spacing-xxs);
  font-size: 12px;
  color: var(--text-n5);
  line-height: 20px;
}

.alva-watermark {
  position: absolute;
  bottom: var(--spacing-m);
  left: var(--spacing-m);
  opacity: 0.2;
  line-height: 0;
}
```

### Widget Layout

#### Grid System

| Platform | Total Columns | Gap                   |
| -------- | ------------- | --------------------- |
| Web      | 8 columns     | 24px (`--spacing-xl`) |
| Mweb     | 4 columns     | 16px (`--spacing-l`)  |

#### Container

```css
.widget-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: var(--spacing-xl); /* 24px */
  align-items: stretch;
}
```

#### Column Spans

Each widget declares how many columns it spans in the 8-column grid via `col-*`
classes:

| Class    | Web Proportion | Mweb Behavior               | Use Case                   |
| -------- | -------------- | --------------------------- | -------------------------- |
| `.col-2` | 25% (2/8)      | Stays 2/4 (half-width)      | Small KPI, up to 4 per row |
| `.col-3` | 37.5% (3/8)    | Expands to 4/4 (full-width) | Narrow column widget       |
| `.col-4` | 50% (4/8)      | Expands to 4/4 (full-width) | Equal two-column split     |
| `.col-5` | 62.5% (5/8)    | Expands to 4/4 (full-width) | Main column (wide)         |
| `.col-6` | 75% (6/8)      | Expands to 4/4 (full-width) | Large widget               |
| `.col-8` | 100% (8/8)     | Expands to 4/4 (full-width) | Full width                 |

```css
/* Web spans */
.col-2 {
  grid-column: span 2;
}
.col-3 {
  grid-column: span 3;
}
.col-4 {
  grid-column: span 4;
}
.col-5 {
  grid-column: span 5;
}
.col-6 {
  grid-column: span 6;
}
.col-8 {
  grid-column: span 8;
}

/* Mweb: 4-col grid */
@media (max-width: 768px) {
  .widget-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-l); /* 16px */
  }
  /* col-2 stays half-width (two side by side) */
  .col-2 {
    grid-column: span 2;
  }
  /* col-3 and above all expand to full-width (each on its own row) */
  .col-3,
  .col-4,
  .col-5,
  .col-6,
  .col-8 {
    grid-column: span 4;
  }
}
```

#### Line Break Rules

**The sum of col spans for all widgets in the same row must equal exactly 8 (Web)**. Grid wraps automatically -- widgets exceeding 8 columns automatically move to the next row. Combinations that don't add up to 8 leave empty space at the end of the row and should be avoided.

Common combinations overview:

| Combination              | Col Spans       | Width Ratio         | Description             |
| ------------------------ | --------------- | ------------------- | ----------------------- |
| Equal two-column         | `4 + 4`         | 50% + 50%           | Most common             |
| Left narrow, right wide  | `3 + 5`         | 37.5% + 62.5%       | Info + chart            |
| Left wide, right narrow  | `5 + 3`         | 62.5% + 37.5%       | Chart + description     |
| Large + small two-column | `6 + 2`         | 75% + 25%           | Main widget + KPI       |
| Near-equal three-column  | `3 + 3 + 2`     | 37.5% + 37.5% + 25% | Multi-metric comparison |
| One main + two small     | `4 + 2 + 2`     | 50% + 25% + 25%     | Main widget + two KPIs  |
| Four-column KPI          | `2 + 2 + 2 + 2` | 25% x 4             | KPI horizontal row      |
| Full width               | `8`             | 100%                | Large chart, wide table |

#### Three-Column Split

8 columns cannot be evenly divided by 3. When true equal-width three columns are
needed, use the sub-grid `.col-thirds`:

```css
/* Span the full row, then evenly divide into 3 columns inside */
.col-thirds {
  grid-column: span 8;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xl);
  align-items: stretch;
}

@media (max-width: 768px) {
  .col-thirds {
    grid-column: span 4;
    grid-template-columns: 1fr; /* Each widget takes its own row */
  }
}
```

```html
<div class="widget-grid">
  <div class="col-thirds">
    <div class="widget-card">...</div>
    <div class="widget-card">...</div>
    <div class="widget-card">...</div>
  </div>
</div>
```

#### Equal-Height Fill

When there are more than 1 Widget in the same row and their content heights
differ, the shorter Widget must fill the row height to avoid whitespace.

**Rules**:

1. `.widget-grid` already sets `align-items: stretch` (see
   [Container](#container)) — no need to redeclare
2. `.widget-card` itself uses `flex-direction: column` (already defined in the
   general specification)
3. Add `flex: 1` to the content body (`.widget-body` or chart container) to fill
   the remaining height
4. ECharts chart containers must set `height: 100%; min-height: 180px`

**HTML/CSS approach**:

```css
/* Chart widget body fills height */
.widget-card .widget-body.fill {
  flex: 1;
  height: 0; /* Works with flex:1 to make 100% take effect */
}

/* ECharts DOM container */
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 180px;
}

/* Shorter KPI column: each card flex:1 to equally split row height */
.kpi-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s);
}
.kpi-column .kpi-card {
  flex: 1;
  background: var(--grey-g01);
  border-radius: var(--radius-ct-m);
  padding: var(--spacing-m);
}
```

#### Content Reflow

When a widget's container width is too narrow for its internal horizontal
layout, content should automatically reflow to vertical stacking.

**Rules**:

1. Widget internal horizontal layouts must use `flex-wrap: wrap` to allow
   natural reflow
2. Each child should declare `min-width` to control the wrap breakpoint
3. After wrapping, children expand to full width via `flex: 1 1 100%`
4. Charts and tables are exempt — they always fill `width: 100%` and don't wrap

**CSS**:

```css
/* Horizontal row that auto-wraps when children can't fit */
.widget-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs); /* 8px */
}
.widget-row > * {
  flex: 1 1 auto;
  min-width: 120px; /* triggers wrap below this width */
}
```

**Common scenarios**:

| Scenario             | Behavior                                                                              |
| -------------------- | ------------------------------------------------------------------------------------- |
| KPI metrics in a row | `flex-wrap: wrap`, each metric `min-width: 120px`, stacks when < 120px per item       |
| Feed item + thumb    | Thumb drops below text when container < 240px (via `flex-wrap: wrap` on `.feed-item`) |
| Chart / Table        | Never wraps — always `width: 100%`, adapts internally                                 |

> **Principle**: Prefer `flex-wrap` + `min-width` over media queries for
> widget-internal reflow. This ensures widgets adapt to their actual container
> width regardless of viewport size.

> **Page-level vs Widget-internal layout**: Page-level multi-column layouts
> (e.g. placing two widgets side-by-side on a dashboard) may use CSS Grid
> (`grid-cols-2`) because the page width is predictable. However,
> **widget-internal** horizontal arrangements (KPI rows, metric groups,
> side-by-side charts within one card) **must** use `flex-wrap` + `min-width` —
> never `grid-cols-N` — because widget containers can vary in width depending on
> their page context.

#### Height

| Widget Type    | Default Height         | Overflow Behavior        |
| -------------- | ---------------------- | ------------------------ |
| KPI Card       | auto (content-driven)  | Wrap via flex-wrap       |
| Chart Card     | 320px                  | Chart scales internally  |
| Table Card     | auto, capped at 5600px | Scroll within table body |
| Free Text Card | auto (content-driven)  | Scroll or truncate       |
| Feed Card      | auto, capped at 560px  | Scroll within feed body  |

- **Max Height**: All widgets share a unified max height of **960px**. When
  content exceeds this, apply `overflow-y: auto` to the widget body (not the
  entire card — header must remain visible)
- **Default Height**: `auto` means the widget sizes to its content naturally;
  Chart Card uses a fixed default height because ECharts requires an explicit
  container height to render
- **Table Card / Feed Card**: Content < 560px → auto height fits content;
  content ≥ 320px → default height 320px, body scrolls

#### Divider

**Important**: Widget internal dividers must not span full width; both ends must
align with the content padding.

**Approach: Flex standalone divider elements**

Applies to all Widgets using flex layout (KPI Card, Free Text Card, etc.).

```css
/* Vertical divider -- margin-block = cell vertical padding */
.divider-v {
  width: 1px;
  flex-shrink: 0;
  margin-block: 20px; /* must equal adjacent cell padding */
  background-color: var(--line-l05);
}

/* Horizontal divider -- margin-inline = cell horizontal padding */
.divider-h {
  height: 1px;
  margin-inline: 20px; /* must equal adjacent cell padding */
  background-color: var(--line-l05);
}
```

```css
/* Prohibited -- full-width edge-to-edge */
border-bottom: 1px solid var(--line-l05);
border-right: 1px solid var(--line-l05);
```

---

### Widget Background

**Important**: Widget background color varies by type. **Do NOT add border/outline to widgets or internal cards** — use background color or divider to create visual separation. The only exception is Tag elements, which may have borders.

- **Chart Card**: Uses dotted background, see
  [`.chart-dotted-background`](#chart-card) for styling
- **Table Card**: No background color
- **Other Widgets**: Default to g01 background color
  ```css
  background-color: var(--grey-g01);
  ```

---

## Free Text Card

Used to display narrative context, investment rationale, and other rich text
content.
**Use the Markdown component; refer to this document + [design-components.md](./design-components.md)**

```css
.free-text-body {
  padding: var(--spacing-l);
}
```

---

## Chart Card

1. Use ECharts.
2. Legend and chart areas should not overlap.
3. **Do NOT set a separate background color on the chart canvas** (e.g., ECharts
   `backgroundColor`). The widget card already provides the background (dotted
   pattern or `--grey-g01`); adding a canvas-level background creates visual
   conflict.
4. **Important**: Select colors in 'Chart & Widget Colors' based on data
   semantics; avoid duplicates. See the `/* ── Chart ── */` section in
   [design-system.md - Color Tokens](./design-system.md#color-tokens) for the full chart color
   palette.

### Chart Rules

**Grey Color Restriction**
(`--chart-grey-main / --chart-grey-1 / --chart-grey-2`):

- When chart has **< 3 series** → **grey is forbidden**;
- When chart has **≥ 3 series** → grey is allowed;

```css
.chart-dotted-background {
  background-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 0.18) 0.6px,
    transparent 0.6px
  );
  background-size: 3px 3px;
}

/* Dark Mode */
[data-theme="dark"] .chart-dotted-background {
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.12) 0.6px,
    transparent 0.6px
  );
}

.chart-body {
  flex: 1;
  padding: var(--spacing-m);
  position: relative;
}

/* Legend */
.chart-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-xs);
  height: 16px;
  margin-bottom: var(--spacing-xxs);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xxs);
  font-size: 10px;
  color: var(--text-n5);
}

/* Legend Markers by Chart Type
   ┌──────────────┬──────────────┬──────────────────────┐
   │ Chart Type   │ Class        │ Shape                │
   ├──────────────┼──────────────┼──────────────────────┤
   │ Line / Area  │ .legend-line │ rounded rect 12×2 ── │
   │ Bar / Column │ .legend-rect │ rounded rectangle ▪  │
   │ Pie / Donut  │ .legend-dot  │ circle dot ●         │
   └──────────────┴──────────────┴──────────────────────┘
*/

/* Line / Area Chart: rounded rectangle 12×2 */
.legend-line {
  width: 12px;
  height: 2px;
  border-radius: 0.5px;
}

/* Bar / Column Chart: rounded rectangle 8×8 */
.legend-rect {
  width: 8px;
  height: 8px;
  border-radius: 0.5px;
}

/* Pie / Donut Chart: circle dot (default) */
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
```

**Line series defaults (ECharts)**:

```javascript
{
    smooth: 0.1,              // Curve tension
    lineStyle: { width: 1 }   // Line thickness 1px
    // showSymbol — see Hover Dot Standard below
}
```

**Area fill gradient (Line / Area charts)**:

When a line series has `areaStyle`, use a vertical linear gradient from the
series color at **15% opacity** to **0% opacity**:

```javascript
areaStyle: {
  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: "rgba({r},{g},{b}, 0.15)" }, // series color @ 15%
    { offset: 1, color: "rgba({r},{g},{b}, 0)" }, // series color @ 0%
  ]);
}
```

> Extract `{r},{g},{b}` from the series' chart color token value.
> For negative-direction data (e.g. drawdown), reverse the gradient direction
> (0% at top, 15% at bottom).

### Axis Rules

```javascript
// Shared axis config AX -- must use this config every time a Chart is generated
const AX = {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
        fontSize: 10,
        color: var(--text-n7),
        fontFamily: "'Delight',-apple-system,BlinkMacSystemFont,sans-serif",
        margin: 8,  // <- 8px gap from label to axis line
    },
    splitLine: { show: false }
};

// Grid must use containLabel:true -- auto-calculate margin from axis labels to container edge
grid: { top: 4, right: 4, bottom: 4, left: 4, containLabel: true }
// Do not use the legacy hard-coded left:40/44/48 + bottom:32 approach

// Line chart xAxis must add boundaryGap:false -- data starts from the edge, no whitespace
xAxis: { type: 'category', data: x, boundaryGap: false, ...AX }
```

### Mark Line

**Important specification**: Dashed divider lines only appear at the 0 axis

- **0 axis divider line**: Uses dashed style
  - `color: 'var(--line-l3)'`
  - `type: [3, 2]` (Dash 3px, Gap 2px)
  - `width: 1`
  - `silent: true`
  - `symbol: 'none'`

- **Non-0 axis divider line**: Not displayed (opacity 0 or do not add markLine)

**Example**:

```javascript
// Bar chart - x axis starts at 0, should show dashed line at 0
markLine: {
  silent: true,
  symbol: 'none',
  data: [{ xAxis: 0 }],
  lineStyle: {
    color: 'var(--line-l3)',
    type: [3, 2],
    width: 1
  },
  label: { show: false }
}

// Line chart - y axis range 80-160 does not include 0, should not show markLine
// Do not add markLine configuration
```

### Tooltip

**Important specification**: All chart tooltips must follow a unified style

**ECharts configuration**:

> ECharts `textStyle.color` is a global unified color and cannot natively
> separate title/data row colors. You must use `formatter` to manually output
> HTML to achieve title n7 + data row n9.

```javascript
// -- Shared formatter factory function (define once per file) --
// valueFn: format each data value, defaults to raw value, override per chart unit
function mkFmt(valueFn) {
  valueFn = valueFn || ((v) => v);
  return (params) => {
    const t = params[0].axisValueLabel || params[0].axisValue;
    let s = `<div style="font-size:12px;color:rgba(0,0,0,0.7);margin-bottom:6px;">${t}</div>`;
    params.forEach((p) => {
      s +=
        `<div style="display:flex;align-items:center;gap:6px;line-height:20px;">` +
        `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${p.color};"></span>` +
        `<span style="color:rgba(0,0,0,0.9);">${p.seriesName}</span>` +
        `<span style="color:rgba(0,0,0,0.9);margin-left:auto;">${valueFn(p.value, p)}</span>` +
        `</div>`;
    });
    return s;
  };
}

// -- Shared TT constant (includes default formatter) --
const TT = {
  trigger: "axis",
  backgroundColor: "rgba(255,255,255,0.96)",
  borderColor: "rgba(0,0,0,0.08)",
  borderWidth: 1,
  borderRadius: 6,
  padding: 12,
  textStyle: {
    fontFamily: "'Delight',-apple-system,BlinkMacSystemFont,sans-serif",
    fontSize: 12,
    fontWeight: 400,
    color: "rgba(0,0,0,0.9)",
  },
  axisPointer: {
    type: "line",
    lineStyle: { color: "rgba(0,0,0,0.1)", width: 1 },
  },
  extraCssText: "box-shadow:none;", // Remove ECharts default shadow
  formatter: mkFmt(), // Default: raw value, title n7
};

// -- Override formatter per chart unit --
// Raw values (0-100):     tooltip: TT
// With $ and B suffix:    tooltip: {...TT, formatter: mkFmt(v => '$' + v + 'B')}
// With % suffix:          tooltip: {...TT, formatter: mkFmt(v => v + '%')}
// With x suffix:          tooltip: {...TT, formatter: mkFmt(v => v + 'x')}
// With signed %:          tooltip: {...TT, formatter: mkFmt(v => (v>=0?'+':'') + v + '%')}
```

### Line Chart

1. Line width 1px
2. Gradient background when there are 1–2 lines
3. No gradient background when there are 3 or more lines

#### Hover Dot

**Important**: All line charts must display dots at the corresponding line
position on hover

**ECharts configuration**:

```javascript
{
  symbol: 'circle',                   // Circle symbol
  symbolSize: 10,                     // Dot diameter 10px
  showSymbol: false,                  // Hidden by default
  emphasis: {
    itemStyle: {
      borderColor: '#ffffff',         // White border
      borderWidth: 1,                 // Border 1px
      color: 'primary color'         // Dot color
    }
  }
}
```

**Notes**:

- Do not use shadow effects such as `shadowBlur`, `shadowColor`
- Do not use `focus: 'series'`
- Ensure all line chart hover dot styles are consistent

### Bar Chart

| Property       | Value                        |
| -------------- | ---------------------------- |
| Max bar width  | 16px                         |
| Bar gap        | 8px between adjacent bars    |
| Label position | Above bar or inside          |
| Border radius  | `borderRadius: 1` on bar top |

## KPI Card

Key metric font size can use 24px or 28px.

**Important**: When multiple key metrics appear in the same widget or card, do
NOT nest sub-cards inside — use dividers to separate them. This keeps the layout
flat and consistent with the [Widget Divider](#divider) specification.

### Color Rules

| Type     | Class       | Color | Example        | Design Token |
| -------- | ----------- | ----- | -------------- | ------------ |
| Positive | `.positive` | Green | Return +18%    | --main-m3    |
| Negative | `.negative` | Red   | Drawdown -12%  | --main-m4    |
| Neutral  | `.neutral`  | Black | Volatility 22% | --text-n9    |

## Table Card

Container: `flex-col`, `width: 100%`, `gap: 16px`, `border-radius: 4px`,
`isolation: isolate`. No background color.

### Typography

All text uses **Delight Regular (400)** only. No bold.

| Element     | Font Size | Line Height | Letter Spacing | Color       |
| ----------- | --------- | ----------- | -------------- | ----------- |
| Header cell | 14px      | 22px        | 0.14px         | `--text-n7` |
| Body cell   | 14px      | 22px        | 0.14px         | `--text-n9` |

### Layout

Table uses **row-first** layout: each row is a `flex` container, cells within the same row share the same `flex` proportions to ensure header–body alignment.

> **Important**: Do NOT use column-first layout (one flex-col per column with header + body cells stacked inside). This causes header–body misalignment when padding differs between header and body cells.

```html
<div class="table-card">
  <!-- Header row -->
  <div class="table-row table-header">
    <div class="table-cell" style="flex:1.2">Symbol</div>
    <div class="table-cell" style="flex:1">Side</div>
    <div class="table-cell" style="flex:1.2">Quantity</div>
  </div>
  <!-- Body rows -->
  <div class="table-row table-body-row">
    <div class="table-cell" style="flex:1.2">AAPL</div>
    <div class="table-cell" style="flex:1">LONG</div>
    <div class="table-cell" style="flex:1.2">100</div>
  </div>
</div>
```

```css
.table-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 4px;
  isolation: isolate;
  overflow-x: auto;
}
.table-row {
  display: flex;
  width: 100%;
}
.table-cell {
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  font-weight: 400;
  white-space: nowrap;
  display: flex;
  align-items: center;
}
```

| Element     | Padding (first col) | Padding (other cols) | Border Bottom               |
| ----------- | ------------------- | -------------------- | --------------------------- |
| Header cell | `0 16px 12px 0`     | `0 16px 12px 16px`   | `1px solid var(--line-l07)` |
| Body cell   | `12px 16px 12px 0`  | `12px 16px`          | `1px solid var(--line-l07)` |

Body cell: `max-height: 180px`, `white-space: nowrap`, `width: 100%`.

### Responsive

- `>= 960px`: Full table, no scroll
- `< 960px`: Horizontal `overflow: clip`, scrollable content
- No hover effects (static display)

---

## Feed Card

```css
.feed-body {
  padding: var(--spacing-xxs) 0;
}
.feed-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
  padding: var(--spacing-m);
  position: relative; /* for ::after divider */
}
.feed-item::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: var(--spacing-m);
  right: var(--spacing-m);
  height: 1px;
  background: var(--line-l05);
}
.feed-item:last-child::after {
  display: none;
}
.feed-item-content {
  flex: 1;
  min-width: 0;
}
.feed-thumb {
  width: 88px;
  height: 70px;
  border-radius: var(--radius-ct-s);
  flex-shrink: 0;
  order: 1; /* thumb 始终在右侧 */
  object-fit: cover;
}
```

> **Thumb Layout Rule**: When a Feed Item includes a thumbnail (`.feed-thumb`),
> the thumbnail is displayed on the right by default. Text content is wrapped in
> `.feed-item-content` with `flex: 1` to fill the remaining width.

## Group Title

Used when widgets need separation, to mark the beginning of a thematic section.
It is not a widget-card; it is a page-level layout element.

### Structure

```html
<div class="section-title">
  <span class="section-title-icon">🖥️</span>
  <span class="section-title-text">Data Center (AI GPUs)</span>
  <span class="section-title-sub"
    >Highest Narrative Heat · Blackwell Demand</span
  >
</div>
```

`section-title-icon` and `section-title-sub` are both optional; only add them
when there is content.

### CSS

```css
.section-title {
  display: inline-flex;
  align-items: center;
  gap: 12px; /* --sp-s */
  margin-top: 8px; /* --sp-xs, maintain spacing from content above */
}

/* Icon -- Emoji, same height as title */
.section-title-icon {
  font-size: 22px;
  line-height: 1;
}

/* Main title */
.section-title-text {
  font-size: 22px;
  font-weight: 400; /* Regular only */
  color: var(--text-n9); /* rgba(0,0,0,0.9) */
  letter-spacing: 0.3px;
}

/* Subtitle / keyword summary */
.section-title-sub {
  font-size: 11px;
  color: var(--text-n5); /* rgba(0,0,0,0.5) */
  padding-left: 8px; /* --sp-xs */
  border-left: 1px solid var(--line-l07); /* rgba(0,0,0,0.07) */
}
```

### Usage Rules

| Property                | Specification                                             |
| ----------------------- | --------------------------------------------------------- |
| Subtitle separator      | `·` (middle dot), one space on each side between keywords |
| Max subtitle keywords   | No more than 3                                            |
| Row gap to widget below | Uses page standard `gap: 24px`                            |
