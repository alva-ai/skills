# Ranked-List Screener Playbook

Reference structure + screener-specific styling for any ranked-list screener
(stocks, crypto, etc.).

---

## Design System Compliance (READ FIRST)

Before writing HTML, read `references/design-tokens.css` (tokens),
`references/design-widgets.md` (Chart / Metric / Table Card bases), and
`references/design-components.md` (Tab / Dropdown / Pill primitives). This
playbook only documents screener-unique rules on top of them — never re-spec
a token or base that already exists.

---

## Component Index

Structural:

- [Screener Variants](#screener-variants) — **read first** to know which components apply
- [Feed Contract](#feed-contract) — **read second** to know what data shape to emit
- [Page Layout](#page-layout)
- [Header](#header) · [Snapshot Picker](#snapshot-picker)
- [Tab 1 — Overview](#tab-1--overview) — opens with [Daily Digest](#daily-digest)
- [Tab 2 — Movers & Trends](#tab-2--movers--trends-optional)
- [Tab 3 — Analysis](#tab-3--analysis-optional)
- [Tab 4 — Methodology](#tab-4--methodology)
- [Cron](#cron) · [Push Notifications](#push-notifications--daily-tldr)

Screener-unique components (CSS inline):

- [Ranked Table (sticky cols)](#ranked-table) · [Score Bar](#score-bar) · [Band Pill](#band-pill)
- [Delta Tag](#delta-tag--delta-score) · [Flag Pill](#flag-pill) · [Flag Card](#flag-card)
- [Expand Row](#expand-row) · [Factor Breakdown](#factor-breakdown) · [Gauge Ring](#gauge-ring)
- [Movers Card](#movers-card) · [Basket Trend Chart](#basket-trend-chart)
- [Method Section](#method-section) · [Worked Example](#worked-example)

---

## Screener Variants

A screener is one of two shapes. Pick the variant first — every downstream
component section is tagged `**Applies to**: scored | basket | both` so you
know whether to include it.

| Shape | When to use | Ranking logic |
|---|---|---|
| **Scored** | Rows have a composite score (weighted factor combine). Order = score. | Rank by score desc. Band pill maps score → tier. |
| **Basket** | Pass/fail inclusion — row is either in or out. No score. | Order by the most relevant raw metric (market cap, entry date, etc.). |

If your screener wants basket-style inclusion *plus* a secondary score for
ordering, treat it as **scored** and let the score drive the rank.

Component matrix (✓ = include, ✗ = omit, △ = include with variant-specific rules):

| Component | Scored | Basket | Notes |
|---|---|---|---|
| [Columns: Rank / Score / Δ Score](#columns) | ✓ | ✗ | Basket uses "Days in basket" / "Entry date" instead. |
| [Columns: Inclusion signal](#columns) | ✗ | ✓ | Basket only — "Days in basket", "Entry date", "Exit reason". |
| [Score Bar](#score-bar) | ✓ | ✗ | Requires a score column. |
| [Band Pill](#band-pill) | ✓ | ✗ | Score-tier label. |
| [Delta Tag / Δ Score](#delta-tag--delta-score) | ✓ | △ | Basket: rank Δ only if a secondary sort metric is stable across snapshots. |
| [Flag Pill / Flag Card](#flag-pill) | ✓ | ✓ | Both benefit. |
| [Expand Row](#expand-row) | △ | △ | Different layouts — see section. |
| [Gauge Ring](#gauge-ring) | ✓ | ✗ | Needs a score. |
| [Factor Breakdown](#factor-breakdown) | ✓ | ✗ | Needs weighted factors. |
| [Movers Card](#movers-card) | ✓ | ✓ | Scored: Entries/Dropouts/Top Gainers/Decliners. Basket: Entries/Exits only. |
| [Basket Trend Chart](#basket-trend-chart) | ✓ | ✓ | Both — shows basket size + an aggregate stat over time. |
| [Worked Example](#worked-example) | ✓ | ✗ | Only meaningful when there's a formula to re-derive. |
| [Daily Digest](#daily-digest) | ✓ | ✓ | In-tab (Overview), reacts to snapshot picker. Same `screener/tldr` record powers the push. |
| [Push Notifications](#push-notifications--daily-tldr) | ✓ | ✓ | Derived from `tldr.push_line` + churn line; skip when churn is empty (basket). |

---

## Feed Contract

One frozen data shape so generic tooling (snapshot picker, Daily Digest, push,
Movers cards, trend chart) always works across screeners. Screener-specific
fields live in open `metrics` / `detail` escape hatches — free to name and
shape as the screener needs.

### Storage

```
~/feeds/<screener-name>/v1/data/
  screener/
    rankings/   ← append-only, one record per (snapshot, row)
    summary/    ← append-only, one record per snapshot
    tldr/       ← append-only, one record per snapshot
```

All three are Feed SDK time-series
(`ctx.self.ts("screener", "rankings").append(...)`). Do **not** use
`alfs.writeFile` for these, and do **not** park them under
`playbooks/<name>/data/`. Reads go through `@last/N`. `tldr` is a group on
the same feed, not a separate `<name>-tldr` feed.

### `rankings` — core fields (every record)

| key | type | notes |
|---|---|---|
| `date` | number (ms) | Snapshot timestamp; same value for every row in that snapshot. |
| `id` | string | Primary identifier — always `id`, never `ticker` / `symbol`. |
| `name` | string | Human-readable label. |
| `rank` | number \| null | Scored: required. Basket: may be null. |
| `flags` | `[{label, tier}]` | `[]` if none; `tier` is `"hard"` \| `"soft"`. |

### `rankings` — variant-required fields

- **scored**: `score` (number), `factors: [{name, raw, pts, weight}]`
- **basket**: `entry_date` (ms), `exit_reason` (string \| null)

Do not introduce synonyms (`composite`, `consensusScore`, `ticker`, `symbol`).
Freezing the vocabulary is the whole point of the contract.

### `summary` — required fields

| key | type | notes |
|---|---|---|
| `date` | number (ms) | Matches the row `date` for that snapshot. |
| `universe_size` | number | Count before filters. |
| `delta` | `{new_ids, dropped_ids}` | vs prior snapshot. First run: both `[]`. |

Screeners may add other aggregates (`qualified_count`, `avg_score`,
`layer_counts`, …) — loose, tooling ignores.

### `tldr` — required fields

One record per snapshot. Same record powers both the in-tab
[Daily Digest](#daily-digest) and the
[push notification](#push-notifications--daily-tldr) — the push uses
`push_line` directly, so there is **one** ADK generation per snapshot, not two.

| key | type | notes |
|---|---|---|
| `date` | number (ms) | Matches the snapshot. |
| `body` | string | ADK-generated **markdown**. Free shape — bullets, prose, or one line, whatever the day needs. `""` after grounding failure. |
| `push_line` | string | ADK-generated standalone headline, ≤ 160 chars plain text (not markdown). `""` after grounding failure. |
| `churn_line` | string | Deterministic `"🆕 X · 👋 Y"` — always present, may be `""` when nothing changed. |
| `source` | `"adk"` \| `"fallback"` | `"fallback"` when `body` is `""`. |

### Escape hatches (on each `rankings` row)

- **`metrics`** — flat numeric signals for display
  (`{market_cap: 4.9e12, rev_growth: 104.6, volume_14d: 20}`).
- **`detail`** — nested blobs for expand-row content (trade logs, news
  samples, price arrays, etc.).

Name fields in `metrics` / `detail` freely. The three bedrock rules below
still apply inside them.

### Three bedrock rules

1. **snake_case** for all keys (`market_cap`, not `marketCap`).
2. **Epoch ms** for all timestamps — no ISO strings anywhere.
3. **No stringified JSON in field values.** Use real nested objects and
   arrays; never `"[...]"` wrapped in quotes.

---

## Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ <Screener Name>                                              │
│ <One-sentence summary>                                       │
├──────────────────────────────────────────────────────────────┤
│ [ Overview · Movers & Trends · Analysis · Methodology ]      │
├──────────────────────────────────────────────────────────────┤
│ <Tab content>              [Snapshot ▼: Today, Apr 17 EST]   │
│  Overview: Daily Digest → Ranked Table → expand rows         │
│  Movers / Analysis / Methodology: as their sections describe │
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

Sticky across all tabs. Title + one-sentence summary use
`design-system.md#playbook-header` as-is — no screener-specific markup or
CSS. Keep the summary short (one sentence, no "What this is" duplicate of
what the playbook description already says). Snapshot freshness and refresh
cadence are **not** rendered in the header; timestamp surfaces through the
[Daily Digest](#daily-digest) meta line and the
[Snapshot Picker](#snapshot-picker) label.

---

## Snapshot Picker

Pure view filter — switches which historical snapshot drives the tab content.
Never mutates data.

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

**History accumulation** — snapshots are Feed SDK time-series records in
`screener/rankings` and `screener/summary` (see [Feed Contract](#feed-contract)).
First run produces today only — do **not** fake-backfill past dates from
current SDK queries, since point-in-time calls return *currently revised*
data, not real historical state.

**Visual** — minimal inline trigger (no button chrome), label + value + sub +
caret. Menu is a dropdown with tier-colored active state.

```css
/* Extends design-components.md#dropdown — only screener-unique overrides below:
   inline trigger (no button chrome), m1 hover/active tint, sub-label styles. */
.filter-dropdown { position:relative; display:inline-flex; align-items:center; }
.filter-dropdown-trigger { background:transparent; border:none; padding:0 0 6px 0;
  font-size:12px; line-height:20px; color:var(--text-n9); cursor:pointer;
  display:inline-flex; align-items:center; gap:var(--spacing-xs); transition:color .15s; }
.filter-dropdown-trigger:hover,
.filter-dropdown.open .filter-dropdown-trigger { color:var(--main-m1); }
.filter-dropdown-label     { font-size:12px; color:var(--text-n5); }
.filter-dropdown-value     { color:var(--text-n9); display:inline-flex; align-items:baseline; gap:6px; }
.filter-dropdown-value-sub,
.filter-dropdown-item-sub  { font-size:11px; color:var(--text-n5); }
.filter-dropdown-item-sub  { margin-left: var(--spacing-s); }
.filter-dropdown-caret { display:inline-block; width:12px; height:12px;
  background-color:var(--text-n2); transition:transform .15s, background-color .15s;
  -webkit-mask:url('https://alva-ai-static.b-cdn.net/icons/arrow-down-f2.svg') no-repeat center/contain;
          mask:url('https://alva-ai-static.b-cdn.net/icons/arrow-down-f2.svg') no-repeat center/contain; }
.filter-dropdown.open .filter-dropdown-caret { transform:rotate(180deg); background-color:var(--main-m1); }
.filter-dropdown-menu { position:absolute; top:calc(100% + 6px); right:0; min-width:220px;
  background:var(--b0-container); border:0.5px solid var(--line-l2);
  border-radius:var(--radius-pop-dropdown); box-shadow:var(--shadow-s);
  padding:var(--spacing-xxs); z-index:100; display:none; }
.filter-dropdown.open .filter-dropdown-menu { display:block; }
.filter-dropdown-item { display:flex; justify-content:space-between; align-items:baseline;
  width:100%; padding:var(--spacing-xs) var(--spacing-s);
  font-size:14px; line-height:22px; color:var(--text-n9);
  background:transparent; border:none; cursor:pointer; text-align:left;
  border-radius:var(--radius-ct-s); }
.filter-dropdown-item:hover { background:var(--grey-g01); }
.filter-dropdown-item.active { background:var(--main-m1-10); color:var(--main-m1); }
```

---

## Tab 1 — Overview (default)

Overview layout, top-down: **Daily Digest → Ranked Table (with expandable
rows)**. Always the landing tab.

### Daily Digest

**Applies to**: both.

Markdown summary of the current snapshot. Sits at the top of Overview, above
the ranked table, and **reacts to the snapshot picker** — swapping dates
swaps the digest. One ADK-generated artifact (cached in `screener/tldr`,
see [Feed Contract](#feed-contract)) powers both this panel and the
[push notification](#push-notifications--daily-tldr) via the same record's
`push_line`. One generation per snapshot, two render surfaces.

**Content rules** — **shape follows content**, not the other way around.

- Output is a markdown `body` + a short `push_line`. `body` renders as
  markdown in the digest container; it can be a bulleted list, a short
  paragraph, a single sentence, or any mix. Pick what the day actually
  calls for:
  - **Churn-heavy / multi-signal day** → bulleted list with `**Label:**`
    prefixes reads well.
  - **Single clear driver** → a short paragraph feels more human than
    one lonely bullet.
  - **Quiet day** → one or two dry sentences. Don't manufacture structure
    just to fill the card.
- `push_line` is a standalone ≤ 160-char headline for the lock screen,
  drawn from the same observation that leads the body but not required to
  appear verbatim in it.
- Useful labels when bulleting (no fixed set, no fixed order):
  *Top of basket · New entries · Dropouts · Sector tilt · Flags ·
  Next refresh*.
- No buy/sell, no price targets, no timing calls. Observational only.
- Every number in `body` or `push_line` must appear verbatim in the input
  row data.

**Voice** — write like a sharp analyst dropping a line in Slack, not a
research-report abstract:

- **Verbs, not nouns.** *"PANW crashed into the top-5"* > *"PANW's ranking
  improved"*.
- **Asymmetric rhythm.** Avoid parallel *"A rose to X; B fell to Y"*
  structures. *"TSM pulled ahead on a quiet wave — six fresh insiders
  overnight, nothing else moved."*
- **Texture over aggregates.** *"$10M in a single clip"*, *"stable three
  days running"*. Generic intensifiers ("strong", "significant") banned.
- **Dry over hype.** *"Nothing material; roster unchanged."* beats padding.
  Silence is honest.
- **Screener-native vocabulary.** Use exact factor names from the table
  ("cluster breadth", "entry-level 20d MA"), not model-invented synonyms.

**Few-shot pack** — each screener owns `screener/prompts/tldr.yaml`:

- **3 gold examples** from real prior snapshots of *this* screener,
  showing the full range: one bullet-heavy day, one prose day, one quiet
  one-liner day. Each example = full `{body, push_line}` pair. Rotate
  when stale.
- **2 negative examples** labeled with *why they're bad*:
  - *"TSM leads with strong momentum and solid fundamentals."* — generic
    adjectives, no factor driver, no numbers.
  - *"PANW entered at rank 4; ORCL dropped to rank 12."* — parallel
    structure, reads like a diff, no driver named.

Include the pack verbatim in the ADK prompt. Without it, output drifts to
research-report tone within a week.

**Generation**:

- ADK output is structured JSON: `{body: "<markdown>", push_line: "<plain>"}`.
- Length caps: `push_line` ≤ 160 chars (so push line 1 + churn + URL fit
  the 280-char lock-screen budget); `body` ≤ ~800 chars rendered (keep the
  digest from dominating the tab).
- **Numeric grounding** — extract every number (regex `-?\d+(\.\d+)?%?`)
  from both fields. If **any** unverified number appears, mark the whole
  digest as fallback (`body: ""`, `push_line: ""`, `source: "fallback"`) and
  let the UI render `churn_line` alone. All-or-nothing beats patching
  partial prose.
- Persist per snapshot to `screener/tldr`. Regenerate only when a new
  snapshot appears.

**Prompt skeleton** — use verbatim; only `{{few_shots}}` varies per screener.

```text
You are writing today's <SCREENER_NAME> digest for a finance-savvy user.
`body` renders as markdown in the Overview tab. `push_line` is the
standalone lock-screen headline.

VOICE
- Verbs, not abstract nouns. Asymmetric rhythm. Texture over aggregates.
- Dry tone; silence over padding. Use the screener's own factor names.
- No buy/sell, no price targets, no timing calls.
- Every number in body or push_line must appear verbatim in INPUT_DATA.
- push_line ≤ 160 chars. body ≤ ~800 chars rendered.

BODY SHAPE — let the day's content decide:
- Churn-heavy / multi-signal → bulleted list with **Label:** prefixes.
- Single clear driver → a short paragraph.
- Quiet day → one or two sentences. Do not pad with labels to fill space.
Useful labels when bulleting (pick only what applies, any order):
Top of basket · New entries · Dropouts · Sector tilt · Flags · Next refresh.

FEW_SHOTS
{{few_shots}}

INPUT_DATA
  today_top_n:    {{today_rows}}
  prior_top_n:    {{prior_rows}}
  churn:          {{churn_line}}    # e.g. "🆕 PANW, NKE · 👋 ORCL"
  factor_deltas:  {{factor_deltas}} # {id: {factor: {today, prior}}}
  new_flags:      {{new_flags}}
  field_schema:   {{schema}}

Output JSON only: {"body": "<markdown>", "push_line": "<plain ≤160 chars>"}.
No preamble, no surrounding text.
```

**Reactivity** — on snapshot picker change, re-fetch the matching
`screener/tldr` record and re-render. The picker owns which record is
shown; when only one snapshot exists, the digest still renders (the
picker is hidden per its own rules).

**Rendering** — reuse `.markdown-container --m` from design-components.md
inside the digest container, so bullets, bold labels, and paragraphs all
pick up the design system's shared markdown styles without re-spec.

**Visual**:

```css
/* Outer container only — inner markdown rendering is handled by
   .markdown-container --m from design-components.md. Do not re-spec
   ul / li / strong here. */
.daily-digest { background: var(--grey-g01); border-radius: var(--radius-ct-l);
  padding: var(--spacing-l) var(--spacing-xl);
  margin-bottom: var(--spacing-l); }
.daily-digest-meta { font-size: 11px; color: var(--text-n5);
  margin-top: var(--spacing-s); letter-spacing: 0.11px; }
```

Meta line below the body: `Digest · <timestamp EST> · <source>` — e.g.
`Digest · Apr 16, 2026 9:58 PM · ADK`, or `· fallback` when `body` is
empty (in which case render `churn_line` as a single line in place of
the markdown body).

### Row anchor

**Required**: `<id> · ⌄` — the row's `id` from the
[Feed Contract](#feed-contract) plus the expand caret.

`id` is a string; its content depends on the screener's universe, but the
field is always called `id` both in the feed data and in the rendered markup:

- Stocks/ETFs → ticker string (`PLTR`, `NVDA`, `SPY`)
- Crypto → symbol or pair (`BTC`, `ETH-USD`)
- Bonds → ISIN / CUSIP
- Sectors / themes → sector or theme name

The UI renders `id` verbatim — no translation layer, no alternate column
name ("ticker", "symbol") anywhere in the playbook.

### Columns

**Applies to**: scored | basket (pick the rows that match your variant)

**Often-used** — pick what matters for *this* screener. None are mandatory:

- Position: Rank *(scored)*
- Score: composite score *(scored)*
- Identity: Name, Sector, Industry, Asset Class *(both)*
- Movement: Δ Rank, Δ Score *(scored — vs prior snapshot)*
- Inclusion signal: "Days in basket", "Entry date", "Exit reason" *(basket)*
- Risk/quality signals: Flag (descriptive label, tier-colored) *(both)*
- Relevant metrics: fundamentals / technicals / on-chain / etc. *(both)*

Order columns by importance left-to-right. If there's no Rank/Score, sort by the
most relevant metric (e.g. market cap, entry date) and make that column primary.

### Ranked Table

Built on the Table Card base from design-widgets.md. Screener-specific
additions: horizontal scroll, sticky `#` and `id` columns on the left,
sticky caret column on the right, expandable rows.

Structural rules:

- Each `.table-row` is its own box (`min-width: max-content`) so its background
  and bottom border cover every cell — including cells that overflow during
  horizontal scroll.
- Row content is inset `var(--spacing-m)` from the left via `padding-left`;
  right inset comes from the 40px sticky caret cell. Dividers span the full
  table-card width.
- Column 1 (`#`, 48px) and column 2 (the row's `id`, 88px) are pinned left.
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

**Applies to**: scored.

Score column combines a fill bar + numeric value, optional delta pill.

Color rules (score → color) — **must match Band Pill exactly** so a row's bar
and pill never disagree. Apply via inline style on `.score-bar-fill`; JS may
use `var(--token)` directly in `element.style.background`.

- `≥ 80` → `var(--main-m3)` (green, `#2a9b7d`) — *elite*
- `≥ 70` → `var(--main-m1)` (teal) — *strong*
- `≥ 60` → `var(--main-m5)` (amber) — *average*
- `< 60` → `var(--main-m4)` (red, `#e05357`) — *weak*

```css
.score-cell { display:flex; align-items:center; gap: var(--spacing-xxs); }
.score-bar-track { width: 64px; height: 4px;
  background: var(--line-l07); border-radius: var(--radius-ct-xs);
  overflow: hidden; flex-shrink: 0; }
.score-bar-fill { height: 100%; border-radius: var(--radius-ct-xs); transition: width .4s; }
.score-value { font-size: 14px; min-width: 24px; letter-spacing: 0.14px; }
```

### Band Pill

**Applies to**: scored.

Tier label using the same palette as [Score Bar](#score-bar): `elite` /
`strong` / `average` / `weak`. Thresholds: 80+ / 70–79 / 60–69 / 0–59.

### Delta Tag / Delta Score

**Applies to**: scored (both tags). Basket: include only if rank ordering is
stable across snapshots (i.e. a secondary sort metric that doesn't churn).

Rank Δ (vs prior snapshot) → pill:

- `up` → m3 green tint, "↑N"
- `down` → m4 red tint, "↓N"
- `flat` → grey tint, "—"
- `new` → m1 teal tint, "New"

Score Δ → inline text (not a pill): green `up`, red `down`, grey `—`. Threshold:
suppress when `|Δ| < 0.5`.

### Flag Pill

**Applies to**: both.

Shows the primary red flag in the table cell. Two tiers only: `soft` / `hard`,
mapped from each flag's `tier` field in the [Feed Contract](#feed-contract).
When a row has multiple flags, show the first label plus `+N`. When
`flags: []`, render **nothing** — do not add a "clean" / "—" placeholder,
since a universe of 500 rows × one placeholder pill is pure visual noise.

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
.flag-pill.soft  { background: var(--main-m5-10); color: var(--main-m5); }
.flag-pill.hard  { background: var(--main-m4-10); color: var(--main-m4); }
.flag-pill .flag-extra-count { color: var(--text-n7);
  font-size:10px; line-height:16px; margin-left: var(--spacing-xxxs); }
```

### Expand Row

**Applies to**: both (layout differs — see below).

Always include a **price/value chart** of the asset. Other blocks are optional —
mix & match based on what reveals *why* the row is in the basket.

Layout: 8-col grid inside the expand panel.

- **Scored**: row 1 = `col-4` Gauge Ring + `col-4` Factor Breakdown; row 2
  = `col-8` Price/K-line chart; row 3 = Flag cards (auto-fit).
- **Basket**: row 1 = `col-8` Price/K-line; row 2 = custom narrative blocks
  (peer comparison, news links, holdings, on-chain stats, etc.).

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

**Applies to**: scored.

ECharts `gauge` in the expand panel's Score card. Not a screener-unique
primitive — spec it here because design-widgets.md doesn't cover gauges.

- Radius 78%, single progress arc (width 14, roundCap), no pointer/tick/label.
- Progress color = score color (same breakpoints as Score Bar).
- Center: big number (40px, weight 400, `var(--text-n9)`) + band label (12px,
  weight 500, tinted to score color) stacked via `rich` formatter.
- Card container = Chart Card with dotted background, center-aligned.

### Factor Breakdown

**Applies to**: scored.

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

**Applies to**: both.

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

**Applies to**: both (card set differs).

- **Scored**: Entries · Dropouts · Top Gainers · Top Decliners.
- **Basket**: Entries · Exits only (Top Gainers/Decliners need a score).

KPI-style: icon (22px, solid background) + label + count, then a list of rows.
Icon background applied via inline style — use tokens:

- Entries → `var(--main-m3)` (green)
- Dropouts / Exits → `var(--main-m4)` (red)
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

**Applies to**: both.

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

**Applies to**: scored.

Re-derive the current #1 from raw inputs. Always lives inside a `.method-body`,
rendered into an inline `.worked-example` card so it stands out from narrative
paragraphs.

**Design rule (required)** — the displayed `score` MUST equal the
factor-weighted sum, with **no** cross-basket rescaling. This is what makes
the worked example actually verifiable: a user with SDK access can reproduce
the exact number. If a screener needs a different display convention, drop
the Worked Example entirely rather than ship one that doesn't reconcile.

Three parts:

- **Header** — big `id` in `--main-m1`, then "· name · Rank #N · Band X" in
  `--text-n7`.
- **Rows** — monospace, one per factor: `name | raw / 100 × weight% = pts`.
- **Total** — divider + the sum. Verify badge states the invariant:
  *"Sum of factor contributions = displayed score (87.3)."*

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
- `args.now` (ms) is for **replaying missed runs** — e.g. cron was down
  Tuesday; pass Tuesday's timestamp and rerun. It stamps today's SDK response
  with a different snapshot date, which is the correct behavior for recovery.
- **Do not use `args.now` to fabricate pre-launch history.** Point-in-time
  SDK calls return *currently revised* data, not real historical state — any
  "history" built this way would be a fiction. The only honest mode is
  forward-only accumulation starting from the screener's launch date.

---

## Push Notifications / Daily Digest

**Applies to**: both.

Push payload is **deterministically derived** from the same
`screener/tldr` record that powers the in-tab
[Daily Digest](#daily-digest) — one ADK generation per snapshot, two render
surfaces, zero drift. Base push plumbing (signal target schema, subscription,
delivery) comes from the Alva skill.

**When to send**:

- First snapshot of the day (or first snapshot ever) → always send.
- Subsequent snapshots → only if something *changed*: new entries, new
  dropouts, rank churn in top-N, new flags, or a factor driver swap.
- Basket variant: skip entirely when both churn sides are empty — don't
  send "nothing happened" pings.
- If the `tldr` record's `source` is `"fallback"` (grounding failed) and
  churn is empty, skip the push.

**Payload derivation** (no separate ADK call):

```
title:   <Screener> · <date>
line 1:  tldr.push_line              ← already grounded + voice-checked + ≤ 160 chars
line 2:  tldr.churn_line             ← deterministic "🆕 X · 👋 Y"
line 3:  Full snapshot → <playbook URL>
```

If `push_line: ""` (fallback), line 1 is omitted and the push is churn line
+ URL only. **Length budget** stays ≤ 280 chars for lines 1+2 combined —
the 160-char cap on `push_line` in the Daily Digest prompt guarantees the
fit.

**Example**:

```text
Title: Insider Buying Clusters · 2026-04-22
TSM leads on cluster breadth (29 insiders, +6 vs yesterday); PANW enters the
top-5 after a $10M CEO purchase.
🆕 PANW, NKE · 👋 ORCL
Full snapshot → https://alva.ai/u/ivan/playbooks/insider-screener-v2
```

A basket variant with no churn is **not sent** under the rules above — don't
ship a second template for "No new entries or exits".

**Implementation sketch** — feed script writes one `tldr` record per
snapshot (see [Feed Contract](#feed-contract)); the push cron and the
playbook HTML both read the same record via `@last/1`:

```js
// in the feed script, after computing today's ranking
const churn_line = formatChurn(entries, exits);   // deterministic — computed first so ADK can see it
const digest = await adk.generateJson({
  prompt: DIGEST_PROMPT,   // see Daily Digest → Prompt skeleton
  data: { today: topN, prior: priorTopN, churn: churn_line, factorDeltas, newFlags },
  maxTokens: 500,
});
const grounded = passesGrounding(digest, inputData);   // all numbers verified?
await ctx.self.ts("screener", "tldr").append([{
  date: snapshotDate,
  body:       grounded ? digest.body       : "",
  push_line:  grounded ? digest.push_line  : "",
  churn_line,
  source: grounded ? "adk" : "fallback",
}]);
```
