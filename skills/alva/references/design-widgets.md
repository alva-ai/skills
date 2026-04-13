# Widget Design Guideline

## Widget Types

- [Critical Rules (TL;DR)](#critical-rules-tldr)
- [Shared Styles](#shared-styles)
- [Widget Layout](#widget-layout)
- [Chart Card](#chart-card)
- [Metric Card](#metric-card)
- [Table Card](#table-card)
- [Free Text Card](#free-text-card)
- [Feed Card](#feed-card)
- [Group Title](#group-title)

## Critical Rules (TL;DR)

> These are the most common sources of error. Read before generating any widget
> code.

1. **Widget-internal layout uses `flex-wrap`** (metric rows, metric groups,
   side-by-side elements). Never `grid-cols-N` — grid is only for page-level
   `.widget-grid`. → [Details](#content-reflow)
2. **No border/outline on widgets** — use `--grey-g01` or `--line-l05` dividers.
   Only Tags may have borders. → [Details](#widget-background)
3. **Dividers don't span full width** — align both ends with content padding. →
   [Details](#divider)
4. **Chart Card → dotted bg; Table Card → none; others → `--grey-g01`.** →
   [Details](#widget-background)
5. **Same-row widgets must equal height** — `.widget-body.fill` + `flex: 1`.
   ECharts: `height:100%; min-height:180px`. → [Details](#equal-height-fill)
6. **Table columns require JS `initTableAlignment`** — proportional widths based
   on content, horizontal scroll when overflow. `gap:var(--spacing-m)` on rows,
   `border-bottom` on rows not cells. → [Details](#column-alignment)

---

## Shared Styles

> **Include this block in every playbook page.** Then add each widget type's CSS
> block as needed.

```css
/* ── Widget Card ── */
.widget-card {
  background: transparent;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
}

.widget-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-m);
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

.widget-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: var(--radius-ct-s);
}

.alva-watermark {
  position: absolute;
  bottom: var(--spacing-m);
  right: var(--spacing-m);
  opacity: 0.2;
  line-height: 0;
}

/* ── Dividers ── */
.divider-v {
  width: 1px;
  flex-shrink: 0;
  margin-block: var(--spacing-l);
  background-color: var(--line-l05);
}

.divider-h {
  height: 1px;
  margin-inline: var(--spacing-l);
  background-color: var(--line-l05);
}

/* ── Equal Height Fill ── */
.widget-card .widget-body.fill {
  flex: 1;
  height: 0;
}

/* ── Widget Grid ── */
.widget-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: var(--spacing-xl);
  align-items: stretch;
}

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

.col-thirds {
  grid-column: span 8;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xl);
  align-items: stretch;
}

@media (max-width: 768px) {
  .widget-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-l);
  }
  .col-2 {
    grid-column: span 2;
  }
  .col-3,
  .col-4,
  .col-5,
  .col-6,
  .col-8 {
    grid-column: span 4;
  }
  .col-thirds {
    grid-column: span 4;
    grid-template-columns: 1fr;
  }
}

/* ── Content Reflow ── */
.widget-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.widget-row > * {
  flex: 1 1 auto;
  min-width: 120px;
}
```

> **Watermark SVG**: Always use the CDN URL via `<img>` tag. Do not inline SVG.

---

## Widget Layout

### Grid System

| Platform | Total Columns | Gap                   |
| -------- | ------------- | --------------------- |
| Web      | 8 columns     | 24px (`--spacing-xl`) |
| Mweb     | 4 columns     | 16px (`--spacing-l`)  |

### Column Spans

| Class    | Web Proportion | Mweb Behavior               | Use Case                   |
| -------- | -------------- | --------------------------- | -------------------------- |
| `.col-2` | 25% (2/8)      | Stays 2/4 (half-width)      | Small KPI, up to 4 per row |
| `.col-3` | 37.5% (3/8)    | Expands to 4/4 (full-width) | Narrow column widget       |
| `.col-4` | 50% (4/8)      | Expands to 4/4 (full-width) | Equal two-column split     |
| `.col-5` | 62.5% (5/8)    | Expands to 4/4 (full-width) | Main column (wide)         |
| `.col-6` | 75% (6/8)      | Expands to 4/4 (full-width) | Large widget               |
| `.col-8` | 100% (8/8)     | Expands to 4/4 (full-width) | Full width                 |

### Line Break Rules

Each row's col spans must total exactly 8; shortfalls leave empty space.

| Combination              | Col Spans       | Width Ratio         |
| ------------------------ | --------------- | ------------------- |
| Equal two-column         | `4 + 4`         | 50% + 50%           |
| Left narrow, right wide  | `3 + 5`         | 37.5% + 62.5%       |
| Left wide, right narrow  | `5 + 3`         | 62.5% + 37.5%       |
| Large + small two-column | `6 + 2`         | 75% + 25%           |
| Near-equal three-column  | `3 + 3 + 2`     | 37.5% + 37.5% + 25% |
| One main + two small     | `4 + 2 + 2`     | 50% + 25% + 25%     |
| Four-column KPI          | `2 + 2 + 2 + 2` | 25% x 4             |
| Full width               | `8`             | 100%                |

For true equal-width three columns, use `.col-thirds` (see Shared Styles).

### Solo Widget Rule

Non-KPI widget alone on a row must use `col-8`.

### Equal-Height Fill

Same-row widgets with different content heights: add `.fill` to `.widget-body`
(`flex:1; height:0`). ECharts containers: `height:100%; min-height:180px`.

### Content Reflow

Use `.widget-row` for widget-internal horizontal layouts. Charts and tables
never wrap — always `width: 100%`.

### Widget Height

| Widget Type    | Default Height        | Overflow Behavior        |
| -------------- | --------------------- | ------------------------ |
| Metric Card    | auto (content-driven) | Wrap via flex-wrap       |
| Chart Card     | 320px                 | Chart scales internally  |
| Table Card     | auto, capped at 680px | Scroll within table body |
| Free Text Card | auto (content-driven) | Scroll or truncate       |
| Feed Card      | auto, capped at 680px | Scroll within feed body  |

Table / Feed: content < 320px → auto; ≥ 320px → 320px body + internal scroll. Do
not exceed 680px total height. Max for all widgets: **960px**
(`overflow-y: auto` on widget body, not card).

### Widget Background

No border/outline on widgets (only Tag elements may have borders). Background:

| Widget Type | Background                 |
| ----------- | -------------------------- |
| Chart Card  | `.chart-dotted-background` |
| Table Card  | None (transparent)         |
| Others      | `var(--grey-g01)`          |

### Divider

Use `.divider-v` / `.divider-h` — both ends align with content padding (not full
width). Do not use `border-bottom` / `border-right` for widget dividers.

---

## Chart Card

### CSS

```css
/* Chart cards clip canvas overflow */
.widget-card:has(.chart-body) {
  overflow: hidden;
}

.chart-dotted-background {
  background-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 0.18) 0.6px,
    transparent 0.6px
  );
  background-size: 3px 3px;
}

/* Dark Mode (disabled — kept for future use) */
[data-theme="dark-disabled"] .chart-dotted-background {
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
  letter-spacing: 0.1px;
  color: var(--text-n5);
}

.legend-line {
  width: 12px;
  height: 2px;
  border-radius: 0.5px;
}

.legend-rect {
  width: 8px;
  height: 8px;
  border-radius: 0.5px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 180px;
}
```

### Template

```html
<!-- Chart Card — copy this structure exactly -->
<div class="widget-card">
  <div class="widget-title">
    <span class="widget-title-text">Chart Title</span>
    <span class="widget-timestamp">12:30</span>
    <!-- optional -->
  </div>
  <div class="chart-body chart-dotted-background">
    <!-- optional: HTML legend (use when ECharts legend is insufficient) -->
    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-line" style="background:#5f75c9;"></span>
        <span>Series A</span>
      </div>
    </div>
    <!-- ECharts container -->
    <div id="chart-xxx" style="width:100%;height:320px;"></div>
    <!-- Watermark: always inside chart-body, always this exact structure -->
    <div class="alva-watermark">
      <img
        src="https://alva-ai-static.b-cdn.net/icons/alva-watermark.svg"
        alt="Alva"
      />
    </div>
  </div>
</div>
```

Legend marker class by chart type:

| Chart Type   | Class          | Shape                |
| ------------ | -------------- | -------------------- |
| Line / Area  | `.legend-line` | rounded rect 12×2 ── |
| Bar / Column | `.legend-rect` | rounded rectangle ▪  |
| Pie / Donut  | `.legend-dot`  | circle dot ●         |

### Chart Rules

1. Use ECharts. Legend and chart must not overlap.
2. Do NOT set ECharts `backgroundColor` — dotted pattern handles it.
3. Colors from chart palette in [design-tokens.css](./design-tokens.css). No
   duplicates. Grey (`--chart-grey-*`) only when ≥ 3 series.
4. **ECharts is Canvas — `var(--xxx)` does NOT work.** Use raw hex/rgba in all
   ECharts configs. CSS variables remain correct for DOM styles.
5. **Hidden containers (tab panels, modals) report 0×0 size.** When a chart
   becomes visible after being hidden, call `chart.resize()`. Likewise,
   `initTableAlignment` must re-run for tables that were hidden. The
   [Tab JS](./design-components.md#js-interaction-1) handles both automatically
   for tab switches.

### Axis Rules

```javascript
// Shared axis config — must use every time a chart is generated
// NOTE: use raw color values, NOT CSS vars — ECharts is Canvas-based
const AX = {
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: {
    fontSize: 10,
    color: "rgba(0,0,0,0.7)",  // --text-n7
    fontFamily: "'Delight', -apple-system, 'OPPO Sans 4.0', BlinkMacSystemFont, sans-serif",
    margin: 8, // 8px gap from label to axis line
  },
  splitLine: { show: false },
};

// Grid must use containLabel:true -- auto-calculate margin from axis labels to container edge
const GRID = { top: 4, right: 4, bottom: 4, left: 4, containLabel: true };

// Line chart xAxis must add boundaryGap:false
xAxis: { type: "category", data: x, boundaryGap: false, ...AX }
```

### Mark Line

Dashed lines only at the 0 axis. Non-zero axes: do not add markLine.

```javascript
markLine: {
  silent: true,
  symbol: "none",
  data: [{ xAxis: 0 }], // or { yAxis: 0 }
  lineStyle: { color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", type: [3, 2], width: 1 },
  label: { show: false },
}
```

### Tooltip

```javascript
// Shared formatter factory (define once per file)
// Uses TT_COLORS for theme-aware tooltip content
function mkFmt(valueFn) {
  valueFn = valueFn || ((v) => v);
  return (params) => {
    const tc =
      typeof TT_COLORS !== "undefined"
        ? TT_COLORS
        : { title: "rgba(0,0,0,0.7)", text: "rgba(0,0,0,0.9)" };
    const t = params[0].axisValueLabel || params[0].axisValue;
    let s = `<div style="font-size:12px;color:${tc.title};margin-bottom:6px;">${t}</div>`;
    params.forEach((p) => {
      s +=
        `<div style="display:flex;align-items:center;gap:6px;line-height:20px;">` +
        `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${p.color};"></span>` +
        `<span style="color:${tc.text};">${p.seriesName}</span>` +
        `<span style="color:${tc.text};margin-left:auto;">${valueFn(p.value, p)}</span>` +
        `</div>`;
    });
    return s;
  };
}

// Shared tooltip config (light mode)
var TT_COLORS = {
  bg: "rgba(255,255,255,0.96)",
  border: "rgba(0,0,0,0.08)",
  title: "rgba(0,0,0,0.7)",
  text: "rgba(0,0,0,0.9)",
  pointer: "rgba(0,0,0,0.1)",
};

const TT = {
  trigger: "axis",
  backgroundColor: TT_COLORS.bg,
  borderColor: TT_COLORS.border,
  borderWidth: 1,
  borderRadius: 6,
  padding: 12,
  textStyle: {
    fontFamily: "'Delight', -apple-system, 'OPPO Sans 4.0', BlinkMacSystemFont, sans-serif",
    fontSize: 12,
    fontWeight: 400,
    color: TT_COLORS.text,
  },
  axisPointer: {
    type: "line",
    lineStyle: { color: TT_COLORS.pointer, width: 1 },
  },
  extraCssText: "box-shadow:none;",
  formatter: mkFmt(),
};

// Override per chart unit:
// tooltip: TT                                          — raw values
// tooltip: {...TT, formatter: mkFmt(v => '$' + v + 'B')} — dollar
// tooltip: {...TT, formatter: mkFmt(v => v + '%')}     — percent
// tooltip: {...TT, formatter: mkFmt(v => (v>=0?'+':'') + v + '%')} — signed %
```

### Line Chart

| Property   | Value                                               |
| ---------- | --------------------------------------------------- |
| Line width | 1px (`lineStyle: { width: 1 }`)                     |
| Smoothing  | `smooth: 0.1`                                       |
| Area fill  | Gradient 15%→0% when 1–2 lines; none when ≥ 3 lines |

**Area fill gradient**:

```javascript
areaStyle: {
  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: "rgba({r},{g},{b}, 0.15)" },
    { offset: 1, color: "rgba({r},{g},{b}, 0)" },
  ]),
}
```

**Hover dot** (required on all line charts):

```javascript
{
  symbol: "circle",
  symbolSize: 10,
  showSymbol: false,
  emphasis: {
    itemStyle: {
      borderColor: "#ffffff",
      borderWidth: 1,
      color: "primary color",
    },
  },
}
```

No `shadowBlur`, no `focus: 'series'`.

### Bar Chart

| Property       | Value                        |
| -------------- | ---------------------------- |
| Max bar width  | 16px                         |
| Bar gap        | 8px between adjacent bars    |
| Label position | Above bar or inside          |
| Border radius  | `borderRadius: 1` on bar top |

---

## Metric Card

### CSS

```css
/* ── Metric Column (for stacking metric cards beside a chart) ── */
.metric-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s);
}

.metric-column .metric-card {
  flex: 1;
  background: var(--grey-g01);
  border-radius: var(--radius-ct-m);
  padding: var(--spacing-m);
}
```

### Template

```html
<!-- Metric Card — copy this structure exactly -->
<div class="widget-card">
  <div class="widget-title">
    <span class="widget-title-text">KPI Title</span>
  </div>
  <div
    class="widget-body"
    style="background:var(--grey-g01);padding:var(--spacing-l);flex-direction:column;align-items:flex-start;"
  >
    <!-- Single Metric -->
    <div style="font-size:11px;color:var(--text-n7);letter-spacing:0.11px;">
      Label
    </div>
    <div style="font-size:24px;letter-spacing:0.24px;color:var(--main-m3);">+18.4%</div>
    <!-- Watermark -->
    <div class="alva-watermark">
      <img
        src="https://alva-ai-static.b-cdn.net/icons/alva-watermark.svg"
        alt="Alva"
      />
    </div>
  </div>
</div>
```

### Metric Card Rules

- Key metric font size: 24px or 28px
- When multiple metrics share one card, use `.divider-v` / `.divider-h` to
  separate — **do NOT nest sub-cards**

### Color Rules

| Type     | Color | Example        | Design Token |
| -------- | ----- | -------------- | ------------ |
| Positive | Green | Return +18%    | --main-m3    |
| Negative | Red   | Drawdown -12%  | --main-m4    |
| Neutral  | Black | Volatility 22% | --text-n9    |

---

## Table Card

### CSS

```css
.table-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  isolation: isolate;
  overflow-x: auto;
}

.table-row {
  display: flex;
  width: 100%;
  gap: var(--spacing-m); /* column spacing between cells */
  border-bottom: 1px solid var(--line-l07); /* row divider — on the row, not cells */
  /* min-width is set by initTableAlignment JS — do NOT use CSS min-width here */
}
.table-row:last-child {
  border-bottom: none;
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

### Template

```html
<!-- Table Card — copy this structure exactly -->
<div class="widget-card">
  <div class="widget-title">
    <span class="widget-title-text">Table Title</span>
  </div>
  <div class="table-card">
    <!-- Header row -->
    <div class="table-row table-header">
      <div class="table-cell">Symbol</div>
      <div class="table-cell">Side</div>
      <div class="table-cell">Quantity</div>
    </div>
    <!-- Body rows -->
    <div class="table-row table-body-row">
      <div class="table-cell">AAPL</div>
      <div class="table-cell">LONG</div>
      <div class="table-cell">100</div>
    </div>
  </div>
</div>
```

### Table Rules

- No background. Delight Regular (400) only.
- Row-first flex layout. **Do NOT use column-first layout.**
- Column spacing: `gap: var(--spacing-m)` on `.table-row`. **Do NOT use cell padding for
  inter-column spacing.**
- Row divider: `border-bottom: 1px solid var(--line-l07)` on `.table-row` (not
  cells). Last row: no border.

| Element | Font | Color       | Padding      |
| ------- | ---- | ----------- | ------------ |
| Header  | 14px | `--text-n7` | `0 0 12px 0` |
| Body    | 14px | `--text-n9` | `12px 0`     |

Body cell: `max-height: 180px`. Column widths are handled by
`initTableAlignment` — do not set `width` on cells.

### Column Alignment

Column widths are **proportional to content** and **never narrower than the
widest item**. Overflow triggers horizontal scroll. Do NOT use inline
`style="flex:…"` on cells — sizing is handled by `initTableAlignment`.

**4-phase algorithm**:

1. **Reset** — `removeAttribute('style')` on all cells, clear row `min-width`.
2. **Measure** — `scrollWidth` per column (max across all rows).
3. **Resolve** — `resolved = max(colWidth, colWidth/total × available)`. Wide
   container → proportional fill. Narrow → lock at content width.
4. **Apply** — `flex: 0 0 {resolved}px` on all cells + uniform row `min-width`.

**Required JS** — run after every table render and on `resize`:

```javascript
function initTableAlignment(tableEl) {
  var rows = tableEl.querySelectorAll(".table-row");
  if (rows.length === 0) return;
  var colCount = rows[0].querySelectorAll(".table-cell").length;

  // Phase 1: Reset — nuke all inline styles for clean measurement
  rows.forEach(function (row) {
    row.style.removeProperty("min-width");
    var cells = row.querySelectorAll(".table-cell");
    for (var i = 0; i < cells.length; i++) {
      cells[i].removeAttribute("style");
    }
  });

  // Phase 2: Measure each column's max content width
  var colWidths = [];
  for (var col = 0; col < colCount; col++) {
    var maxW = 0;
    rows.forEach(function (row) {
      var cell = row.querySelectorAll(".table-cell")[col];
      if (cell) maxW = Math.max(maxW, cell.scrollWidth);
    });
    colWidths.push(maxW);
  }

  // Phase 3: Resolve — proportional fill, min = content width
  var totalContent = 0;
  for (var i = 0; i < colWidths.length; i++) totalContent += colWidths[i];
  var gapTotal = (colCount - 1) * 16; // --spacing-m
  var available = tableEl.clientWidth - gapTotal;

  var resolved = [];
  for (var col = 0; col < colCount; col++) {
    var proportional = Math.round((colWidths[col] / totalContent) * available);
    resolved.push(Math.max(colWidths[col], proportional));
  }

  // Phase 4: Apply — fixed pixel widths + uniform row min-width
  var totalWidth = gapTotal;
  for (var col = 0; col < colCount; col++) {
    totalWidth += resolved[col];
    rows.forEach(function (row) {
      var cell = row.querySelectorAll(".table-cell")[col];
      if (!cell) return;
      cell.style.flex = "0 0 " + resolved[col] + "px";
    });
  }

  rows.forEach(function (row) {
    row.style.minWidth = totalWidth + "px";
  });
}
```

> **Timing**: Call after populating the table and on `resize`. Idempotent.
>
> **Key**: Phase 1 uses `removeAttribute('style')` (not `style.flex=''`) because
> browsers don't reliably clear flex longhands. Phase 4 sets explicit pixel
> `min-width` on rows because CSS `min-width:max-content` varies per-row.

### Responsive

Horizontal scroll activates automatically via `overflow-x: auto` when columns
exceed container. No hover effects on rows.

---

## Free Text Card

### CSS

```css
.free-text-body {
  padding: var(--spacing-l);
}
```

### Template

```html
<!-- Free Text Card — copy this structure exactly -->
<div class="widget-card">
  <div class="widget-title">
    <span class="widget-title-text">Text Title</span>
  </div>
  <div class="widget-body" style="background:var(--grey-g01);">
    <div class="free-text-body">
      <div class="markdown-container">
        <!-- Markdown content rendered here -->
      </div>
    </div>
    <div class="alva-watermark">
      <img
        src="https://alva-ai-static.b-cdn.net/icons/alva-watermark.svg"
        alt="Alva"
      />
    </div>
  </div>
</div>
```

Use the Markdown component from [design-components.md](./design-components.md)
for rich text rendering.

---

## Feed Card

### CSS

```css
.feed-body {
  padding: var(--spacing-xxs) 0;
}

.feed-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-m);
  padding: var(--spacing-m);
  position: relative;
  border-radius: var(--radius-ct-s);
  transition: background 0.15s;
}

.feed-item:hover {
  background: var(--b-r02);
  cursor: pointer;
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

/* ── Left column: header + indented content ── */
.feed-item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

/* Header row — avatar + title / user-info */
.feed-header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

/* ── Avatar / Logo ── */
.feed-avatar {
  width: 22px;
  height: 22px;
  border-radius: 100px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.feed-avatar.has-badge {
  overflow: visible;
}

.feed-avatar.no-radius {
  border-radius: 0;
  overflow: visible;
}

.feed-avatar > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 100px;
}

.feed-avatar.no-radius > img {
  border-radius: 0;
}

.feed-avatar-badge {
  position: absolute;
  bottom: -1px;
  right: -3px;
  width: 14px;
  height: 14px;
  background: var(--b0-container);
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feed-avatar-badge img {
  width: 12px;
  height: 12px;
  border-radius: 100px;
}

/* ── Header text variants ── */

/* Podcast / Youtube / News: bold single-line title */
.feed-title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  letter-spacing: 0.14px;
  color: var(--text-n9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* X / Reddit: name + handle + date inline */
.feed-header-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-xxs);
  white-space: nowrap;
}

.feed-display-name {
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.14px;
  color: var(--text-n9);
}

.feed-handle,
.feed-meta-sep,
.feed-meta-date {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  color: var(--text-n5);
}

/* ── Indented content below header ── */
.feed-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  padding-left: var(--spacing-xxl); /* 28px = 22px avatar + 6px gap */
  width: 100%;
}

.feed-post-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  letter-spacing: 0.14px;
  color: var(--text-n9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feed-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  letter-spacing: 0.14px;
  color: var(--text-n9);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feed-text:empty {
  display: none;
}

.feed-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xxs);
  height: 20px;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  color: var(--text-n5);
  white-space: nowrap;
}

/* ── Actions (X / Reddit) ── */
.feed-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.feed-action {
  display: flex;
  align-items: center;
  gap: var(--spacing-xxxs);
  overflow: hidden;
}

.feed-action-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.feed-action span {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.12px;
  color: var(--text-n5);
  white-space: nowrap;
}

/* ── Thumbnail ── */
.feed-thumb {
  width: 88px;
  height: 70px;
  border-radius: var(--radius-ct-s);
  border: 1px solid var(--line-l07);
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

.feed-thumb img:not(.feed-thumb-play) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.feed-thumb-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
}
```

### Template — Podcast / Youtube / News

These three types share the same layout. Podcast and Youtube use fixed CDN
platform logos; News uses the source website's favicon. Only Podcast and
Youtube thumbnails show a play button.

```html
<!-- Feed Card (Podcast / Youtube / News) — copy this structure exactly -->
<div class="widget-card">
  <div class="widget-title">
    <span class="widget-title-text">Feed Title</span>
  </div>
  <div
    class="widget-body"
    style="background:var(--grey-g01);flex-direction:column;align-items:stretch;"
  >
    <div class="feed-body">
      <!-- Podcast item (avatar = CDN platform logo) -->
      <div class="feed-item">
        <div class="feed-item-main">
          <div class="feed-header">
            <div class="feed-avatar">
              <img
                src="https://alva-ai-static.b-cdn.net/icons/logo-social-podcast.svg"
                alt=""
              />
            </div>
            <div class="feed-title">Headline text, single line with ellipsis</div>
          </div>
          <div class="feed-content">
            <div class="feed-text">
              Body text capped at two lines (44px). Overflow is hidden...
            </div>
            <div class="feed-info">
              <span>Podcast</span>
              <span>·</span>
              <span>Jan 21</span>
              <span>·</span>
              <span>By Danya</span>
            </div>
          </div>
        </div>
        <!-- optional thumbnail (Podcast / Youtube get play button) -->
        <div class="feed-thumb">
          <img src="thumb.jpg" alt="" />
          <img
            class="feed-thumb-play"
            src="https://alva-ai-static.b-cdn.net/icons/play.svg"
            alt=""
          />
        </div>
      </div>
      <!-- Youtube item (avatar = CDN platform logo, no-radius) -->
      <div class="feed-item">
        <div class="feed-item-main">
          <div class="feed-header">
            <div class="feed-avatar no-radius">
              <img
                src="https://alva-ai-static.b-cdn.net/icons/logo-social-youtube.svg"
                alt=""
              />
            </div>
            <div class="feed-title">Headline text, single line with ellipsis</div>
          </div>
          <div class="feed-content">
            <div class="feed-text">Body text...</div>
            <div class="feed-info">
              <span>Youtube</span>
              <span>·</span>
              <span>Jan 21</span>
              <span>·</span>
              <span>By Danya</span>
            </div>
          </div>
        </div>
        <div class="feed-thumb">
          <img src="thumb.jpg" alt="" />
          <img
            class="feed-thumb-play"
            src="https://alva-ai-static.b-cdn.net/icons/play.svg"
            alt=""
          />
        </div>
      </div>
      <!-- News item (avatar = website favicon, no play button) -->
      <div class="feed-item">
        <div class="feed-item-main">
          <div class="feed-header">
            <div class="feed-avatar">
              <img src="https://website.com/favicon.png" alt="" />
            </div>
            <div class="feed-title">Headline text, single line with ellipsis</div>
          </div>
          <div class="feed-content">
            <div class="feed-text">Body text...</div>
            <div class="feed-info">
              <span>Reuters</span>
              <span>·</span>
              <span>Jan 21</span>
              <span>·</span>
              <span>By Danya</span>
            </div>
          </div>
        </div>
        <div class="feed-thumb">
          <img src="thumb.jpg" alt="" />
        </div>
      </div>
      <!-- more feed-items... -->
    </div>
    <div class="alva-watermark">
      <img
        src="https://alva-ai-static.b-cdn.net/icons/alva-watermark.svg"
        alt="Alva"
      />
    </div>
  </div>
</div>
```

### Template — X (Twitter)

```html
<!-- Feed Card (X) — copy this structure exactly -->
<div class="feed-item">
  <div class="feed-item-main">
    <div class="feed-header">
      <div class="feed-avatar has-badge">
        <img src="user-avatar.jpg" alt="" />
        <div class="feed-avatar-badge">
          <img
            src="https://alva-ai-static.b-cdn.net/icons/logo-feed-x.svg"
            alt=""
          />
        </div>
      </div>
      <div class="feed-header-meta">
        <span class="feed-display-name">Tesla Owners SV</span>
        <span class="feed-handle">@teslaownersSV</span>
        <span class="feed-meta-sep">·</span>
        <span class="feed-meta-date">Jan 21</span>
      </div>
    </div>
    <div class="feed-content">
      <div class="feed-text">
        Elon Musk: "It appears that, when civilizations are under stress..."
      </div>
      <div class="feed-actions">
        <div class="feed-action">
          <img
            class="feed-action-icon"
            src="https://alva-ai-static.b-cdn.net/icons/social-reply-l.svg"
            alt=""
          />
          <span>12</span>
        </div>
        <div class="feed-action">
          <img
            class="feed-action-icon"
            src="https://alva-ai-static.b-cdn.net/icons/social-repost-l.svg"
            alt=""
          />
          <span>14</span>
        </div>
        <div class="feed-action">
          <img
            class="feed-action-icon"
            src="https://alva-ai-static.b-cdn.net/icons/social-like-l.svg"
            alt=""
          />
          <span>285</span>
        </div>
      </div>
    </div>
  </div>
  <!-- optional thumbnail (no play button) -->
  <div class="feed-thumb">
    <img src="thumb.jpg" alt="" />
  </div>
</div>
```

### Template — Reddit

```html
<!-- Feed Card (Reddit) — copy this structure exactly -->
<div class="feed-item">
  <div class="feed-item-main">
    <div class="feed-header">
      <div class="feed-avatar has-badge">
        <img src="user-avatar.jpg" alt="" />
        <div class="feed-avatar-badge">
          <img
            src="https://alva-ai-static.b-cdn.net/icons/logo-feed-reddit.svg"
            alt=""
          />
        </div>
      </div>
      <div class="feed-header-meta">
        <span class="feed-display-name">r/interesting</span>
        <span class="feed-meta-sep">·</span>
        <span class="feed-meta-date">Jan 21</span>
      </div>
    </div>
    <div class="feed-content">
      <div class="feed-post-title">How to I Invest in Silver or Gold?</div>
      <div class="feed-text">
        The ishares physical versions are "paper gold/silver"...
      </div>
      <div class="feed-actions">
        <div class="feed-action">
          <img
            class="feed-action-icon"
            src="https://alva-ai-static.b-cdn.net/icons/social-vote-l.svg"
            alt=""
          />
          <span>14</span>
        </div>
        <div class="feed-action">
          <img
            class="feed-action-icon"
            src="https://alva-ai-static.b-cdn.net/icons/social-reply-l.svg"
            alt=""
          />
          <span>12</span>
        </div>
      </div>
    </div>
  </div>
  <!-- optional thumbnail (no play button) -->
  <div class="feed-thumb">
    <img src="thumb.jpg" alt="" />
  </div>
</div>
```

### Feed Card Rules

#### Avatar / Logo by Source Type

| Type    | Avatar (22×22)                                       | Badge (14×14)                 | Thumbnail Play |
| ------- | ---------------------------------------------------- | ----------------------------- | -------------- |
| Podcast | CDN fixed: `logo-social-podcast.svg`                 | —                             | Yes            |
| Youtube | CDN fixed: `logo-social-youtube.svg` (**no-radius**) | —                             | Yes            |
| News    | Website favicon / logo (round)                       | —                             | No             |
| X       | User avatar (round)                                  | `logo-feed-x.svg` (CDN)      | No             |
| Reddit  | User avatar (round)                                  | `logo-feed-reddit.svg` (CDN) | No             |

- `.feed-avatar` is always 22×22 with `border-radius: 100px`.
- **Youtube** logo is rectangular — add `.no-radius` to `.feed-avatar` to
  remove the circular clip.
- **Podcast / Youtube** use platform logos from CDN
  (`https://alva-ai-static.b-cdn.net/icons/logo-social-podcast.svg`,
  `https://alva-ai-static.b-cdn.net/icons/logo-social-youtube.svg`).
- **News** uses the source website's favicon or logo image.
- For X / Reddit, add `.has-badge` to `.feed-avatar` (disables `overflow:hidden`
  so the badge can overflow the circle).
- Badge background uses `--b0-container` to mask the avatar edge; inner icon is
  12×12 with `border-radius: 100px`.
- X badge: `https://alva-ai-static.b-cdn.net/icons/logo-feed-x.svg`.
- Reddit badge: `https://alva-ai-static.b-cdn.net/icons/logo-feed-reddit.svg`.

#### Layout Rules

- **Header row** (`.feed-header`): avatar + title or meta, `gap: 6px`.
- **Content** (`.feed-content`): indented `padding-left: var(--spacing-xxl)`
  (28px = 22px avatar + 6px gap) to align with header text.
- **Body text** (`.feed-text`): auto height, max 2 lines via `-webkit-line-clamp: 2`.
  Collapses via `:empty` when body is blank.
- **Post title** (`.feed-post-title`): Reddit only; single line, `font-weight: 500`,
  placed before `.feed-text`.
- **Info line** (`.feed-info`): for Podcast / Youtube / News — `Source · Date · By Author`.
- **Actions** (`.feed-actions`): for X / Reddit — icon 14×14 + count, `gap: var(--spacing-xs)`.
- **Thumbnail** (`.feed-thumb`): 88×70, right side via flex order,
  `border: 1px solid var(--line-l07)`. Optional for all types.
- **Play button**: Podcast and Youtube thumbnails show a centered play icon
  (`.feed-thumb-play`, 28×28).
- **Divider** (`.feed-item::after`): 1px line between items, inset by
  `var(--spacing-m)` on both sides. Hidden on `:last-child`. **`.feed-item`
  must be a direct child of `.feed-body`** — do NOT wrap it in `<a>` or any
  other element. Wrapping breaks `:last-child` (every item becomes the only
  child of its wrapper, so all dividers disappear). Use `data-href` +
  delegated click instead:

  ```html
  <div class="feed-item" data-href="https://...">...</div>
  ```

  ```js
  document.addEventListener("click", function(e) {
    var el = e.target.closest(".feed-item[data-href]");
    if (!el) return;
    var url = el.getAttribute("data-href");
    var m = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
    if (m) {
      document.getElementById("yt-frame").src =
        "https://www.youtube.com/embed/" + m[1] + "?autoplay=1";
      document.getElementById("yt-modal").classList.add("open");
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  });
  ```

- **YouTube links open inline** via `youtube.com/embed/{id}` in a modal
  overlay. Close on backdrop click or close button; set `iframe.src = ""`
  on close to stop playback.

  ```css
  .yt-modal {
    display: none; position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); z-index: 9999;
    align-items: center; justify-content: center;
  }
  .yt-modal.open { display: flex; }
  .yt-modal-inner {
    position: relative; width: 90%; max-width: 800px;
    aspect-ratio: 16/9; border-radius: var(--radius-ct-s);
    overflow: hidden; background: #000;
  }
  .yt-modal-inner iframe { width: 100%; height: 100%; border: 0; }
  .yt-modal-close {
    position: absolute; top: -32px; right: 0;
    width: 28px; height: 28px; border: none; background: none;
    color: #fff; font-size: 20px; cursor: pointer;
    line-height: 28px; text-align: center;
  }
  ```

  ```html
  <div class="yt-modal" id="yt-modal">
    <div class="yt-modal-inner">
      <button class="yt-modal-close" id="yt-close">&times;</button>
      <iframe id="yt-frame" src="" allow="autoplay; encrypted-media"
        allowfullscreen></iframe>
    </div>
  </div>
  ```

  ```js
  document.getElementById("yt-close").addEventListener("click", function() {
    document.getElementById("yt-modal").classList.remove("open");
    document.getElementById("yt-frame").src = "";
  });
  document.getElementById("yt-modal").addEventListener("click", function(e) {
    if (e.target === this) {
      this.classList.remove("open");
      document.getElementById("yt-frame").src = "";
    }
  });
  ```

---

## Group Title

Not a widget-card; a page-level section separator.

### CSS

```css
.section-title {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.section-title-icon {
  font-size: 22px;
  line-height: 1;
}

.section-title-text {
  font-size: 22px;
  font-weight: 400;
  color: var(--text-n9);
  letter-spacing: 0.22px;
}

.section-title-sub {
  font-size: 12px;
  letter-spacing: 0.12px;
  color: var(--text-n5);
  padding-left: 8px;
  border-left: 1px solid var(--line-l07);
}
```

### Template

```html
<!-- Group Title — copy this structure exactly -->
<div class="section-title">
  <span class="section-title-icon">🖥️</span>
  <!-- optional -->
  <span class="section-title-text">Data Center (AI GPUs)</span>
  <span class="section-title-sub">Highest Heat · Blackwell</span>
  <!-- optional -->
</div>
```

| Property               | Specification                                             |
| ---------------------- | --------------------------------------------------------- |
| Subtitle separator     | `·` (middle dot), one space on each side between keywords |
| Max subtitle keywords  | No more than 3                                            |
| Row gap to next widget | Page standard `gap: 24px`                                 |
