# Trading Strategy Playbook

> Follow this spec strictly for all trading strategy playbooks. Do not invent
> alternative layouts. Global tokens and rules: [design-system.md](./design-system.md).

---

## 0. Page Layout

```
┌────────────────────────────────────────┐
│  Tab Navigation Bar                    │
├────────────────────────────────────────┤
│                                        │
│   Tab Content Area                     │
│   (scrollable)                         │
│                                        │
└────────────────────────────────────────┘
```

The Tab Bar is a **fixed structure shared by all 4 tabs**. The Tab Content Area
switches content based on the active tab.

---

## 1. Shared Structure

### Page Container (`.main-wrapper`)

| Property | Value                                            |
| -------- | ------------------------------------------------ |
| Padding  | `0`                                              |
| Layout   | `display: flex; flex-direction: column; flex: 1` |

`.main-wrapper` has no padding. Page-edge spacing comes from `.playbook-container`.
Top padding is 0 — owned by `.tab-bar-wrapper` (see §1.1).

#### Mobile Override (≤ 768px)

Only the tab bar top padding needs to be reduced on mobile:

```css
@media (max-width: 768px) {
  .tab-bar-wrapper {
    padding-top: var(--spacing-m); /* 16px */
  }
}
```

**Result**: Web = 28px (from `.playbook-container`), Mweb = 16px (from
`.playbook-container`).

### Module Spacing

All modules **inside each tab panel** stack vertically with **24px** gap
(`--spacing-xl`).

```css
.tab-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl); /* 24px between sibling modules */
  padding-top: var(--spacing-xl); /* 24px from tab bar to first module */
}
```

The `padding-top` on `.tab-panel` is the **only** spacing between the tab bar
and the first module (e.g. Meta Info Bar). Do not add extra `margin-top` on the
first child or extra `margin-bottom`/`padding-bottom` on `.tab-bar-wrapper`.

### Widget Title Size

| Tab       | Title Size          | Line Height         |
| --------- | ------------------- | ------------------- |
| Overview  | 16px                | 26px                |
| Analytics | widget spec default | widget spec default |

### 1.1 Tab Bar

| Property       | Value                                                                                                                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Items          | Overview · Analytics · Strategy · Feed                                                                                                                                                                                                                                                 |
| Style          | [Underline M](./design-components.md#tab) — class `.tab .tab-underline`                                                                                                                                                                                                                |
| Position       | `.tab-bar-wrapper`: `position: sticky`, `top: 0`, `z-index: 100`, `background: var(--b0-page)`, `padding-top: var(--spacing-xl)` (24px) |
| Bottom Divider | 1px solid var(--line-l07) on `.tab-bar-wrapper`. Active indicator and container border sit on the **same line** — apply `margin-bottom: -1px` to `.tab-item` so the 2px indicator overlaps the 1px border                                                                              |
| URL Routing    | Each tab has a unique URL hash (`#overview`, `#analytics`, `#strategy`, `#feed`); on load, activate tab matching hash. Use `history.replaceState()` (not `window.location.hash`) to update the hash without triggering a scroll jump                                                   |

#### Tab Item Spec (Underline M)

| Element        | Spec                                                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gap            | 16px between items                                                                                                                                                                        |
| Font           | 14px, line-height 22px, letter-spacing 0.14px                                                                                                                                             |
| Inactive color | `--text-n7`, `border-bottom: 2px solid transparent`                                                                                                                                       |
| Active color   | `--text-n9`, `font-weight: 500`, `border-bottom-color: var(--main-m1)`                                                                                                                    |
| Width-jump fix | Each `.tab-item` needs `data-text` attribute matching its label; a hidden `::after` pseudo-element with `font-weight: 500` reserves the bold width so the tab doesn't shift on activation |

```html
<div class="tab-bar-wrapper">
  <div class="tab tab-underline">
    <div class="tab-item active" data-text="Overview">Overview</div>
    <div class="tab-item" data-text="Analytics">Analytics</div>
    <div class="tab-item" data-text="Strategy">Strategy</div>
    <div class="tab-item" data-text="Feed">Feed</div>
  </div>
</div>
```

### 1.2 Meta Info Bar

Sits directly below the Tab Bar; **fields vary per tab**. The gap between the
tab bar and the meta bar is already provided by `.tab-panel`'s `padding-top` —
do **not** add any `padding-top` or `margin-top` to `.meta-bar`.

| Property         | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Layout           | flex, align-items: center, gap: 4px, flex-wrap: wrap                     |
| Field Background | `rgba(73, 163, 166, 0.06)`                                               |
| Field Padding    | `2px 8px`                                                                |
| Field Height     | 24px                                                                     |
| Font             | 12px, Regular 400, `--text-n5`, letter-spacing 0.12px, line-height: 20px |

**Fields per tab:**

| Tab       | Fields                                                |
| --------- | ----------------------------------------------------- |
| Overview  | Last Updated · Interval · Start Date · Initial Amount |
| Analytics | Last Updated · Interval                               |
| Strategy  | —                                                     |
| Feed      | —                                                     |

### 1.3 Traded Symbols (shared by Overview + Feed)

Displays all tickers ever traded by the strategy.

The page reads symbol-level UI data from the active item in `tradedSymbols[]`:
summary fields render the name/price row, `candles[]` powers the candlestick
chart, and `tradeLog[]` powers both trade markers and the Trade Log modal. This
is a UI projection contract, not a direct dump of Altra's raw ALFS directories.

#### Layout

Title, Symbol Pills, selected symbol price, and chart stack vertically with gap
= 16px (`--spacing-m`).

Title row includes a Trade Log icon on the right:
`https://alva-ai-static.b-cdn.net/icons/order-l.svg` 16×16px, `--text-n9`;
clicking opens a [Modal](./design-components.md#modal) containing a
[Table](./design-widgets.md#table-card) of trade records.
Sort: newest first (descending by trade timestamp).

#### Symbol Pills Row

Hide entirely when there is only one symbol.

Uses [Pill S](./design-components.md#tab) style. Each pill contains:

| Element      | Spec                                                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ticker Logo  | 14×14px, border-radius 50%, left of text; fallback when no image: first letter of ticker in a colored circle (`--b-r07` bg, `--text-n7` text, 10px font) |
| Position Dot | 5×5px, border-radius 50%, `--main-m1`, right of text; only for active positions                                                                          |

#### Selected Symbol Price

```
Bitcoin  90634.34  +1.84%  +1427.46 USD
```

Row uses `align-items: baseline`, gap = 4px (`--spacing-xxs`).

| Element     | Spec                                                                    |
| ----------- | ----------------------------------------------------------------------- |
| Symbol Name | 16px, Regular 400, `--text-n9`, line-height: 26px                       |
| Price       | 16px, Regular 400, line-height: 26px, up `--main-m3` / down `--main-m4` |
| Change %    | 12px, Regular 400, line-height: 20px, up `--main-m3` / down `--main-m4` |
| Change Abs  | 12px, Regular 400, line-height: 20px, `--text-n5`                       |

#### Candlestick Chart (ECharts)

Follows [Chart Card](./design-widgets.md#chart-card) spec. Candlestick is a
Chart Card — must use `.chart-dotted-background` + `.chart-body` wrapper per
Chart Card spec. Business overrides:

| Property    | Value                        |
| ----------- | ---------------------------- |
| Type        | ECharts `candlestick` series |
| Height      | 372px                        |
| Up / Down   | `--main-m3` / `--main-m4`    |
| barMaxWidth | 16px                         |
| DataZoom    | `inside` + `slider` (bottom) |

> **Data source note**: OHLCV candlestick data is NOT included in Altra backtest
> output. After running the backtest, separately fetch the traded symbols' OHLCV
> data (e.g. from exchange API or OHLCV provider), then project it into each
> symbol's `candles[]`. Do not skip the candlestick chart.

#### Trade Log Markers

Plotted via ECharts `markPoint`.

| Marker | Shape    | Size  | Color       | Position      | Label |
| ------ | -------- | ----- | ----------- | ------------- | ----- |
| Buy    | `circle` | 20×20 | `--main-m3` | Below the bar | "B"   |
| Sell   | `circle` | 20×20 | `--main-m4` | Above the bar | "S"   |

```javascript
markPoint: {
  data: tradeLog.map((t) => ({
    coord: [t.time, t.price],
    symbol: "circle",
    symbolSize: 20,
    symbolOffset: t.side === "BUY" ? [0, 14] : [0, -14],
    itemStyle: { color: t.side === "BUY" ? "var(--main-m3)" : "var(--main-m4)" },
    label: { show: true, formatter: t.side === "BUY" ? "B" : "S", fontSize: 10, color: "#fff" },
  })),
}
```

---

## 2. Tab: Overview

### Vertical Stack

```
┌────────────────────────────────────────────────────┐
│  Meta Info Bar (4 fields)                          │
├────────────────────────────────────────────────────┤
│  Performance Metrics (6 × Metric Cards)             │
├────────────────────────────────────────────────────┤
│  Equity Curve Chart                                │
├────────────────────────────────────────────────────┤
│  Traded Symbols (Pills + Candlestick)              │
├────────────────────────────────────────────────────┤
│  Current Positions Table                           │
├────────────────────────────────────────────────────┤
│  Daily P&L Chart                                   │
├────────────────────────────────────────────────────┤
│  Drawdown Chart                                    │
└────────────────────────────────────────────────────┘
```

### 2.1 Performance Metrics

6 equal-width metric cards in a horizontal row.

#### Layout

| Property   | Value                                                                 |
| ---------- | --------------------------------------------------------------------- |
| Container  | flex, gap: 12px, width: 100%, flex-wrap: wrap                         |
| Card       | flex: 1; at ≤960px → flex: 1 1 calc(33.33% - 8px), wraps to 3 per row |
| Background | transparent                                                           |

#### KPI-Sparkline Card

```
┌──────────────────────────────┐
│ Label                        │
│ Value                        │
│ Sparkline                    │
└──────────────────────────────┘
```

```html
<div style="display:flex;flex-direction:column;gap:4px;">
  <div
    style="font-size:11px;color:var(--text-n7);letter-spacing:0.11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
  >
    Label
  </div>
  <div style="font-size:18px;letter-spacing:0.18px;color:var(--main-m3);">
    +18.4%
  </div>
  <div id="sparkline-xxx" style="width:100%;height:52px;"></div>
</div>
```

| Element         | Spec                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------- |
| Label           | 11px, Regular 400, `--text-n7`, letter-spacing 0.11px, single-line ellipsis                  |
| Value           | 18px, Regular 400, letter-spacing 0.18px                                                     |
| Value Color     | Positive `--main-m3`, negative `--main-m4`                                                   |
| Sparkline       | ECharts mini line chart, height 52px, full-width, no axis/labels/grid/tooltip                |
| Sparkline Color | Positive `--main-m3`, negative `--main-m4`                                                   |
| Sparkline Fill  | `areaStyle.origin: 0`, gradient 0%→15% from zero axis toward the line; both sides when mixed |

#### 6 Metrics

| #   | Label             | Example | Direction        |
| --- | ----------------- | ------- | ---------------- |
| 1   | Total Return      | 18.4%   | positive = green |
| 2   | Annualized Return | 49.32%  | positive = green |
| 3   | Volatility        | 22.4%   | neutral = green  |
| 4   | Sharpe Ratio      | 5.54    | positive = green |
| 5   | Sortino Ratio     | 1.45    | positive = green |
| 6   | Max Drawdown      | -9.6%   | negative = red   |

> Max Drawdown always uses bearish color; all others use bullish when positive.

### 2.2 Equity Curve Chart

#### Layout

Title → Benchmark Attribution: gap 8px. Benchmark Attribution → chart: gap 16px.

```
Equity Curve  USD
Benchmark Attribution:  Alpha {computed}%  Beta {computed}
┌ chart-body ─────────────────────────────────────────┐
│  ---- Initial Amount — This Playbook ── {benchmark} │
│  [ECharts canvas]                                   │
└─────────────────────────────────────────────────────┘
```

| Element          | Spec                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| Unit label "USD" | 11px, Regular 400, `--text-n7`, line-height: 18px, baseline-aligned with title, gap 8px |
| Benchmark row    | 12px, `--text-n7`; values `--text-n9`, Alpha/Beta computed from data                    |
| Legend           | 3 series: dashed = Initial Amount; solid = This Playbook; colored = {benchmark}         |
| Chart height     | chart-body total 280px (padding 16×2 + legend 16+8, ECharts canvas 224px)               |
| Y-axis range     | Dynamic: min/max of all series, expanded 10% each side (data range × 120%)              |

> **Benchmark** is data-driven: read from `equityCurve.benchmark.label` (e.g.
> "BTC" for crypto, "NASDAQ" for equities).

> **Data source note**: Benchmark price data is NOT included in Altra backtest
> output. After running the backtest, separately fetch the benchmark asset's
> historical prices (e.g. from an OHLCV provider), normalize them to the initial
> amount, and project the result into
> `overview.equityCurve.series.benchmark.data`. Do not skip the benchmark
> series.
>
> **Benchmark computation**: Fetch the benchmark asset's OHLCV over the same
> date range as the backtest. Compute the normalized equity as:
> ```js
> const benchmarkEquity = prices.map(p =>
>   initialAmount * (p.close / prices[0].close)
> );
> ```
> This produces an independent buy-and-hold curve. Do NOT copy or derive the
> benchmark from the strategy equity array — they must be computed from
> separate data sources (strategy trades vs raw price series).

#### Chart Spec

Follows [Chart Card](./design-widgets.md#chart-card) spec. Business overrides:

| Series          | Color                  |
| --------------- | ---------------------- |
| "This Playbook" | `--chart-purple2-main` |
| {benchmark}     | `--chart-orange1-main` |

### 2.3 Current Positions Table

Follows [Table Card](./design-widgets.md#table-card) spec. Title-to-table gap:
16px.

#### Columns

| Column       | Width     | Style                                                                                                   |
| ------------ | --------- | ------------------------------------------------------------------------------------------------------- |
| Symbol       | flex: 1.2 | 13px `--text-n9`                                                                                        |
| Side         | flex: 1   | [Tag](./design-components.md#tag): LONG = `.tag-bullish`; SHORT = `.tag-bearish`; CASH = `.tag-neutral` |
| Quantity     | flex: 1.2 | Default text                                                                                            |
| Market Value | flex: 1.2 | Prefixed with $                                                                                         |
| Allocation   | flex: 1.2 | Percentage                                                                                              |
| P&L          | flex: 1   | Positive `--main-m3` (+$); negative `--main-m4` (-$)                                                    |

### 2.4 Daily P&L Chart

Follows [Chart Card](./design-widgets.md#chart-card) spec. Business overrides:

| Property     | Value                                                                                |
| ------------ | ------------------------------------------------------------------------------------ |
| Series name  | "Daily Profit and Loss" (shown in tooltip)                                           |
| Positive bar | `--main-m3`                                                                          |
| Negative bar | `--main-m4`                                                                          |
| Chart height | 224px (incl. padding, ECharts canvas 192px)                                          |
| Y-axis range | auto (ECharts default min/max)                                                       |
| DataZoom     | `inside` only (no slider); enables mouse wheel zoom and drag pan when data > 90 bars |

### 2.5 Drawdown Chart

Follows [Chart Card](./design-widgets.md#chart-card) spec. Business overrides:

| Property     | Value                                                                                |
| ------------ | ------------------------------------------------------------------------------------ |
| Chart type   | **Bar chart** (same as Daily P&L)                                                    |
| Series name  | "Drawdown" (shown in tooltip)                                                        |
| Bar color    | `--main-m4` (all bars are negative)                                                  |
| Y-axis range | 0% ~ -5%                                                                             |
| Chart height | 224px (incl. padding, ECharts canvas 192px)                                          |
| DataZoom     | `inside` only (no slider); enables mouse wheel zoom and drag pan when data > 90 bars |

---

## 3. Tab: Analytics

All charts follow [Chart Card](./design-widgets.md#chart-card) spec.

### Chart Selection Logic

> **Supported chart types**: Line and Bar have full specs in
> [design-widgets.md](./design-widgets.md#chart-card) (axis, tooltip, legend,
> colors, hover). Table has full specs in
> [design-widgets.md](./design-widgets.md#table-card). Use these three as
> primary chart types. Histogram, Box Plot, and Scatter Plot may be used when
> the data clearly requires them, but they lack detailed interaction specs —
> apply the shared Chart Card axis/tooltip/color rules and keep styling minimal.

| Data Type              | Chart Format                  | Examples                                         |
| ---------------------- | ----------------------------- | ------------------------------------------------ |
| Time-series            | **Line Chart** (fully spec'd) | Cumulative return, portfolio value, drawdown     |
| Categorical comparison | **Bar Chart** (fully spec'd)  | Returns by sector, factor contribution, win rate |
| Distribution           | Histogram / Box Plot (basic)  | Return distribution, holding period distribution |
| Relationship           | Scatter Plot (basic)          | Factor score vs future return                    |
| Screening / ranking    | **Table** (fully spec'd)      | Top stocks, factor rankings                      |

### Layout

| Breakpoint | Behavior                                                             |
| ---------- | -------------------------------------------------------------------- |
| ≥ 1280px   | 2 cards per row (`grid-template-columns: repeat(2, 1fr)`, gap: 24px) |
| < 1280px   | 1 card per row (single column stack, gap: 24px)                      |

> Analytics container: `flex: none`. Cards: `align-items: start`.

### Requirements

- Use **actual computed strategy data**, not placeholders.
- Each chart must include: title, axis labels, legend (if applicable), and a
  brief interpretation.

---

## 4. Tab: Strategy

Explains the core idea and implementation logic of the trading strategy.

### Vertical Stack

```
┌────────────────────────────────────────────────────┐
│  Objective Section                                 │
├────────────────────────────────────────────────────┤
│  Strategy Section                                  │
└────────────────────────────────────────────────────┘
```

### 4.1 Section Container

| Property            | Value                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| Section title       | 18px, Regular 400, `--text-n9`, line-height 26px, letter-spacing 0.18px |
| Title → content gap | 16px (`--spacing-m`)                                                    |
| Max Width           | 960px, horizontally centered (`margin: 0 auto`)                         |

### 4.2 Objective Section

Plain text paragraph: 16px, Regular 400, `--text-n9`, line-height 26px,
letter-spacing 0.16px.

### 4.3 Strategy Section

Content follows [Free Text Card](./design-widgets.md#free-text-card) spec
(Markdown component + `.free-text-body` padding).

Summarize the strategy logic and render using the **Large (default)** Markdown
size (`.markdown-container` without size modifier). See
[Markdown sizes](./design-components.md#markdown).

> **Heading restriction**: Only H4–H6. H1–H3 are reserved for page-level
> structure.

---

## 5. Tab: Feed

### Vertical Stack

```
┌────────────────────────────────────────────────────┐
│  Traded Symbols (reuses §1.3, no title row)        │
├────────────────────────────────────────────────────┤
│  Signal Feed Card  ×N                              │
│  Signal Feed Card                                  │
│  Signal Feed Card                                  │
│  ...                                               │
└────────────────────────────────────────────────────┘
```

Reuses §1.3 Traded Symbols component, but without the title row — starts
directly from Pills.

> **Sort**: Newest signal first (descending by `timestamp`).

> **Layout**: Same as Strategy tab — `max-width: 960px`, horizontally centered
> (`margin: 0 auto`).

### 5.1 Signal Feed Card

Displays individual trading signals from the strategy.

#### Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Strategy Name                                   timestamp  │
│  [AAPL logo] Increase AAPL allocation 4.5% → 8.0%  ↑        │
│  [WMT logo]  Reduce WMT allocation 6.0% → 2.0%    ↓         │
│  [AMZN logo] Reduce AMZN allocation 4.0% → 1.0%   ↓         │
│                                                             │
│  Multi-signal update: Portfolio rebalanced across...        │
│  • BTC RSI is 81.64 > 35                                    │
│  • BTC price is at Bollinger Upper Band.                    │
├─────────────────────────────────────────────────────────────┤ ← border-bottom
│  (next card...)                                             │
```

#### Card Container

| Property      | Value                     |
| ------------- | ------------------------- |
| padding       | 20px 0                    |
| border-bottom | 1px solid var(--line-l07) |
| Last card     | No border-bottom          |

#### Header

```html
<div class="feed-header">
  <span class="feed-strategy-name">NASDAQ Ultimate AI Trader</span>
  <span class="feed-timestamp">11/22/2025 16:30</span>
</div>
```

| Element       | Spec                                                         |
| ------------- | ------------------------------------------------------------ |
| Strategy name | 16px, Medium 500, `--text-n9`, line-height: 26px             |
| Timestamp     | 12px, `--text-n5`, right-aligned; format: "MM/DD/YYYY HH:mm" |

#### Signal Row

```html
<div class="feed-signal">
  <img class="signal-ticker-logo" src="{ticker_logo_url}" alt="AAPL" />
  <span class="signal-action">Increase</span>
  <a class="signal-ticker" target="_blank" rel="noopener noreferrer">AAPL</a>
  <span class="signal-detail">allocation 4.5% → 8.0%</span>
  <span class="signal-trend up"></span>
</div>
```

All text in the signal card uses `--text-n9` except the ticker link.

| Element     | Spec                                                                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row height  | 28px                                                                                                                                                                                      |
| Ticker Logo | 20×20px, border-radius: 50%, flex-shrink: 0; from `tickerLogoUrl` in data (optional — fallback: first letter of ticker in a colored circle, `--b-r07` bg, `--text-n7` text, 12px font)    |
| Action      | 16px, Regular 400, `--text-n9`, line-height: 26px                                                                                                                                         |
| Ticker link | 16px, Medium 500, `--main-m1`, cursor pointer, line-height: 26px                                                                                                                          |
| Detail      | 16px, `--text-n9`, line-height: 26px                                                                                                                                                      |
| Trend icon  | 18×18px, CSS mask, flex-shrink: 0; up = `https://alva-ai-static.b-cdn.net/icons/bullish-l.svg` + `--main-m3`, down = `https://alva-ai-static.b-cdn.net/icons/bearish-l.svg` + `--main-m4` |

**Signal format variants:**

| Format            | Example                                    |
| ----------------- | ------------------------------------------ |
| Allocation change | "Increase AAPL allocation 4.5% → 8.0%"     |
| Share count       | "Buy 10 shares of AAPL"                    |
| Dollar amount     | "Sell 5,000 USDT worth of WMT"             |
| % of cash         | "Buy 20% of available cash in AMZN"        |
| % of position     | "Sell 50% of the current position in NFLX" |

#### Description

| Property    | Value                          |
| ----------- | ------------------------------ |
| Font        | 16px, Regular 400, `--text-n9` |
| Line height | 26px                           |
| Margin top  | 12px                           |

#### Bullet Points (Indicators)

| Property    | Value                          |
| ----------- | ------------------------------ |
| Font        | 16px, Regular 400, `--text-n9` |
| Bullet      | disc, `--text-n3`              |
| Indent      | padding-left: 20px             |
| Line height | 26px                           |
| Margin top  | 8px                            |

---

## 6. Responsive Breakpoints

| Breakpoint | Behavior                                                                  |
| ---------- | ------------------------------------------------------------------------- |
| ≥ 1280px   | Performance Metrics: 6 columns (1 row)                                    |
| 900–1279px | Performance Metrics: 3 columns × 2 rows (3 per row)                       |
| < 900px    | Performance Metrics: 2 columns × 3 rows; chart height reduced             |
| < 768px    | Metrics: single column; Symbol Pills: horizontal scroll; Feed: full width |

---

## 7. Data Schema (JSON)

This schema is the UI-facing projection consumed by the playbook page. Build it
from Altra outputs plus any required enrichments (for example benchmark history
or traded-symbol OHLCV). Do not pass raw ALFS directory trees directly to the
page.

```jsonc
{
  // === Shared ===
  "playbook": {
    "lastUpdated": "11/20/2025",
    "interval": "1d",
    "startDate": "06/12/2023",
    "initialAmount": "1M USD",
  },
  "tradedSymbols": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "price": 90634.34,
      "changePct": 1.84,
      "changeAbs": 1427.46,
      "source": "Binance",
      "candles": [
        {
          "time": "2025-11-18",
          "open": 89200.1,
          "high": 91020.4,
          "low": 88780.3,
          "close": 90634.34,
        },
      ],
      "tradeLog": [
        {
          "time": "2025-11-18",
          "side": "BUY",
          "price": 89880.0,
          "quantity": 0.8,
        },
      ],
    },
    { "symbol": "ETH", "candles": [], "tradeLog": [] },
    { "symbol": "SOL", "candles": [], "tradeLog": [] },
    { "symbol": "BNB", "candles": [], "tradeLog": [] },
  ],

  // === Overview ===
  "overview": {
    "metrics": [
      {
        "label": "Total Return",
        "value": "18.4%",
        "sparkline": [],
        "direction": "positive",
      },
      {
        "label": "Annualized Return",
        "value": "49.32%",
        "sparkline": [],
        "direction": "positive",
      },
      {
        "label": "Volatility",
        "value": "22.4%",
        "sparkline": [],
        "direction": "positive",
      },
      {
        "label": "Sharpe Ratio",
        "value": "5.54",
        "sparkline": [],
        "direction": "positive",
      },
      {
        "label": "Sortino Ratio",
        "value": "1.45",
        "sparkline": [],
        "direction": "positive",
      },
      {
        "label": "Max Drawdown",
        "value": "-9.6%",
        "sparkline": [],
        "direction": "negative",
      },
    ],
    "equityCurve": {
      "currency": "USD",
      "alpha": "9.45%",
      "beta": "1.2",
      "series": {
        "initialAmount": [],
        "playbook": [],
        "benchmark": { "label": "BTC", "data": [] },
      },
    },
    "positions": [
      {
        "symbol": "AAPL",
        "side": "LONG",
        "quantity": 100,
        "marketValue": 5120,
        "allocation": 27.9,
        "pnl": 612,
      },
      {
        "symbol": "GOOGL",
        "side": "LONG",
        "quantity": 400,
        "marketValue": 7960,
        "allocation": 21.4,
        "pnl": -145,
      },
      {
        "symbol": "BTC",
        "side": "SHORT",
        "quantity": 8.68,
        "marketValue": 10740,
        "allocation": 36.8,
        "pnl": 1045,
      },
      {
        "symbol": "MSFT",
        "side": "LONG",
        "quantity": 12,
        "marketValue": 5050,
        "allocation": 13.9,
        "pnl": 98,
      },
    ],
    "dailyPnl": { "currency": "USD", "dates": [], "values": [] },
    "drawdown": { "dates": [], "values": [] },
  },

  // === Analytics ===
  "analytics": {
    "charts": [
      {
        "type": "single-line",
        "title": "Single Line Chart",
        "showPrice": true,
        "series": [
          { "name": "Xxxxxx", "color": "#76b900", "yAxisIndex": 0, "data": [] },
        ],
        "areaFill": true,
        "interpretation": "Explain what this chart means in one concise sentence.",
      },
      {
        "type": "multi-lines",
        "title": "Multi Lines Chart",
        "showPrice": true,
        "series": [
          { "name": "Xxxxxx", "color": "#FF9800", "yAxisIndex": 0, "data": [] },
          { "name": "Xxxxxx", "color": "#3D8BD1", "yAxisIndex": 0, "data": [] },
          { "name": "Xxxxxx", "color": "#40A544", "yAxisIndex": 1, "data": [] },
          { "name": "Xxxxxx", "color": "#e05357", "yAxisIndex": 1, "data": [] },
        ],
        "dualYAxis": { "left": "Price (USD)", "right": "Vol / Drawdown (%)" },
        "areaFill": false,
        "interpretation": "Explain the relationship between the plotted series.",
      },
    ],
  },

  // === Strategy ===
  "strategy": {
    "objective": "The strategy triggers whenever BTC long liquidations exceed...",
    "blocks": [
      {
        "title": "Signal Generation",
        "items": [
          "Wait until the next UTC 00:00 open.",
          "Compute the 7-day forward return...",
        ],
      },
      {
        "title": "Entry Rule",
        "items": [
          "Buy an equal-weighted basket of the top 3 outperformer tokens...",
        ],
      },
      {
        "title": "Exit Rule",
        "preText": "At the end of the 7-day holding window:",
        "items": [
          "Sell all tokens",
          "Realize the basket return",
          "Return to cash until...",
        ],
      },
    ],
  },

  // === Feed ===
  "feed": {
    "signals": [
      {
        "strategy": { "name": "NASDAQ Ultimate AI Trader" },
        "timestamp": "11/22/2025 16:30",
        "actions": [
          {
            "type": "increase",
            "ticker": "AAPL",
            "tickerLogoUrl": "https://logo.clearbit.com/apple.com",
            "detail": "allocation 4.5% → 8.0%",
            "trend": "up",
          },
          {
            "type": "reduce",
            "ticker": "WMT",
            "tickerLogoUrl": "https://logo.clearbit.com/walmart.com",
            "detail": "allocation 6.0% → 2.0%",
            "trend": "down",
          },
          {
            "type": "reduce",
            "ticker": "AMZN",
            "tickerLogoUrl": "https://logo.clearbit.com/amazon.com",
            "detail": "allocation 4.0% → 1.0%",
            "trend": "down",
          },
        ],
        "description": "Multi-signal update: Portfolio rebalanced across multiple assets based on new factor readings.",
        "indicators": [
          "BTC RSI is 81.64 > 35",
          "BTC price is at Bollinger Upper Band.",
        ],
      },
    ],
  },
}
```

---

## 8. Generation Checklist

### General

- Tab Navigation Bar (4 tabs, correct active state)
- Font: Delight Regular 400 / Medium 500, no bold
- `-webkit-font-smoothing: antialiased`
- Chart primary series color is **not** `--main-m1`

### Overview Tab

- Meta Info Bar (4 fields)
- Performance Metrics Row (6 KPI-Sparkline cards, correct colors)
- Equity Curve Chart (3 lines + Alpha/Beta + legend) — benchmark series requires
  separate price data fetch; do not skip if backtest output lacks it
- Traded Symbols (Pills + Candlestick + Trade Markers) — uses
  `tradedSymbols[].candles` and `tradedSymbols[].tradeLog`
- Current Positions Table (LONG/SHORT/CASH tags + P&L coloring)
- Daily P&L Chart (positive/negative dual-color bars)
- Drawdown Chart (all-negative red bars)

### Analytics Tab

- Meta Info Bar (2 fields)
- Charts auto-selected by data type
- Each chart includes a short `interpretation`
- ≥1280px: 2-column grid; <1280px: single column
- Alva watermark bottom-left

### Strategy Tab

- No Meta Bar
- Objective Section (plain paragraph)
- Strategy Section (Free Text Card with Markdown)
- Content Card bg `--grey-g01`, block titles Medium 500

### Feed Tab

- No Meta Bar
- Traded Symbols — reuses §1.3 without title row (Pills + Selected Symbol
  Price + Candlestick Chart with Trade Markers)
- Signal Feed Cards ×N
- Each card: strategy name + timestamp header
- Signal row: ticker logo (20×20) + action + ticker link (`--main-m1`) +
  detail + trend icon
- Description + bullet indicators
- Cards separated by border-bottom
