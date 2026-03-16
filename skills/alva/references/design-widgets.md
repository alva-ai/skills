# Widget Design Guideline

## Widget Types

- [Critical Rules (TL;DR)](#critical-rules-tldr)
- [Widget Base CSS](#widget-base-css)
- [Widget Layout](#widget-layout)
- [Chart Card](#chart-card)
- [KPI Card](#kpi-card)
- [Table Card](#table-card)
- [Free Text Card](#free-text-card)
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

## Widget Base CSS

> **Include this entire block in every playbook / dashboard page.** It contains
> all shared widget styles. Do not rewrite or partially recreate these classes.

```css
/* ── Widget Card ── */
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
  left: var(--spacing-m);
  opacity: 0.2;
  line-height: 0;
}

/* ── Chart Card ── */
.chart-dotted-background {
  background-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 0.18) 0.6px,
    transparent 0.6px
  );
  background-size: 3px 3px;
}

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

/* ── Table Card ── */
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

/* ── Free Text Card ── */
.free-text-body {
  padding: var(--spacing-l);
}

/* ── Feed Card ── */
.feed-body {
  padding: var(--spacing-xxs) 0;
}

.feed-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
  padding: var(--spacing-m);
  position: relative;
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
  order: 1;
  object-fit: cover;
}

/* ── Dividers ── */
.divider-v {
  width: 1px;
  flex-shrink: 0;
  margin-block: 20px;
  background-color: var(--line-l05);
}

.divider-h {
  height: 1px;
  margin-inline: 20px;
  background-color: var(--line-l05);
}

/* ── Equal Height Fill ── */
.widget-card .widget-body.fill {
  flex: 1;
  height: 0;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 180px;
}

/* ── Widget Grid ── */
.widget-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: var(--spacing-xl);
  align-items: stretch;
}

.col-2 { grid-column: span 2; }
.col-3 { grid-column: span 3; }
.col-4 { grid-column: span 4; }
.col-5 { grid-column: span 5; }
.col-6 { grid-column: span 6; }
.col-8 { grid-column: span 8; }

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
  .col-2 { grid-column: span 2; }
  .col-3, .col-4, .col-5, .col-6, .col-8 {
    grid-column: span 4;
  }
  .col-thirds {
    grid-column: span 4;
    grid-template-columns: 1fr;
  }
}

/* ── KPI Column (for stacking KPI cards beside a chart) ── */
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

/* ── Group Title ── */
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
  letter-spacing: 0.3px;
}

.section-title-sub {
  font-size: 11px;
  color: var(--text-n5);
  padding-left: 8px;
  border-left: 1px solid var(--line-l07);
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

For true equal-width three columns, use `.col-thirds` (see Base CSS).

### Equal-Height Fill

When widgets share a row with different content heights, the shorter must fill
the row height:

1. `.widget-grid` already sets `align-items: stretch`
2. `.widget-card` uses `flex-direction: column`
3. Add `flex: 1` to `.widget-body` (use `.widget-body.fill`)
4. ECharts containers: `height: 100%; min-height: 180px`

### Content Reflow

Use `.widget-row` from Base CSS for widget-internal horizontal layouts.
Charts and tables never wrap — they always fill `width: 100%`.

### Widget Height

| Widget Type    | Default Height         | Overflow Behavior        |
| -------------- | ---------------------- | ------------------------ |
| KPI Card       | auto (content-driven)  | Wrap via flex-wrap       |
| Chart Card     | 320px                  | Chart scales internally  |
| Table Card     | auto, capped at 560px  | Scroll within table body |
| Free Text Card | auto (content-driven)  | Scroll or truncate       |
| Feed Card      | auto, capped at 560px  | Scroll within feed body  |

**Table Card / Feed Card**: Content < 320px → auto height fits content;
content ≥ 320px → use a 320px body with internal scroll. Do not exceed 560px
total height.

Max height for all widgets: **960px**. Apply `overflow-y: auto` to the widget
body (not the entire card) when exceeded.

### Widget Background

**Do NOT add border/outline to widgets or cards.** Use background color or
dividers for visual separation. Only Tag elements may have borders.

| Widget Type | Background                                          |
| ----------- | --------------------------------------------------- |
| Chart Card  | Dotted pattern (`.chart-dotted-background`)         |
| Table Card  | None (transparent)                                  |
| Others      | `background-color: var(--grey-g01)` (`#fafafa`)     |

### Divider

Widget internal dividers must not span full width; both ends align with content
padding. Use `.divider-v` / `.divider-h` from Base CSS. **Do not use**
`border-bottom` or `border-right` for widget-internal dividers.

---

## Chart Card

### Template

```html
<!-- Chart Card — copy this structure exactly -->
<div class="widget-card">
  <div class="widget-title">
    <span class="widget-title-text">Chart Title</span>
    <span class="widget-timestamp">12:30</span>  <!-- optional -->
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
    <div id="chart-xxx" style="width:100%;height:280px;"></div>
    <!-- Watermark: always inside chart-body, always this exact structure -->
    <div class="alva-watermark">
      <img src="https://alva-ai-static.b-cdn.net/icons/alva-watermark.svg" alt="Alva" />
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

1. Use ECharts.
2. Legend and chart areas must not overlap.
3. **Do NOT set** ECharts `backgroundColor` — the dotted pattern handles it.
4. Select colors from the chart palette in
   [design-tokens.css](./design-tokens.css). Avoid duplicates.
5. **Grey** (`--chart-grey-*`) is only allowed when chart has **≥ 3 series**.

### Axis Rules

```javascript
// Shared axis config — must use every time a chart is generated
const AX = {
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: {
    fontSize: 10,
    color: "var(--text-n7)",
    fontFamily: "'Delight', -apple-system, BlinkMacSystemFont, sans-serif",
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
  lineStyle: { color: "var(--line-l3)", type: [3, 2], width: 1 },
  label: { show: false },
}
```

### Tooltip

```javascript
// Shared formatter factory (define once per file)
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

// Shared tooltip config
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

| Property | Value |
| -------- | ----- |
| Line width | 1px (`lineStyle: { width: 1 }`) |
| Smoothing | `smooth: 0.1` |
| Area fill | Gradient 15%→0% when 1–2 lines; none when ≥ 3 lines |

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

## KPI Card

### Template

```html
<!-- KPI Card — copy this structure exactly -->
<div class="widget-card">
  <div class="widget-title">
    <span class="widget-title-text">KPI Title</span>
  </div>
  <div class="widget-body" style="background:var(--grey-g01);padding:var(--spacing-l);flex-direction:column;align-items:flex-start;">
    <!-- Single KPI -->
    <div style="font-size:11px;color:var(--text-n7);letter-spacing:0.12px;">Label</div>
    <div style="font-size:24px;color:var(--main-m3);">+18.4%</div>
    <!-- Watermark -->
    <div class="alva-watermark">
      <img src="https://alva-ai-static.b-cdn.net/icons/alva-watermark.svg" alt="Alva" />
    </div>
  </div>
</div>
```

### KPI Rules

- Key metric font size: 24px or 28px
- When multiple metrics share one card, use `.divider-v` / `.divider-h` to
  separate — **do NOT nest sub-cards**

### Color Rules

| Type     | Class       | Color | Example        | Design Token |
| -------- | ----------- | ----- | -------------- | ------------ |
| Positive | `.positive` | Green | Return +18%    | --main-m3    |
| Negative | `.negative` | Red   | Drawdown -12%  | --main-m4    |
| Neutral  | `.neutral`  | Black | Volatility 22% | --text-n9    |

---

## Table Card

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
      <div class="table-cell" style="flex:1.2;padding:0 16px 12px 0;">Symbol</div>
      <div class="table-cell" style="flex:1;padding:0 16px 12px 16px;">Side</div>
      <div class="table-cell" style="flex:1.2;padding:0 16px 12px 16px;">Quantity</div>
    </div>
    <!-- Body rows -->
    <div class="table-row table-body-row">
      <div class="table-cell" style="flex:1.2;padding:12px 16px 12px 0;">AAPL</div>
      <div class="table-cell" style="flex:1;padding:12px 16px;">LONG</div>
      <div class="table-cell" style="flex:1.2;padding:12px 16px;">100</div>
    </div>
  </div>
</div>
```

### Table Rules

- **No background color** on table card
- All text: **Delight Regular (400)** only, no bold
- Row-first flex layout. **Do NOT use column-first layout.**

| Element     | Font  | Color       |
| ----------- | ----- | ----------- |
| Header cell | 14px  | `--text-n7` |
| Body cell   | 14px  | `--text-n9` |

| Element     | Padding (first col) | Padding (other cols) | Border Bottom               |
| ----------- | ------------------- | -------------------- | --------------------------- |
| Header cell | `0 16px 12px 0`     | `0 16px 12px 16px`   | `1px solid var(--line-l07)` |
| Body cell   | `12px 16px 12px 0`  | `12px 16px`          | `1px solid var(--line-l07)` |

Body cell additional constraints: `max-height: 180px`, `white-space: nowrap`,
`width: 100%`.

### Responsive

- `>= 960px`: Full table, no scroll
- `< 960px`: Horizontal `overflow-x: auto`, scrollable content
- No hover effects (static display)

---

## Free Text Card

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
      <img src="https://alva-ai-static.b-cdn.net/icons/alva-watermark.svg" alt="Alva" />
    </div>
  </div>
</div>
```

Use the Markdown component from
[design-components.md](./design-components.md) for rich text rendering.

---

## Feed Card

### Template

```html
<!-- Feed Card — copy this structure exactly -->
<div class="widget-card">
  <div class="widget-title">
    <span class="widget-title-text">Feed Title</span>
  </div>
  <div class="widget-body" style="background:var(--grey-g01);flex-direction:column;align-items:stretch;">
    <div class="feed-body">
      <div class="feed-item">
        <div class="feed-item-content">
          <div><!-- headline --></div>
          <div><!-- description --></div>
        </div>
        <img class="feed-thumb" src="thumb.jpg" alt="" />  <!-- optional -->
      </div>
      <!-- more feed-items... -->
    </div>
    <div class="alva-watermark">
      <img src="https://alva-ai-static.b-cdn.net/icons/alva-watermark.svg" alt="Alva" />
    </div>
  </div>
</div>
```

> Thumbnail (`.feed-thumb`) is always on the right via `order: 1`. Text fills
> remaining width via `flex: 1`.

---

## Group Title

Not a widget-card; a page-level section separator.

### Template

```html
<!-- Group Title — copy this structure exactly -->
<div class="section-title">
  <span class="section-title-icon">🖥️</span>             <!-- optional -->
  <span class="section-title-text">Data Center (AI GPUs)</span>
  <span class="section-title-sub">Highest Heat · Blackwell</span>  <!-- optional -->
</div>
```

| Property              | Specification                                             |
| --------------------- | --------------------------------------------------------- |
| Subtitle separator    | `·` (middle dot), one space on each side between keywords |
| Max subtitle keywords | No more than 3                                            |
| Row gap to next widget | Page standard `gap: 24px`                                |
