# Thesis Tracking Template

Reference structure for any narrative-driven thematic thesis tracker (defense, AI infra, GLP-1, energy transition, capex bottlenecks, etc.). Distilled from three production playbooks: `siriusshen/space-defense-orders`, `siriusshen/mag7-capex`, and `steven/next-bottleneck`.

## Design System Compliance (READ FIRST)

Before writing HTML, read from the Alva skill:
- [references/design-system.md](../../references/design-system.md) -- `.playbook-container` rule verbatim (max-width 2048px, 28px horizontal padding)
- [references/design-widgets.md](../../references/design-widgets.md) -- **Chart Card / Metric Card / Table Card / Free Text Card / Feed Card** bases. Every surface in this template maps to one of these widgets; do not invent new card types or re-style widget internals.
- [references/design-components.md](../../references/design-components.md) -- **Tab** (Underline / Pill), **Modal**, **Dropdown**, **Markdown** primitives.
- [references/design-tokens.css](../../references/design-tokens.css) -- use spacing/color tokens as-is, do NOT override.

This template shares its shell (tab bar + README chip + methodology modal) with the screener template. Where screener has already specified a pattern, **reference `templates/screener/template.md` rather than re-specing it** -- matching surfaces must stay visually identical across playbook families.

## Page Layout

```
+--------------------------------------------------------------------+
| [ Thesis · Basket · Catalysts · Risks · News & Social ]  [📖 README] |
+--------------------------------------------------------------------+
| <Tab content -- everything is "current" except the TLDR card       |
|  inside Tab 1, which has its own date picker over narrative history> |
|  README chip → Methodology modal (max-width 896px)                 |
+--------------------------------------------------------------------+
```

Five tabs of equal weight. Methodology is **not** a tab -- it lives in a modal opened by a `README` chip in the tab-right group (mirrors screener; see [Tab-Right Group](#tab-right-group) below). **No internal header**: the Alva playbook shell already renders the thesis name, last-updated timestamp, refresh cadence, and feed list -- do not duplicate them inside the page. All content within each tab is expanded (not collapsed) and laid out vertically.

**Tab bar**: reuse the same Tab component as screener's main tab bar -- Underline tab from `design-components.md#tab`, mounted inside `.tab-wrapper-row` with a `.tab-right-group` on the right. Full CSS / HTML skeleton lives in `templates/screener/template.md § Page Layout` and § Tab-Right Group; do not re-spec here.

Only Tab 1's TLDR card is time-scrubbable (see Tab 1 → TLDR). Every other surface reads the latest snapshot / record. This mirrors how the data is actually produced: quant feeds overwrite "latest" each day, only the narrative feed accumulates history worth re-reading.

## Tab-Right Group

The right side of the tab bar row carries a single chip:

- **README chip** -- opens the [Methodology Modal](#methodology-modal).

Unlike screener, thesis does **not** put a snapshot picker at the page level -- the only historical scrub surface is the TLDR card's own date picker inside Tab 1. The tab-right group is therefore a single-chip cluster on desktop, and wraps below the tabs on mobile.

Reuse `.tab-wrapper-row` / `.tab-right-group` / `.tab-chip` / `.tab-readme` CSS and chip-chassis tokens verbatim from `templates/screener/template.md § Tab-Right Group`. Do not redefine these classes in a thesis playbook.

## How it's generated -- ADK agent + quant feed

- A dedicated **ADK narrative agent** runs once per cadence, after the quant feed has finished.
- Agent input: today's quant snapshot (basket, prices, macro, filings, news, socials), yesterday's snapshot, the prior narrative record, the basket universe, and tool access (news search, social search, URL scrape, optional web search).
- Agent output: a single **narrative record** per date. See **Data Contract** below for field names and allowed values.
- A thesis may have one claim or several independent pillars. When there are pillars, each delta / catalyst / risk tags its `pillar`; single-pillar theses simply omit the field. No separate pillar UI is required, though playbooks are free to add one.
- **Post-processing step**: after the narrative record is written, a matching pass attaches relevant news/social items to each catalyst and risk entry as `relatedNews: [{type, title, url, snippet}]`. Matching is by ticker overlap + keyword similarity. Unmatched items go to the News & Social tab.
- The same record powers Tab 1 (TLDR + deltas), Tab 3 (catalysts), and Tab 4 (risks). But only Tab 1 is historically scrubbable -- Tabs 3/4 always read the latest record (see "Date scope" below).
- **The TLDR is never hand-written.** If the agent fails, show the most recent successful TLDR with a "stale" indicator; the quant widgets still render.
- In Methodology, spell out **exactly** which data sources feed the agent -- the reader should be able to reproduce the context.

**Date scope.** Only the TLDR card in Tab 1 has a date picker. That picker scrubs two things from `narrative/records`: the `thesis` body (TLDR) and the `deltas` list rendered beneath it in Tab 1. Everything else -- metric cards, equity curve, horizon returns, basket table, catalysts tab, risks tab, news feed -- reads the latest data and ignores the picker. Catalyst `status` changes and risk edits are reflected via the TLDR narrative prose, not by rewinding the Tab 3/4 lists.

---

## Data Contract

Three surveyed playbooks diverged on field names, casing, and record shapes -- enough that generic tooling (date picker, TLDR renderer, catalyst/risk widgets, news matcher) can't be reused across them. This section freezes the joints that caused the divergence. Everything else is free.

### Frozen field names

Do not invent synonyms for these. UI code decodes case-exactly.

| Term        | Meaning                                                             | Do not use                      |
|-------------|---------------------------------------------------------------------|---------------------------------|
| `id`        | Basket member primary key (uppercase ticker / symbol).              | `ticker`, `symbol`, `code`      |
| `layer`     | Member's grouping inside the basket (sub-industry / persona / tier).| `segment`, `bucket`, `tier`     |
| `pillar`    | Independent support of the thesis. Distinct from `layer`.           | `leg`, `axis`, `arm`            |
| `sentiment` | Title Case, chosen from `{"Bull", "Bear", "Neutral", "Ambiguous"}`. Each object field uses a subset -- see Delta / Catalyst below. | lowercase, numeric, `"bullish"` |
| `category`  | Delta / risk tag. Enumerated below.                                 | `tag`, `type`, `kind`           |

### `narrative/records` — one record per date

```
date          int   epoch ms at midnight UTC of the record date
recordDate    str   "YYYY-MM-DD"  (redundant with `date`, carried for UI pickers)
generatedAt   int   epoch ms, when the agent produced this record
thesis        str   markdown TLDR body, rendered in Tab 1's TLDR card
pushLine      str   standalone plain-text headline, ≤ 160 chars, used verbatim
                    by push notifications. ADK produces it in the same call as
                    `thesis` -- one generation, two consumption surfaces, zero
                    second-pass drift.
source        str   "adk" | "fallback"  -- "fallback" when grounding failed
                    and `thesis` + `pushLine` were both blanked
deltasJson    str   JSON-encoded array of delta objects
catalystsJson str   JSON-encoded array of catalyst objects
risksJson     str   JSON-encoded array of risk objects
```

The `Json`-suffixed fields are JSON strings, not native arrays -- this matches Feed SDK behavior and both surveyed live playbooks. Renderers `JSON.parse()` at read time.

**Re-run semantics**: a re-triggered narrative agent for the same `recordDate` appends a new row (Feed SDK default). Readers deduplicate by `recordDate`, keeping the row with the largest `generatedAt`. The date picker dropdown also dedupes on `recordDate`.

**ADK output shape**: the narrative agent produces structured JSON `{thesis, pushLine}` in a single call, not free-form text. Both fields go through the same voice check and the same numeric grounding check (see Tab 1 → TLDR). If either field fails grounding, **both** are blanked and `source: "fallback"` is written -- partial prose in a finance UI is worse than silence.

### Delta object

```
{ sentiment, category, label, body?, pillar? }
```

- `sentiment`: `"Bull"` | `"Bear"` | `"Neutral"`
- `category`: `"Valuation"` | `"Catalyst"` | `"Risk"` | `"Macro"` | `"News"` | `"Positioning"` | `"Flows"`
- `label`: one line, ≤ 80 chars
- `body`: optional 1-2 sentence context
- `pillar`: required if the thesis is multi-pillar; must match a declared pillar id

### Catalyst object

```
{ date, status, sentiment, title, notes, ids, relatedNews?, pillar? }
```

- `date`: absolute `"YYYY-MM-DD"`, rough `"YYYY Q3"`, or `"TBD"`
- `status`: `"Upcoming"` | `"Delivered"` | `"Missed"`
- `sentiment`: `"Bull"` | `"Bear"` | `"Ambiguous"`
- `ids`: array of member `id`s affected by this catalyst
- `relatedNews`: post-processing populates as `[{type, title, url, snippet}]`. `type`: `"news"` | `"twitter"` (extend per source only if you wire it in the matcher).
- `pillar`: required if multi-pillar

### Risk object

```
{ category, description, divergenceType, exitTrigger, ifTriggered, priority,
  relatedNews?, pillar?, thesisClaim? }
```

- `category`: `"Policy"` | `"Regulatory"` | `"Tech substitution"` | `"Cyclical"` | `"Execution"` | `"Valuation"` | `"Narrative"` | `"Geopolitical"`
- `divergenceType`: `"Fundamental"` | `"Narrative"` | `"Valuation"` | `"Flows"`
- `exitTrigger`: concrete threshold, or `"--"` if none
- `ifTriggered`: planned action (trim / rotate / exit / prose)
- `priority`: `"High"` | `"Medium"` | `"Low"`
- `pillar` + `thesisClaim`: required if multi-pillar. `thesisClaim` quotes the pillar commitment this risk diverges from -- anchors the risk to a specific thesis claim instead of free-floating worry. Do not use `pillarQuote`, `claim`, etc.

### `alpha/snapshot` — theme-level return snapshot

```
date            int
basketRet       {d1, d5, d30, d180}   percentage points (5.23 = +5.23%)
benchmarkRet    {d1, d5, d30, d180}
alpha           {d1, d5, d30, d180}   basketRet - benchmarkRet per horizon
controlRet?     {d1, d5, d30, d180}   if the thesis has a control universe
vsControl?      {d1, d5, d30, d180}
```

**Do not embed member tickers in field names.** `pltr1d` / `rklb1d` / `ita1d` is a forbidden pattern -- it locks the snapshot to a specific thesis. Per-member horizon returns belong in `alpha/basket` (one row per member). Hero-ticker curves belong in `prices/<id>`.

### Empty-state rules

Three rules are load-bearing -- template renderers must follow them verbatim, otherwise the same empty data will render three different ways across playbooks:

- `flags: []` on a basket row → render **no** flag pill. Do not render a synthetic `"clean"` pill.
- `deltas: []` on a narrative record → **hide** the whole "What changed since yesterday" section (no heading, no placeholder).
- `catalysts: []` / `risks: []` on the latest record → keep the tab visible; show a single muted line ("No tracked catalysts." / "No tracked risks today."). Do not hide the tab.
- `relatedNews: []` on a catalyst or risk → hide the related-news pill entirely; do not render `0 news & social`.
- Narrative record missing for a selected date → fall back to the deterministic TLDR one-liner (see Tab 1 TLDR); quant widgets render normally from the snapshot.

---

## Tab 1 -- Thesis (ADK + quant)

The daily thesis view. All widgets default expanded, laid out vertically. No collapsible sections. Prefer charts and visual elements over tables and text wherever possible.

### TLDR

Short-form markdown summary rendered inside a **Free Text Card** (`design-widgets.md#free-text-card`) with the body rendered via the **Markdown (M)** primitive (`.markdown-container --m` from `design-components.md#markdown`). Same combination screener uses for its Daily Digest -- do not spec a thesis-unique `.tldr` class, and do not re-style `ul / li / strong` / headings. The card is the only historically scrubbable surface in the playbook.

**Card layout**:
```
+----------------------------------------------------------+
| < [ Apr 22 · today      v ] >     generated 6:32 PM ET  |
|                                                          |
|  <TLDR markdown body>                                    |
+----------------------------------------------------------+
```

- **Date picker** (top-left of the card): left arrow, dropdown, right arrow. The dropdown lists up to ~60 `narrative/records` entries, newest-first, each labeled `<Date> · <relative age>` (e.g. `Apr 22 · today`, `Apr 18 · 4d ago`). Prev/Next step one record; disable at boundaries. The selected date is the record currently rendered in the card **and** in the "What changed since yesterday" deltas section below -- nowhere else.
- **Generated-at label** (top-right): `generated <HH:MM ET>` from the selected record's `generatedAt`. A separate small "stale" pill appears if the selected date is today and the record is older than one cadence.
- Writes `#tldr-date=YYYY-MM-DD` to the URL hash for deep-linking; restore on page load. Omitted hash means "latest".

**Input to ADK:** same as the agent's full context (see "How it's generated" above) -- quant snapshot pair, deltas, catalyst/risk status changes, macro trends, band flips.

**TLDR must answer four questions, in order:**
1. **What happened?** -- the key event or data point since last snapshot (catalyst flip, earnings, macro release, big price move). If nothing happened, say so.
2. **What's the impact on our basket?** -- how it moved alpha, scores, or specific names. Tie the event to basket-level or name-level numbers.
3. **Is there a longer-term push?** -- does this reinforce or weaken the structural thesis? One clause, not a paragraph.
4. **What to watch next?** -- the next upcoming catalyst, earnings date, or data release that could move the thesis.

**Content rules:**
- One sentence can cover multiple questions. Don't pad to fill all four if two suffice.
- When multiple events (e.g. one catalyst + one risk), cover both -- give each its own clause or sentence.
- Name 1-2 specific drivers (ticker, event, factor) -- not a summary of everything.
- No buy/sell language. Observational only.
- Voice: verbs over adjectives, numbers embedded in prose, thesis-native terms. No research-report hedging ("we believe", "arguably", "on balance").

**Hard constraints:**
- **Must render as formatted markdown** -- use `**bold**` for tickers and key events, keep paragraphs short or use a brief list. A plain-text wall is a bug.
- Follow the four-question order. Do not reorganize by pillar or layer.
- Length follows the day: ~3-5 sentences is the soft upper bound. A quiet day with no material change is one or two sentences -- say so explicitly. A churn-heavy day may use short bullets. Do not pad to hit a length target; do not append when overshooting, compress.
- **Grounding**: every number must be traceable to a field in today's `alpha/snapshot`, `alpha/basket`, `fundamentals/snapshot`, or events feeds. Agent-synthesized numbers are forbidden. Implementation: after the ADK call, extract every number from both `thesis` and `pushLine` with regex `-?\d+(?:\.\d+)?%?` and cross-check each against the input data. One miss → blank **both** fields and write `source: "fallback"` (all-or-nothing; see Data Contract). Silence beats partial fabrication in a finance UI.
- The generated `{thesis, pushLine, source}` is persisted as fields on the day's `narrative/records` row. Regenerate only when a new snapshot appears -- do not recompute on every page load.

**Fallback (when ADK fails or grounding fails):**
- Storage: `thesis` and `pushLine` are stored blank; `source: "fallback"` flags the row.
- Render-time substitute: when UI reads a row with `source === "fallback"`, it renders a deterministic one-liner computed client-side from the latest `alpha/snapshot` alone (not from the narrative record, which is untrusted): `Basket <±X.X%> today vs benchmark <±Y.Y%> · 5d alpha <±Z.Z pp>`. Numbers come straight from `basketRet.d1`, `benchmarkRet.d1`, `alpha.d5`.
- On grounding failure only (not ADK crash), prepend a muted `<small>Narrative self-check failed -- showing quant summary.</small>` line.
- Never show an empty TLDR card -- always fall back.

Methodology should include 1-2 gold TLDRs (real past records you'd happily ship) as few-shot exemplars for the agent. This is a recommendation, not a contract.

### Metric cards (3)

Three KPI cards in a row, each rendered with the **Metric Card** widget (`design-widgets.md#metric-card`). Follow the widget's color rules (green/red for +/-) and typography verbatim -- do not override. Each card: large number + label + sub-description.

- **Theme YTD** -- basket absolute return YTD + basket description (e.g. "8 names EW").
- **Benchmark YTD** -- benchmark return YTD + benchmark name (e.g. "iShares A&D ETF").
- **Alpha YTD** -- theme minus benchmark + definition label. Give this card the most visual weight (accent border or background tint) as the thesis headline.

### What changed since yesterday (deltas)

Bound to the TLDR card's date picker above: selecting a date swaps both the TLDR body and this deltas list, which are two renderings of the same `narrative/records` entry.

Each delta has:
- Sentiment dot: `[Bull]` / `[Bear]` / `[Neutral]`
- Category badge: one of the enumerated categories (see Data Contract)
- Short label (one line) + optional 1-2 sentence body
- Pillar chip (if multi-pillar): small pillar id

Empty state: see Data Contract (`deltas: []` hides the whole section).

### Equity curve vs benchmark

**Chart Card** widget (`design-widgets.md#chart-card`), Line chart variant. Default expanded, 1Y window. Base=100; basket in brand color, benchmark (SPY / sector ETF / BTC / etc.) in neutral, dashed 100 baseline. Beneath the curve: `Alpha · Beta · R2 · Correlation` one-liner. Follow the widget's ECharts rules verbatim -- raw hex in ECharts config (no `var(--x)`, ECharts is Canvas), dotted background handled by `.chart-dotted-background`, no `backgroundColor` override.

### Horizon returns bar chart

**Chart Card** widget, grouped Bar chart variant (not a table). X-axis = horizons (1D / 7D / 1M / 3M / YTD / 1Y), two bars per horizon (theme return + benchmark return), alpha labeled above each pair. Color: theme in brand color, benchmark in neutral. Data comes from `alpha/snapshot` (1D/5D/30D/180D) plus derived YTD/1Y from `prices/themeIndex`.

### Macro / industry charts (if any)

Thesis-level context charts that don't fit in the basket table. E.g. hyperscaler capex stacked bars, DoD budget trend, GLP-1 Rx volumes. Each chart uses the **Chart Card** widget -- pick the variant (Line / Bar / Stacked Bar) from the widget spec. Include only if the thesis has 1-2 macro signals that directly drive conviction; skip when the basket is the whole story. Document every series in Methodology.

---

## Tab 2 -- Basket

Basket membership is judgment-driven (manually curated per thesis). How the basket is ranked and described has two forms.

**Default**: members are grouped by `layer`, sorted within layer by alpha vs benchmark, and each member carries a short hand-written rationale. No composite score. This is what every surveyed production playbook uses, and the right choice unless you have a specific reason otherwise.

**Optional: composite scoring**. If you have 20+ members and genuinely definable factors, you can add a weighted `thesisScore` column that ranks members 0-100 across layers. Spec is at the end of this section. Use it only when comparability across layers matters more than rationale depth.

### Ranked table

**Table Card** widget (`design-widgets.md#table-card`), used verbatim -- do not re-spec the table chassis, sticky behavior, hover tint, or expanded-row border handling. Column widths are set by `initTableAlignment` at runtime (proportional flex); **never** set `width` on `<td>` / `<th>` in CSS. Column 1 (`#`) and column 2 (`id`) pinned left; caret pinned right.

Columns left-to-right:

- **`#`** (sticky) -- rank by layer then alpha desc (default), or by `thesisScore` desc if using composite scoring.
- **`<id>`** (sticky) -- row anchor + expand caret.
- **Name - Layer** -- layer chip, colored by layer.
- **Thesis-relevant fundamentals** (2-3 columns) -- pick what matters for *this* thesis.
- **Alpha vs benchmark YTD** -- color-coded +/-.
- **(optional) Thesis Score** + Score Bar -- only if using composite scoring. Color by score: ≥80 green, ≥70 blue, ≥60 amber, <60 red.
- **(optional) Band Pill** -- `Elite` / `Strong` / `Average` / `Weak` at 80/70/60/0.
- **(optional) Flag Pill** -- `soft` (amber) / `hard` (red). `flags: []` means no pill.
- **v** (sticky right) -- expand caret.

Every column sortable.

### Expand-row panel

8-col grid. All chart surfaces use the **Chart Card** widget (`design-widgets.md#chart-card`); prose surfaces use the **Free Text Card** widget with `.markdown-container --m`. Three invariants:

- **Subtitle typography**: every in-panel card title is uniformly **14px / weight 400** (this is the Chart Card `widget-title-text` default -- do not override). Do not bold, do not upsize, do not re-color titles in this panel.
- **Equal-height on the same row**: cards sharing a row must match heights via the widget's `.widget-row` + `flex:1; height:0` pattern (ECharts containers: `height:100%; min-height:180px`). Never let one card grow tall while its row-mate collapses.
- **No new card classes**: reuse `.widget-card` / `.widget-body` / `.chart-body` / `.free-text-body`.

Layout:

- **Row 1**: `col-8` Price chart (Chart Card, K-line + volume, daily bars, interval sized to thesis horizon).
- **Row 2**: `col-8` **Rationale** (Free Text Card, `.markdown-container --m`) -- 2-5 sentences of hand-written prose: what this member IS in the thesis, why it fits right now, what the market is missing, what would break the rationale. Shape is up to the author; keep it tight. Static until manually updated (basket changelog).
- **Row 3** (composite scoring only): `col-4` Gauge Ring (Chart Card) + `col-4` Factor Breakdown (Chart Card, horizontal Bar). Equal-height required.
- **Row 4** (if any flags): Flag Cards -- one card per active flag, tier-colored accent bar. Omit if no flags.

### Valuation scatter

**Chart Card** widget (`design-widgets.md#chart-card`), Scatter variant.

- X: valuation percentile (e.g. 5Y P/E %ile)
- Y: 1Y return
- Dot size: market cap, mapped via `log10(cap/1e9 + 1) * 14` clamped to `[10, 40]` (same formula as screener's factor scatter, so sizes read consistently across playbooks).
- Dot color: by `layer` (default) or by band (composite scoring).
- Shade the "sweet spot" quadrant (cheap + outperforming).
- Labels on points: `labelLayout: { hideOverlap: true }`.

Footnote: "Cheap in a fading thesis is a trap -- read alongside Catalysts and Risks."

### Composite scoring (optional)

Only use when (a) 20+ members, (b) factors are definable and measurable uniformly across members, (c) cross-layer ranking matters.

- **Factors**: each factor has a name, what it measures, a normalization rule (how raw → 0-100), and a weight (all weights sum to 100%).
- **Composite**: `thesisScore = Σ (normalized factor × weight)`, range 0-100.
- **Bands**: Elite ≥ 80 / Strong ≥ 70 / Average ≥ 60 / Weak < 60. Adjust thresholds per thesis if the distribution is skewed -- by changing factor weights or normalization, not by rescaling the final score. The displayed score must equal the weighted sum verbatim.
- **Flags**: threshold breaches on raw metrics, independent of the composite. Each flag is `hard` (actionable) or `soft` (watch). Flags do not move the score. `flags: []` means no pill (no synthetic `"clean"`).
- **Refresh**: scores recompute every quant feed run. Factor definitions and weights are static until manually updated (log in Methodology basket changelog).

---

## Tab 3 -- Catalysts (ADK-driven)

Always reads the **latest** `narrative/records` entry -- no date picker, no historical scrub. If you want to know how today's catalyst state differs from yesterday's, the TLDR in Tab 1 (which IS scrubbable) describes the transition in prose. Each catalyst card can be expanded to show related News & Social items that support it (attached via post-processing).

### Sub-tabs

`Ongoing` / `Delivered` / `Missed` -- rendered with the **Pill M** tab variant (`design-components.md#tab`, `.tab .tab-pill .tab-m`). Label format: `<Name> <count>`, e.g. `Ongoing 4`. Count is the catalyst array length filtered by `status` for that sub-tab.

### Timeline per sub-tab
- Ongoing: ascending (soonest first).
- Delivered / Missed: descending (most recent first).

### Catalyst card (collapsed)
- Date -- absolute (`2026-06-15`), rough (`2026 Q3`), or `TBD`
- Status badge: `Upcoming` / `Delivered` / `Missed` -- **grey pill** (neutral background, muted text). Informational, low visual weight.
- Sentiment pill: `Bull` / `Bear` / `Ambiguous` -- **colored fill pill**. Bull = green (m3), Bear = red (m4), Ambiguous = grey. Highest-contrast element on the card.
- Pillar chip (multi-pillar only): small pillar id.
- Title (one line)
- Notes (2-4 sentences of context + impact)
- Affected basket names (from the `ids` array)
- Related News & Social pill: `<count> news & social` -- **blue pill** (m1 teal tint). Only shown if related items exist.

Past events dim; upcoming events prominent.

### Catalyst card (expanded)
Expand to reveal related News & Social items (shared expand format -- see below).

---

## Tab 4 -- Risks (ADK-driven)

Always reads the **latest** `narrative/records` entry (same as Catalysts -- no date picker). Each risk row can be expanded to show related News & Social items (same post-processing as Catalysts).

Structured risk register -- no hand-waving. Rendered with the **Table Card** widget (`design-widgets.md#table-card`), same column-alignment rules as Tab 2 (widths via `initTableAlignment`, no CSS cell widths). Columns:
- **Category chip** -- from the risk `category` enum.
- **Pillar chip + thesis-claim quote** (multi-pillar only) -- the `pillar` id and the `thesisClaim` rendered as a muted quote block, anchoring the risk to a specific thesis commitment.
- **Risk description** -- must cite today-snapshot evidence.
- **Divergence type** -- `Fundamental` / `Narrative` / `Valuation` / `Flows`. Small pill.
- **Exit trigger** -- concrete threshold (`--` if none). E.g. "DoD FY27 budget grows <3% YoY nominal."
- **If triggered** -- planned portfolio action.
- **Priority** -- `High` (red) / `Medium` (orange) / `Low` (grey).
- **Related News & Social** -- count badge; only if related items exist.

Sort by priority descending, then by status (Materializing > Watching > Dormant).

### Risk row (expanded)
Same shared expand format as Catalysts.

### Shared expand format (Catalysts + Risks)
- Each item: source icon (`N` news / `X` Twitter), title (clickable, opens in new tab), snippet (~1 line), timestamp.
- Cap ~5 items, highest-relevance first. No expand affordance if nothing matched.

---

## Tab 5 -- News & Social

The full news and social feed for the basket. All items, including those already matched to catalysts or risks -- this is the complete picture, not a spillover.

### Layout

**Feed Card** widget (`design-widgets.md#feed-card`). Pick the `News` or `X (Twitter)` item template from the widget spec based on `type` -- do not invent a new item type. Avatar / source-logo slot rules come from the widget (`N` for news, `X` for Twitter) automatically; do not re-spec.

- Flat list, newest-first.
- Each item: source icon (widget default), title (clickable, opens in new tab), ticker tags (using `id`), sentiment dot, timestamp, snippet (~1 line).
- Items matched to a catalyst or risk show a tag indicating which one (e.g. `-> MSFT earnings catalyst`), rendered inside the feed item's metadata row (not as a separate badge).
- No pagination -- 24-72h window, oldest drops off. Full feed: basket-tagged, de-duped, engagement-filtered for social, no exclusions (matched + unmatched). Details in Methodology.

## Methodology Modal

Always include -- explains how the playbook works. Lives in a **modal**, triggered by the README chip in the [Tab-Right Group](#tab-right-group). Entry, trigger, overlay, panel, and section markup all reuse `templates/screener/template.md § Methodology Modal` verbatim:

- **Trigger**: `.tab-readme` chip with `data-modal-open="methodology-modal"`. Overlay click, close-X, and `Esc` all dismiss. Body scroll locks while open.
- **Panel**: Modal base from `design-components.md#modal` with the same `max-width: 896px` override screener uses (text-dense content reads better at narrower line length). Do not re-spec overlay color, panel radius, title typography, or close icon.
- **Section markup**: `.method-section` / `.method-body` / `.method-code` / `.method-limit-list` classes from screener. Reuse, do not redefine.
- **Performance**: lazy-render the modal body on first open, not on page load.

### Content subsections

Pick what applies -- shape follows the thesis's nature. Skip subsections that don't fit (a single-pillar thesis has no pillars list; a default-scored basket has no factor weights table).

- **How this playbook works** -- two pipelines (quant + ADK narrative), post-processing news matcher, cadence in ET, exact list of inputs fed to the narrative agent. One ADK record per date powers Thesis / Catalysts / Risks.
- **Thesis pillars** (multi-pillar theses only) -- for each pillar: short id, name, the one-sentence claim, and what daily signal would verify or contradict it.
- **News matching** -- ticker overlap + keyword similarity; unmatched items flow to News & Social tab.
- **TLDR generation** -- four-question framework, grounding rule, fallback behavior, how `pushLine` is written (one-line plain-text headline, same grounding as `thesis`). 1-2 gold few-shot TLDRs recommended (each example is a `{thesis, pushLine}` pair, not just prose).
- **Basket selection** -- every name by layer; judgment-based inclusion criteria; change-log policy. If using composite scoring: each factor (name, measure, normalization, weight), composite formula, band thresholds, flag definitions, a worked example re-deriving the current #1.
- **Computation rules** -- every derived field: Rev YoY/TTM, alpha definition, risk priority matrix, delta surfacing rules.
- **Data sources** -- OHLCV + fundamentals (Alva SDK); macro (FRED / World Bank / etc.); news (Alva News SDK); social (GrokX or equivalent); narrative (ADK agent + tools).
- **Blind spots** -- honest list of what this does NOT capture.
- **Glossary** -- thesis-specific terms.

## Push Notification

For users who subscribe to the playbook. Fires once per new `narrative/records` entry, deterministically derived -- no second ADK call, no truncation of `thesis`.

- **Title**: `<Thesis Name> · <recordDate>`
- **Body**: read `pushLine` from the new record verbatim. No truncation, no paraphrase. Empty `pushLine` (fallback source) means this push would have had nothing to say -- see "When to send" below.
- **Source of truth**: the same `narrative/records` row that powers Tab 1. One ADK generation per snapshot, two render surfaces (card + push), zero drift.

### When to send

Use deterministic signals from the new record, not prose parsing of `thesis`:

- **First record ever** for this playbook → always send.
- **Subsequent records** → send only if at least one of these is true (all comparisons are scalar diffs against the prior record, no prose parsing):
  - `deltas.length` > 0
  - any catalyst with the same `title` changed `status` vs the prior record (covers Upcoming → Delivered / Missed)
  - `risks.length` increased, OR the count of risks with `priority === "High"` increased
- **Fallback source + no signal changes** → skip. If `source === "fallback"` and none of the deterministic signals fired, there is nothing trustworthy to push.
- **Fallback source + signals fired** → still send, but substitute `pushLine` with a deterministic line from the signals themselves (e.g. `"3 catalyst flips, 1 new High risk -- narrative self-check failed"`). Never send an empty body.

## Cron

Two crons, not one.

| Pipeline | Cadence | Notes |
|---|---|---|
| Quant feed | Daily post-close (e.g. 6 PM ET) | Faster only if an input metric actually updates intraday. |
| Narrative feed (ADK) | Daily ~30 min after quant (e.g. 6:30 PM ET) | Must run **after** quant so it can diff today vs yesterday. |

- Cron in UTC; display in ET in the UI (account for EDT/EST shift).
- Quant feed accepts `args.now` (ms) for one-off backfill runs.
- Narrative feed accepts `args.date` (YYYY-MM-DD) to (re)generate a specific record -- useful when the agent fails and a day needs re-running.
- **Forward-only narrative accumulation.** Never fake-backfill past narrative records by running the agent on historical snapshots -- it will see currently-revised quant data, not the real point-in-time state, and produce a misleading "what changed yesterday." Each narrative record should be the one produced live on that date.
