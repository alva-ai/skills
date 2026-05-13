# What-If Playbook Template

For "what-if I bought/sold X when Y happens" analysis.

> **Highest-priority standard — strictly follow. Template iterates; always work from the latest version of this file.**

## 0. Design System Compliance (READ FIRST)

**MANDATORY — strictly follow the Alva skill design guideline. Non-negotiable.**

Before writing HTML, read from the Alva skill:

- [references/design-system.md](../../references/design-system.md) — copy `.playbook-container` rule verbatim (max-width 2048px, 28px horizontal padding)
- [references/design-widgets.md](../../references/design-widgets.md) — metric cards / charts / tables specs
- [references/design-tokens.css](../../references/design-tokens.css) — use spacing/color tokens as-is, do NOT override

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

## 1. Title and naming

### 1a. Title format

Format: `[Asset] [After/Before] [Trigger]` — keep it short, concrete, no time-window suffix.

✓ Examples: `S&P 500 After a 10% Drawdown`, `Gold After a New All-Time High`, `QQQ After Three Down Days`, `Bitcoin After Halving`.

✗ **Do NOT append `— [N]-Year What-If`** (or any other lookback suffix). The lookback is a methodology detail, not a title element. The reader does not need it to understand the playbook in 3 seconds.

✗ **Do NOT include the word "What-If"** in any user-facing copy: title, `display_name`, URL slug, hero card, modal header. The playbook category is communicated by the playbook chrome around the HTML; repeating it inside the HTML is noise.

### 1b. Naming rules across the three surfaces

The same subject appears in three places — keep them aligned, NOT duplicated:

| Surface | Rule | Example |
|---|---|---|
| **`display_name`** (playbook chrome) | The concrete subject, ≤40 chars, no `What-If` suffix | `S&P 500 After a 10% Drawdown` |
| **URL slug** (`name` in release CLI) | Lowercase, hyphens, no `whatif`/`what-if` suffix, no lookback | `spx-after-10-drop` |
| **HTML `.section-title-text`** | The same subject as `display_name` | `S&P 500 After a 10% Drawdown` |

✗ **Do NOT use an HTML `<h1>` named `.playbook-title`.** That selector belongs to a different page chrome and creates a visual second title above the first widget. Use `.section-title` containing `.section-title-text` + `.section-readme-btn` — see §3 step 1 for the exact widget.

### 1c. README chip placement

The README chip is the **only** non-data UI element on the page (alongside chart tooltips). It lives at the right end of the `.section-title` row, opens the Methodology modal (§6).

**Widget spec:**
- Reuse the Screener shared chassis `.section-readme-btn` — height 24px, 12px font, 14px icon (`researcher-l1.svg`) + "README" label.
- Carries `data-modal-open="methodology-modal"`.
- Copy the CSS verbatim; do not re-skin.

### 1d. 3-second rule

A reader must understand what the playbook is about within 3 seconds, without reading any paragraph. The `display_name` (in the playbook chrome) and the section-title (inside the HTML) deliver this. Below the section-title, the **hero card and the four horizon cards must be visible without scrolling** — see §3 First-fold rule.

## 2. Verdict Hero (required, first widget after section-title)

A single full-width Free Text Card that answers "did this work?" before the reader scrolls. Data-driven — no hardcoded prose.

**One prose paragraph**, ≤80 words, conclusion-first, with the headline numbers **inline** and color-coded via `.pos` / `.neg` markdown spans (not in chips, not in separate metric cards). Don't open with `Here's how X has moved…` / `Here's the distribution…`; lead with the number.

No disclaimer eyebrow (`Verdict — historical observation only` and similar) — legal text, if any, goes in the Methodology modal, not on the card.

**Widget:** Free Text Card with `markdown-container--m` (Medium). See `references/design-widgets.md` → Free Text Card and `references/design-components.md` → Markdown.

**Inline number coloring** — use the markdown-container spans:
- `<span class="pos">+15.5%</span>` for positive headline numbers
- `<span class="neg">−39%</span>` for negative headline numbers
- Plain text for neutral values (counts, dates, durations)
- Use `<strong>` sparingly for non-numeric emphasis (e.g. **every single case**)

**Example hero:**
> Across the past 25 years the S&P 500 has dropped 10% from a peak <span class="pos">8 times</span>. The first-week bounce held in **every single case** (median <span class="pos">+4.6%</span>); a year later the index was higher <span class="pos">5 of 8</span> times, with a median gain of <span class="pos">+15.5%</span> — even after counting the <span class="neg">−39%</span> scar of 2008. Every drawdown eventually clawed back to its prior high, in a median of 11 months.

### 2a. Hero chips — optional, default off

Compact asset / trigger / case-count chips at the top of the hero card are **optional and default OFF**. The hero prose already names the asset, the trigger, and the case count inline; chips are pure redundancy in the default case.

Turn chips on **only** when at least one of the following is true:
- The asset is non-mainstream and the reader may not recognise it (e.g. an industry ETF or non-US index)
- The trigger needs a compact technical label the prose can't carry cleanly (e.g. `RSI < 20`)
- The page is being remixed into a screener-like collection and chips help skimming across multiple playbooks

If chips are used, they must follow the same shape:
1. **Asset chip** — shortest recognizable label.
2. **Trigger chip** — shortest readable trigger label (1–3 words).
3. **Case count chip** — `Cases: {n_events}`.

Keep them mechanical — do not use interpretive labels like `Trend intact`, `Strong setup`, or `Risk-on`.

### 2b. Counter-narrative card — REMOVED

Earlier versions of this template allowed a separate counter-narrative card under the hero. **Do not add one.** The single most memorable counter-intuitive finding belongs **inside the hero paragraph**, not as a second card. Splitting it into a separate card pushes the four horizon cards (§3 step 3) below the fold and breaks the 3-second rule.

## 3. Layout (single-page scroll, results first)

One vertically-scrolling page. Top-to-bottom order:

1. **Section-title row** — `.section-title` containing `.section-title-text` (the page subject from §1b) on the left and `.section-readme-btn` (the README chip from §1c) on the right. **Not** a widget card. Lives directly inside `.playbook-container`, before the first `.widget-grid`.
2. **Verdict hero** (section 2) — one full-width Free Text Card (`.col-8`, `markdown-container--m`). Single paragraph with inline colored numbers.
3. **Four horizon cards** — exactly four metric cards (`.col-2` × 4). See §3a for which four. **These must sit directly under the hero** (no intervening widgets) so they stay in the first fold.
4. **Main path chart** (`.col-8`) — Chart Card. Normalized event paths overlay (rebased to 100 at event day), median line + middle-half band + a representative sample of past paths + a non-event "typical year" reference line. See §3c.
5. **Two side-by-side analysis charts** (`.col-4` + `.col-4`) — both Chart Cards.
   - **Left:** "Typical move at each horizon, event vs plain historical average". Paired bars per horizon: event mean vs unconditional baseline mean.
   - **Right:** "How [asset] moved [headline horizon] after each past event". One bar per past event, sorted best-to-worst, green/red by sign, dashed line at zero.
6. **Audit ledger** (`.col-8`) — one row per event, **newest first**. Use the row-first flex table and `initTableAlignment`. See §5 audit ledger collapse rule.
7. **References card** (`.col-8`) — Free Text Card with two short paragraphs:
   - **Trigger source:** how events are identified, in plain language. One sentence on the re-arm rule when relevant.
   - **Data source:** which SDK / symbol / interval, what the forward-move horizons are in trading days, what is and is not included (dividends, transaction costs), and how often the pipeline refreshes.

Methodology lives in the Modal (§6, opened by the README chip). The bottom References card is a short data-source eyebrow — it is **not** the methodology. Do not duplicate.

No tabs, no hidden panels other than the Methodology modal and the audit-ledger expand/collapse behavior — everything else is on the single scroll.

### 3. First-fold rule (very strict)

On a 1440 × 900 viewport, the first fold must contain:
**section-title row + hero card + four horizon cards** — and nothing else from the section-title row down.

This is what enforces the "results in 3 seconds" promise. Any widget that lives between the hero and the horizon cards (counter-narrative card, belief cards, eyebrow callouts, etc.) is rejected — they have all been removed from this template. The next-fold content starts with the main path chart (§3 step 4).

**Canonical reasoning flow:** headline (hero) → headline numbers per horizon (4 cards) → typical price path (main chart) → event vs baseline + per-event distribution (two side-by-side) → raw rows (audit ledger) → data provenance (references). Each step answers the objection raised by the previous. Methodology is available on-demand via the README chip.

### 3a. Choosing the four horizon cards

The four horizon metric cards always cut **by time**. Pick one of the two canonical sets based on the trigger:

| Set | Use when | Headline framing |
|---|---|---|
| **1W / 1M / 3M / 1Y** | The short-term reaction is the story (drawdowns, single-day shocks, sentiment extremes, breadth thrusts) | "Does the bounce hold? Then what?" |
| **1M / 3M / 6M / 1Y** | A regime / setup whose payoff plays out over months, not days (macro signals, long-base breakouts, slow-building setups) | "Does the trend stick?" |

Pick one set per playbook; **do not mix** (no 1W / 3M / 6M / 1Y).

In `forward-return` days: 1W = 5, 1M = 21, 3M = 63, 6M = 126, 1Y = 252 (trading days).

Each card carries:
- Big number = the median forward return for that horizon (signed %, color by sign)
- One short label above: `A week later` / `A month later` / `Three months later` / `Six months later` / `A year later`
- Small label below: `Typical (median)`
- Small footer: `positive in {wins} of {N}` (the win rate, not a method description)

### 3b. Two side-by-side analysis charts (§3 step 5)

**Left chart — event vs baseline at each horizon:**
- X-axis: the four horizon labels from §3a (categorical)
- Two paired bars per horizon: event mean (teal) and unconditional baseline mean (grey)
- Baseline is the average forward path over the same period from any non-event start day (sampled regularly, e.g. quarterly). Stored in the feed's `normal_path` time series.
- Dashed line at zero. Tooltip shows both numbers with signed %.

**Right chart — per-event return at the headline horizon:**
- The headline horizon is the one the hero leans on (typically 1Y).
- One bar per past event. Sort **best-to-worst** (not by date).
- X-axis labels: short month-year of the onset (e.g. "Feb 2020"); rotate 30° to avoid clipping.
- Green bars positive, red bars negative; `borderRadius: [1, 1, 0, 0]` per the design-widgets bar spec.
- Dashed line at zero. Tooltip shows full date + signed %.

### 3c. Chart Card — widget spec

Every chart on the page is a **Chart Card**. Follow `references/design-widgets.md` → Chart Card verbatim (CSS, Chart Rules, Axis Rules, Mark Line, Tooltip, Line Chart / Bar Chart specifics). Do not re-define any of those here.

**Two overrides for this template:**

1. **Chart Card height = 560px.** The design-widgets default is 320px; per-event charts in What-If carry more horizon and more individual paths than a typical dashboard tile, so they need the extra vertical room. All charts on the page — including the side-by-side `.col-4` pair — use 560px.
2. **Every Chart Card has a `widget-subtitle`** — one line of small grey text directly under the widget-title, before the chart body. It explains *what the chart shows* in plain prose, including what colored marks mean (e.g. "Teal bars: the average move after past −10% drawdowns. Grey bars: the S&P 500's plain historical average over the same period from any non-event start day. Dashed line is zero."). This pairs with the title to set context without making the reader hover for hints.

**Main path chart rules**

- Rebase signal day to 100.
- Do not draw every past case as a full-opacity line. Show only a representative sample of past paths and add a subtle middle-half band.
- Show the typical-after-signal line and the typical-non-event-year reference line.
- Tooltip hides helper / sampled-path series and shows only useful readout lines.

**One-event-per-bar chart rules** (the right side-by-side chart)

- One bar per completed past event.
- Sort by return (best-to-worst), not by date — the visual gradient is the headline.
- Sparse year anchors on x-axis if dates are used; full date in tooltip.
- Green positive, red negative.
- Keep the zero line; avoid label text that can clip.

### 3d. Plain language (every user-visible surface)

Applies to cards, chart titles, widget subtitles, axis labels, table headers, tooltips, References card, and methodology — not just hero. LLM defaults trend toward trading-desk jargon; override them.

- **Tickers**: first mention only, in parens after the plain name ("the S&P 500 (SPY)"). Typically in the hero or References card; for basket playbooks, in the first card introducing each member. Never in chart titles, axis labels, table headers, or tooltips. Default map: SPY → "the S&P 500", USO → "oil", TLT → "long-dated Treasury bonds", GLD → "gold", QQQ → "the Nasdaq (100)", VIX → "market volatility", DXY / UUP → "the US dollar"; company tickers → company names.
- **Time horizons and telegraphic codes**: "a month later" / "a year later" / "sixty trading days after the event". Never `+1M` / `+1Y` / `D+10` / `D+60` / `d21` / `fwd_3m` / `N=15` / bare `21 trading days`.
- **Banned jargon**: `drawdown` (in body copy — title may use it as a noun if it's the trigger word), `cohort`, `regime`, `baseline` (in body copy — methodology may use it), `dispersion`, `reaction`, `realization`, `persistency`, `cumulative return`, `IQR`, `whiskers`, `outliers`, `realized volatility`, `R-squared`. Prefer: "biggest dip", "group", "state", "plain historical average", "typical outcome", "range between biggest and smallest past cases", "middle half of past outcomes", "daily price swings", "almost no relationship between the two".
- **Explain cutoffs inline**: every `since YYYY` / sample filter / threshold carries a one-clause reason on first mention ("since 2000 — that's when the daily S&P 500 series starts in our data"; "10% from peak — the textbook threshold for a 'correction'").
- **Methodology** (inside the modal) — modal body renders the playbook's `README.md` (see [release.md → Playbook README](../../references/api/release.md#playbook-readme) for the canonical content shape). For what-if, the README covers "how we picked events" and "how we measured returns" in plain prose — no formulas, no `consensus EPS` / `recovery date` / `sample period` jargon. Any legal disclaimer lives at the bottom of the README.

## 4. Data presentation

- **Number is the visual hero.** Big numerical value, small descriptive label underneath. Never the other way around.
- **Every chart** pairs a short title with a `widget-subtitle` (one-line plain-prose explanation, see §3c).
- **Consistent color semantics** across cards, charts, and tables: positive = teal/cyan token (`--main-m3`), negative = red token (`--main-m4`), neutral/reference = grey token. Same meaning everywhere. ECharts is Canvas — use raw hex/rgba, not `var(--…)`.
- **Reference lines** on comparison charts (e.g. dashed zero line on per-event bar chart; dashed median line where helpful) to anchor interpretation at a glance.
- **Aggregate → individual.** At least one chart must show per-event detail (not just averages), so the reader can judge dispersion and clustering. The right side-by-side chart (§3b) covers this by default.
- **Footer = observable context.** Card footers carry a specific date, delta, or bucket label (`positive in 5 of 8`) — never a method description. Method lives once, in the Methodology modal and the References card.

## 5. Hard rules

- **No** "last updated / refreshed / as of" timestamp anywhere on the page.
- **No** filters, dropdowns, selectors.
- **No** second h1 / repeated title above the section-title row.
- **No** "What-If" label anywhere user-facing (title, slug, hero, modal header, chips).
- **No** counter-narrative card, belief cards, featured-case cards, readout rail — any element that sits between the hero and the four horizon cards and pushes them below the fold is forbidden. Earlier template versions allowed these; they are now explicitly removed.
- **Only interactivity allowed:** chart hover tooltips, the README chip opening the Methodology modal, and the audit-ledger expand/collapse button when event count is high.

**Audit ledger collapse rule**

- If event count is 12 or fewer, show all rows.
- If event count is above 12, show the latest 8 rows by default.
- Add one compact `Show all N cases` button in the ledger title row.
- When expanded, the button becomes `Show latest 8`.
- Use the row-first flex table and `initTableAlignment`; do not use a native HTML table.

## 6. Methodology modal

Triggered by the README chip in the section-title row (§1c). Mirrors the Screener template's Methodology modal pattern — reuse the same modal chassis (`.modal-overlay` / `.modal-panel`) and the same `data-modal-open` / `data-modal-close` wiring.

- README chip carries `data-modal-open="methodology-modal"`; the modal root has `id="methodology-modal"`.
- Modal panel `max-width: 896px` (narrower than the 960px base — methodology content is prose, not wide tables).
- Body content = the playbook's [`README.md`](../../references/api/release.md#playbook-readme), rendered into the modal body. One source of truth; do not duplicate the content shape here.
- Closed by default on page load — methodology is rarely the first thing a reader wants.

**Modal ≠ References card.** The methodology modal is the full explanation (how we picked events, how we measured, sample-size caveats, asset-choice rationale). The References card at the bottom of the scroll (§3 step 7) is a two-sentence data-source eyebrow. They have different audiences (curious / glancing) and different content shapes. Do not duplicate the methodology inside the References card.
