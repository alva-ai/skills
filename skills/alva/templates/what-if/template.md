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
- If the question genuinely cannot fit a strategy shape (e.g. joining news headlines or macro-calendar data to event timestamps for display context), use an **Alva SDK module + thin feed wrapper** that shapes SDK output for the HTML layer (≤ ~80 lines; do NOT re-implement aggregations).
- Custom feed computation is a last resort — flag it explicitly so the choice can be double-checked before shipping.

**Operations that MUST run on Altra — never in a feed-side `for` loop:**
- Event onset detection (first threshold cross, first close below a trailing high, etc.)
- Forward-return computation at any horizon
- Hit rate / win rate / median / mean / distribution quantiles across an event set
- Drawdown depth + recovery-time
- Cross-asset or cross-ticker cohort comparisons conditioned on an event

The playbook HTML reads the computed output via runtime `fetch()` from the deployed feed path — never hardcoded data literals.

## 1. Title

Format: `[Asset] [After/Before] [Trigger]`

Recommended longer form including lookback: `[Asset] [After/Before] [Trigger] — [Lookback] What-If`
e.g. "SPY After a Golden Cross (50MA × 200MA) — 15-Year What-If"

No description paragraph under the title. The verdict-hero card (section 2) replaces the prose description — it conveys the same framing, but with live numbers instead of static text.

**3-second rule:** a reader must understand what the playbook is about within 3 seconds, without reading any paragraph. Title + verdict hero together must deliver this.

## 2. Verdict Hero (required, first widget after title)

A single full-width card that answers "did this work?" before the reader scrolls. Data-driven — no hardcoded prose.

One sentence, ≤45 words, conclusion-first. Carries 2-3 headline numbers — no more. Don't open with `Here's how X has moved…` / `Here's the distribution…`; lead with the number. No disclaimer eyebrow (`Verdict — historical observation only` and similar) — legal text, if any, goes at the bottom of methodology.

A paragraph under the hero is only allowed when it carries a counter-narrative that can't fit in the main sentence. The single most memorable counter-intuitive finding, if one exists, belongs here (or in a dedicated card) — never buried in methodology.

## 3. Layout (single-page scroll, results first)

One vertically-scrolling page. Top-to-bottom order:

1. **Title** (section 1)
2. **Verdict hero** (section 2) — one full-width card, data-driven
3. **Summary cards row** — 3-6 cards (usually 4-5), each slicing the finding by ONE cutting dimension (see §3a). All cards in the row share the same dimension; don't mix returns, hit rates, and per-ticker picks into one row. **Time is one valid dimension, not the default** — choose whichever best answers the crowd question.
4. **Supporting charts** — one or more visualizations that contextualize the metrics. Typical options: distribution bar+range, normalized price trajectory overlay, per-event heatmap, win-rate comparison, baseline comparison (if the strategy explicitly needs one). Pick whichever combination best tells the story; order them from most summary to most granular.
5. **Event / row detail table** — one row per event, basket member, or regime bucket, with the key per-row metric columns.
6. **References** — trigger source + data source + brief methodology note.

No tabs, no hidden panels — everything is on the single scroll.

**Canonical reasoning flow:** headline → aggregate slice (across chosen dimension) → aggregate spread → reliability → per-event / per-member paths → historical context → raw rows → methodology. Each step answers the objection raised by the previous.

### 3a. Cutting dimensions for the summary cards row

Pick ONE based on the crowd question:

| Dimension | Use when the question is | Example cards |
|---|---|---|
| **Time** | "How long does X last / take?" | 1W / 1M / 3M / 6M / 1Y forward return + win rate |
| **Asset** | "What moves most after event X?" | hit rate + median for SPY / TLT / GLD / DXY / XLE |
| **Ticker** | "Which basket members moved?" | per-ticker median reaction across the event set |
| **Regime** | "Is Y different in state A vs B?" | mean / median side-by-side per regime |
| **Magnitude** | "Does bigger X mean bigger Y?" | small / medium / large event buckets |
| **Recovery** | "How long does it take to heal?" | median / fastest / % within 3M / % within 1Y |
| **Event-specific** | "What happened in the key past case?" | 4-5 recognizable events, each its own card |

The big number on each card is the observable outcome, not a sample count (sample counts go in the small footer).

### 3b. Each card extends a specific hero atom (no orthogonal angles)

For every card, articulate "this shows the [tail / reliability / long-horizon] of [hero atom X]". If the hero doesn't name the underlying quantity, a card about its derivative doesn't belong here.

| Hero atom | Card extends into |
|---|---|
| average X% | **tail** — biggest single-event X |
| median took N days | **reliability** — how often within window |
| recovered by day Y | **long-horizon** — hit rate at 1Y / 2Y |
| event rate R% | **tail** — biggest single case |
| across N events | **distribution** — per-decade / per-regime split |

Failure pattern: hero "oil spike fades in 2 weeks" paired with a card about market-volatility moves on fade days — market volatility was not in the hero, reject.

### 3c. Plain language (every user-visible surface)

Applies to cards, chart titles, axis labels, table headers, tooltips, and methodology — not just cards. LLM defaults trend toward trading-desk jargon; override them.

- **Tickers**: first mention only, in parens after the plain name ("the S&P 500 (SPY)"). Typically in the hero; for basket playbooks, in the first card introducing each member. Never in chart titles, axis labels, table headers, or tooltips. Default map: SPY → "the S&P 500", USO → "oil", TLT → "long-dated Treasury bonds", GLD → "gold", QQQ → "the Nasdaq (100)", VIX → "market volatility", DXY / UUP → "the US dollar"; company tickers → company names.
- **Time horizons and telegraphic codes**: "a month later" / "a year later" / "sixty trading days after the event". Never `+1M` / `+1Y` / `D+10` / `D+60` / `d21` / `fwd_3m` / `N=15` / bare `21 trading days`.
- **Banned jargon**: `drawdown`, `cohort`, `regime`, `baseline`, `dispersion`, `reaction`, `realization`, `persistency`, `cumulative return`, `IQR`, `whiskers`, `outliers`, `realized volatility`, `R-squared`. Prefer: "biggest dip", "group", "state", "typical outcome", "range between biggest and smallest past cases", "middle half of past outcomes", "daily price swings", "almost no relationship between the two".
- **Explain cutoffs inline**: every `since YYYY` / sample filter / threshold carries a one-clause reason on first mention ("since 2011 — that's when this ETF started trading"; "20% volatility threshold — the level that typically flags an early sell-off").
- **Methodology** = two short plain paragraphs: "how we picked events" + "how we measured returns". No formulas, no `consensus EPS` / `recovery date` / `sample period`.

## 4. Data presentation

- **Number is the visual hero.** Big numerical value, small descriptive label underneath. Never the other way around.
- **Every chart** pairs a short title with a small-text methodology subtitle (e.g. "rebased to 100 at event day, −60d to +252d").
- **Consistent color semantics** across cards, charts, and tables: positive = teal/cyan token, negative = red token, neutral/reference = grey token. Same meaning everywhere.
- **Reference lines** on comparison charts (e.g. dashed 50% line on win-rate chart) to anchor interpretation at a glance.
- **Aggregate → individual.** At least one chart must show per-event detail (not just averages), so the reader can judge dispersion and clustering.
- **Footer = observable context.** Card footers carry a specific date, delta, or bucket label — never a method description. Method lives once, in the methodology block.

## 5. Hard rules

- **No** "last updated / refreshed / as of" timestamp anywhere on the page.
- **No** filters, dropdowns, selectors.
- **Only interactivity allowed:** chart hover tooltips.
