# Thesis Tracker Playbook

Reference structure + thesis-specific styling for any narrative-driven thematic
thesis tracker (defense, AI infra, GLP-1, energy transition, etc.). Built from
`playbook-thesis.html`. Sibling to `screener.md`.

---

## Design System Compliance (READ FIRST)

Before writing HTML, read from the Alva skill:

- `references/design-tokens.css` — spacing, color, radius tokens. Use as-is.
- `references/design-widgets.md` — Metric Card / Chart Card / Table Card base
  specs. This playbook documents thesis-unique rules on top of that.
- `references/design-components.md` — Tab (Underline, Pill), Dropdown primitives.

**Rule of thumb**: if a token or base spec already exists in the design system,
reference it here by name — do not re-spec.

**Reference implementation**: `playbook-thesis.html` is the pixel-level ground
truth. Structure follows this md; exact pixel/DOM details → check the HTML.

---

## Component Index

Structural:

- [Page Layout](#page-layout)
- [Header](#header) · [Hero Section](#hero-section)
- [Tab 1 — Overview](#tab-1--overview)
- [Tab 2 — Basket](#tab-2--basket)
- [Tab 3 — Catalysts](#tab-3--catalysts)
- [Tab 4 — Risks](#tab-4--risks)
- [Tab 5 — News & Social](#tab-5--news--social)
- [Tab 6 — Methodology](#tab-6--methodology)
- [Tab 7 — Macro & Industry](#tab-7--macro--industry-optional)
- [Other Tabs](#other-tabs-as-thesis-demands) · [Cron](#cron)

Thesis-unique components (CSS inline):

- [Hero Card](#hero-card) · [Date Switcher](#date-switcher) · [Sentiment Dot](#sentiment-dot) · [Category Badge](#category-badge) · [Delta List](#delta-list)
- [Horizon Grid](#horizon-grid) · [Equity Curve + Attribution](#equity-curve--attribution)
- [Basket Table](#basket-table) · [Valuation Tag](#valuation-tag) · [Basket Expand Panel](#basket-expand-panel) · [KV Row](#kv-row) · [Valuation Scatter](#valuation-scatter)
- [Sub-Pill Tabs](#sub-pill-tabs) · [Catalyst Timeline](#catalyst-timeline)
- [Risk Register](#risk-register) · [Priority Chip](#priority-chip)
- [Feed Filter Bar](#feed-filter-bar) · [Feed Item](#feed-item) · [Ticker Tag](#ticker-tag)
- [Free Text Card](#free-text-card) · [Callout](#callout) · [Verdict Hero](#verdict-hero-optional)

---

## Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ <Thesis Name>                                                │
│ ● Last updated · <ts ET>     [Quant 6 PM ET · Narrative 6:30]│
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ HERO (sticky)  Today's Thesis …       [Snapshot ▼: Apr17]│ │
│ │ ─────────────────────────────────────────────────────── │ │
│ │ <ADK-generated narrative for selected date>              │ │
│ │ What changed since yesterday                             │ │
│ │   ● [Valuation] Label — body                             │ │
│ │   ● [Catalyst]  Label — body                             │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ [ Overview · Basket · Catalysts · Risks · Macro · News ·     │
│   Methodology ]                                              │
├──────────────────────────────────────────────────────────────┤
│ <Tab content — all ADK-driven tabs honor the hero date>     │
└──────────────────────────────────────────────────────────────┘
```

Container: `.playbook-container` from design-widgets.md. Do not re-spec.

Tab bar: Underline-L (`.tab-underline.tab-l`, 16px / 26px / gap `--spacing-l`)
from design-components.md. The hero card sits **above** the tab bar, so every
tab shows the same hero — the hero is the anchor, the tab is the lens.

---

## Header

Sticky across all tabs. One row, no separate tagline (the thesis narrative
lives in the hero card below).

- **Title** — 24px / 400 / `--text-n9`, line-height 34px.
- **Last-updated pill** — 1px `--line-l07` border, solid dot `--main-m3`,
  height 28px. Reflects the latest narrative record's `generatedAt`; **not**
  affected by the hero date picker.
- **Refresh badge(s)** — tinted `--main-m1-10`, text `--main-m1`, height 28px.
  Thesis uses **two cadences** in one badge: `Quant 6 PM ET · Narrative 6:30 PM ET`.
  Add an EST shift note if relevant (5:00 / 5:30 PM ET during Nov–Mar).

Base `.playbook-title` comes from design-system.md#playbook-header — do not
re-spec. Thesis doesn't use `.playbook-desc` (the hero card replaces it).
Thesis only adds header-row layout (so the title can share a flex row with
meta pills) and the pills themselves:

```css
.playbook-header { display:flex; align-items:center; flex-wrap:wrap;
  row-gap: var(--spacing-xs); margin-bottom: var(--spacing-l); }
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
  width:6px; height:6px; background:var(--main-m3); border-radius:50%;
  flex-shrink:0; }
.header-meta .stale-pill { background:rgba(212,133,0,0.12); color:#d48500;
  padding:1px 6px; border-radius: var(--radius-ct-xs);
  font-size:10px; font-weight:500; letter-spacing:0.3px; }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
```

Show `.stale-pill` beside `.last-updated` when the narrative record is older
than the expected cadence (e.g. narrative should be ≤24h old).

---

## Hero Section

The heart of the page. **Sticky below the header.** Always the first widget
after the title, shown on every tab. Everything about cadence, inputs, and
fallback behavior is documented here so the reader trusts the narrative.

### How it's generated — ADK agent

- A dedicated **ADK narrative agent** runs once per cadence, **after** the
  quant feed. Input: today's quant snapshot (basket, prices, macro, filings,
  news, social), yesterday's snapshot, the prior narrative record, the basket
  universe, tool access (Serper/Brave news, GrokX, URL scrape).
- Output: one **narrative record per date** —
  `{date, generatedAt, thesis, deltas[], catalysts[], risks[], changelog[]}`.
- The same record powers the hero, Catalysts tab, and Risks tab. Changing the
  hero date reshapes all three.
- **The hero is never hand-written.** If the agent fails, show
  `Narrative refresh pending · last successful <date>` and keep the last-good
  record visible; quant tabs still render.

### Context the agent must consume

- Current day's basket table (prices, fundamentals, valuation tags, α vs
  benchmark)
- Day-over-day moves + status flips on prior catalysts/risks
- News & Social feed (last 24–72h window, basket-tagged, de-duped)
- Any Macro & Industry series on the page
- The prior narrative record (for diffing)

List the exact data sources in Methodology — the reader should be able to
reproduce the context.

### Hero Card

```css
.hero-card {
  background: var(--grey-g01);
  border-radius: var(--radius-ct-l);
  padding: var(--spacing-l) var(--spacing-l) var(--spacing-s);
}
.hero-head { display:flex; justify-content:space-between; align-items:center;
  gap: var(--spacing-m); margin-bottom: var(--spacing-xs); flex-wrap:wrap; }
.hero-head-meta { font-size:12px; line-height:20px; color: var(--text-n5);
  text-transform:uppercase; letter-spacing: 0.06em; }
.hero-text { font-size:14px; line-height:22px; color: var(--text-n7);
  letter-spacing:0.14px; margin:0; }
```

DOM skeleton:

```html
<div class="hero-card">
  <div class="hero-head">
    <span class="hero-head-meta">Today's Thesis · Narrative refresh 6:30 PM ET</span>
    <!-- .filter-dropdown date switcher, see below -->
  </div>
  <p class="hero-text"><!-- narrative --></p>
  <div class="hero-deltas-block">
    <div class="hero-deltas-title">What changed since yesterday</div>
    <ul class="hero-deltas-list"><!-- .hero-delta items --></ul>
  </div>
</div>
```

### Date Switcher

Pure view filter over the narrative-record history. Uses the same
`.filter-dropdown` primitive as screener's snapshot picker (see
`screener.md#snapshot-picker`) — identical CSS, just swap the label.

- **Label** — `Snapshot`.
- **Value** — `<Date>` + age sub (e.g. `Apr 17 EST`, sub `1d ago`).
- Lists the last ~60 narrative records, newest-first.
- Selecting a date:
  - Rewrites hero narrative, deltas, Catalysts tab, Risks tab, and any ADK
    changelog to that record.
  - Does **not** change the header last-updated (always reflects newest).
  - Writes `#hero=YYYY-MM-DD` to URL hash for deep-linking; restore on load.
- Methodology is static — picker hidden entirely there.

*(Optional)* Prev/Next arrows flanking the dropdown for one-step navigation,
disabled at boundaries. If you add them, use `--text-n3` icon mask buttons at
24px, matching `.filter-dropdown-caret`.

### Body Format — flexible

Pick one per playbook (don't mix):

**Format A — Short thesis + deltas** (fast-moving theses):

- `<p class="hero-text">` paragraph (~60–120 words).
- Deltas list below (`.hero-deltas-list`) — each delta: sentiment dot +
  category badge + label + optional body.
- Hide `.hero-deltas-block` entirely when no deltas.

**Format B — Long-form narrative** (slow structural theses):

- Multi-paragraph essay (~200–400 words) in `.hero-text` weaving in
  what-changed inline. No separate delta list.

### Sentiment Dot

Used in hero deltas, catalyst timeline, and anywhere the agent labels polarity.

- `bull` → `--main-m3` (green) — positive for thesis
- `bear` → `--main-m4` (red) — negative for thesis
- `neutral` / `ambiguous` → `--text-n3` (grey) — unclear

```css
.hero-delta-dot { width:8px; height:8px; border-radius:50%;
  margin-top:7px; flex-shrink:0; }
.hero-delta-dot.bull    { background: var(--main-m3); }
.hero-delta-dot.bear    { background: var(--main-m4); }
.hero-delta-dot.neutral { background: var(--text-n3); }
```

### Category Badge

Small uppercase tag inside the delta body identifying what kind of change it
is. Five categories; each maps to a fixed tint (thesis-specific palette — do
not reuse the main palette here, category is orthogonal to polarity):

- `Valuation` → purple `#7c3aed` (category-only, no main-token equivalent)
- `Catalyst` → `var(--main-m3)` (green)
- `Risk` → `var(--main-m4)` (red)
- `Macro` → blue `#2c5fb5` (category-only, no main-token equivalent)
- `News` → `var(--text-n7)` (grey)

```css
.hero-delta-cat { display:inline-flex; align-items:center;
  height:22px; box-sizing:border-box;
  font-size:10px; line-height:1;
  text-transform:uppercase; letter-spacing:0.06em;
  padding:0 6px; border-radius: var(--radius-ct-xs);
  margin-right:6px; vertical-align:top; }
.hero-delta-cat.cat-valuation { background:rgba(124,58,237,0.10); color:#7c3aed; }
.hero-delta-cat.cat-catalyst  { background:rgba(42,155,125,0.14); color: var(--main-m3); }
.hero-delta-cat.cat-risk      { background:rgba(224,83,87,0.14);  color: var(--main-m4); }
.hero-delta-cat.cat-macro     { background:rgba(60,120,200,0.12); color:#2c5fb5; }
.hero-delta-cat.cat-news      { background:rgba(120,120,120,0.14); color: var(--text-n7); }
```

### Delta List

```css
.hero-deltas-title { font-size:11px; color: var(--text-n5);
  text-transform:uppercase; letter-spacing:0.06em;
  margin: var(--spacing-m) 0 var(--spacing-xs) 0; }
.hero-deltas-list { list-style:none; padding:0; margin:0; }
.hero-delta { display:flex; align-items:flex-start; gap:10px;
  padding:12px 0; font-size:13px; line-height:22px;
  border-bottom: 1px solid var(--line-l05); }
.hero-delta:last-child { border-bottom: none; }
.hero-delta-body-wrap { flex:1; min-width:0; }
.hero-delta-label { color: var(--text-n9); font-weight:500; }
.hero-delta-body  { color: var(--text-n7); }
.hero-delta-empty { font-size:13px; color: var(--text-n5); padding:8px 0; }
```

Delta row DOM:

```html
<li class="hero-delta">
  <span class="hero-delta-dot bull"></span>
  <div class="hero-delta-body-wrap">
    <span class="hero-delta-cat cat-catalyst">catalyst</span>
    <span class="hero-delta-label">Label text</span>
    <span class="hero-delta-body">— optional body clause</span>
  </div>
</li>
```

---

## Tab 1 — Overview (default, quant-driven)

Lands here by default. Shows the quant snapshot of the basket as a whole. Do
**not** restate the hero narrative.

Typical widgets (skip any that don't add signal):

1. [Horizon Grid](#horizon-grid) — 1D / 7D / 1M / 3M / YTD / 1Y return cards.
2. [Equity Curve + Attribution](#equity-curve--attribution) — 1Y basket vs
   benchmark line chart with CAPM row.

### Horizon Grid

Six metric cards (or match however many horizons the thesis cares about). Each
shows basket return big, benchmark comparison as a tag below.

```css
.horizon-grid { display:grid;
  grid-template-columns: repeat(6, 1fr); gap:12px; width:100%; }
@media (max-width:960px) { .horizon-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width:560px) { .horizon-grid { grid-template-columns: repeat(2, 1fr); } }
.hz-value.hz-pos { color: var(--main-m3); }
.hz-value.hz-neg { color: var(--main-m4); }
.hz-value.hz-neu { color: var(--text-n9); }
```

Card DOM (`.metric-card` from design-widgets.md):

```html
<div class="metric-card">
  <div class="metric-label">1Y</div>
  <div class="metric-value hz-value hz-pos">+24.31%</div>
  <div style="display:flex; gap:8px;">
    <span class="tag tag-bull">SPY +12.08%</span>
  </div>
</div>
```

Value sign-color: positive `var(--main-m3)` (green), negative `var(--main-m4)`
(red), null/NaN `var(--text-n9)` (neutral). Benchmark tag uses `.tag-bull` /
`.tag-bear` / `.tag-neutral` (see [Valuation Tag](#valuation-tag)).

### Equity Curve + Attribution

Chart Card from design-widgets.md. Thesis-specific: the title area is
flex-direction column with an **attribution sub-row** below the title.

Attribution row format:
`Benchmark Attribution: Alpha <α>% (annualized) · Beta <β> · R² <r²> · Correlation <corr>`

- Alpha text is **colored by sign** via JS: `>= 0` → `var(--main-m3)`, `< 0`
  → `var(--main-m4)` (set as inline `style.color`).
- Beta / R² / Corr stay `var(--text-n9)`.

ECharts spec (on top of design-widgets.md Chart Card defaults):

- Two line series, 1Y of daily closes normalized to base=100:
  - **Basket** → `#5f75c9` (`--chart-purple1-main`)
  - **Benchmark** (SPY / sector ETF / BTC / etc.) → `#ff9800` (`--chart-orange1-main`)
- Both: `type:"line"`, `smooth: 0.1`, `showSymbol: false`, `lineStyle.width: 1`,
  `areaStyle` linear gradient 15% → 0% alpha of the line color.
- `xAxis.type: "time"`; `yAxis.scale: true` (don't force 0 origin — base=100 is
  the implicit baseline).
- `grid: { top:4, right:4, bottom:4, left:4, containLabel:true }`.
- Chart height: 320px.

Legend uses the `.chart-legend` + `.legend-item` + `.legend-line` primitives
(same as screener). Two entries; put the basket first.

---

## Tab 2 — Basket (quant-driven)

Two widgets: the basket table (with expand panels), and a valuation scatter.

### Basket Table

Built on the Table Card base from design-widgets.md. Less complex than
screener's ranked table — **no sticky columns, no ranking, no sticky caret.**
Just a horizontally-scrollable table with expandable rows.

**Row inset**: body rows have `padding: var(--spacing-m)` horizontal (both
sides); header row no inset.

```css
#basket-table .table-row {
  padding-left: var(--spacing-m);
  padding-right: var(--spacing-m);
  box-sizing: border-box;
}
```

**Columns** — pick what matters for the thesis. `ticker` is always the row
anchor (colored `--main-m1`), always first, always has the caret column at the
end.

Often-used:

- Ticker — `--main-m1`, the row anchor.
- Name
- Layer / sub-theme — short text; thesis-specific layer taxonomy (e.g.
  `Primes`, `Shipbuilder`, `Hyperscaler`, `Enabler`). Document layers in
  Methodology.
- Mkt Cap
- Thesis-relevant fundamentals: P/E, EV/EBITDA, Rev YoY (swap for NVT / FCF
  yield / pipeline count / on-chain volume as fits).
- 1Y return (sign-colored)
- α vs benchmark YTD (sign-colored)
- Valuation tag — `Cheap` / `Fair` / `Rich` / `N/A` pill.
- Caret (sticky-free, last column).

Sort by layer, then market cap within layer. Keep every column sortable.

Row hover: `background: var(--b-r02)`. Row open state: bottom border goes
transparent (expand panel below carries the divider).

### Valuation Tag

Thesis variants of the `.tag` primitive (base spec: design-components.md#tag).
Do not re-spec base — only the thesis-specific color modifiers below.

```css
.tag-bull        { background:rgba(42,155,125,0.14); color: var(--main-m3); }
.tag-bear        { background:rgba(224,83,87,0.14);  color: var(--main-m4); }
.tag-neutral     { background: var(--grey-g01);      color: var(--text-n7); }
.tag-cheap       { background:rgba(42,155,125,0.14); color: var(--main-m3); } /* same as bull */
.tag-rich        { background:rgba(224,83,87,0.14);  color: var(--main-m4); } /* same as bear */
.tag-fair        { background:rgba(120,120,120,0.14); color: var(--text-n7); }
.tag-na          { background: var(--grey-g01);      color: var(--text-n5); }
.tag-approaching { background:rgba(223,167,60,0.18); color:#a56b10; } /* amber warning */
```

Mapping:

- `Cheap` / `Rich` / `Fair` — basket valuation pill.
- `N/A` — negative or missing earnings.
- `Bull` / `Bear` / `Neutral` — signed-return pills (e.g. SPY comparison in
  Horizon Grid).
- `Approaching` (optional) — "near the threshold" warning (e.g. near exit
  trigger).

Valuation threshold: percentile of current P/E vs own 5y history — `Cheap <25%`,
`Rich >75%`, everything else `Fair`.

### Basket Expand Panel

Lazy-rendered on first click, fade-in 0.25s. Uses `.basket-expand-panel` (not
`.expand-panel`) to avoid colliding with screener.md's sticky-column expand
panel — two playbooks loaded in the same page must not share that class.

```css
.basket-expand-panel { padding: var(--spacing-l) var(--spacing-m) var(--spacing-xl);
  border-bottom: 1px solid var(--line-l07);
  animation: expandFade .25s ease; }
.basket-expand-panel:last-child { border-bottom: none; }
@keyframes expandFade {
  from { opacity:0; transform: translateY(-4px); }
  to   { opacity:1; transform: translateY(0); }
}
.basket-expand-grid { display:grid;
  grid-template-columns: 2fr 1fr; gap: var(--spacing-l); }
@media (max-width:900px) {
  .basket-expand-grid { grid-template-columns: 1fr; }
}
```

Layout: 2-col grid inside `.basket-expand-grid`.

**Left (`2fr`)** — price chart (Chart Card). Daily bars, 1Y window by default.
ECharts line chart, green `#2a9b7d` (= `--main-m3`; ECharts canvas needs raw
hex), smooth 0.1, gradient fill 15% → 0%. No volume, no OHLC tooltips — keep
it clean.

**Right (`1fr`)** — two stacked `.ft-card`s:

1. "Why it's in the basket" — 1–3 sentence narrative tying the name to the
   thesis. **Prewritten per name**, refreshed only when basket changes. Not
   part of the ADK daily record.
2. Key metrics — `.kv-row` list (P/E percentile, 1M / 3M / YTD return, Rev
   YoY, any thesis-relevant signal). Sign-color numeric values.

### KV Row

General-purpose label/value row used in expand panels, methodology, and
anywhere you need a tight two-column layout.

```css
.kv-row { display:flex; justify-content:space-between;
  padding: 6px 0; border-bottom: 1px solid var(--line-l05);
  font-size:13px; }
.kv-row:last-child { border-bottom: none; }
.kv-row .k { color: var(--text-n5); }
.kv-row .v { color: var(--text-n9); }
```

Sign-color the `.v` span for signed numerics via a utility class: positive
green, negative red, neutral `--text-n9`.

### Valuation Scatter

Chart Card. Two-axis map of the basket — valuation on X, return on Y.

- **X** — P/E percentile (0–100) vs own 5y history, `nameLocation: "middle"`,
  `nameGap: 30`.
- **Y** — 1Y total return (%), `nameLocation: "middle"`, `nameGap: 45`.
- **Dot size** — `Math.sqrt(mcap/1e9) * 3 + 8` (market-cap scaling, clamped
  visually by the formula).
- **Dot color** — by valuation tag (ECharts canvas — raw hex):
  `Cheap` `#2a9b7d` (= `--main-m3`), `Rich` `#e05357` (= `--main-m4`),
  else grey `#64748b`.
- **Labels** — ticker on each dot, `position: "top"`, `fontSize: 10`,
  `color: "#333"`.
- **Quadrant guides** — second `type: "line"` series carries `markLine.data =
  [{ xAxis: 50 }, { yAxis: 0 }]`, dashed `rgba(0,0,0,0.15)`.
- **Grid** — `{ left:60, right:30, top:40, bottom:60 }`.
- **Splitlines** — visible, very light (`rgba(0,0,0,0.05)`).
- **Height** — 460px.

Caption (`.widget-title-sub`): "Upper-left = cheap + outperforming (sweet
spot). Upper-right = expensive momentum. Lower-right = crowded, rolling over."
And a footnote callout: "Cheap in a fading thesis is a trap — read alongside
Catalysts and Risks."

---

## Tab 3 — Catalysts (ADK-driven)

Hero date ↔ Catalyst list are bound — they share one narrative record.

Structure: sub-pill tab row at top (Ongoing / Delivered / Missed with counts),
then a single `.ft-card` container with three `.sub-tab-panel`s, each holding
a `.timeline`.

### Sub-Pill Tabs

Different primitive from the main tab bar — uses the **`.tab-pill`** variant
(rounded chip buttons, not underline). Full CSS is in
design-components.md#tab — do not re-spec base. Thesis only adds:

- A `.count` child for the number badge.
- `.sub-tab-panel` for the content-toggle container.
- Kill the width-reservation `::after` trick that `.tab-underline` uses (not
  needed on pills).

```css
.tab-pill .tab-item .count { opacity:0.55; font-size:12px; font-weight:400; }
.tab-pill .tab-item::after { display:none; }  /* disable underline's layout-shim */
.sub-tab-panel { display:none; }
.sub-tab-panel.active { display:block; }
```

DOM:

```html
<div class="tab tab-pill">
  <div class="tab-item active" data-sub-tab="ongoing">Ongoing <span class="count">4</span></div>
  <div class="tab-item" data-sub-tab="delivered">Delivered <span class="count">6</span></div>
  <div class="tab-item" data-sub-tab="missed">Missed <span class="count">1</span></div>
</div>
```

Sort order:

- **Ongoing** (includes `upcoming` + live `ongoing`): ASC (nearest future
  first); null dates last.
- **Delivered / Missed**: DESC (most recent first); null dates last.

### Catalyst Timeline

Vertical timeline — line on the left, dot per event, event text stacked right
of each dot.

```css
.timeline { position:relative; padding-left: var(--spacing-xl); }
.timeline::before { content:""; position:absolute;
  left:11px; top:4px; bottom:4px; width:2px;
  background: var(--line-l07); }
.tl-item { position:relative;
  padding: var(--spacing-xs) 0 var(--spacing-s) 0; }
.tl-item::before { content:""; box-sizing:border-box;
  position:absolute; left:-19px; top:11px;
  width:14px; height:14px; border-radius:50%;
  background: var(--text-n5);
  border: 2px solid var(--b0-page); }
.tl-item.bull::before      { background: var(--main-m3); }
.tl-item.bear::before      { background: var(--main-m4); }
.tl-item.ambig::before,
.tl-item.ambiguous::before { background: var(--text-n5); }
.tl-item.done::before,
.tl-item.delivered::before { background: var(--main-m3);
  box-shadow: 0 0 0 2px rgba(42,155,125,0.25); }  /* 0.25 halo, no token equiv */
.tl-item.missed::before    { background: var(--main-m4); }
.tl-date  { font-size:12px; line-height:20px;
  letter-spacing:0.12px; color: var(--text-n5); }
.tl-title { font-size:14px; line-height:22px;
  letter-spacing:0.14px; font-weight:500;
  color: var(--text-n9); margin: var(--spacing-xxxs) 0; }
.tl-sub   { font-size:12px; line-height:20px;
  letter-spacing:0.12px; color: var(--text-n5); }
```

Event DOM:

```html
<div class="tl-item bull">            <!-- or .bear / .ambig / .delivered / .missed -->
  <div class="tl-date">2026-06-15 · Upcoming</div>
  <div class="tl-title">FY27 DoD budget mark-up hearing</div>
  <div class="tl-sub">2–4 sentences of context + impact. Affected: LMT, RTX.</div>
</div>
```

Status badge for the date line:

- Ongoing → `Upcoming` (grey text).
- Delivered → append `✓` (green check).
- Missed → append `✗` (red cross).

Dot coloring reflects **sentiment for thesis**, not event outcome. A
`delivered` event can still be `.bear` if it harmed the thesis.

Past events visually dim (`.tl-sub` already `--text-n5`); upcoming events
prominent.

---

## Tab 4 — Risks (ADK-driven)

Same narrative record as the hero. Structured risk register — no hand-waving.

Table Card with four columns:

- **Risk** — narrative description, optionally prefixed with a `[CATEGORY]`
  tag (wrapped in `.risk-cat-prefix` for `--text-n5` color). Categories:
  `Policy` / `Regulatory` / `Tech substitution` / `Cyclical` / `Execution` /
  `Valuation` / `Narrative` / `Geopolitical`.
- **Exit trigger** — concrete measurable threshold. `—` (em-dash, wrapped in
  `.risk-exit-cell.empty` for muted color) if none. Example: "DoD FY27 budget
  grows <3% YoY nominal."
- **If triggered** — planned portfolio action (trim / rotate / exit).
- **Priority** — see [Priority Chip](#priority-chip).

Body cells use `white-space: normal` so long text wraps.

```css
.risk-cat-prefix { color: var(--text-n5); }
.risk-exit-cell.empty { color: var(--text-n5); }
```

### Priority Chip

Priority is **derived**, not hand-set. Derive from `Severity` × `Status`:

| Severity \ Status | Dormant | Watching | Materializing |
|---|---|---|---|
| **High**   | Medium | High   | High   |
| **Medium** | Low    | Medium | High   |
| **Low**    | Low    | Low    | Medium |

Chip shows the level; the raw `<sev> · <status>` shows on hover via the
native `title=""` attribute (`cursor: help`).

```css
.prio-chip { display:inline-flex; align-items:center; gap:6px;
  padding: 3px 10px; border-radius: 999px;
  font-size:12px; font-weight:500; line-height:18px;
  cursor: help; }
.prio-chip::before { content:""; width:6px; height:6px; border-radius:50%; }
.prio-high   { background:rgba(224,83,87,0.14);  color: var(--main-m4); }
.prio-high::before   { background: var(--main-m4); }
.prio-medium { background:rgba(223,167,60,0.18); color:#a56b10; }
.prio-medium::before { background:#d4a63c; }
.prio-low    { background:rgba(120,120,120,0.14); color: var(--text-n7); }
.prio-low::before    { background: var(--text-n5); }
```

Sort rows: Priority DESC, then Severity DESC (H > M > L), then Status DESC
(Materializing > Watching > Dormant).

---

## Tab 5 — News & Social (quant-driven)

Unified feed. The ADK also consumes this upstream, but the tab shows raw items.

Structure: `.tab-pill` filter bar at top (`All` / `News` / `X (Twitter)` with
counts) → a `.widget-body` wrapper (`padding:0; background: var(--grey-g01)`)
containing `.feed-body` with `.feed-item` children.

### Feed Filter Bar

Same `.tab.tab-pill` primitive as catalyst sub-tabs. Add `.feed-filter-bar`
class for `margin-bottom: var(--spacing-m); flex-wrap: wrap;`.

```css
.feed-filter-bar { margin-bottom: var(--spacing-m); flex-wrap: wrap; }
```

DOM:

```html
<div class="tab tab-pill feed-filter-bar">
  <div class="tab-item active" data-filter="all">All <span class="count">120</span></div>
  <div class="tab-item" data-filter="news">News <span class="count">80</span></div>
  <div class="tab-item" data-filter="x">X (Twitter) <span class="count">40</span></div>
</div>
```

### Feed Item

Base Feed Card spec (all `.feed-*` structure, avatar/title/content/thumb CSS,
hover, divider) is in design-widgets.md#feed-card — do not re-spec. Thesis
only overrides the avatar and adds thesis-specific inline chips inside
`.feed-info`.

**Avatar per source** — priority is always: **real avatar first, generic
source logo only as fallback.** The generic X / letter logo is the last
resort, not the default.

Resolution order:

1. **Real avatar from the item** — the post author's profile picture (X) or
   the publisher's logo (news). If the item provides one, use it as-is on
   the default `.feed-avatar` background. No `style` override.
2. **Source-inferred icon** — news falls back to Google favicon for the
   article's host (`favicons?domain=<host>&sz=64`); X has no equivalent
   author lookup.
3. **Generic source fallback** — only when both above fail:
   - X → black background (`style="background:#000;"`) + white X SVG
     (`logo-feed-x.svg`) padded 4px. This is the tier-3 fallback; do NOT
     apply it when a real author avatar is available.
   - News → `.feed-avatar-fallback` showing the first letter of the host
     (uppercase), default muted background from design-widgets.

HTML per tier (agent: pick the highest tier with a usable source):

```html
<!-- Tier 1 — real avatar (preferred; no bg override) -->
<div class="feed-avatar">
  <img src="{{authorAvatarUrl}}" alt=""
       onerror="this.parentNode.innerHTML='<!-- fall through to tier 2 or 3 -->'">
</div>

<!-- Tier 2 — news favicon -->
<div class="feed-avatar">
  <img src="https://www.google.com/s2/favicons?domain={{host}}&sz=64" alt=""
       onerror="this.parentNode.innerHTML='<div class=feed-avatar-fallback>{{firstLetter}}</div>'">
</div>

<!-- Tier 3 — generic X logo (only when item.source==='x' AND no author avatar) -->
<div class="feed-avatar" style="background:#000;">
  <img src="https://alva-ai-static.b-cdn.net/design-system/logo-feed-x.svg"
       alt="X" style="padding:4px;"
       onerror="this.parentNode.innerHTML='<div class=feed-avatar-fallback style=background:#000;>X</div>'">
</div>
```

The black background belongs to the tier-3 generic logo only. On tier 1 and
tier 2, `.feed-avatar` keeps the default background from
design-widgets.md#feed-card — do not add `style="background:#000;"`.

**Click behavior**: each `.feed-item` carries `data-href="<article url>"`. A
single delegated click listener on the feed container opens it in a new tab
with `noopener, noreferrer`.

### Ticker Tag

Thesis-specific inline chip + sentiment color spans — sit inside the
`.feed-info` row to tag which basket name each item mentions.

```css
.feed-ticker-tag { font-size:11px; line-height:16px;
  padding:1px 6px; border-radius:3px;
  background:rgba(124,58,237,0.1); color:#7c3aed;
  font-weight:500; }
.feed-sentiment-bull { color: var(--main-m3); }
.feed-sentiment-bear { color: var(--main-m4); }
```

### Inclusion rules (document in Methodology)

- **News** — basket-tagged, de-duped by URL, 24–72h rolling window, cap ~80.
- **Social** — engagement-filtered (≥1 like/RT or verified author),
  spam-filtered, cap ~40.
- **Combined** — ~120 item cap; older items paginate or drop.

Dedupe both streams by URL after merge. Sort newest-first.

---

## Tab 6 — Methodology

Always include. Every pipeline and every derived field must be explained so the
reader can trust the page.

### Structure

Two-column grid of `.method-cell`s using `.grid .grid-2` from
design-widgets.md#grid-system with `gap: var(--spacing-xl)`. Each cell:
`h3.section-h` title + `.ft-card` body. Grid collapses to single column below
1100px (handled by the base `.grid-2` rule).

```css
.section-h { font-size:16px; color: var(--text-n9);
  margin: 0 0 var(--spacing-m) 0; font-weight:400; }
.method-cell { display:flex; flex-direction:column; }
.method-cell .ft-card { flex: 1; }
```

### Free Text Card

The default narrative container inside methodology / hero overflow / expand-
right-column.

```css
.ft-card { background: var(--grey-g01);
  border-radius: var(--radius-ct-s);
  padding: var(--spacing-l); }
.ft-card h3 { margin: 0 0 var(--spacing-s) 0;
  font-size:16px; font-weight:500; color: var(--text-n9); }
.ft-card p { margin: 0 0 var(--spacing-s) 0;
  font-size:14px; line-height:22px; color: var(--text-n7);
  letter-spacing:0.14px; }
.ft-card ul { margin: 0 0 var(--spacing-s) 0;
  padding-left: var(--spacing-l);
  color: var(--text-n7); font-size:14px; line-height:22px; }
.ft-card li { margin-bottom: 4px; }
strong, b { font-weight:500; color: var(--text-n9); }
```

### Subsections to cover

- **How this playbook works** — two pipelines (quant + ADK narrative), cadence
  in ET (with EST shift note), and that hero / Catalysts / Risks share one
  ADK record per date.
- **Hero format choice** — A or B, and why.
- **ADK context** — exact list of inputs fed to the narrative agent (snapshots,
  prior record, news/social, macro, tool access).
- **Basket selection** — list every name by layer; rule-based vs judgment-
  based; basket change-log policy.
- **Computation rules** — define every derived field:
  - Rev YoY / TTM basis
  - Valuation tag thresholds (e.g. `Cheap <25%` P/E percentile vs 5Y)
  - α definition (e.g. α vs SPY YTD = ticker YTD − SPY YTD, in pp)
  - CAPM α / β / R² / Corr method (e.g. 1Y daily excess returns, α annualized)
  - Risk priority matrix
  - Hero-delta surfacing rules (e.g. `|1D move| > 3%`, catalyst status flips,
    ≥2-source news)
- **Data sources** — OHLCV + fundamentals (Alva SDK); macro (FRED / World
  Bank / USAspending / etc.); news (Alva News SDK); social (GrokX or
  equivalent); narrative (ADK agent + tools).
- **What this does NOT capture** — honest blind-spot list.
- **Glossary** — thesis-specific jargon.

Use `.kv-row` lists for tight source/computation tables; use `<p>` + `<ul>`
for prose subsections. Hero date picker is hidden on this tab (static).

### Callout

Short emphasized note — left accent bar, grey background. Same as screener.

```css
.callout { border-left: 3px solid var(--main-m1);
  padding: var(--spacing-s) var(--spacing-m);
  background: var(--grey-g01);
  border-radius: var(--radius-ct-xs);
  font-size:13px; line-height:20px; color: var(--text-n7); }
.callout strong { color: var(--text-n9); }
```

### Verdict Hero *(optional)*

For conviction summaries (e.g. in Methodology or a standalone summary page).
4-column grid of `.vh-block`s (label / value / sub). Not used in the default
thesis template but available.

```css
.verdict-hero { background: var(--grey-g01);
  border-radius: var(--radius-ct-s); padding: var(--spacing-xl);
  display:grid; grid-template-columns: 1.2fr 1fr 1fr 1.2fr;
  gap: var(--spacing-l); margin-bottom: var(--spacing-xl); }
@media (max-width:900px) {
  .verdict-hero { grid-template-columns: 1fr 1fr; }
}
.vh-block { display:flex; flex-direction:column; gap:6px; }
.vh-label { font-size:12px; color: var(--text-n5);
  text-transform:uppercase; letter-spacing:0.06em; }
.vh-value { font-size:28px; color: var(--text-n9); line-height:36px; }
.vh-sub   { font-size:12px; color: var(--text-n5); }
.val-bull    { color: var(--main-m3); }
.val-bear    { color: var(--main-m4); }
.val-neutral { color: var(--text-n7); }
```

---

## Tab 7 — Macro & Industry *(optional)*

Include only if the thesis has 2+ macro / industry signals that actually move
conviction and aren't captured by the basket chart. Skip when the basket is
the whole story.

All charts are Chart Cards (design-widgets.md). Stack vertically with
`margin-top: var(--spacing-xxxxl)` between them.

Common building blocks (mix & match):

- **Aggregate spend / volume** — time-series line, last 10y. Green
  `#40a544` (= `--chart-green1-main`; ECharts canvas — raw hex) line, smooth
  0.1, gradient fill 15% → 0%.
- **Cross-country / cross-region bar** — horizontal bars, conditional color
  (e.g. green if ≥ threshold else red), value label on right
  (`position:"right"`, `formatter: p => p.value.toFixed(2) + "%"`),
  `barMaxWidth: 16`, `borderRadius: [0, 1, 1, 0]`.
- **Quarterly trend stack** — stacked bars by contributing factor (e.g.
  contractor family, sponsor). Use the shared chart palette (no duplicates;
  grey reserved for "Other" bucket):
  `["#3d8bd1","#ff9800","#40a544","#5f75c9","#c76466","#dc7aa5","#a878dc","#7cafad","#54A5C2","#8fc13a"]`.
  Top-N contributors + "Other" catch-all. `barMaxWidth: 16`.
- **Latest-period horizontal breakdown** — single-period share bars; percent-
  of-total label at bar end.
- **Filings / contracts / deal-flow table** — Table Card. Size threshold to
  strip noise; newest-first; clean description text of source prefixes.

All ECharts tooltips follow the design-widgets.md Chart Card `TT` defaults
(white bg, 6px radius, 12px padding, dotted-line axis pointer).

Document every series, window, cleaning rule, and threshold in Methodology.

---

## Other tabs (as thesis demands)

Don't bolt on tabs speculatively. Add one only when a type of content
genuinely doesn't fit elsewhere.

Examples:

- **Regulatory / Policy** — for theses where policy timing is the primary
  driver (biotech approvals, antitrust, tariffs).
- **Supply Chain** — for hardware / physical theses (semis, EV, defense
  components).
- **On-chain** — for crypto theses (flows, fees, holder distribution).
- **Sentiment / Positioning** — for crowded-trade theses (CFTC positioning,
  short interest, fund flows).

Each new tab must:

- Be clearly either **quant-driven** or **ADK-driven**.
- Respect the hero date picker if ADK-driven (share one narrative record per
  date with hero / Catalysts / Risks).
- Be documented in Methodology (sources + computation).

---

## Cron

**Two crons, not one.** The narrative agent must run **after** the quant feed
so it can diff today vs yesterday on fresh data.

| Pipeline | Cadence | Notes |
|---|---|---|
| Quant feed | Daily post-close (e.g. 6 PM ET) | Faster only if an input metric actually updates intraday. |
| Narrative feed (ADK) | Daily ~30 min after quant (e.g. 6:30 PM ET) | Runs **after** quant so it diffs today vs yesterday on fresh data. |

- Cron expressions in UTC; display in ET in the UI. Both feeds shift one hour
  earlier during EST (Nov–Mar).
- Quant feed accepts `args.now` (ms) for one-off backfill runs.
- Narrative feed accepts `args.date` (YYYY-MM-DD) to re-generate a specific
  record — useful when the agent fails and a day needs re-running.
- **Forward-only narrative accumulation.** Never fake-backfill past narrative
  records by running the agent on historical snapshots — point-in-time quant
  queries return *currently-revised* data, not real point-in-time state, so
  a backfilled "what changed yesterday" is misleading. Each narrative record
  should be the one produced live on its date.
- Quant and narrative outputs live in separate feeds, stored as independent
  time series — historical hero entries are browsable via the hero date
  picker.

---

## Reference Implementation

`playbook-thesis.html` is the visual/behavioral ground truth.

- **Structure** of each tab and widget → this md.
- **Pixel / exact DOM details** where the md is ambiguous → open the HTML
  and match verbatim.
- **ECharts configs** beyond what's specified here → mirror the relevant
  `render<X>` function in the HTML (look for `renderBenchChart`,
  `renderValScatter`, `renderCatalysts`, `renderRiskTable`, `renderFeed`,
  `renderDoDChart`, `renderNatoChart`, `renderContractsCharts`).

When generating a new thesis playbook, also check `screener.md` for any shared
primitive (`.filter-dropdown`, `.tag`, `.expand-caret`, `.ft-card`, `.callout`,
`.kv-row`, `.chart-dotted-background`, `.alva-watermark`) — don't re-spec
those, they're identical across both playbooks.

---

## Push Notifications

The daily hero narrative is the natural push payload. Wire the **narrative feed** (not the quant feed), so the diffed "what changed" is included. See SKILL.md Pattern E for the mechanics.

**Format**:

- `title`: `<Thesis> · <date>`
- `text`: one-sentence thesis + top 1–2 deltas (sentiment dot + short label). Self-contained — recipients won't click through.

**Skip**: the agent failed and the last-good record was reused — otherwise the same thesis re-pushes.
