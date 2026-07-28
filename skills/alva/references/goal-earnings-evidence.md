# earnings-evidence

Reconcile one fiscal reporting period into an auditable evidence conclusion.

## Trigger

Use this goal when the final output concerns one focal earnings period: actual
versus contemporaneous consensus, beat or miss, guidance change, management
statements, filing evidence, market reaction, or whether that period supports a
declared thesis.

## Does not own

- Do not use it for a broad company thesis without a focal reporting period;
  use `research-and-compare`.
- Do not use it for entry, stop, target, or position sizing; use `trade-setup`
  or `portfolio-plan-and-allocate` according to the requested output.
- Do not use it for a formal multi-period event study or historical rule
  validation; use `backtest-and-validate`.
- Do not create a recurring post-earnings check; use
  `build-and-run-monitor`.
- Do not reproduce a full copyrighted transcript or substitute an unsourced
  secondary summary for primary evidence.

## Required inputs

Collect the canonical issuer, fiscal year and quarter or reporting period,
calendar mapping, known-at boundary, publication time, actual and estimate
definitions, currency, units, GAAP or non-GAAP policy, source hierarchy, and
the thesis or claims to test. Define the guidance comparison basis and, when a
market reaction is requested, the publication phase, reaction window,
benchmark, timezone, and market session.

Use `needs_user_input` when issuer or fiscal-period ambiguity could join facts
from different releases. This goal uses public evidence only; do not request
account access.

## Workflow

1. Normalize the request with [goal-contracts.md](goal-contracts.md). Resolve
   issuer identity, fiscal-period identity, known-at boundary, and all relevant
   publication and market clocks before collecting figures.
2. Follow [Data Skills discovery](data-skills.md#discovery-pipeline) with
   `alva data-skills list`, then `alva data-skills summary <skill>`, then
   `alva data-skills endpoint <skill> <File>`. Fetch each endpoint's detail
   before its first use in the session; re-fetch after an unexpected shape.
   Never guess a path, parameter, field, or response shape.
3. Use Arrays for typed actuals, estimates, guidance, filing or transcript
   metadata, prices, benchmarks, source clocks, revisions, and coverage. Keep
   source hierarchy, thesis testing, and conclusion ownership in Alva.
4. Pin actuals to the correct filing or release and consensus to the snapshot
   available before publication. Reconcile fiscal versus calendar periods,
   units, currency, continuing operations, and GAAP versus non-GAAP definitions.
5. Use deterministic code to calculate surprise and guidance deltas. Preserve
   formula inputs, revision or vintage, rounding, and noncomparable fields; do
   not let the LLM align or calculate financial values silently.
6. Summarize management evidence from permitted primary material and bind each
   material claim to a source. Mark missing or unsupported claims as unresolved
   instead of filling them from memory or a secondary narrative.
7. Align market reaction to the actual release time and trading session. State
   the window and benchmark, distinguish association from causation, and use
   `event-risk-and-impact` as supporting evidence when deeper impact analysis is
   needed.

## Minimum output

Return `period_identity`, `source_manifest`, `actual_consensus`, `surprise`,
`guidance_delta`, `management_evidence`, `market_reaction`,
`thesis_assessment`, and `unresolved_claims`. Include known-at and publication
times, units, currency, estimate vintage, formulas, reaction window, coverage,
and EvidencePacket refs for every material conclusion.

## States

Set `completion_state` independently from `domain_verdict`. Use `supported`,
`mixed`, `refuted`, or `unresolved` only for the earnings evidence conclusion.
Use `complete_with_gaps` when bounded missing evidence does not invalidate the
answer, and `insufficient_data` when primary evidence cannot support the focal
claim. Do not treat a `supported` thesis verdict as proof that source coverage
was complete. Keep `actionability_state=informational`.

## Safety and authorization

Do not combine different fiscal periods, label a revised estimate as the
contemporaneous consensus, or present noncomparable GAAP and non-GAAP values as
a surprise. Do not fabricate quotes, publication times, guidance, or market
reaction. Quote only what is necessary and permitted; summarize rather than
reproduce protected transcripts. This public-only goal has no account, write,
notification, or execution scope. Live execution remains unauthorized.

## Composition

Keep this goal primary when reconciliation of one earnings period completes the
request. Supply bounded evidence to `trade-setup`, `research-and-compare`,
`event-risk-and-impact`, `build-and-run-monitor`, or `backtest-and-validate`
when their final outputs own completion. A broad thesis belongs to
`research-and-compare`; a persistent earnings rule belongs to
`build-and-run-monitor`; a multi-period statistical result belongs to
`backtest-and-validate`. Supporting goals cannot broaden scopes or replace
unresolved primary evidence.
