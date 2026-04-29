# What-If Playbook Template

For requests like: "what if I bought / sold / avoided / compared X after Y happened?"

> **Highest-priority standard — strictly follow. Always work from the latest version of this file.**

Build an editorial financial artifact, not a dashboard. It should feel polished, compact, evidence-backed, financially credible, Alva-native, and worth opening even when the user could ask AI for a short answer.

Show the verdict, evidence, historical texture, and audit trail. Keep methodology and references in README, not the main scroll. Do not build tabs, filters, dropdowns, selectors, optimization controls, portfolio dashboards, or strategy-monitor views.

## 0. Design System Compliance

Before writing HTML, read and follow:

- [references/design-system.md](../../references/design-system.md)
- [references/design-widgets.md](../../references/design-widgets.md)
- [references/design-tokens.css](../../references/design-tokens.css)

Use these as the source of truth for layout, typography, widget cards, chart styling, tokens, responsive grid, watermark, and page container behavior. Do not invent a separate visual system.

Do **not** apply `design-playbook-trading-strategy.md`; What-if is narrative, not a trading-strategy dashboard.

## 0a. Showcase Example Alignment

Before building, look for approved What-If showcase examples available in the current skill or sandbox context.

Use them to align page density, vertical rhythm, section order, chart treatment, card compactness, historical texture style, and audit ledger proportion.

Do not copy example data, claims, titles, or topic-specific conclusions. Examples are style and structure references only.

If examples conflict with this template, follow this template’s required page flow and trust rules first.

## 0b. Calculation and Trust Rules

All event-study / backtest computation must run on Alva's Altra engine on Alva Cloud whenever the request fits an Altra strategy or event-study shape.

Express trigger and entry logic as an Altra strategy definition (`skills/alva/references/altra-trading.md`, `skills/alva/references/api/trading.md`). Never hand-roll these in feed-side loops or front-end code:

- event onset detection
- forward returns
- hit rate / win rate
- median / mean / quantiles
- drawdown or recovery calculations
- cross-asset conditional comparisons

The HTML reads computed output via runtime `fetch()` from deployed feed paths. Do not hardcode quantitative results.

Avoid look-ahead bias. The trigger must be observable before entry. Deduplicate ongoing events: for threshold events, count the first trigger after reset, not every day while the condition remains true.

If a claim says "edge", "beat", "lagged", "worked", "better", or "worse", include comparison against normal periods or relevant peers.

Sample language:
- `n < 10`: thin. Use counts, not percentages as the main claim. Avoid "reliable", "proven", or "usually".
- `10 <= n < 25`: limited. Percentages may appear with counts nearby; keep confidence qualified.
- `n >= 25`: adequate. Still show sample count and avoid certainty language.

If Altra, SDK coverage, or validated BYOD data cannot support the study, reduce scope or report the blocker. Do not fabricate events, samples, or returns.

## 1. Before Building

Silently identify:

- target asset or asset group
- trigger event
- action: buy, sell, avoid, compare, or observe
- study shape: single-asset time study or cross-asset comparison
- main horizon
- comparison need
- sample quality
- main visual that best explains the result without misleading the reader

Do not show this planning object on the page.

## 2. Required Page Flow

Use one vertically scrolling page. **Keep this module order stable. Do not rename, reorder, merge, or invent top-level sections.**

1. **Title row** — concise title + README chip on the right
2. **Verdict hero** — direct answer to the user's question
3. **Belief vs history** — two balanced cards or one balanced two-column block
4. **Main evidence** — one primary visual, with optional readout rail when helpful
5. **What to remember** — compact takeaway cards using one consistent dimension
6. **Historical texture** — case cards or one compact supporting visual when it adds non-repeated evidence
7. **Audit ledger** — matched events table or equivalent audit view
8. **README modal** — methodology, references, data sources, date range, and sample count

Canonical flow: clear question → direct verdict → belief/history context → main visual evidence → memorable takeaways → historical audit trail.

## 3. Title Row and Verdict Hero

Use a concise question-style or result-oriented title.

- Single-asset studies: `[Asset] [After/Before] [Trigger]`
- Comparison studies: prefer trigger-first titles like `What Moves After [Trigger]?`
- Longer form: `[Title] — [Lookback] What-If`

Title + hero must explain the playbook within 3 seconds.

Title row:
- title text: `font-size: 20px; font-weight: 400`
- single flex row, title left, README chip right
- README chip reuses `.tab-chip.tab-readme` and opens `#methodology-modal`

Verdict hero:
- full-width Free Text Card with `markdown-container--m`
- conclusion-first
- one sentence or short paragraph
- 2–3 headline numbers only
- say whether history looked favorable, unfavorable, mixed, thin, or inconclusive
- no legal disclaimer in the main flow

Optional counter-narrative card only when it adds one memorable finding that cannot fit in the hero.

## 4. Evidence Structure

### Belief vs history

Use exactly two balanced ideas:
- the belief / intuition being tested
- what history showed

This may be two compact cards or one two-column block. It should not become methodology.

### Main evidence

Include one primary visual that most directly answers the question. The chart type is adaptive, but the section role is fixed.

Prefer a **path / indexed line chart** when the question is how outcomes unfolded over time and real path observations exist. Use another chart type when it is clearer or more honest:

- **grouped bar or ranking chart** for horizon comparison or cross-asset comparison
- **distribution, range, or case-bar view** for breadth, dispersion, or outlier-driven results
- **heatmap or case map** when historical episode texture is central

Do not default to grouped bars unless they are truly the clearest explanation. Do not draw a path or line chart unless real observations across time exist. Never connect sparse horizon summary points as if they were a continuous path.

Optional readout rail:
- allowed only inside the Main evidence block
- use 2–3 short interpretation cards when they improve clarity
- keep rail cards compact; do not create tall empty blocks
- do not duplicate takeaway cards

### What to remember

Use one consistent cutting dimension.

| Dimension | Use when the question is |
|---|---|
| **Time** | "What happened later?" |
| **Asset** | "What moved most after event X?" |
| **Ticker** | "Which basket members moved?" |
| **State** | "Is Y different in state A vs B?" |
| **Magnitude** | "Does bigger X mean bigger Y?" |
| **Recovery** | "How long does it take to heal?" |
| **Event-specific** | "What happened in key past cases?" |

The big number on each card is the observable outcome, not the sample count. If a card does not extend the hero claim, cut it.

### Historical texture

Use only when it adds depth beyond the main visual and takeaways. Prefer one of:
- three compact case cards
- one compact supporting visual
- one case range block

Do not add both a large supporting chart and multiple extra card rows unless the story genuinely needs it. Do not repeat the same metrics.

### Audit ledger

Show enough historical detail for trust. Use a compact matched-events table or equivalent audit view. The ledger is the audit layer, not the visual centerpiece.

## 5. Compact Layout and Chart Sizing

Follow `references/design-widgets.md` for Widget Layout, Metric Cards, Chart Cards, Table Cards, ECharts rules, axis rules, mark lines, and tooltips. Do not redefine those rules here.

Default card layouts:
- 3 cards: `.col-thirds`
- 4 cards: `.col-2` x 4
- 5+ cards: wrap consistently with the same cutting dimension

The page should be compact, not sparse:
- keep section spacing modest and consistent
- avoid large blank gaps between title, hero, cards, and charts
- keep card content concise so card height follows content
- avoid oversized readout cards
- avoid stretching charts or cards to fill empty space
- aim for a dense but readable first screen

Chart height is based on information density and visual balance:
- low-density charts: compact height
- medium-density charts: medium height
- high-density charts, such as real path charts, dense heatmaps, or rich distributions: taller only when readability improves

The primary evidence chart should feel important but proportionate. If a chart looks sparse, reduce its height or choose a more compact visual.

## 6. Visual and Chart Integrity

Use compact composition, clear hierarchy, Alva-compatible colors, muted references, direct labels where useful, short chart titles, compact subtitles, and clean tables.

Avoid default-looking charts, clutter, excessive grey boxes, too many lines, tiny labels, over-explained legends, repeated metrics, decorative charts, and large empty areas.

Chart integrity comes before visual ambition.

- Keep comparison meaning consistent across title, hero, chart, cards, and table.
- For cross-asset playbooks, keep labels and ordering coherent enough that the page reads as one analysis.
- If a positive return lags normal periods, keep the return positive-colored and show the negative gap separately.
- At least one chart or audit view should show per-event detail when event-level data exists.
- No "last updated / refreshed / as of" timestamp anywhere on the page.

## 7. Plain Language

Use plain English on every visible surface.

- Tickers: first mention only, in parens after the plain name. Prefer "the S&P 500", "oil", "gold", "airline stocks", "market volatility", etc.
- Time horizons: use "a month later", "a year later", or "sixty trading days after the event". Avoid `+1M`, `+1Y`, `D+10`, `fwd_3m`, `N=15`.
- Avoid trading-desk jargon unless requested. Prefer "normal periods", "past cases", "typical outcome", "strongest case", "weakest case", and "history was mixed".
- Explain cutoffs inline on first mention.

## 8. README Modal

README chip opens `#methodology-modal`. Reuse the Screener modal chassis and `data-modal-open` / `data-modal-close` wiring.

Keep methodology and references out of the main page flow. Put them in README.

Modal content:
1. how events were picked
2. how returns were measured
3. trigger source, market data source, date range, and sample count
4. legal or cautionary note, if needed

Closed by default. Must be keyboard-openable and closable via button, overlay click, and Escape.

## 9. Quality Bar

Revise before shipping if:

- the required page flow is broken, renamed, or rearranged
- the answer is not clear in the first screen
- the page could be replaced by three sentences with little loss
- the main visual does not answer the question
- the chart is generic, confusing, misleading, sparse, or badly proportioned
- a low-density chart is stretched into a dominant block
- cards or rails create large empty areas
- metrics repeat without adding interpretation
- the table dominates the page
- sample language is overconfident
- the page feels like a dashboard
- the design does not look aligned with Alva

A strong playbook should feel like:

> clear question → direct verdict → belief/history context → visual evidence → memorable takeaways → historical audit trail.
