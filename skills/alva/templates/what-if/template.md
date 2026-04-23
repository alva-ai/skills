# What-If Playbook Template

For "what-if I bought/sold X when Y happens" analysis.

> **Highest-priority standard — strictly follow. Template iterates; always work from the latest version of this file.**

## 0. Design System Compliance (READ FIRST)

**MANDATORY — strictly follow the Alva skill design guideline. Non-negotiable.**

Before writing HTML, read from the Alva skill:

- `references/design-system.md` — copy `.playbook-container` rule verbatim (max-width 2048px, 28px horizontal padding)
- `references/design-widgets.md` — metric cards / charts / tables specs
- `references/design-tokens.css` — use spacing/color tokens as-is, do NOT override

**Do NOT** apply `design-playbook-trading-strategy.md` — that doc is for trading-strategy dashboards with Overview/Analytics/Strategy/Feed tabs. What-if is a narrative, not a dashboard.

## 0a. Backtest engine — use Alva's Altra, not local compute

**MANDATORY — all backtest / event-study computation runs on Alva's Altra engine on Alva Cloud.** Never run backtests locally or hand-roll return / streak / aggregation logic in a feed script when Altra already exposes it.

- Express the trigger rule and entry logic as an **Altra strategy definition** (`skills/alva/references/altra-trading.md`, `skills/alva/references/api/trading.md`). Altra handles event detection, forward-return computation, portfolio stats, and look-ahead-bias guards — all on Alva Cloud.
- If the question genuinely cannot fit a strategy shape (e.g. a cross-asset cohort comparison Altra doesn't expose), use an **Alva SDK module + thin feed wrapper** that shapes SDK output for the HTML layer (≤ ~80 lines; do NOT re-implement aggregations).
- Custom feed computation is a last resort. When used, call it out in the Stage 7 build prompt so the reviewer can sanity-check whether Altra could have done it.

The playbook HTML reads the computed output via runtime `fetch()` from the deployed feed path — never hardcoded data literals.

## 1. Title

Format: `[Asset] [After/Before] [Trigger]`

Recommended longer form including lookback: `[Asset] [After/Before] [Trigger] — [Lookback] What-If`
e.g. "SPY After a Golden Cross (50MA × 200MA) — 15-Year What-If"

No description paragraph under the title. The verdict-hero card (section 2) replaces the prose description — it conveys the same framing, but with live numbers instead of static text.

**3-second rule:** a reader must understand what the playbook is about within 3 seconds, without reading any paragraph. Title + verdict hero together must deliver this.

## 2. Verdict Hero (required, first widget after title)

A single full-width card that answers "did this work?" before the reader scrolls. Data-driven — no hardcoded prose.

One sentence, live numbers. Conclusion-first (answer before question).

## 3. Layout (single-page scroll, results first)

One vertically-scrolling page. Top-to-bottom order:

1. **Title** (section 1)
2. **Verdict hero** (section 2) — one full-width card, data-driven
3. **Per-horizon metric cards** — 5 cards (1W / 1M / 3M / 6M / 1Y), each with avg return + win rate + median
4. **Supporting charts** — one or more visualizations that contextualize the metrics. Typical options: distribution bar+range, normalized price trajectory overlay, per-event heatmap, win-rate comparison, baseline comparison (if the strategy explicitly needs one). Pick whichever combination best tells the story; order them from most summary to most granular.
5. **Event table** — one row per event (name, date, context, per-horizon returns).
6. **References** — trigger source + data source + brief methodology note.

All content visible through a single scroll. No tabs, no hidden panels.

**Canonical reasoning flow:** headline → aggregate slice → aggregate spread → reliability → per-event paths → historical context → raw rows → methodology. Each step answers the objection raised by the previous.

## 4. Data presentation

- **Number is the visual hero.** Big numerical value, small descriptive label underneath. Never the other way around.
- **Every chart** pairs a short title with a small-text methodology subtitle (e.g. "rebased to 100 at event day, −60d to +252d").
- **Consistent color semantics** across cards, charts, and tables: positive = teal/cyan token, negative = red token, neutral/reference = grey token. Same meaning everywhere.
- **Reference lines** on comparison charts (e.g. dashed 50% line on win-rate chart) to anchor interpretation at a glance.
- **Aggregate → individual.** At least one chart must show per-event detail (not just averages), so the reader can judge dispersion and clustering.

## 5. Hard rules

- **No** "last updated / refreshed / as of" timestamp anywhere on the page.
- **No** filters, dropdowns, selectors.
- **Only interactivity allowed:** chart hover tooltips.
