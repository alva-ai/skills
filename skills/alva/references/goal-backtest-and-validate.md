# backtest-and-validate

Validate a historical rule with point-in-time data, realistic costs,
robustness tests, and explicit bias controls. Apply the shared contracts in
[goal-contracts.md](goal-contracts.md).

## Trigger

Use this goal for strategy or signal backtests, multi-event studies, factor
validation, walk-forward tests, parameter sensitivity, or regime analysis.
Make it primary when historical validity or robustness is the final output.

## Does not own

- Do not own a current trade setup with no historical-validation request.
- Do not own a single historical price lookup or a one-event impact assessment.
- Do not reverse-engineer rules to prove a preferred conclusion.
- Do not own continuous paper-trading deployment or live orders. Route either
  request through the separate delivery and trading workflow after validation.

## Required inputs

Require an unambiguous rule, signal timing, universe, interval, test period,
benchmark, position sizing, rebalance policy, cost and slippage assumptions,
and a train/holdout or walk-forward policy. Clarify execution timing and all
material parameters before inspecting performance.

## Workflow

1. Compile and version the strategy specification before running the test.
   Record formulas, parameters, decision times, execution times, and expected
   outputs.
2. Follow [Data Skills discovery](data-skills.md#discovery-pipeline) with
   `alva data-skills list`, then `alva data-skills summary <skill>`, then
   `alva data-skills endpoint <skill> <File>` for each endpoint before its first
   use in the session. Re-fetch after an unexpected shape; do not guess
   endpoints or silently substitute a different dataset.
3. Build a point-in-time data manifest. Preserve availability timestamps,
   revisions or vintages, historical universe membership, delisted subjects,
   corporate actions, adjustment policy, and missing-data treatment.
4. Read [altra-trading.md](altra-trading.md) and run the strategy in Altra. Let
   Arrays supply typed historical inputs and coverage; let Alva and Altra own
   strategy-specific signals, positions, simulated trades, portfolio state,
   and interpretation. Do not hand-roll a loop that bypasses Altra's alignment
   and execution model.
5. Model commissions, spread, slippage, liquidity, and applicable borrow,
   funding, or market-impact assumptions. Report gross and net results.
6. Run benchmark, regime, parameter-sensitivity, and holdout or walk-forward
   tests. Audit look-ahead, survivorship, revision, selection, and
   multiple-testing bias.
7. Preserve the strategy version, data refs, run configuration, and outputs so
   the result can be reproduced.

## Minimum output

Return `strategy_spec`, `data_manifest`, `signals`, `trades`, `equity_curve`,
`risk_metrics`, `regime_results`, `sensitivity`, `cost_assumptions`, and
`bias_audit`. State coverage, failed checks, and unresolved data issues.

## States

Set `domain_verdict` to `supported`, `fragile`, or `rejected`. Set
`completion_state=insufficient_data` when point-in-time validity or coverage is
not adequate. Keep the verdict separate from execution or artifact state.

## Safety and authorization

Treat historical performance as evidence, never as a forecast or guarantee.
This goal needs no portfolio-account scope, but may use public data, authorized
private feeds, or BYOD when provenance and point-in-time controls are preserved.
Never convert simulated trades into real orders or call execution endpoints
from this controller. A durable paper
strategy requires a separate delivery route and the existing trading workflow;
the backtest result is not authorization. Disclose assumptions that can
materially inflate results.

## Composition

Use `screen-and-rank` to define a historical selection rule,
`earnings-evidence` to define earnings samples, and
`event-risk-and-impact` to define event identity or windows. Keep
`backtest-and-validate` primary for formal multi-period or multi-event
validation. Route a current entry plan to `trade-setup` and an allocation model
without historical validation to `portfolio-plan-and-allocate`.
