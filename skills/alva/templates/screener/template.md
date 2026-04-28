# Ranked-List Screener Template

Reference structure for any ranked-list screener (stocks, crypto, ETFs, sectors,
themes — anything where you score or filter a universe and present an ordered
list).

## How to use this template

**Start from [`example/`](./example/) — do not rebuild from scratch.** It's a
working "Growth Inflection Screener" (US mid-caps $5B–$50B scored by Growth ·
Margin · Safety, ranked on revenue re-acceleration + gross-margin improvement)
with the full UI shell, all three tabs, the methodology modal with worked
example, the gauge ring, factor breakdown, movers grid, basket trend chart, and
the feed wired up. Copy it, then swap in your universe / factors / filters.

The example is the source of truth for **all implementation detail** — CSS,
widget chassis, ECharts options for K-line / gauge / trend / scatter, sticky
column behavior, expand-row layout, modal scaffolding, snapshot picker wiring,
flag-pill rendering, worked-example formatter. Do not re-derive any of that
from this template; read the file.

Files:

- [`example/index.html`](./example/index.html) — UI shell, tab bar + README
  chip, snapshot picker, ranked table with expandable rows, gauge ring,
  factor breakdown, K-line, movers cards, basket trend chart, methodology
  modal with worked example.
- [`example/feeds/inflection-screener-feed.js`](./example/feeds/inflection-screener-feed.js)
  — feed: rankings group, summary group, klines group; factor scoring,
  flag derivation, churn vs prior snapshot.

This template only covers what isn't readable from the code: which **variant**
you are (scored vs basket), the **frozen feed contract** (so the renderers
keep working), the **operational invariants** that must survive customization,
and the **content rules** for the optional Daily Digest + push line that the
example doesn't yet ship.

## What to customize

| Concern | Where |
|---|---|
| Screener name, page title, hero copy | `index.html` |
| Universe + filters (which rows qualify) | feed |
| Factor list, weights, scoring formula (scored variant) | feed + methodology section in `index.html` |
| Inclusion logic (basket variant) | feed |
| Flags (label, tier, threshold) | feed `flags` array per row + flag-card text in `index.html` |
| Columns shown in ranked table | table renderer in `index.html` |
| Expand-row content (extra widgets) | expand-panel renderer in `index.html` |
| Methodology modal copy | `.modal-panel` body in `index.html` |
| Cron schedule | feed cron config |

## What NOT to change without an explicit user override

- Tab order: **Overview · Movers & Trends · Analysis** (latter two optional;
  if included, this order). Methodology is **not** a tab — it's a modal.
- README chip in the tab-right group opens the Methodology modal.
- Frozen field names in the [Feed Contract](#feed-contract).
- The snapshot picker is a **pure view filter** — never mutates data, never
  changes the page header timestamp.
- Empty-state rules in the [Feed Contract](#feed-contract).
- Forward-only history accumulation: never call point-in-time SDKs to
  fake-backfill past snapshots — those return *currently revised* data, not
  real historical state.

This template shares its shell (tab bar + README chip + methodology modal)
with the thesis template; matching surfaces stay visually identical across
playbook families. The example already conforms — keep it that way.

---

## Build workflow

- **Respect the [Feed Contract](#feed-contract) verbatim** — snake_case,
  epoch ms, flat `metrics`, frozen field names (`id` / `score` / `rank` /
  `flags`). Doing this means the example HTML's renderers work first try and
  the test-debug loop on field-name mismatches disappears. The temptation is
  "my screener is special, one camelCase field won't hurt"; it will, because
  it pushes you back into adapter-shimming the renderers.
- `cp` example files then mutate in place. Don't `Write` whole files back
  when 70%+ is identical.
- Do all mechanical renames in one `sed -i` pass (screener name, theme color +
  CSS slugs, factor names, feed name, `USER`, API endpoint). `grep -nE` after
  to catch stragglers.
- Don't read the HTML linearly. `grep -n` the marker, then `Read` with
  `offset` + `limit` on that section only.
- Single feed: `grant` and `deploy create` have no cross-dependencies —
  issue them in parallel. Only `playbook draft` → `release playbook` is
  strictly serial.
- Batch ticker → sector verification via one `alva run` against
  `company/detail` before writing the universe. **`company/detail`'s sector
  field can mislead on thematic baskets** — e.g. optical-transceiver makers
  tagged "Semiconductors", fiber-laser makers tagged the same. When you
  override the SDK's bucketing to match thematic intent, log the override in
  the Methodology modal (under Data sources or Blind spots) so users see it's
  a deliberate reclassification, not a bug.
- Spend disproportionate time on **factor weights + flag thresholds**
  (always) and on the **Daily Digest few-shot pack** + `push_line` voice
  (when shipping the digest). Smallest blocks, highest leverage.
- Drop the example HTML's `adaptRanking` / `adaptSummary` adapters once your
  feed conforms to the frozen contract — they exist to paper over the senate
  feed's quirks. A new feed that respects [Feed Contract](#feed-contract)
  should pass through directly; leaving the adapters in place hides schema
  drift.

Cannot shortcut: universe curation, factor selection + weights, flag
thresholds, the Daily Digest few-shot pack. Everything else is plumbing.

---

## Variants

Pick first. Every component below is tagged with which variant it applies to.

| Shape | When to use | Ranking logic |
|---|---|---|
| **Scored** | Rows have a composite score (weighted factor combine). | Rank by score desc. Band pill maps score → tier. |
| **Basket** | Pass/fail inclusion — row is either in or out. No score. | Order by the most relevant raw metric (market cap, entry date, etc.). |

If you want basket-style inclusion *plus* a secondary score for ordering,
treat it as **scored** and let the score drive the rank. The example is a
scored screener.

Component matrix (✓ = include, ✗ = omit, △ = include with variant-specific
rules — read the example to see how):

| Component | Scored | Basket |
|---|---|---|
| Rank / Score / Δ Score columns | ✓ | ✗ |
| Inclusion-signal columns (entry date, days in basket, exit reason) | ✗ | ✓ |
| Score bar + Band pill | ✓ | ✗ |
| Δ rank tag | ✓ | △ (only if a stable secondary sort exists) |
| Flag pill / Flag card | ✓ | ✓ |
| Expand row | △ | △ |
| Gauge ring + Factor breakdown (in expand) | ✓ | ✗ |
| Movers card set | Entries · Dropouts · Top Gainers · Top Decliners | Entries · Exits only |
| Basket trend chart | ✓ | ✓ |
| Worked example (methodology) | ✓ | ✗ |
| Daily Digest + push notification | ✓ | ✓ (skip push when both churn sides empty) |

---

## Feed Contract

Three surveyed screeners diverged on field names and storage layout — enough
that snapshot picker / Movers cards / trend chart couldn't be reused across
them. This section freezes the joints. Screener-specific signals live in
open `metrics` / `detail` escape hatches — name those freely.

### Storage

```
~/feeds/<screener-name>/v1/data/
  screener/
    rankings/   ← append-only, one record per (snapshot, row)
    summary/    ← append-only, one record per snapshot
    tldr/       ← append-only, one record per snapshot (optional, for Daily Digest)
```

All groups are Feed SDK time-series (`ctx.self.ts("screener", "<group>").append(...)`).
Reads go through `@last/N`. `tldr` is a group on the **same feed**, not a separate
`<name>-tldr` feed.

### Frozen field names

Do not invent synonyms. Renderers decode case-exactly.

| Term | Meaning | Do not use |
|---|---|---|
| `id` | Row primary key — uppercase ticker / symbol / pair / ISIN / theme name. The UI renders `id` verbatim. | `ticker`, `symbol`, `code` |
| `score` | Composite score, scored variant. | `composite`, `consensusScore` |
| `rank` | Integer rank, scored variant. | `position`, `place` |
| `flags` | `[{label, tier}]` per row, `tier ∈ "hard" \| "soft"`. `[]` if none. | `warnings`, `tags` |

### Record shapes

`rankings` — every row, every snapshot:

```
date         int       epoch ms; same value for every row in that snapshot
id           str       primary key
name         str       human-readable label
rank         int|null  scored: required; basket: may be null
flags        [{label,tier}]
metrics      object    flat numeric signals for display (free shape)
detail       object    nested blobs for expand-row content (free shape)

scored-only:
score        number
factors      [{name, raw, pts, weight}]

basket-only:
entry_date   int       epoch ms
exit_reason  str|null
```

`summary` — one row per snapshot:

```
date            int
universe_size   int
delta           {new_ids, dropped_ids}    vs prior snapshot; first run: both []
```

`tldr` — one row per snapshot (only if you ship Daily Digest + push):

```
date         int
body         str   ADK-generated markdown — bullets, prose, or one line. "" on grounding failure.
push_line    str   ADK-generated standalone headline, ≤ 160 chars plain text. "" on grounding failure.
churn_line   str   deterministic "🆕 X · 👋 Y", always present, may be ""
source       str   "adk" | "fallback"
```

### Three bedrock rules

1. **snake_case** for all keys (`market_cap`, not `marketCap`).
2. **Epoch ms** for all timestamps — no ISO strings anywhere.
3. **No stringified JSON in field values.** Real nested objects/arrays;
   never `"[...]"` wrapped in quotes.

### Empty-state rules

- `flags: []` → render no flag pill (no synthetic "clean" pill — 500 placeholder
  pills is pure noise).
- Score Δ where `|Δ| < 0.5` → suppress the inline delta text.
- `< 2` snapshots in history → hide the basket trend chart entirely; show the
  `.trend-empty` hint.
- Only 1 snapshot in history → hide the snapshot picker entirely.
- `tldr.source === "fallback"` → render `churn_line` only (no body); skip
  push when churn is also empty.

---

## Tabs

Three tabs. Overview is mandatory; the others are optional, included only when
they reveal something the ranked list doesn't.

| Tab | When to include | Reads from |
|---|---|---|
| **Overview** | Always | `screener/rankings @last/1` (+ `tldr @last/1` if shipped) |
| **Movers & Trends** | Day-to-day churn matters (skip for slow-moving quarterly screeners) | `screener/rankings @last/N` + `summary @last/N` |
| **Analysis** | Cross-sectional patterns reveal something the list doesn't (factor scatter, sector bars, etc.) | `screener/rankings @last/1` |

Per-tab structural notes — for the actual rendering, read the example.

### Tab 1 — Overview

Top-down: optional Daily Digest card → Ranked Table with expandable rows.

**Ranked table** uses the Table Card base from `design-widgets.md` verbatim.
Order columns by importance left-to-right; if there's no Rank/Score, sort by
the most relevant metric (e.g. market cap, entry date) and make that column
primary. Often-used columns:

- Position: Rank *(scored)*
- Score: composite + score-bar fill *(scored)*
- Identity: Name, Sector / Industry / Asset Class
- Movement: Δ Rank (pill), Δ Score (inline) *(scored, vs prior snapshot)*
- Inclusion: Entry date, Days in basket, Exit reason *(basket)*
- Risk: Flag pill (first label + `+N` if multiple)
- Screener-specific metrics

**Score bar / Band pill / Score color** must agree on the same breakpoints —
a row's bar color and pill tier never disagree:

| Score | Token | Tier label |
|---|---|---|
| `≥ 80` | `var(--main-m3)` (green) | elite |
| `≥ 70` | `var(--main-m1)` (teal) | strong |
| `≥ 60` | `var(--main-m5)` (amber) | average |
| `< 60` | `var(--main-m4)` (red) | weak |

**Expand row** — always include a price/value chart (K-line by default; line
chart for assets without OHLC). Beyond that, mix-and-match what reveals *why*
the row is where it is. Scored screeners typically pair a Gauge Ring + Factor
Breakdown above the chart and Flag cards below; basket screeners use the
chart-row plus screener-specific narrative blocks (peer comparison, news,
holdings, on-chain stats). The example has both shapes — read it.

K-line interval should be ≤ update cadence with enough bars to see the
pattern the screener cares about (rule of thumb: quarterly fundamentals →
daily bars / 60–90d window; daily / weekly → daily bars / 30–90d; intraday
momentum → hourly or 15min / 5–10d; long-cycle macro → weekly bars / 1–2y).

### Tab 2 — Movers & Trends

Optional. Common building blocks (pick what fits): Movers cards (Entries ·
Dropouts · Top Gainers · Top Decliners for scored; Entries · Exits only for
basket) → basket trend chart (eligible count bar + aggregate stat line over
time) → optional detail tables / sector rotation.

**Within-session reruns produce identical snapshots** for any feed whose
inputs are daily OHLCV / fundamentals — every score is the same, so Movers
cards render `0 entries / 0 dropouts / no changes`. This is correct behavior,
not a bug. Real churn appears only after the next trading day's cron fires.
Don't rerun manually expecting Movers to populate, and don't try to
fake-backfill prior days; if the screener genuinely needs intra-day movers,
move the inputs to an intraday cadence and tighten the cron accordingly.

### Tab 3 — Analysis

Optional. Cross-sectional charts: factor scatter, sector bars, distribution
histograms, correlation matrix. Each chart sits in a Chart Card with an
`.analysis-caption` between title and body (one-line read of what the chart
shows).

---

## Daily Digest *(optional)*

A short markdown summary that sits at the top of Overview and reacts to the
snapshot picker. The same `screener/tldr` record powers both this card and
the [push notification](#push-notifications) — **one ADK generation per
snapshot, two render surfaces**. The example doesn't yet ship this; the
contract and content rules below cover what to do when you add it.

**Shape follows content** — let the day's content decide:

- Churn-heavy / multi-signal day → bulleted list with `**Label:**` prefixes.
- Single clear driver → a short paragraph (one bullet alone reads worse than
  a sentence).
- Quiet day → one or two dry sentences. Don't manufacture structure to fill
  the card.

Useful labels when bulleting (no fixed set, no fixed order): *Top of basket ·
New entries · Dropouts · Sector tilt · Flags · Next refresh*.

**Voice** — sharp analyst dropping a line in Slack, not a research-report
abstract:

- **Verbs, not nouns.** *"PANW crashed into the top-5"* > *"PANW's ranking
  improved"*.
- **Asymmetric rhythm.** Avoid parallel *"A rose to X; B fell to Y"*. *"TSM
  pulled ahead on a quiet wave — six fresh insiders overnight, nothing else
  moved."*
- **Texture over aggregates.** *"$10M in a single clip"*, *"stable three
  days running"*. Generic intensifiers (`strong`, `significant`) banned.
- **Dry over hype.** *"Nothing material; roster unchanged."* beats padding.
- **Screener-native vocabulary.** Use exact factor names from the table
  (*"cluster breadth"*, *"entry-level 20d MA"*), not model-invented synonyms.
- **No buy/sell, no price targets, no timing calls.** Observational only.

**Few-shot pack** — each screener owns `screener/prompts/tldr.yaml` with 3
gold examples drawn from real prior snapshots of *this* screener (one
bullet-heavy day, one prose day, one quiet one-liner) and 2 negative
examples labeled with *why they're bad*. Include the pack verbatim in the
ADK prompt. Without it, output drifts to research-report tone within a week.

**Generation rules**:

- Output is structured JSON: `{body: "<markdown>", push_line: "<plain>"}`.
- Length caps: `push_line ≤ 160` chars; `body ≤ ~800` chars rendered.
- **Numeric grounding** — extract every number (regex `-?\d+(\.\d+)?%?`) from
  both fields. If **any** unverified number appears, mark the whole digest
  as fallback (`body: ""`, `push_line: ""`, `source: "fallback"`) and let the
  UI render `churn_line` alone. All-or-nothing beats patching partial prose.
- Persist per snapshot to `screener/tldr`. Regenerate only when a new snapshot
  appears.

---

## Push Notifications

**Deterministically derived** from the same `screener/tldr` record — no
separate ADK call. Base push plumbing (signal target schema, subscription,
delivery) comes from the Alva skill.

**Payload**:

```
title:   <Screener> · <date>
line 1:  tldr.push_line              ← already grounded + voice-checked, ≤ 160 chars
line 2:  tldr.churn_line             ← deterministic "🆕 X · 👋 Y"
line 3:  Full snapshot → <playbook URL>
```

**When to send**:

- First snapshot ever / first of the day → always.
- Subsequent → only if something changed: new entries, new dropouts, rank
  churn in top-N, new flags, a factor driver swap.
- Basket variant with both churn sides empty → **do not send** "nothing
  happened" pings.
- `tldr.source === "fallback"` and churn empty → skip.
- `push_line === ""` (fallback) → omit line 1; push is churn line + URL only.

Length budget: lines 1+2 ≤ 280 chars combined — the 160-char `push_line` cap
in the digest prompt guarantees the fit.

---

## Methodology Modal

Always include — explain how the screener works. Triggered by the README chip
in the tab-right group. The example wires up the trigger / overlay / panel /
close behaviors / lazy-render. Only the **content** changes per screener.

Pick subsections that apply; skip ones that don't (a momentum screener has no
factor weights; a pure-filter screener has no scoring formula):

- **One-paragraph overview** (always) — plain English: what the screener
  ranks / filters and why.
- **Filter rules** (basket / hard filters) — every threshold, every excluded
  category. The senate example excludes ETFs and requires ≥ 2 distinct
  senators + ≥ $50K total — that level of specificity.
- **Factor weights + scoring formula** (scored only) — factor name, raw
  measure, normalization, weight. State the formula exactly.
- **Worked example** (scored only) — re-derive the current #1 from raw
  inputs. Header (id + name + rank + band) plus monospace per-factor rows
  (`name | raw / 100 × weight% = pts`) plus a total. The verify badge states
  the actual relationship: if the displayed score is the factor-weighted
  sum, it equals the total; if the display is a rescaling (like the senate
  example's `45 + 50 * normalized composite`), state that honestly so users
  can reconcile. Don't claim equality you can't deliver.
- **Score bands** — score ranges → tier label.
- **Flag definitions** — for each flag: label, tier, exact threshold.
- **Data sources & freshness** — which SDKs / endpoints, when each updates.
- **Blind spots** — honest list of what this does NOT capture.
- **Glossary** — domain-specific terms.

**Performance** — lazy-render the modal body the first time it opens, not on
page load; methodology is rarely the first thing a user wants. The example
does this.

---

## Cron

Match frequency to the **slowest** input metric — running faster than your
data updates wastes credits and creates noise.

| Screener cadence | Suggested cron |
|---|---|
| Quarterly fundamentals | 1× weekly (after weekend) |
| Daily fundamentals + price | 1–2× daily (post-close + optional pre-open) |
| Intraday momentum / technical | 4–12× daily (every market hour) |
| Real-time signals (rare) | every 5–15 min during market hours |

- Cron in UTC; display in EST in the UI.
- `args.now` (ms) is for **replaying missed runs** only — e.g. cron was down
  Tuesday; pass Tuesday's timestamp and rerun. It stamps today's SDK
  response with a different snapshot date, which is correct for recovery.
- **Do not use `args.now` to fabricate pre-launch history** — point-in-time
  SDK calls return *currently revised* data, not real historical state. The
  only honest mode is forward-only accumulation from launch date.
