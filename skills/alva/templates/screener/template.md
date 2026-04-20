# Ranked-List Screener Template

Reference structure for any composite-score screener (stocks, crypto, etc.).
Built from `quality-growth-screener-clean`.

## Design System Compliance (READ FIRST)

Before writing HTML, read from the Alva skill:

- `references/design-system.md` — copy `.playbook-container` rule verbatim (max-width 2048px, 28px horizontal padding)
- `references/design-widgets.md` — metric cards / charts / tables specs
- `references/design-tokens.css` — use spacing/color tokens as-is, do NOT override

## Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ <Screener Name>                                              │
│ Last updated · <ts EST> · Refreshes <schedule EST>           │
│ <One-sentence summary>                                       │
├──────────────────────────────────────────────────────────────┤
│ [ Overview │ Movers & Trends │ Analysis │ Methodology ]      │
├──────────────────────────────────────────────────────────────┤
│ <Tab content>              [Snapshot ▼: Today, Apr 17 EST]  │
│  ... ranked table / charts / docs ...                        │
└──────────────────────────────────────────────────────────────┘
```

## Header (sticky, all tabs)

- Title
- Last-updated timestamp (EST) — from latest snapshot; **not** affected by snapshot picker
- Refresh schedule badge ("Refreshes 8:00 PM & 1:00 AM EST")
- One-sentence summary (no "What this is" duplicate)

## Snapshot picker (top-right of Overview / Movers / Analysis tabs)

Pure view filter — switches which historical snapshot drives the tab content. Never mutates data, never changes the header timestamp.

**Naming** — match the label to the cadence, don't hard-code "Date":

- Daily or slower → `Date` ("Today, Apr 17 EST", "Apr 16 EST", …)
- Intraday (≥hourly) → `Snapshot` or `Time` ("Today 4:00 PM EST", "Today 1:00 PM EST", …)
- Weekly/monthly → `Week of` / `Month` ("Week of Apr 13", "Mar 2026", …)

**Behavior**:

- Lists all available historical snapshots (most recent first), defaults to latest
- Filters Overview / Movers / Analysis only. Methodology is static, picker hidden there
- "Δ vs prior" calculations on the selected tab use the snapshot immediately before the picked one
- For first-load smoothness: picker disabled (or hidden) when only 1 snapshot exists

**History accumulation rules** *(must follow)*:

1. **First run = today only.** Don't fake-backfill past dates from current SDK queries — point-in-time SDK calls return *currently revised* data, not real historical state. Misleading.
2. **Every cron run appends a new snapshot, never overwrites.** Each historical snapshot stays in `screener/rankings` + `screener/summary` indefinitely. Picker grows organically as days/runs accumulate.
3. **No retention pruning by default.** Keep full history so the picker, Movers Δ-calcs, and basket trend chart all work on real data. Add pruning only if storage becomes a concern (>1y of snapshots).

## Tab 1 — Overview (default)

Full ranked table.

**Required**: `<primary identifier> · ▾` (the row anchor + expand caret).

The **primary identifier** is the unique label for each row in the screener's universe — the thing a user thinks of as "the row". Examples:

- Stocks/ETFs → ticker (`PLTR`, `NVDA`, `SPY`)
- Crypto → symbol or pair (`BTC`, `ETH-USD`)
- Bonds → ISIN / CUSIP
- Sectors / themes → sector or theme name

**Often-used columns** — pick what matters for *this* screener. None are mandatory:

- Position: Rank (only if the screener is ranked, not a flat basket)
- Score: composite score (only if there's a scoring formula; basket-style screeners with pure pass/fail criteria omit this)
- Identity: Name, Sector, Industry, Asset Class
- Movement: Δ Rank, Δ Score (vs prior snapshot — only if Rank/Score exist)
- Inclusion signal *(basket-style)*: "Days in basket", "Entry date", "Exit reason" — useful when there's no ranking
- Risk/quality signals: Flag (descriptive label, tier-colored)
- Relevant metrics: fundamentals for fundamental screeners, technicals for technical ones, on-chain for crypto, etc.

Order columns by importance left-to-right. If there's no Rank/Score, sort the table by the most relevant metric (e.g. market cap, entry date) and make that column primary.

**Expand row** — always include a price/value chart of the asset. Other components are optional, mix & match based on what reveals *why* this row is in the basket.

- **Price chart (always include)** — K-line / candlestick by default, or line chart for assets without OHLC. Choose interval to match the screener:
  - Quarterly fundamentals screener → daily bars, ~60-90 day window
  - Daily / weekly screener → daily bars, ~30-90 day window
  - Intraday momentum / technical screener → hourly or 15min bars, ~5-10 day window
  - Long-cycle macro / monthly screener → weekly bars, ~1-2 year window
  - Rule of thumb: enough bars to see the pattern the screener cares about, interval ≤ screener's update cadence
- Optional add-ons:
  - Score ring chart (if scored)
  - Factor breakdown bars with raw value + points (if scored)
  - Active flag cards with thresholds (if flagged)
  - Custom narrative blocks (peer comparison, news links, holdings, on-chain stats, etc.)

Skip components that don't add insight.

## Tab 2 — Movers & Trends *(optional)*

Include only if there's meaningful day-to-day churn. Skip for slow-moving screeners (quarterly fundamentals, long-cycle macro).

Common building blocks (pick what fits):

- **Movers cards**: Entries · Dropouts · Top Gainers · Top Decliners (vs prior snapshot)
- **Basket trend chart**: aggregate stat over time (size, avg score, avg metric, etc.)
- **Detail tables**: full gainers / decliners side-by-side
- **Sector/category rotation**: if relevant to the universe

## Tab 3 — Analysis *(optional)*

Include only if cross-sectional patterns reveal something the ranked list doesn't. Examples:

- 2D scatter / heatmap of two key factors, dot size/color = third dim
- Stacked bars decomposing top-N by contributing factor
- Distribution histograms / boxplots
- Correlation matrix between factors

## Tab 4 — Methodology

Always include — explain how the screener works. Pick the subsections that apply:

- One-paragraph plain-English overview (always)
- Worked example (re-derive #1 from raw inputs) — for composite scores
- Factor weights + scoring formula — for weighted composites
- Filter rules / thresholds — for rule-based screeners
- Data sources & freshness
- "What this does NOT capture" caveats
- Glossary — if domain-specific terms

Skip subsections that don't apply (a momentum screener may have no factor weights; a binary filter screener has no scoring formula).

## Cron

Match frequency to the **slowest** input metric — running faster than your data updates wastes credits and creates noise.

| Screener cadence | Suggested cron |
|---|---|
| Quarterly fundamentals | 1× weekly (after weekend) |
| Daily fundamentals + price | 1-2× daily (post-close + optional pre-open) |
| Intraday momentum / technical | 4-12× daily (every market hour) |
| Real-time signals (rare) | every 5-15 min during market hours |

- Cron in UTC; display in EST in the UI
- Feed accepts `args.now` (ms) for one-off backfill runs
- For slow screeners: backfill via point-in-time SDK queries returns *current revised* data, not real point-in-time. Forward-only accumulation is more honest.

```css
 #rankings-table .expand-panel { position: sticky; left: 0; padding: var(--spacing-xl) var(--spacing-m) var(--spacing-xxl); box-sizing: border-box; border-bottom: 1px solid var(--line-l07); }
  /* Pin the caret column to the right edge. Cell is 40px wide (24px caret + 16px
     inset absorbed via padding-right) and pinned at right:0. */
  #rankings-table .caret-cell {
    position: sticky; right: 0; z-index: 2;
    background: var(--b0-page);
  }
  /* Freeze # (48px) and Ticker (88px) columns to the left edge on horizontal scroll.
     Sticky `left` matches each cell's natural position so the cells don't shift
     during the initial scroll. A 16px box-shadow extends the cell's background
     leftward to cover the row's padding-left (for col 1) and the flex gap
     between col 1 and col 2 (for col 2), hiding scrolled content. */
  #rankings-table .table-row .table-cell:nth-child(1),
  #rankings-table .table-row .table-cell:nth-child(2) {
    position: sticky; z-index: 2;
    background: var(--b0-page);
    box-shadow: calc(-1 * var(--spacing-m)) 0 0 var(--b0-page);
  }
  #rankings-table .table-row .table-cell:nth-child(1) { left: var(--spacing-m); }
  #rankings-table .table-row .table-cell:nth-child(2) { left: calc(var(--spacing-m) + 48px + var(--spacing-m)); }
  /* Hover overlay sits above all cells so tint is uniform across sticky and
     non-sticky cells (avoids double-stacking of semi-transparent var(--b-r02)). */
  #rankings-table .table-row.expandable::after {
    content: ''; position: absolute; inset: 0;
    background: transparent; pointer-events: none;
    z-index: 3; transition: background .15s;
  }
  #rankings-table .table-row.expandable:hover::after { background: var(--b-r02); }
  /* When a row is expanded, hide its divider — the expand-panel carries the divider instead */
  #rankings-table .table-row.expandable.open { border-bottom-color: transparent; }
  #rankings-table > .table-body > .table-row:last-child { border-bottom: none; }
  #rankings-table > .table-body > .expand-panel:last-child { border-bottom: none; }

```
