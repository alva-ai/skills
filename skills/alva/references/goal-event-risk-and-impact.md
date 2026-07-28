# event-risk-and-impact

Verify one discrete event and assess either its pre-event risk or its observed
post-event market impact.

## Trigger

Use this goal when the final output is an event dossier, a pre-event scenario
assessment, or a post-event reaction analysis. Events may include company or
industry news, earnings-adjacent disclosures, CPI or FOMC releases, policy
changes, token unlocks, insider or congressional transactions, social signals,
or prediction-market developments.

## Does not own

- Do not use it for a broad company or theme thesis without a focal event.
- Do not use it for entry, stop, or target levels; use `trade-setup`.
- Do not use it for persistent waiting or notification; use
  `build-and-run-monitor`.
- Do not use it for a multi-event historical study; use
  `backtest-and-validate`.
- Do not construct target portfolio weights or perform side effects.

## Required inputs

Collect the claimed event, source, affected issuer or instrument, and analysis
mode: `pre_event_risk` or `post_event_impact`. Record the known-at boundary,
event and publication times, event window, benchmark or peers, materiality
threshold, source hierarchy, and known related events. Request an account
reference and `account:read` only when the user explicitly asks about impact on
their current portfolio.

## Workflow

1. Resolve the event, entity, instrument, venue, and clocks. Distinguish when
   the event occurred, was published, became available, and became tradable.
2. Follow [Data Skills discovery](data-skills.md#discovery-pipeline) with
   `alva data-skills list`, then `alva data-skills summary <skill>`, then
   `alva data-skills endpoint <skill> <File>`. Read the selected
   endpoint reference before calling it; do not guess paths or parameters.
3. Use Arrays for typed public event and market evidence, source metadata,
   prices, peers, and benchmarks. Keep relevance, user context, scenario
   construction, and conclusion ownership in Alva.
4. Verify the primary source, bind the event to the correct entity, cluster
   duplicates, and determine whether it contains new information. Separate a
   reported claim from a confirmed fact. Treat a prediction-market price as an
   expectation, not proof.
5. For `pre_event_risk`, calculate exposure and bounded scenarios against the
   selected benchmark and expected volatility. For `post_event_impact`, use
   deterministic code to calculate raw, benchmark-adjusted, and peer-adjusted
   reactions over the declared window.
6. Check concurrent events, market regime, liquidity, and data coverage before
   assigning materiality or causal confidence. Bind each material claim to an
   EvidencePacket and preserve unresolved alternatives.

## Minimum output

Return `event_dossier`, `source_manifest`, `affected_assets`,
`scenario_or_reaction`, `materiality`, `causal_confidence`, and
`evidence_gaps`. Include event identity and clocks, analysis mode, benchmark,
window, deterministic calculations, assumptions, and account exposure only
when authorized.

## States

Set `completion_state` independently from `domain_verdict`. Use `follow`,
`watch`, or `reject` only for the event verdict, and attach materiality and
causal confidence. Keep `account_context` and `actionability_state` separate.
Do not emit monitor `condition_result` or `delivery_decision` values, and do not
use a verdict to imply successful data collection or authorization.

## Safety and authorization

Do not state causation when evidence supports only temporal association. Do not
fabricate missing event times, benchmark data, or affected assets. Keep private
holdings in Alva and disclose only the minimum account-derived result needed by
the user. This goal has no write or notification scope and never authorizes an
order, monitor, Feed, cronjob, or delivery side effect. Live execution remains
outside the goal contract.

## Composition

Keep this goal primary only when event verification, risk, or impact completes
the request. A binary reduce-or-wait question around the focal event remains
here when no target state or resize amount is requested. Supply bounded
evidence to `trade-setup` when the user requests a
conditional trade plan, to `portfolio-plan-and-allocate` when the user requests
target changes, and to `build-and-run-monitor` when the user requests ongoing
observation. Use `earnings-evidence` for focal-period earnings reconciliation
and `backtest-and-validate` for repeated historical events. Supporting goals
cannot broaden account or side-effect scopes.
