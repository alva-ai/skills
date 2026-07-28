# research-and-compare

Build a sourced thesis or compare a closed set of issuers, instruments, or
themes. Apply the shared contracts in [goal-contracts.md](goal-contracts.md).

## Trigger

Use this goal for broad company, protocol, industry, cycle, valuation, or theme
research, and for comparisons among a finite set of known candidates. Use it
for ETF versus single-name, ADR versus ordinary-share, or other questions where
the issuer and the investable instrument may differ.

## Does not own

- Do not own precise entry, stop, target, or invalidation levels.
- Do not own open-universe screening, persistent monitoring, target allocation,
  or a single earnings period's evidence reconciliation.
- Do not turn a comparison into a portfolio recommendation unless the final
  requested output is an allocation plan.

## Required inputs

Collect the research question, closed comparison set or theme, comparison
dimensions, horizon, as-of boundary, base currency, source standard, and any
thesis or counter-thesis to test. Ask for the missing field when it would
materially change comparability.

## Workflow

1. Resolve the issuer and each instrument separately. Record instrument type,
   venue, currency, economic claim, and wrapper; never treat a shared issuer as
   proof that two instruments are equivalent.
2. Define a comparability matrix before drawing conclusions. Fix fiscal-period,
   unit, currency, benchmark, adjustment, and return conventions.
3. Distinguish price return from total return. Include distributions and
   corporate actions only when the selected total-return contract supports
   them; otherwise label the result as price return.
4. Follow [Data Skills discovery](data-skills.md#discovery-pipeline) with
   `alva data-skills list`, then `alva data-skills summary <skill>`, then
   `alva data-skills endpoint <skill> <File>` for each endpoint before its first
   use in the session. Re-fetch after an unexpected shape; do not guess endpoint
   names or claim unavailable coverage.
5. Let Arrays provide typed public facts, identity, timestamps, revisions, and
   coverage. Let Alva choose evidence, normalize comparison inputs, run
   user-specific deterministic tables, and synthesize the argument.
6. Bind every material claim to evidence, expose noncomparable fields, and
   state the thesis, counter-thesis, catalysts, risks, and invalidation.

## Minimum output

Return `evidence_manifest`, `comparability_matrix`, `comparison_tables`,
`thesis`, `counter_thesis`, `scenario_or_valuation_range`, `catalysts`,
`risks`, `invalidation`, and `unknowns`. Include assumptions, coverage, and
unresolved gaps.

## States

Set `domain_verdict` to `conditional_preference`, `indifferent`, or
`not_comparable`. Set `completion_state` independently. Use
`complete_with_gaps` for a usable comparison with disclosed gaps and
`insufficient_data` when missing evidence would make the conclusion misleading.

## Safety and authorization

Use public data by default. Request `account:read` only when the user explicitly
wants their holdings or constraints included, and keep account data inside
Alva. Do not create durable artifacts, notifications, allocations, or orders
without the separately routed scope. Present conditional evidence, not
certainty or guaranteed performance.

## Composition

Keep this goal primary for a thesis or closed-set comparison. Use
`earnings-evidence` for a focal period and `event-risk-and-impact` for a bounded
event dossier. Route open-universe ranking to `screen-and-rank`, historical
rule validation to `backtest-and-validate`, and target weights or resize amounts
to `portfolio-plan-and-allocate`. Supporting goals return evidence only; this
goal owns the final research conclusion.
