# Ranked-List Screener Playbook

Reference structure + screener-specific styling for any composite-score screener
(stocks, crypto, etc.). Built from `quality-value-screener-clean`.

---

## Design System Compliance (READ FIRST)

Before writing HTML, read from the Alva skill:

- `references/design-tokens.css` — all spacing, color, radius tokens. Use as-is, do NOT override.
- `references/design-widgets.md` — Chart Card / Metric Card / Table Card base specs.
  This playbook only documents screener-unique rules on top of that.
- `references/design-components.md` — Tab, Dropdown, Pill primitives.

**Rule of thumb**: if a token or base spec already exists in the design system,
reference it here by name — do not re-spec it.

---

## Component Index

Structural:

- [Page Layout](#page-layout)
- [Header](#header) · [Snapshot Picker](#snapshot-picker)
- [Tab 1 — Overview](#tab-1--overview)
- [Tab 2 — Movers & Trends](#tab-2--movers--trends-optional)
- [Tab 3 — Analysis](#tab-3--analysis-optional)
- [Tab 4 — Methodology](#tab-4--methodology)
- [Cron](#cron)

Screener-unique components (CSS inline):

- [Ranked Table (sticky cols)](#ranked-table) · [Score Bar](#score-bar) · [Band Pill](#band-pill)
- [Delta Tag](#delta-tag--delta-score) · [Flag Pill](#flag-pill) · [Flag Card](#flag-card)
- [Expand Row](#expand-row) · [Factor Breakdown](#factor-breakdown) · [Gauge Ring](#gauge-ring)
- [Movers Card](#movers-card) · [Basket Trend Chart](#basket-trend-chart)
- [Method Section](#method-section) · [Worked Example](#worked-example)

---

## Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ <Screener Name>                                              │
│ Last updated · <ts EST> · Refreshes <schedule EST>           │
│ <One-sentence summary>                                       │
├──────────────────────────────────────────────────────────────┤
│ [ Overview · Movers & Trends · Analysis · Methodology ]      │
├──────────────────────────────────────────────────────────────┤
│ <Tab content>              [Snapshot ▼: Today, Apr 17 EST]   │
│  ... ranked table / charts / docs ...                        │
└──────────────────────────────────────────────────────────────┘
```

Container: `.playbook-container` from design-widgets.md (`max-width: 2048px`,
`padding: var(--spacing-m) var(--spacing-xxl) var(--spacing-xxxxl)`, mobile
`padding: var(--spacing-m)`). Do not re-spec.

Tab bar: Underline-M style from `design-components.md#tab`. Sits above the
content panels; the snapshot picker is anchored to the right of the tab bar row
on desktop, wraps to its own row on mobile.

---

## Header

Sticky across all tabs. Three pieces, left to right then wrap:

- **Title** — 24px / 400 weight / line-height 34px, `--text-n9`.
- **Last-updated pill** — 1px border `--line-l07`, pulsing dot (`--main-m3`),
  height 28px. Shows the latest snapshot timestamp; **not** affected by the
  snapshot picker.
- **Refresh badge** — tinted `--main-m1-10`, text `--main-m1`, height 28px.
  Label format: `Refreshes <schedule> EST`.
- **One-sentence summary** — 14px / `--text-n5`, below the row. No "What this is"
  duplicate.

Base `.playbook-title` + `.playbook-desc` come from design-system.md#playbook-header —
do not re-spec. Screener only adds header-row layout (so the title can share a
flex row with meta pills) and the pills themselves:

```css
.playbook-header { display:flex; align-items:center; flex-wrap:wrap;
  row-gap: var(--spacing-xs); margin-bottom: var(--spacing-xs); }
/* Flex-row extensions on design-system.md .playbook-title */
.playbook-title { margin-right: auto; white-space: nowrap; }

.header-meta { display:flex; align-items:center; gap: var(--spacing-xs); flex-wrap:wrap;
  font-size:12px; color:var(--text-n5); }
.header-meta .refresh-badge { display:inline-flex; align-items:center; gap:6px;
  background: var(--main-m1-10); color:var(--main-m1);
  padding:0 10px; border-radius: var(--radius-ct-s); height:28px; font-size:12px; }
.header-meta .refresh-badge::before { content:''; width:6px; height:6px;
  border-radius:50%; background:var(--main-m3);
  animation:pulse 2s ease-in-out infinite; }
.header-meta .last-updated { display:inline-flex; align-items:center; gap:6px;
  border:1px solid var(--line-l07); color:var(--text-n5);
  padding:0 10px; border-radius: var(--radius-ct-s); height:28px; font-size:12px; }
.header-meta .last-updated::before { content:''; display:inline-block;
  width:6px; height:6px; background:var(--main-m3); border-radius:50%; }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
```

---

## Snapshot Picker

Pure view filter — switches which historical snapshot drives the tab content.
Never mutates data, never changes the header timestamp.

**Naming** — match the label to the cadence:

- Daily or slower → `Date` ("Today, Apr 17 EST", "Apr 16 EST", …)
- Intraday (≥ hourly) → `Snapshot` or `Time` ("Today 4:00 PM EST", …)
- Weekly/monthly → `Week of` / `Month` ("Week of Apr 13", "Mar 2026", …)

**Behavior**:

- Lists all available historical snapshots (most recent first), defaults to latest.
- Filters Overview / Movers / Analysis only. Methodology is static; picker is
  hidden (`visibility: hidden`, keeps layout) there.
- "Δ vs prior" calculations on the selected tab use the snapshot immediately
  before the picked one.
- First-load smoothness: picker hidden entirely when only 1 snapshot exists.

**History accumulation** *(must follow)*:

1. **First run = today only.** Don't fake-backfill past dates from current SDK
   queries — point-in-time SDK calls return *currently revised* data, not real
   historical state. Misleading.
2. **Every cron run appends a new snapshot, never overwrites.** Each snapshot
   stays in `screener/rankings` + `screener/summary` indefinitely.
3. **No retention pruning by default.** Keep full history so picker, Movers
   Δ-calcs, and basket-trend chart all work on real data.

**Visual** — minimal inline trigger (no button chrome), label + value + sub +
caret. Menu is a dropdown with tier-colored active state.

```css
.filter-dropdown { position:relative; display:inline-flex; align-items:center; }
.filter-dropdown-trigger { background:transparent; border:none; border-radius:0;
  padding:0 0 6px 0; margin-bottom: var(--spacing-xxxs);
  font-size:12px; color:var(--text-n9); line-height:20px;
  cursor:pointer; display:inline-flex; align-items:center; gap: var(--spacing-xs);
  transition:color .15s; }
.filter-dropdown-trigger:hover,
.filter-dropdown.open .filter-dropdown-trigger { color:var(--main-m1); }
.filter-dropdown-label { color:var(--text-n5); font-size:12px; }
.filter-dropdown-value { color:var(--text-n9); flex:1;
  display:inline-flex; align-items:baseline; gap:6px; }
.filter-dropdown-value-sub { font-size:11px; color:var(--text-n5); }
.filter-dropdown-caret { display:inline-block; width:12px; height:12px;
  background-color:var(--text-n2);
  -webkit-mask:url('https://alva-ai-static.b-cdn.net/icons/arrow-down-f2.svg') no-repeat center / contain;
          mask:url('https://alva-ai-static.b-cdn.net/icons/arrow-down-f2.svg') no-repeat center / contain;
  transition:transform .15s, background-color .15s; }
.filter-dropdown.open .filter-dropdown-caret { transform:rotate(180deg);
  background-color:var(--main-m1); }
.filter-dropdown-menu { position:absolute; top:calc(100% + 6px); right:0;
  min-width:220px; background:var(--b0-container);
  border:0.5px solid var(--line-l2); border-radius:var(--radius-pop-dropdown);
  box-shadow:var(--shadow-s); padding: var(--spacing-xxs); z-index:100; display:none; }
.filter-dropdown.open .filter-dropdown-menu { display:block; }
.filter-dropdown-item { display:flex; align-items:baseline;
  justify-content:space-between; padding: var(--spacing-xs) var(--spacing-s);
  font-size:14px; color:var(--text-n9); line-height:22px;
  background:transparent; border:none; cursor:pointer; width:100%;
  border-radius: var(--radius-ct-s); text-align:left; }
.filter-dropdown-item:hover { background:var(--grey-g01); }
.filter-dropdown-item.active { background: var(--main-m1-10);
  color:var(--main-m1); }
.filter-dropdown-item-sub { font-size:11px; color:var(--text-n5);
  margin-left: var(--spacing-s); }
```

---

## Tab 1 — Overview (default)

Full ranked table. Always the landing tab.

### Row anchor

**Required**: `<primary identifier> · ⌄` (the row anchor + expand caret).

The **primary identifier** is the unique label for each row in the screener's
universe — the thing a user thinks of as "the row":

- Stocks/ETFs → ticker (`PLTR`, `NVDA`, `SPY`)
- Crypto → symbol or pair (`BTC`, `ETH-USD`)
- Bonds → ISIN / CUSIP
- Sectors / themes → sector or theme name

### Columns

**Often-used** — pick what matters for *this* screener. None are mandatory:

- Position: Rank (only if ranked, not a flat basket)
- Score: composite score (only if there's a scoring formula; basket-style pass/fail
  screeners omit this)
- Identity: Name, Sector, Industry, Asset Class
- Movement: Δ Rank, Δ Score (vs prior snapshot — only if Rank/Score exist)
- Inclusion signal *(basket-style)*: "Days in basket", "Entry date", "Exit reason"
- Risk/quality signals: Flag (descriptive label, tier-colored)
- Relevant metrics: fundamentals / technicals / on-chain / etc.

Order columns by importance left-to-right. If there's no Rank/Score, sort by the
most relevant metric (e.g. market cap, entry date) and make that column primary.

### Ranked Table

Built on the Table Card base from design-widgets.md. Screener-specific
additions: horizontal scroll, sticky `#` and primary-identifier columns to the
left, sticky caret column to the right, expandable rows.

Structural rules:

- Each `.table-row` is its own box (`min-width: max-content`) so its background
  and bottom border cover every cell — including cells that overflow during
  horizontal scroll.
- Row content is inset `var(--spacing-m)` from the left via `padding-left`;
  right inset comes from the 40px sticky caret cell. Dividers span the full
  table-card width.
- Column 1 (`#`, 48px) and column 2 (primary identifier, 88px) are pinned left.
  Their `box-shadow` extends the cell background leftward to cover the row's
  `padding-left` and the flex gap between them — otherwise scrolled content
  bleeds through.
- Hover tint is applied via an `::after` overlay (z-index 3) so the tint is
  uniform across sticky and non-sticky cells (avoids double-stacking of
  semi-transparent `--b-r02`).
- When a row is expanded, hide its bottom border — the expand-panel below
  carries the divider instead.

```css
#rankings-table .table-row { position: relative;
  padding-left: var(--spacing-m);
  box-sizing: border-box; min-width: max-content;
  border-bottom: 1px solid var(--line-l07); }
#rankings-table .expand-panel { position: sticky; left: 0;
  padding: var(--spacing-xl) var(--spacing-m) var(--spacing-xxl);
  box-sizing: border-box;
  border-bottom: 1px solid var(--line-l07); }
#rankings-table .caret-cell { position: sticky; right: 0; z-index: 2;
  background: var(--b0-page); }
#rankings-table .table-row .table-cell:nth-child(1),
#rankings-table .table-row .table-cell:nth-child(2) {
  position: sticky; z-index: 2; background: var(--b0-page);
  box-shadow: calc(-1 * var(--spacing-m)) 0 0 var(--b0-page); }
#rankings-table .table-row .table-cell:nth-child(1) { left: var(--spacing-m); }
#rankings-table .table-row .table-cell:nth-child(2) {
  left: calc(var(--spacing-m) + 48px + var(--spacing-m)); }
#rankings-table .table-row.expandable { cursor: pointer; }
#rankings-table .table-row.expandable::after {
  content: ''; position: absolute; inset: 0;
  background: transparent; pointer-events: none;
  z-index: 3; transition: background .15s; }
#rankings-table .table-row.expandable:hover::after { background: var(--b-r02); }
#rankings-table .table-row.expandable.open { border-bottom-color: transparent; }
#rankings-table > .table-body > .table-row:last-child,
#rankings-table > .table-body > .expand-panel:last-child { border-bottom: none; }

.expand-caret { display:inline-block; width:12px; height:12px;
  background-color: var(--text-n3);
  -webkit-mask: url('https://alva-ai-static.b-cdn.net/icons/arrow-down-f2.svg') no-repeat center / contain;
          mask: url('https://alva-ai-static.b-cdn.net/icons/arrow-down-f2.svg') no-repeat center / contain;
  transition: transform .2s, background-color .15s; }
.table-row.expandable.open .expand-caret { transform: rotate(180deg); }

/* Widget titles inside .expand-panel step down to 14px (vs 16px default) */
.expand-panel .widget-title-text { font-size: 14px; letter-spacing: 0.14px; }
```

### Score Bar

Score column combines a fill bar + numeric value, optional delta pill.

Color rules (score → color). Apply via inline style on `.score-bar-fill`;
JS may use `var(--token)` directly in `element.style.background`.

- `≥ 80` → `var(--main-m3)` (green, `#2a9b7d`)
- `≥ 70` → `#54a5c2` (blue — no direct main token; `--chart-blue2-1`)
- `≥ 60` → `var(--main-m6)` (amber, `#ff9800`)
- `< 60` → `var(--main-m4)` (red, `#e05357`)

```css
.score-cell { display:flex; align-items:center; gap: var(--spacing-xxs); }
.score-bar-track { width: 64px; height: 4px;
  background: var(--line-l07); border-radius: var(--radius-ct-xs);
  overflow: hidden; flex-shrink: 0; }
.score-bar-fill { height: 100%; border-radius: var(--radius-ct-xs); transition: width .4s; }
.score-value { font-size: 14px; min-width: 24px; letter-spacing: 0.14px; }
```

### Band Pill

Used on a scored screener to label the score tier. Four bands map 1:1 to the
Alva main palette: `elite` (m3 green), `strong` (m1 teal), `average` (m5 amber),
`weak` (m4 red). Suggested thresholds: 80+ / 70–79 / 60–69 / 0–59.

### Delta Tag / Delta Score

Rank Δ (vs prior snapshot) → pill:

- `up` → m3 green tint, "↑N"
- `down` → m4 red tint, "↓N"
- `flat` → grey tint, "—"
- `new` → m1 teal tint, "New"

Score Δ → inline text (not a pill): green `up`, red `down`, grey `—`. Threshold:
suppress when `|Δ| < 0.5`.

### Flag Pill

Shows the primary red flag in the table cell. `clean` (no flag) / `soft` /
`hard`. When a row has multiple flags, show the first label plus `+N`.

```css
.band-pill, .flag-pill, .delta-tag {
  display:inline-flex; align-items:center; justify-content:center;
  font-weight:400; white-space:nowrap;
  min-width:40px; padding:1px 6px;
  font-size:12px; line-height:20px; letter-spacing:0.12px;
  border-radius: var(--radius-ct-s); }

.band-pill.elite   { background: var(--main-m3-10); color: var(--main-m3); }
.band-pill.strong  { background: var(--main-m1-10); color: var(--main-m1); }
.band-pill.average { background: var(--main-m5-10); color: var(--main-m5); }
.band-pill.weak    { background: var(--main-m4-10); color: var(--main-m4); }

.delta-tag { gap: var(--spacing-xxxs); }
.delta-up   { background: var(--main-m3-10); color: var(--main-m3); }
.delta-down { background: var(--main-m4-10); color: var(--main-m4); }
.delta-flat { background: var(--b-r05);      color: var(--text-n5); }
.delta-new  { background: var(--main-m1-10); color: var(--main-m1); }
.delta-score { font-size:11px; margin-left: var(--spacing-xxs); letter-spacing:0.11px;
  color: var(--text-n5); }
.delta-score.up   { color: var(--main-m3); }
.delta-score.down { color: var(--main-m4); }

.flag-pill { gap: var(--spacing-xxs); }
.flag-pill.clean { background: var(--b-r05);      color: var(--text-n5); }
.flag-pill.soft  { background: var(--main-m5-10); color: var(--main-m5); }
.flag-pill.hard  { background: var(--main-m4-10); color: var(--main-m4); }
.flag-pill .flag-extra-count { color: var(--text-n7);
  font-size:10px; line-height:16px; margin-left: var(--spacing-xxxs); }
```

### Expand Row

Always include a **price/value chart** of the asset. Other blocks are optional —
mix & match based on what reveals *why* the row is in the basket.

Layout: 8-col grid inside the expand panel.

- Scored screener: row 1 = `col-4` Gauge Ring + `col-4` Factor Breakdown; row 2
  = `col-8` Price/K-line chart; row 3 = Flag cards (auto-fit grid).
- Unscored basket: row 1 = `col-8` Price/K-line; row 2 = custom narrative
  blocks (peer comparison, news links, holdings, on-chain stats, etc.).

Skip components that don't add insight.

### Price / K-line

Use the Chart Card base from design-widgets.md. K-line / candlestick by
default, or a line chart for assets without OHLC.

**Interval by screener cadence** (rule of thumb: interval ≤ update cadence,
enough bars to see the pattern the screener cares about):

- Quarterly fundamentals → daily bars, ~60–90 day window
- Daily / weekly → daily bars, ~30–90 day window
- Intraday momentum / technical → hourly or 15min bars, ~5–10 day window
- Long-cycle macro / monthly → weekly bars, ~1–2 year window

ECharts spec essentials (beyond design-widgets Chart Card defaults):

- 2 grids stacked: main (62% height) for candles, volume (18% height) below.
  Tops 4% / 76%, both `containLabel: true`.
- Candle up/down colors: `#2a9b7d` / `#e05357` (= `--main-m3` / `--main-m4`;
  ECharts canvas needs raw hex). Volume bars use 45% alpha of the same.
- Shared x-axis pointer via `axisPointer.link: [{ xAxisIndex:'all' }]`.
- Period-change pct rendered in the widget-timestamp line, color-coded by sign.

### Gauge Ring

ECharts `gauge` in the expand panel's Composite Score card. Not a screener-
unique primitive — spec it here because design-widgets.md doesn't cover gauges.

- Radius 78%, single progress arc (width 14, roundCap), no pointer/tick/label.
- Progress color = score color (same breakpoints as Score Bar).
- Center: big number (40px, weight 400, `var(--text-n9)`) + band label (12px,
  weight 500, tinted to score color) stacked via `rich` formatter.
- Card container = Chart Card with dotted background, center-aligned.

### Factor Breakdown

Rows: name (110px) + horizontal bar (flex) + raw pts `/ 100` + weight `×N%`.
Sits in a `grey-g01` widget body, flex column, justify center. Same widget
title size as the Gauge card so row heights match.

```css
.breakdown-title { font-size:12px; color:var(--text-n5); margin-bottom: var(--spacing-s); }
.breakdown-row { display:flex; align-items:center; padding: var(--spacing-xs) 0;
  font-size:14px; gap: var(--spacing-s);
  border-bottom:1px solid var(--line-l05); }
.breakdown-row:last-child { border-bottom:none; }
.breakdown-name { width:110px; color:var(--text-n9); }
.breakdown-bar  { flex:1; height:6px; background:var(--line-l07);
  border-radius:3px; overflow:hidden; min-width:60px; }
.breakdown-bar-fill { height:100%; border-radius:3px; transition: width .5s; }
.breakdown-raw { width:72px; text-align:right; color:var(--text-n7);
  font-size:12px; font-variant-numeric:tabular-nums; }
.breakdown-pts { width:68px; text-align:right; color:var(--text-n9);
  font-size:12px; font-variant-numeric:tabular-nums; }
```

### Flag Card

Shown at the bottom of the expand panel when a row has any active flag. Accent
bar only (no border/outline), tier-colored. Grid is auto-fit
`minmax(260px, 1fr)`.

```css
.flag-cards { margin-top: var(--spacing-xl);
  display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-xs); }
.flag-card { background: var(--grey-g01); border-radius: var(--radius-ct-l);
  padding: var(--spacing-s) var(--spacing-m) var(--spacing-s) calc(var(--spacing-m) + 3px);
  font-size:12px; line-height:20px; position: relative; overflow: hidden; }
.flag-card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:3px; }
.flag-card.hard::before { background: var(--main-m4); }
.flag-card.soft::before { background: var(--main-m5); }
.flag-card-title { font-size:12px; margin-bottom: var(--spacing-xxs);
  display:flex; align-items:center; gap: var(--spacing-xxs); }
.flag-card.hard .flag-card-title { color: var(--main-m4); }
.flag-card.soft .flag-card-title { color: var(--main-m5); }
.flag-card-tier { font-size:10px; padding:1px 6px; line-height:16px;
  border-radius: var(--radius-ct-xs); }
.flag-card.hard .flag-card-tier { background: var(--main-m4-10); }
.flag-card.soft .flag-card-tier { background: var(--main-m5-10); }
.flag-card-threshold { font-family:'JetBrains Mono', monospace;
  font-size:11px; padding:1px 6px; border-radius: var(--radius-ct-xs);
  background: var(--b-r02); color: var(--text-n7); }
.flag-card-body { color: var(--text-n7); margin-top: var(--spacing-xxs); }
```

---

## Tab 2 — Movers & Trends *(optional)*

Include only if there's meaningful day-to-day churn. Skip for slow-moving
screeners (quarterly fundamentals, long-cycle macro).

Common building blocks (pick what fits):

- **Movers cards** (§ below): Entries · Dropouts · Top Gainers · Top Decliners
  (vs prior snapshot)
- **Basket trend chart**: aggregate stat over time
- **Detail tables**: full gainers / decliners side-by-side
- **Sector/category rotation**: if relevant to the universe

### Movers Card

KPI-style: icon (22px, solid background) + label + count, then a list of rows.
Icon background applied via inline style — use tokens:

- Entries → `var(--main-m3)` (green)
- Dropouts → `var(--main-m4)` (red)
- Top Gainers → `var(--main-m3)` (green)
- Top Decliners → `var(--main-m6)` (amber)

Row detail colors: entries green, dropouts grey, gainers green / decliners red
depending on sign.

```css
.movers-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-m); }
@media (max-width:768px) { .movers-grid { grid-template-columns: repeat(2, 1fr); } }
.mover-card { background: var(--grey-g01); border-radius: var(--radius-ct-l);
  padding: var(--spacing-m) var(--spacing-l) var(--spacing-xs); min-height:160px; }
.mover-card-header { display:flex; align-items:center; gap: var(--spacing-xs);
  margin-bottom: var(--spacing-s); }
.mover-icon { width:22px; height:22px; border-radius: var(--radius-ct-s);
  display:flex; align-items:center; justify-content:center;
  font-size:13px; color: var(--b-common-white); flex-shrink:0; }
.mover-card-label { font-size:14px; color: var(--text-n9); }
.mover-card-count { font-size:12px; color: var(--text-n5); margin-left:auto; }
.mover-row { display:flex; align-items:center; justify-content:space-between;
  padding: var(--spacing-xs) 0; border-bottom:1px solid var(--line-l05); font-size:13px; }
.mover-row:last-child { border-bottom:none; }
.mover-ticker { color: var(--main-m1); }
.mover-name { font-size:11px; color: var(--text-n5);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  max-width:90px; margin-left: var(--spacing-xxs); }
.mover-detail { font-size:12px; }
.mover-empty { font-size:12px; color: var(--text-n5);
  padding: var(--spacing-s) 0; text-align:center; }
```

### Basket Trend Chart

Composite bar + line chart showing basket size & aggregate stat over time. Use
the Chart Card base from design-widgets.md.

Screener-specific ECharts rules:

- **Bar** (eligible count, yAxisIndex 0): `barMaxWidth: 16`. The bar for the
  currently-selected snapshot uses `--chart-purple1-main` (`#5f75c9`); all
  other bars use `--chart-purple1-2` (`#9ab1d7`). This visually pins the
  picker selection to the chart.
- **Line** (avg score, yAxisIndex 1, min 0 / max 100): `--chart-green1-main`
  (`#40a544`), width 1, `smooth: 0.1`, `showSymbol: false`. Area gradient 15%
  → 0% alpha of the same green.
- Hide the chart card entirely and show `.trend-empty` hint when < 2 snapshots
  exist (nothing meaningful to trend yet).

```css
.trend-empty { background: var(--grey-g01); border-radius: var(--radius-ct-l);
  padding: var(--spacing-xxxxl) var(--spacing-l); text-align:center;
  font-size:14px; color: var(--text-n5); line-height:22px; }
```

---

## Tab 3 — Analysis *(optional)*

Include only if cross-sectional patterns reveal something the ranked list
doesn't. Examples:

- 2D scatter / heatmap of two key factors, dot size/color = third dim
- Stacked bars decomposing top-N by contributing factor
- Distribution histograms / boxplots
- Correlation matrix between factors

Every chart goes in a Chart Card (design-widgets.md) with an
`.analysis-caption` sitting between the title and the chart body:

```css
.analysis-caption { font-size:12px; color: var(--text-n5); line-height:20px;
  margin-bottom: var(--spacing-m); letter-spacing: 0.12px; }
```

Common screener analysis charts (ECharts rules on top of Chart Card defaults):

- **Factor scatter** — dot color = band (use band palette), dot size = market
  cap mapped via `log10(cap/1e9 + 1) * 14`, clamped to `[10, 40]`. Labels on
  scatter points: `labelLayout: { hideOverlap: true }`.
- **Sector bar** — horizontal bars, color = score color (same breakpoints as
  Score Bar), right-side label shows "N stocks".

---

## Tab 4 — Methodology

Always include — explain how the screener works. Pick the subsections that apply:

- One-paragraph plain-English overview (always)
- Worked example (re-derive #1 from raw inputs) — for composite scores
- Factor weights + scoring formula — for weighted composites
- Filter rules / thresholds — for rule-based screeners
- Data sources & freshness
- "What this does NOT capture" caveats
- Glossary — if domain-specific terms

Skip subsections that don't apply (a momentum screener may have no factor
weights; a binary filter screener has no scoring formula).

### Method Section

Each subsection = `h3` title + `.method-body` (grey-g01 card) container. Inside
the body, use the bar rows for factor/band lists, `.method-code` for formulas,
and `.method-limit-list` for caveats.

```css
.method-section { margin-bottom: var(--spacing-xl); }
.method-section:last-child { margin-bottom: 0; }
.method-section h3 { font-size:16px; font-weight:400; color: var(--text-n9);
  line-height:22px; letter-spacing:0.16px; margin-bottom: var(--spacing-m); }
.method-body { background: var(--grey-g01); border-radius: var(--radius-ct-l);
  padding: var(--spacing-l); }
.method-body > *:first-child { margin-top: 0; }
.method-body > *:last-child  { margin-bottom: 0; }
.method-section p { font-size:14px; color: var(--text-n9); line-height:22px;
  margin-bottom: var(--spacing-xs); letter-spacing: 0.14px; }

/* Factor weights row (also used for score bands) */
.factor-row { display:flex; align-items:center; gap: var(--spacing-m);
  padding: var(--spacing-s) 0; border-bottom:1px solid var(--line-l05);
  width:100%; box-sizing:border-box; }
.factor-row:first-child { padding-top: 0; }
.factor-row:last-child  { border-bottom: none; padding-bottom: 0; }
.factor-name { width:160px; font-size:14px; color: var(--text-n9); flex-shrink:0; }
.factor-weight-label { width:40px; font-size:14px; color: var(--text-n7);
  text-align:right; flex-shrink:0; font-variant-numeric: tabular-nums; }
.factor-bar-track { flex:1; height:6px; background: var(--line-l07);
  border-radius:3px; overflow:hidden; }
.factor-bar-fill  { height:100%; border-radius:3px; }
.factor-desc { font-size:13px; color: var(--text-n5); line-height:22px; }
.band-row .factor-name { width:72px; }
.band-row .factor-weight-label { width:60px; text-align:left; color: var(--text-n9); }
.band-row .factor-desc { flex:1; }

/* Filter rules / formula code */
.method-label { font-size:14px; font-weight:500; line-height:22px;
  margin-bottom: var(--spacing-xs); color: var(--text-n9); }
.method-label.hard { color: var(--main-m4); }
.method-label.soft { color: var(--main-m5); }
.method-block { margin-bottom: var(--spacing-m); }
.method-block:last-child { margin-bottom: 0; }
.method-code { font-family:'JetBrains Mono', monospace;
  font-size:12px; line-height:20px; color: var(--text-n7);
  margin-top: var(--spacing-m); }

/* Limitations / caveats */
.method-limit-list { list-style:none; padding:0; margin:0; }
.method-limit-list li { font-size:13px; color: var(--text-n7); line-height:20px;
  padding: var(--spacing-xs) 0 var(--spacing-xs) var(--spacing-l);
  border-bottom:1px solid var(--line-l05); position:relative; }
.method-limit-list li:first-child { padding-top: 0; }
.method-limit-list li:last-child  { border-bottom: none; padding-bottom: 0; }
.method-limit-list li::before { content:'\2014'; position:absolute; left:0;
  color: var(--text-n5); }
```

For hard/soft filter rules and limitations, use the existing `.markdown-container
--m` component (design-components.md) with inline `<script type="text/markdown">`
— the page's markdown-it renderer converts it on load. Simpler than hand-building
list HTML.

### Worked Example

For any scored screener — re-derive the current #1 from raw inputs. Always live
inside a `.method-body`, rendered into an inline `.worked-example` card so it
stands out from narrative paragraphs.

Three parts:

- **Header** — big ticker in `--main-m1`, then "· name · Rank #N · Band X" in
  `--text-n7`.
- **Rows** — monospace, one per factor: `name | raw / 100 × weight% = pts`.
- **Total** — divider + "factor-weighted sum" vs "displayed score" line. These
  are **not** expected to match exactly (the displayed score is a linear
  rescaling of the composite across the basket). State this explicitly in the
  verify badge, e.g. *"All three factors come from the same SDK observation;
  the display score is a linear rescaling so absolute value may differ but
  relative ordering is preserved."*

```css
.worked-example { background: var(--b0-container);
  padding: var(--spacing-m); border-radius: var(--radius-ct-l);
  margin-top: var(--spacing-s); }
.worked-example-header { display:flex; align-items:baseline;
  gap: var(--spacing-xs); margin-bottom: var(--spacing-s); flex-wrap: wrap; }
.worked-example-ticker { font-size:18px; color: var(--main-m1); line-height:28px; }
.worked-example-score { font-size:13px; color: var(--text-n7); }
.worked-example-rows { font-family:'JetBrains Mono', monospace;
  font-size:12px; line-height:20px; color: var(--text-n7); }
.worked-example-total { font-family:'JetBrains Mono', monospace;
  font-size:13px; color: var(--text-n9);
  padding-top: var(--spacing-s); margin-top: var(--spacing-s);
  border-top: 1px solid var(--line-l05); }
.worked-example-verify { font-size:12px; margin-top: var(--spacing-s);
  padding: var(--spacing-xs) var(--spacing-s); border-radius: var(--radius-ct-s);
  background: var(--main-m3-10); color: var(--main-m3);
  display:inline-flex; align-items:center; gap: var(--spacing-xxs); line-height:20px; }
```

---

## Cron

Match frequency to the **slowest** input metric — running faster than your data
updates wastes credits and creates noise.

| Screener cadence | Suggested cron |
|---|---|
| Quarterly fundamentals | 1× weekly (after weekend) |
| Daily fundamentals + price | 1–2× daily (post-close + optional pre-open) |
| Intraday momentum / technical | 4–12× daily (every market hour) |
| Real-time signals (rare) | every 5–15 min during market hours |

- Cron in UTC; display in EST in the UI.
- Feed accepts `args.now` (ms) for one-off backfill runs.
- For slow screeners: backfill via point-in-time SDK queries returns *current
  revised* data, not real point-in-time. Forward-only accumulation is more
  honest.

---

## Push Notifications

The qualified list is the natural push payload — "who's in today?" is the whole point of a screener. Guidance below is screener-specific; see SKILL.md Pattern E for the mechanics.

**What to select** — lead with churn, not the full list:

- Scored screener: new entries + dropouts + top-N by score.
- Basket/unscored: entries + exits only. Skip the push when both are empty.

**Format**:

- `title`: `<Screener> · <date> · +N / -M` — scannable from a lock screen.
- `text`: entries as `<ID> (<score>, <band>)` one per line, followed by dropouts, then a `Top N:` line. Include only the 1–2 most decision-relevant metrics per row — recipients won't click through.
