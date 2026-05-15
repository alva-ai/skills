# Per-ticker coverage-gap policy (universal) + screener-template rendering contract

Issue: https://github.com/alva-ai/mono-meta/issues/419

## 1. Background

A user-built screener (`ai-buildout-5x`, session
`https://alva.ai/chat?id=2054655887044825088`) over a curated 35-name AI-
exposed universe silently degraded 12 tickers to 50%-weight scoring (AI +
Valuation factors only, dropping Growth + Margin) because
`/api/v1/stocks/financial-metrics` returned `INVALID_PARAMETER: stock symbol
not found` for those names on every metric attempted (48 total errors:
12 unique tickers × `REVENUE_GROWTH_YOY_TTM` · `REVENUE_GROWTH_QOQ` ·
`GROSS_MARGIN_MRQ` · `FCF_MARGIN_MRQ`).

The failing tickers are real, publicly-traded, mid/small-cap US companies
with full SEC coverage: AAOI, AEHR, AI, AMBA, BBAI, INDI, NNE, POET,
POWI, POWL, SOUN, TDC. The user explicitly asked for *small-cap upside*;
the silent degrade biased the ranking toward mid-caps (CRDO at $35B mcap
won partly because the small-cap competitors were scored at half weight),
with no UI surface telling the user which names were partially scored.

**Relevant systems** — single submodule. The problem is **not screener-
specific**: any playbook calling `/api/v1/stocks/financial-metrics` (thesis,
what-if, ai-digest, custom) hits the same per-ticker coverage gap. Policy
belongs in `SKILL.md` so every agent reaches it; only the *rendering surface*
("Data Coverage Gap" UI card, `coverage_gap` field shape) is screener-template-
specific.

- `code/public/skills/skills/alva/SKILL.md` — has a "SDK Coverage Gaps"
  section (line 369) for whole-domain gaps and a fail-fast rule (line 1027),
  but nothing prescriptive for per-ticker partial coverage inside an
  otherwise working endpoint. **This is where the policy + recipe goes.**
- `code/public/skills/skills/alva/templates/screener/template.md` — frozen
  Feed Contract, operational invariants, and template guidance. **Only
  gets the screener-specific rendering contract** (`summary.coverage_gap`
  field, "Data Coverage Gap" card location, methodology-disclosure rule)
  with a one-line pointer to the canonical policy in SKILL.md.
- `code/public/skills/skills/alva/templates/screener/example/feeds/inflection-screener-feed.js`
  — the working example screener feed users copy from per `template.md:9`
  ("Start from `example/` — do not rebuild from scratch"); inline
  demonstration of the SKILL.md recipe.
- `code/public/skills/skills/alva/templates/screener/example/index.html`
  — renders rankings, summary, methodology modal; new "Data Coverage Gap"
  card on Overview tab.

**Constraints (validated in Phase 1)**:

- `Feed error handling is fail-fast` (SKILL.md:1027) — applies to whole-
  endpoint failures, not per-ticker partial coverage.
- The example feed already hard-drops tickers via `_drop` flags
  (`_drop = "insufficient_gm"` etc.) but never enters a "fallback compute"
  branch and never emits a coverage-gap surface.
- The example's universe is sourced from `/stocks/screener/financial-
  metrics`, which excludes uncovered tickers by construction. So the
  example never exercises the per-ticker-gap path — copies that switch
  to a curated ticker list (the natural thematic-basket shape) inherit
  no guidance.
- The previously-attempted fallback path `/api/v1/stocks/financials/
  income-statement` is wrong (returns `ROUTE_NOT_FOUND`). The correct
  paths are `/api/v1/stocks/company/income-statements` and `/api/v1/
  stocks/company/cashflow-statements`. Confirmed via
  `arrays-data-api-equity-fundamentals` doc skill.

**Premises (all validated by user in Phase 5; P1 revised in Phase 9)**:

- P1: The root cause is missing **universal** policy in SKILL.md, not just
  missing screener-template guidance. Any playbook calling
  `financial-metrics` hits this — thesis, what-if, ai-digest, custom —
  not only screener-shaped ones. Policy lives in SKILL.md; template only
  carries the screener-specific rendering contract.
- P2: Doing nothing leaves every future curated-list playbook (any
  shape, not only screener) exposed to the same silent degrade.
- P3: The fix layers on existing patterns (`_drop`, fail-fast, frozen
  Feed Contract, existing "SDK Coverage Gaps" section in SKILL.md) — no
  new abstraction.
- P4: Single-submodule scope (`code/public/skills`). No service-side
  code, no proto, no DB.

## 2. End-to-End Behavior

**Primary behavior (applies to any playbook, not just screeners).**
When a feed queries `/api/v1/stocks/financial-metrics` for a ticker and
the endpoint returns `INVALID_PARAMETER: stock symbol not found`
(HTTP 400), the feed:

1. Attempts a fallback compute from `/api/v1/stocks/company/income-
   statements` + `/api/v1/stocks/company/cashflow-statements` for the
   four canonical ratios derivable from raw statements
   (`REVENUE_GROWTH_YOY_TTM`, `REVENUE_GROWTH_QOQ`, `GROSS_MARGIN_MRQ`,
   `FCF_MARGIN_MRQ`).
2. If the fallback succeeds, the ticker enters the ranked table with
   full-weight scoring. Source attribution flips from `metrics_api` to
   `fallback_computed` in a per-row provenance field so methodology
   text can disclose the mix.
3. If the fallback fails (statements endpoints also return error / empty
   data / insufficient rows for the formula), the ticker is **excluded
   from the ranked list / output entirely** and surfaced via a per-
   template `coverage_gap` channel — never scored at reduced weight.
   The channel shape is template-specific (screener: a `coverage_gap`
   array on the `summary` group; thesis / what-if would have their own
   shapes), but the policy of "exclude and surface, never silent
   reweight" is universal and lives in SKILL.md.
4. For the screener template, the example HTML renders excluded
   tickers in a compact "Data Coverage Gap" card on the Overview tab
   listing each ticker, the missing metrics, and the specific endpoints
   that failed.

**Variants and edge cases**:

- *Some metrics covered, others gapped* (most common): fallback compute
  fills only the missing ones; covered metrics keep their
  `financial-metrics` source. Provenance is per-metric, not per-row.
- *True pre-revenue (e.g. NNE)*: fallback returns `revenue = 0`. Growth
  ratios are undefined (divide-by-zero) — exclude the ticker from
  growth-weighted ranking but emit into `coverage_gap` with
  `reason = "pre_revenue"`, distinct from `reason = "no_coverage"`.
  This is the disclosure the issue's methodology request asks for.
- *Statements endpoints also fail* (true upstream gap): exclude, log
  in `coverage_gap` with `reason = "no_coverage"`.
- *Universe-API screeners* (like the existing inflection example): the
  universe-fetch step already excludes uncovered tickers, so the
  fallback branch never fires. The policy is a no-op for them. Adding
  it costs nothing.

**Failure modes**:

- Fail-fast invariant preserved: whole-endpoint failures (auth, 5xx,
  schema drift) still throw and surface the failed run in the sandbox.
  The new fallback branch is scoped to a specific error signature
  (`INVALID_PARAMETER` + `stock symbol not found`) — broader failures
  bypass the fallback and throw as today.
- `summary.coverage_gap` MUST be present (`[]` when no gaps) so the UI
  card renders deterministically.

## 3. Findings

**Existing code patterns to reuse**:

- `_drop` exclusion pattern in `inflection-screener-feed.js:122-143` —
  the new "exclude and report" branch attaches to the same loop, just
  routes through fallback-attempt first.
- `buildSeriesMap` (line 66) — its sort-by-`observed_at` convention is
  what we need to mirror when ordering statement rows for TTM /
  YoY / QoQ math.
- Frozen Feed Contract field naming convention (`template.md:168-177`)
  — new `coverage_gap` field follows the same snake_case + flat-shape
  rules. `summary.delta` (line 200-205) is the existing precedent for
  "summary-level array of strings/objects describing churn".
- SKILL.md "SDK Coverage Gaps" section (line 369-378) for cross-linking;
  this change is the per-ticker analogue of the existing whole-domain-
  gap guidance.

**Constraints and dependencies discovered**:

- Verified live via Alva sandbox (Phase 4): all 12 failing tickers
  return 200 with 6-8 quarters of data on both `company/income-
  statements` and `company/cashflow-statements`. Real revenues match
  public IR data (AAOI $151M, TDC $444M, POWL $296M, AMBA $100M, etc.).
  NNE and POET correctly return $0 / minimal revenue — the data itself
  distinguishes "no-coverage" from "pre-revenue" without the agent
  having to guess.
- The four canonical ratios are all derivable from documented response
  fields: `revenue`, `cost_of_revenue` (→ `GROSS_MARGIN_MRQ`),
  `gross_profit_ratio`; `operating_cash_flow` − `capital_expenditure`
  divided by `revenue` (→ `FCF_MARGIN_MRQ`); 4-quarter rolling
  `revenue` (→ `REVENUE_GROWTH_YOY_TTM`); current vs. prior quarter
  `revenue` (→ `REVENUE_GROWTH_QOQ`).

**Chosen approach (Approach A from Phase 6, scope revised in Phase 9)** —
Policy + recipe in SKILL.md (universal); screener template carries only
the rendering contract.

*Alternatives rejected*: **Approach B** (promote fallback into a reusable `@alva/finance` helper) — defers because it expands scope to a backend repo and requires test infra for the formulas; premature without a second caller. **Approach C** (validate universe up-front, exclude uncovered tickers before scoring) — rejects because it relabels the silent-bias problem rather than solving it: in the reported session the user *wanted* the small-cap names that fail, so excluding them at the universe step is the same bad outcome with a different label.

*Scope revision in Phase 9*: the original Approach A put the policy +
recipe in `template.md`. User pushed back: not every playbook starts
from the screener template, but every playbook reads SKILL.md. Policy
moved to SKILL.md; template.md narrows to the screener-specific
rendering contract.

Scope of revised Approach A:

**`SKILL.md` — policy + recipe (the main change)**:

- Add a new subsection **"Per-Ticker Coverage Gaps"** under the existing
  "SDK Coverage Gaps" section (line 369), covering:
  - Error signature: `financial-metrics` returns HTTP 400 with
    `INVALID_PARAMETER: stock symbol not found`.
  - Operational invariant: **fallback-or-exclude, never silent
    reweighting.**
  - Fallback endpoints: `/api/v1/stocks/company/income-statements`
    and `/api/v1/stocks/company/cashflow-statements`.
  - Formulas for the four canonical ratios (`GROSS_MARGIN_MRQ`,
    `FCF_MARGIN_MRQ`, `REVENUE_GROWTH_YOY_TTM`, `REVENUE_GROWTH_QOQ`)
    in terms of raw statement fields.
  - Exclude-and-surface requirement: each playbook MUST expose a
    `coverage_gap` channel; exact shape is template-specific (see
    each template's Feed Contract).
  - `reason` taxonomy: `"no_coverage"` (both endpoints fail) vs.
    `"pre_revenue"` (statements return `revenue == 0`). Methodology
    text MUST use these labels verbatim — no conflating with
    "speculative" or similar agent-invented categories.

**`templates/screener/template.md` — screener rendering contract only**:

- Extend the Feed Contract `summary` shape with `coverage_gap:
  [{id, missing_metrics, reason, fallback_attempted}]` (frozen field).
- Add "Data Coverage Gap" card to the Overview tab structural notes
  (placement, when to render, when to hide if empty).
- One-line pointer at the top of the new subsection: *"Policy and
  recipe live in SKILL.md `Per-Ticker Coverage Gaps`. This section
  only specifies the screener-template rendering shape."*
- Methodology Modal section: one-paragraph rule that narrative copy
  must label `coverage_gap` rows with `reason` verbatim — same as
  SKILL.md's taxonomy, restated here because the Methodology Modal is
  the surface most likely to be customized per-screener.

**`templates/screener/example/feeds/inflection-screener-feed.js`** —
inline demonstration of the SKILL.md recipe (~30 LOC):

- Catch `INVALID_PARAMETER` on per-ticker `financial-metrics` calls
  → call `company/income-statements` + `company/cashflow-statements`
  → compute the four ratios from raw fields.
- Failed-fallback tickers: emit into `summary.coverage_gap` with
  `reason` set, never reach the ranked list.
- Existing `_drop` path preserved as the broader exclusion mechanism.

**`templates/screener/example/index.html`** — "Data Coverage Gap" card
(~40 LOC): compact card on Overview tab, reads from
`summary.coverage_gap`, hides when array is empty, uses existing
movers-card chassis.

**Risks and unknowns**:

- *Risk*: TTM rolling math from raw statement rows can drift from
  vendor TTM if the vendor handles non-calendar fiscal quarters
  differently. Acceptable for `coverage_gap` rows (which today have
  no value at all) but the recipe must call out: "rows scored via
  fallback may differ marginally from rows scored via `financial-
  metrics` for vendor-side adjustments". Surface this in methodology.
- *Unknown* (out of scope, per Phase 3): why Arrays
  `financial-metrics` lacks ticker-level coverage for AAOI / AMBA /
  POWI specifically (they have decades of public IR data). Mentioned
  here for trail; lives with whoever owns Arrays equity coverage.
- *Risk*: agents copying the example may keep the fallback code but
  skip the `coverage_gap` emission. Mitigation: make
  `summary.coverage_gap` a *required* field on the screener `summary`
  group schema (renderers check its presence) so silent-skip surfaces
  as a missing-field error rather than a clean-but-wrong run.
- *Risk* (non-screener templates): thesis / what-if / ai-digest don't
  yet have a `coverage_gap` rendering surface, so SKILL.md's "exclude
  and surface" requirement is currently unenforced for them — agents
  could exclude without surfacing. Accepted for this change: the bug
  reported in #419 is screener-shaped; other templates can adopt the
  pattern when they next take a maintenance pass. The universal policy
  in SKILL.md still tells those agents *not* to silent-reweight, which
  is the primary harm.

**Scope shape**: single-service (`code/public/skills` submodule). Touches
four files; no service-side code, no proto, no DB, no other submodules.

**Reference files for implementation**:

- SKILL.md prose pattern: existing "SDK Coverage Gaps" section
  (line 369-378) — new "Per-Ticker Coverage Gaps" subsection slots in
  right after it, same numbered-list + invariant tone.
- Feed Contract pattern: `skills/alva/templates/screener/template.md:168-220`
  (frozen-field tables + record-shape blocks) — add `coverage_gap` alongside
  `delta` in the `summary` record shape.
- Feed code pattern to mirror: `skills/alva/templates/screener/example/feeds/inflection-screener-feed.js` itself (modify in place); follow its existing `arraysGet` / `buildSeriesMap` / `_drop` conventions.
- HTML card pattern: existing Movers cards block in `skills/alva/templates/screener/example/index.html` — same chassis (chart-card / flag-card style), smaller, no chart.
- No test pattern exists in this submodule (skills repo has no test infra) — verification is by running the example feed end-to-end against the live Arrays endpoints, which Phase 4 has already done for the fallback branch.
