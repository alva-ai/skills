# Thesis Tracking Template

Reference structure for any narrative-driven thematic thesis tracker (defense,
AI infra, GLP-1, energy transition, capex bottlenecks, etc.).

## How to use this template

**Start from [`example/`](./example/) — do not rebuild from scratch.** It's a
working "AI Bottleneck" thesis tracker (basket of Power / Compute / Deployment
names) with the full UI shell, all five tabs, the methodology modal, the ADK
narrative feed, the quant feed, and the news/social feed wired up. Copy it, then
swap in your thesis.

The example is the source of truth for **all implementation detail** — CSS,
widget chassis, ECharts options, sticky behavior, table column alignment, modal
scaffolding, date-picker wiring, grounding regex, fallback string, push-trigger
conditions, methodology copy structure. Do not re-derive any of that from this
template; read the file.

Files:

- [`example/index.html`](./example/index.html) — UI shell, all five tabs,
  methodology modal, all CSS, all chart configs.
- [`example/feeds/ai-bottleneck.js`](./example/feeds/ai-bottleneck.js) — quant
  feed: basket, prices, fundamentals, alpha snapshot, hero-push signal.
- [`example/feeds/ai-bottleneck-narrative.js`](./example/feeds/ai-bottleneck-narrative.js)
  — ADK narrative feed: TLDR + pushLine + deltas + catalysts + risks per day,
  grounding check, fallback path.
- [`example/feeds/ai-bottleneck-news.js`](./example/feeds/ai-bottleneck-news.js)
  — news + social feed and the post-processing matcher that attaches items to
  catalysts/risks.

This template only covers what isn't readable from the code: the **structural
shape** of the playbook (tab order, what each section does), the **frozen data
contract** (so swaps don't break the renderers), and the **operational
invariants** that must survive customization.

## What to customize

| Concern | Where |
|---|---|
| Thesis name, page title, hero copy | `index.html` |
| Basket members, layers, per-name prose | `BASKET` array in the quant feed |
| Pillars (multi-pillar theses) | declared pillar ids; tagged on each delta / catalyst / risk |
| Benchmark + comparison series | quant feed + chart legend in `index.html` |
| Fundamentals columns in the basket table | basket-table renderer in `index.html` |
| ADK narrative agent prompt + few-shot exemplars | narrative feed |
| Methodology modal copy | `.modal-panel` body in `index.html` |
| News / social query keywords | news feed |
| Cron schedule | `.cron.json` files |

## What NOT to change without an explicit user override

- Tab order: **Thesis · Basket · Catalysts · Risks · News & Social**.
- README chip in the tab-right group opens the Methodology modal. Methodology is
  **not** a tab.
- Frozen field names in the [Data Contract](#data-contract).
- Empty-state rules in the [Data Contract](#data-contract).
- Only the Tab 1 TLDR card is historically scrubbable. Every other surface reads
  latest.
- Push-notification body always equals `pushLine` from the same
  `narrative/records` row that powers Tab 1 — one ADK generation per snapshot,
  two render surfaces, zero drift.
- Forward-only narrative accumulation: never run the agent on historical
  snapshots to fake-backfill records.

This template shares its shell (tab bar + README chip + methodology modal)
with the screener template; matching surfaces stay visually identical across
playbook families. The example already conforms — keep it that way.

---

## Build workflow

- `cp` example files then mutate in place. Don't `Write` whole files back
  when 70%+ is identical.
- Do all mechanical renames in one `sed -i` pass (benchmarks, layer/pillar
  names + CSS slugs + colors map, feed names, `USER`, API endpoint).
  `grep -nE` after to catch stragglers.
- Schema field renames are radioactive: one benchmark rename (e.g. `pave_ytd` →
  `spy_ytd`) propagates across quant feed schema, narrative fallback copy, HTML
  KPI cards, horizon cards, equity chart series, and attribution filters — 3
  feeds + 2500-line HTML in lockstep. Always `sed -i` the bulk rename across all
  files first, then do a single `Read` pass to verify, then use `Edit` only for
  narrative prose that `sed` cannot safely touch. Never rename field-by-field
  with `Edit` — every mid-rename `Read` will see a half-dirty file and the Edit
  tool will report the file as modified.
- Don't read the HTML linearly. `grep -n` the marker, then `Read` with
  `offset` + `limit` on that section only.
- Your three feeds' `grant` / `deploy create` / `release feed` have no
  cross-dependencies — issue them in parallel (use your own feed names, not the
  example's). Only `draft` → `release playbook` is strictly serial.
- Draft all basket members' prose in one pass, polish after. Voice converges
  only when you see them side-by-side.
- Spend disproportionate time on the ADK `systemPrompt` and the news-feed
  Bull/Bear definitions — smallest blocks, highest leverage.
- Batch ticker → sector verification via one `alva run` against
  `company/detail` before writing the basket.

Cannot shortcut: basket curation, per-name prose, systemPrompt. Everything else
is plumbing.

---

## Pipeline

Two daily cron jobs:

| Pipeline | Cadence | Notes |
|---|---|---|
| Quant feed | Daily post-close (e.g. 6 PM ET) | Faster only if an input metric actually updates intraday. |
| Narrative feed (ADK) | Daily ~30 min after quant (e.g. 6:30 PM ET) | Must run **after** quant so it can diff today vs yesterday. |

The narrative agent reads today's quant snapshot, yesterday's, the prior narrative
record, and basket universe; it has tool access to news / social / URL-scrape /
optional web search. It emits a single `narrative/records` row per date that
powers Tab 1, Tab 3, and Tab 4. A post-processing matcher attaches relevant
news/social items to each catalyst and risk; unmatched items fall through to
Tab 5.

Implementation lives in `feeds/ai-bottleneck-narrative.js` and
`feeds/ai-bottleneck-news.js` — read those for the prompt shape, grounding check,
fallback handling, and matcher rules. Do not re-derive from prose.

---

## Data Contract

Three surveyed playbooks diverged on field names, casing, and record shapes —
enough that generic tooling couldn't be reused across them. This section freezes
the joints that caused the divergence. Everything else is free.

### Frozen field names

Do not invent synonyms. UI code decodes case-exactly.

| Term        | Meaning                                                              | Do not use                       |
|-------------|----------------------------------------------------------------------|----------------------------------|
| `id`        | Basket member primary key (uppercase ticker / symbol).               | `ticker`, `symbol`, `code`       |
| `layer`     | Member's grouping inside the basket (sub-industry / persona / tier). | `segment`, `bucket`, `tier`      |
| `pillar`    | Independent support of the thesis. Distinct from `layer`.            | `leg`, `axis`, `arm`             |
| `sentiment` | Title Case from `{"Bull", "Bear", "Neutral", "Ambiguous"}`. Each object uses a subset.  | lowercase, numeric, `"bullish"`  |
| `category`  | Delta / risk tag. Enumerated below.                                  | `tag`, `type`, `kind`            |

### Record shapes

`narrative/records` (one row per date):

```
date          int   epoch ms at midnight UTC of the record date
recordDate    str   "YYYY-MM-DD"
generatedAt   int   epoch ms when the agent produced this record
thesis        str   markdown TLDR body
pushLine      str   plain-text headline, ≤ 160 chars, used verbatim by push
source        str   "adk" | "fallback"  — "fallback" blanks thesis & pushLine
deltasJson    str   JSON-encoded array of Delta objects
catalystsJson str   JSON-encoded array of Catalyst objects
risksJson     str   JSON-encoded array of Risk objects
```

`Json`-suffixed fields are JSON strings, not native arrays. Renderers
`JSON.parse()` at read time. Re-runs append a new row; readers dedupe by
`recordDate` keeping the largest `generatedAt`.

**Object shapes** (frozen field names + enums; see narrative feed for usage):

```
Delta    { sentiment, category, label, body?, pillar? }
         sentiment ∈ Bull|Bear|Neutral
         category  ∈ Valuation|Catalyst|Risk|Macro|News|Positioning|Flows

Catalyst { date, status, sentiment, title, notes, ids, relatedNews?, pillar? }
         date      "YYYY-MM-DD" | "YYYY Qn" | "TBD"
         status    ∈ Upcoming|Delivered|Missed
         sentiment ∈ Bull|Bear|Ambiguous

Risk     { category, description, divergenceType, exitTrigger, ifTriggered,
           priority, relatedNews?, pillar?, thesisClaim? }
         category       ∈ Policy|Regulatory|Tech substitution|Cyclical
                          |Execution|Valuation|Narrative|Geopolitical
         divergenceType ∈ Fundamental|Narrative|Valuation|Flows
         priority       ∈ High|Medium|Low
```

`pillar` is required if the thesis is multi-pillar. `thesisClaim` on a risk
quotes the pillar commitment the risk diverges from — anchors the risk to a
specific claim instead of free-floating worry.

`alpha/snapshot` (theme-level returns):

```
date            int
basketRet       {d1, d5, d30, d180}   percentage points (5.23 = +5.23%)
benchmarkRet    {d1, d5, d30, d180}
alpha           {d1, d5, d30, d180}   basketRet - benchmarkRet
controlRet?     {d1, d5, d30, d180}
vsControl?      {d1, d5, d30, d180}
```

**Do not embed member tickers in field names** (`pltr1d` / `rklb1d` is a
forbidden pattern — locks the snapshot to a specific thesis). Per-member
horizon returns belong in `alpha/basket`. Hero-ticker curves belong in
`prices/<id>`.

### Empty-state rules

- `flags: []` → render no flag pill (no synthetic `"clean"` pill).
- `deltas: []` → hide the whole "What changed since yesterday" section (no
  heading, no placeholder).
- `catalysts: []` / `risks: []` → keep the tab visible; show one muted line. Do
  not hide the tab.
- `relatedNews: []` → hide the related-news pill entirely; do not render
  `0 news & social`.
- Narrative record missing for a selected date → fall back to the deterministic
  one-liner (logic in narrative feed); quant widgets render normally.

---

## Tabs

Five tabs, equal weight. Methodology lives in a modal triggered by the README chip
in the tab-right group.

| Tab | Reads from | Date scope |
|---|---|---|
| **Thesis** | `narrative/records` (TLDR + deltas) + `alpha/snapshot` + `prices/themeIndex` (curves, horizon bars, optional macro charts) | TLDR card scrubbable via its own date picker; everything else latest |
| **Basket** | `basket` + per-member `prices` + `fundamentals` (+ `thesisScore` if composite scoring) | Latest |
| **Catalysts** | latest `narrative/records.catalystsJson` | Latest only — no picker |
| **Risks** | latest `narrative/records.risksJson` | Latest only — no picker |
| **News & Social** | full news + social feed (matched + unmatched) | Rolling 24-72h window |

Per-tab structural notes — for the actual rendering, read the example.

### Tab 1 — Thesis

TLDR card → three KPI metric cards → "What changed since yesterday" deltas list
(bound to TLDR date picker) → equity curve vs benchmark → horizon-returns bar
chart → optional macro / industry charts (only if the thesis has 1-2 macro
signals that directly drive conviction; skip when the basket is the whole
story).

The TLDR is **never hand-written** — it's the ADK narrative agent's output,
regenerated only when a new snapshot appears. The card is the only historically
scrubbable surface in the playbook (URL hash deep-link `#tldr-date=YYYY-MM-DD`).
For voice, length, and the four-question framework the agent must follow, see
the agent prompt in the narrative feed and the gold few-shot exemplars in
Methodology.

### Tab 2 — Basket

Ranked basket table → expand-row panel per member → valuation scatter.

Membership is judgment-driven (manually curated). Default mode: group by `layer`,
sort within layer by alpha vs benchmark, each member carries a hand-written rationale.
**Optional composite scoring** (only when 20+ members and factors are uniformly
definable across them) adds a `thesisScore` 0-100 column with bands
`Elite ≥ 80 / Strong ≥ 70 / Average ≥ 60 / Weak < 60` and optional `flags`.
Rationale prose is static until manually updated; log changes in the basket
changelog inside Methodology.

### Tab 3 — Catalysts

Sub-tabs `Upcoming` / `Delivered` / `Missed` (label format `<Name> <count>`).
Ongoing ascends (soonest first); Delivered / Missed descend (most recent first).
Each card expands to reveal related news/social items attached by the
post-processing matcher.

### Tab 4 — Risks

Risk register table sorted by priority descending. Expand row reveals related
news/social items (same matcher as catalysts).

### Tab 5 — News & Social

Flat feed, newest-first. **All items**, including those already matched to
catalysts or risks — this is the complete picture, not a spillover. Items
matched to a catalyst or risk show a tag indicating which one. No pagination —
24-72h window, oldest drops off.

---

## Methodology Modal

Always include — explains how the playbook works. The example wires up the trigger
/ overlay / panel / close behaviors / lazy-render. Only the **content** changes
per thesis.

Pick subsections that apply; skip ones that don't fit (a single-pillar thesis
has no pillars list; a default-scored basket has no factor weights table):

- **How this playbook works** — quant + ADK pipelines, post-processing matcher,
  cadence in ET, exact list of inputs fed to the narrative agent.
- **Thesis pillars** (multi-pillar only) — for each pillar: id, name, one-sentence
  claim, the daily signal that would verify or contradict it.
- **News matching** — ticker overlap + keyword similarity; unmatched flow to Tab 5.
- **TLDR generation** — four-question framework, grounding rule, fallback, how
  `pushLine` is written. Include 1-2 gold few-shot TLDRs (each a `{thesis,
  pushLine}` pair).
- **Basket selection** — every name by layer; inclusion criteria; change-log
  policy. If composite scoring: factor table (name, measure, normalization,
  weight), composite formula, band thresholds, flag definitions, a worked
  example re-deriving the current #1.
- **Computation rules** — every derived field: alpha definition, risk priority
  matrix, delta surfacing rules, etc.
- **Data sources** — OHLCV + fundamentals (Alva SDK); macro (FRED / World Bank /
  etc.); news (Alva News SDK); social (GrokX or equivalent); narrative (ADK agent
  + tools).
- **Blind spots** — honest list of what this does NOT capture.
- **Glossary** — thesis-specific terms.
