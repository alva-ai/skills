# trade-setup

Build a time-bounded, conditional plan for one instrument without placing or
authorizing a trade.

## Trigger

Use this goal when the final output is an entry, invalidation, stop, target,
exit, chase-or-wait, or risk plan for one instrument over a current or near-term
horizon. The plan must expire and remain conditional on declared market facts.

## Does not own

- Do not use it for a broad issuer thesis or a closed-set comparison; use
  `research-and-compare`.
- Do not use it for portfolio target weights, cross-asset rotation, or resize
  legs; use `portfolio-plan-and-allocate`.
- Do not use it for a persistent rule or notification; use
  `build-and-run-monitor`.
- Do not use it to validate a rule historically; use `backtest-and-validate`.
- Do not place an order or treat a completed plan as execution authorization.

## Required inputs

Collect the canonical instrument, venue, instrument or contract type,
direction, as-of boundary, horizon, interval, timezone, market session, and
quote freshness requirement. Record whether the user holds the instrument or
is considering a new position, the maximum loss or risk budget, base currency,
price type, and adjustment policy. Request an account reference and
`account:read` only when current position facts are needed.

Use `needs_user_input` when ambiguity about the instrument, direction, horizon,
market session, or risk constraint would materially change the plan. Do not
invent risk tolerance, leverage, or a default stop.

## Workflow

1. Normalize the request with [goal-contracts.md](goal-contracts.md). Keep the
   trade plan separate from its delivery route and any account context.
2. Follow [Data Skills discovery](data-skills.md#discovery-pipeline) with
   `alva data-skills list`, then `alva data-skills summary <skill>`, then
   `alva data-skills endpoint <skill> <File>`. Fetch each endpoint's detail
   before its first use in the session; re-fetch after an unexpected shape.
   Do not infer paths, parameters, or response fields from this reference.
3. Use Arrays for typed price, volume, volatility, liquidity, derivatives, and
   event evidence with source clocks and coverage. Keep scenario design,
   user-specific risk, and plan ownership in Alva.
4. Resolve the instrument and market clock. Reject a mismatched venue or
   contract, and distinguish completed bars from an in-progress bar. Verify
   quote and bar freshness before calculating any level.
5. Collect the evidence needed for the declared horizon, including relevant
   multi-interval structure and known event risk. Preserve units, currency,
   session, adjustment policy, and missing reasons.
6. Use deterministic code to calculate entry conditions, invalidation, stop,
   targets, maximum loss, position-independent risk, and risk/reward. Bind the
   formula and inputs to EvidencePacket refs; do not let the LLM calculate or
   silently round material values.
7. Return a scenario-based plan only when the evidence supports one. Otherwise
   return a conditional plan with explicit gaps or the `no_setup` verdict.

## Minimum output

Return `resolved_instrument`, `as_of`, `scenario`, `entry`, `invalidation`,
`stop`, `targets`, `risk`, `risk_reward`, `expiry`, `evidence_refs`, `coverage`,
and `gaps`. Include units, currency, market session, formulas, assumptions, and
the quote or bar freshness used. Every condition must be testable, and every
level must identify the evidence snapshot from which it was derived.

## States

Set `completion_state` independently from `domain_verdict`. Use `ready` only
when the complete conditional plan is supported by fresh evidence, `conditional`
when declared conditions or gaps remain, and `no_setup` when the evaluated
scenario has no acceptable setup. `no_setup` can be a successful completion.
Use `insufficient_data` when required evidence cannot support precise levels.
Keep `account_context` and `actionability_state` separate; the result is at
most a research model or review artifact, not an executable instruction.

## Safety and authorization

Never derive precise levels from a screenshot, stale quote, incomplete bar, or
unresolved instrument. Do not present a target as guaranteed, conceal leverage,
or convert a user's general risk preference into an invented loss amount. Keep
private positions in Alva, pass only minimum public-data queries to Arrays, and
do not copy account state into public artifacts. This goal has no write,
notification, or execution scope. Live execution remains unauthorized.

## Composition

Keep this goal primary when a conditional single-instrument plan completes the
request. Use `earnings-evidence`, `event-risk-and-impact`, or
`research-and-compare` only as bounded supporting evidence. Make
`portfolio-plan-and-allocate` primary when the final output changes portfolio
weights, `build-and-run-monitor` primary when the plan must persist or notify,
and `backtest-and-validate` primary when historical validity is requested.
Supporting goals cannot broaden account or side-effect scopes.
