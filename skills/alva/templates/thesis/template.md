# Thesis Tracking Template

Reference structure for any narrative-driven thematic thesis tracker (defense, AI infra, GLP-1, energy transition, etc.).
Built from the defense-thesis-tracker production playbook. Sibling doc to `SCREENER_TEMPLATE.md`.

## Design System Compliance (READ FIRST)

Before writing HTML, read from the Alva skill:

- `references/design-system.md` — copy `.playbook-container` rule verbatim (max-width 2048px, 28px horizontal padding)
- `references/design-widgets.md` — metric cards / charts / tables specs
- `references/design-tokens.css` — use spacing/color tokens as-is, do NOT override

## Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ <Thesis Name>                                                │
│ ● Last updated · <ts ET> · Quant <time> / Narrative <time>   │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ HERO (ADK, sticky)                                       │ │
│ │ ◀  Today's Thesis · <cadence note>  ▼  ▶                │ │
│ │ ─────────────────────────────────────────────────────── │ │
│ │ <ADK-generated thesis narrative for selected date>       │ │
│ │ <Optional: "what changed since yesterday" deltas>        │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ [ Overview │ Basket │ Catalysts │ Risks │ News & Social │    │
│   Methodology            (+ Macro & Industry if relevant) ]  │
├──────────────────────────────────────────────────────────────┤
│ <Tab content — all ADK-driven tabs honor the hero date>     │
└──────────────────────────────────────────────────────────────┘
```

## Header (sticky, all tabs)

- Thesis name
- Last-updated dot + timestamp (ET) — from the latest narrative record's `generatedAt`; **not** affected by the hero date picker
- Refresh badge naming both pipelines (e.g. `Quant 6 PM ET / Narrative 6:30 PM ET`, with EST shift note if applicable)

One line. No separate tagline paragraph — the actual thesis lives in the hero card below.

## Hero Section (required, sticky, first widget after title)

The hero is the heart of the page. Everything about how/when it produces content is pinned here so the reader understands what they're looking at before scrolling.

### How it's generated — ADK agent

- A dedicated **ADK narrative agent** runs once per cadence, after the quant feed has finished.
- Agent input: today's quant snapshot (basket, prices, macro, filings, news, socials), yesterday's snapshot, the prior narrative record, the basket universe, and tool access (news search, social search, URL scrape, optional web search).
- Agent output: a single **narrative record** per date — `{date, generatedAt, thesis, deltas[], catalysts[], risks[], changelog[]}`.
- The same record powers the hero, the Catalysts tab, and the Risks tab. Changing the hero date reshapes all three.
- **The hero is never hand-written.** If the agent fails, show "Narrative refresh pending · last successful <date>" and keep the last-good record visible; the quant tabs still render.

### Context the agent must consume

Whatever else is on the page, the agent's prompt must pull in:

- The current day's basket table (prices, fundamentals, valuation tags, alpha vs benchmark)
- Day-over-day moves + any status flips on prior catalysts/risks
- News & Social feed (last 24–72h window, basket-tagged, de-duped)
- Any Macro & Industry series on the page (if that tab exists)
- The prior narrative record (so it can diff and write the "what changed" section)

In Methodology, spell out **exactly** which data sources feed the agent — the reader should be able to reproduce the context.

### Date switcher

- Left arrow · **dropdown** · right arrow at the top of the card.
- Dropdown lists the last ~60 narrative records, newest-first, each labeled `<Date> · <relative age>` (e.g. `Apr 18 · 1d ago`).
- Selecting a date:
  - Rewrites hero narrative, deltas, Catalysts tab, Risks tab, and any ADK-driven changelog to that record.
  - Does **not** change the header "last updated" (that always reflects the newest record).
  - Writes `#hero=YYYY-MM-DD` to the URL hash for deep-linking; restore on page load.
- Prev/Next buttons step one record; disable at boundaries.
- Methodology is static — the picker has no effect there.

### Body format — flexible

Pick whichever fits the thesis; keep one format per playbook (don't mix).

**Format A — Short thesis + deltas** (good for fast-moving theses):

- **Today's thesis** paragraph (~60–120 words): free-form narrative from the ADK stating what the thesis says today.
- **"What changed since yesterday"** bulleted deltas — each delta has:
  - Sentiment dot: `● Bull` / `● Bear` / `○ Neutral`
  - Category badge: `[Valuation]` / `[Catalyst]` / `[Risk]` / `[Macro]` / `[News]`
  - Short label (one line) + optional 1–2 sentence body
  - Hide the section entirely if no deltas for the day

**Format B — Long-form narrative** (good for slow-moving structural theses):

- One multi-paragraph essay (~200–400 words) stating the current thesis and weaving in what changed since the prior snapshot inline.
- No separate delta list.

## Content arrangement — thesis-driven

Lead with whatever carries the thesis, and **proactively add sections the thesis demands** — the default set is a floor, not a ceiling.

- Near-empty section? Cut it or fold into a neighbor.
- Methodology last; a quant anchor next to the hero.
- Note the chosen arrangement (and any added sections) in Methodology so it isn't "fixed" back to the default.

## Tab 1 — Overview (default, quant-driven)

The hero sits above. Tab body shows the quant snapshot of the basket as a whole.

Typical widgets:

- **Equity curve vs benchmark** — 1Y line chart, base=100; basket in brand color, benchmark (SPY / sector ETF / BTC / etc.) in neutral, dashed 100 baseline.
- **Benchmark attribution** one-liner beneath the curve: `Alpha · Beta · R² · Correlation`.
- **Horizon metrics grid** — 1D / 7D / 1M / 3M / YTD / 1Y cards, each showing basket return, benchmark return tag, +/- color coding.

Skip anything that doesn't add signal. Don't restate the hero narrative here.

## Tab 2 — Basket (quant-driven)

### Basket table

Columns (pick what matters for the thesis):

- **`<ticker> · ▾`** — row anchor + expand caret
- Name
- Layer / sub-theme (e.g. `Primes`, `Shipbuilder`, `Picks & shovels`, `Hyperscaler`, `Enabler`, `Application`)
- Mkt Cap
- Thesis-relevant fundamentals: P/E, EV/EBITDA, Rev YoY (swap for NVT / FCF yield / pipeline count / etc. as fits)
- 1Y return
- α vs benchmark YTD
- Valuation tag: `Cheap` / `Fair` / `Rich` (thresholds in Methodology)

Sort by layer, then market cap; keep every column sortable.

### Expand-row panel

- Left: price chart (daily bars by default; interval sized to thesis horizon).
- Right: **"Why it's in the basket"** (1–3 sentences tying the name to the thesis) + key-value metric pairs (valuation, exposure rationale, key catalyst).

The "why it's in the basket" blurbs are prewritten per name and refreshed only when the basket changes — they are not part of the daily ADK record.

### Valuation scatter

- X: valuation percentile (e.g. 5Y P/E %ile)
- Y: 1Y return
- Dot size: market cap
- Dot color: valuation tag (green cheap / grey fair / red rich)
- Shade the "sweet spot" quadrant (cheap + outperforming).

Footnote: "Cheap in a fading thesis is a trap — read alongside Catalysts and Risks."

## Tab 3 — Catalysts (ADK-driven)

Comes from the **same ADK narrative record** as the hero. Hero date ↔ Catalyst list are bound.

### Sub-tabs

`Ongoing` · `Delivered ✓` · `Missed ✗` — show event counts per tab.

### Timeline per sub-tab

- Ongoing: ascending (soonest first).
- Delivered / Missed: descending (most recent first).

Each event card:

- Date — absolute (`2026-06-15`), rough (`2026 Q3`), or `TBD`
- Status badge: `Upcoming` / `Delivered ✓` / `Missed ✗`
- Sentiment dot: `● Bull` / `● Bear` / `○ Ambiguous`
- Title (one line)
- Notes (2–4 sentences of context + impact)
- Affected basket names (tickers)

Past events dim; upcoming events prominent.

## Tab 4 — Risks (ADK-driven)

Same ADK narrative record as the hero and Catalysts tab.

Structured risk register — no hand-waving. Columns:

- **Risk** — narrative description, optionally prefixed with a `[CATEGORY]` tag: `[Policy]` / `[Regulatory]` / `[Tech substitution]` / `[Cyclical]` / `[Execution]` / `[Valuation]` / `[Narrative]` / `[Geopolitical]`
- **Exit trigger** — concrete threshold that would materialize this risk (`—` if none). E.g. "DoD FY27 budget grows <3% YoY nominal."
- **If triggered** — planned portfolio action (trim, rotate, exit).
- **Priority** — Severity × Status matrix, shown as a colored chip: `High` (red) / `Medium` (orange) / `Low` (grey).

Sort by priority descending, then by status (Materializing > Watching > Dormant).

## Tab 5 — News & Social (quant-driven)

Unified feed; the ADK also consumes this feed upstream but the tab itself shows raw items.

### Filter chips

`All` · `News` · `X (Twitter)` — show count per filter.

### Feed card

- Source icon: `N` (news) / `𝕏` (X)
- Metadata row: source tag · ticker tags · author · engagement (likes/RTs) · sentiment dot · timestamp
- Title
- Snippet (~1–2 lines)
- Thumbnail right-aligned if present
- Click opens source URL in new tab

### Inclusion rules (document in Methodology)

- News: basket-tagged, de-duped, last 24–72h rolling window, cap ~80 items.
- Social: engagement-filtered (≥1 like/RT or verified author), spam-filtered, cap ~40 items.
- Total feed cap ~120 items — older items paginate or drop.

## Tab 6 — Methodology

Always include. Explain every pipeline and every derived field so the reader can trust the page.

Subsections to cover:

- **How this playbook works** — two pipelines (quant + ADK narrative), cadence in ET (plus EST shift if applicable), and that the hero / Catalysts / Risks all come from one ADK record per date.
- **Hero format choice** — Format A or Format B, and why.
- **ADK context** — exact list of inputs fed to the narrative agent (snapshots, prior record, news/social, macro series, tool access).
- **Basket selection** — list every name by layer; state rule-based vs judgment-based; basket change-log policy.
- **Computation rules** — define every derived field shown in the UI:
  - Rev YoY / TTM basis
  - Valuation tag thresholds (e.g. P/E percentile vs 5Y: Cheap <25%, Rich >75%)
  - Alpha definition (e.g. α vs SPY YTD = ticker YTD − SPY YTD)
  - Risk priority matrix (Severity × Status)
  - Hero-delta surfacing rules (e.g. >3% 1D moves, catalyst status flips, ≥2-source news)
- **Data sources** — OHLCV + fundamentals (Alva SDK); macro (FRED / World Bank / etc.); filings / contracts if applicable; news (Alva News SDK); social (GrokX or equivalent); narrative (ADK agent + its tools: Serper / Brave News / GrokX / URL scrape).
- **What this does NOT capture** — honest list of known blind spots.
- **Glossary** — thesis-specific terms.

Snapshot picker is hidden on this tab.

## Tab 7 — Macro & Industry *(optional)*

Include only if the thesis has 2+ macro/industry signals that actually move conviction and aren't captured by the basket chart. Skip when the basket is the whole story.

Mix and match from these building blocks, keeping whatever fits the theme:

- Aggregate spend / volume chart (e.g. FRED series, sector capex, Rx volumes)
- Cross-country / cross-region bar chart (e.g. NATO % GDP, EV penetration by country)
- Quarterly trend stack (e.g. contract awards by contractor family, approvals by sponsor)
- Latest-period horizontal breakdown (most recent quarter, colored by public vs private)
- Filings / contracts / deal-flow table (≥size threshold, newest-first, description text cleaned of source noise)

Document every series, window, and cleaning rule in Methodology.

## Other tabs (use only when the thesis demands it)

Don't bolt on tabs speculatively. Add one only when a type of content genuinely doesn't fit elsewhere. Examples:

- **Regulatory / Policy** — for theses where policy timing is the primary driver (biotech approvals, antitrust, tariffs)
- **Supply Chain** — for hardware / physical theses (semis, EV, defense components)
- **On-chain** — for crypto theses (flows, fees, holder distribution)
- **Sentiment / Positioning** — for crowded-trade theses (CFTC positioning, short interest, fund flows)

Each new tab must:

- Be clearly either quant-driven or ADK-driven.
- Respect the hero date picker if ADK-driven.
- Be documented in Methodology (sources + computation).

## Cron

Two crons, not one.

| Pipeline | Cadence | Notes |
|---|---|---|
| Quant feed | Daily post-close (e.g. 6 PM ET) | Faster only if an input metric actually updates intraday. |
| Narrative feed (ADK) | Daily ~30 min after quant (e.g. 6:30 PM ET) | Must run **after** quant so it can diff today vs yesterday. |

- Cron in UTC; display in ET in the UI (account for EDT/EST shift).
- Quant feed accepts `args.now` (ms) for one-off backfill runs.
- Narrative feed accepts `args.date` (YYYY-MM-DD) to (re)generate a specific record — useful when the agent fails and a day needs re-running.
- **Forward-only narrative accumulation.** Never fake-backfill past narrative records by running the agent on historical snapshots — it will see *currently-revised* quant data, not the real point-in-time state, and produce a misleading "what changed yesterday." Each narrative record should be the one produced live on that date.
