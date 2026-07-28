# portfolio-plan-and-allocate

Construct a target portfolio or rebalance model using only capital and
constraints the user explicitly declares. Apply the shared contracts in
[goal-contracts.md](goal-contracts.md).

## Trigger

Use this goal for a first portfolio, allocation of new cash, asset or sector
allocation, an income portfolio, concentration reduction, rotation between
holdings, target ranges, or a rebalance plan. A request to add or reduce an
asset-class or sector exposure belongs here even when the amount is still an
input to clarify. If the final output is only open-universe candidates, use
`screen-and-rank` instead.

## Does not own

- Do not own read-only diagnosis when no target state is requested.
- Do not own single-instrument entry timing or broad personal financial
  planning.
- Do not assess debt, emergency reserves, income stability, or undisclosed
  assets as part of the MVP.
- Do not place, stage, or transmit real orders.

## Required inputs

Require user-declared `investable_capital`, objective, horizon, base currency,
liquidity needs, loss or drawdown budget, allowed assets, benchmark, and hard
allocation constraints. When an account is explicitly authorized, also collect
read-only holdings, cash, eligibility, and tax-lot references. Never infer
investable capital from account value, memory, income, or net worth.

## Workflow

1. Confirm the declared investable capital and constraints. Treat capital as a
   hard planning boundary; if it is missing, return `needs_user_input`.
2. Use `portfolio-intelligence` for an authorized current-state diagnosis when
   current-to-target deltas are required. Keep account facts in Alva and pass
   only the minimum public instrument identifiers to data discovery.
3. Follow [Data Skills discovery](data-skills.md#discovery-pipeline) with
   `alva data-skills list`, then `alva data-skills summary <skill>`, then
   `alva data-skills endpoint <skill> <File>` for each endpoint before its first
   use in the session. Re-fetch after an unexpected shape; do not guess
   endpoints, holdings coverage, prices, FX, or fund look-through.
4. Let Arrays provide typed market facts, identity, timestamps, revisions, and
   coverage. Read [altra-trading.md](altra-trading.md); use Altra for portfolio
   simulation, target, and rebalance logic, while Alva orchestrates candidate
   research and user-specific constraints deterministically.
5. Apply eligibility, liquidity, concentration, tax, turnover, rounding, and
   cash-residual constraints. Reconcile target amounts to no more than the
   declared capital.
6. Present target ranges, current-to-target deltas when available, alternatives,
   staged actions, warnings, and explicit review gates. Keep every action a
   model proposal.

## Minimum output

Return `goal_feasibility`, `target_ranges`, `current_target_deltas`,
`cash_residual`, `warnings`, `staged_plan`, `alternatives`, and `review_gates`.
Show that modeled allocations plus cash do not exceed declared
`investable_capital`.

## States

Set `domain_verdict` to `feasible`, `constraint_conflict`, or `no_action`. Set
`actionability_state` to `model_only` or `ready_for_review`; never mark an
allocation as executed. Set `completion_state` independently and disclose
coverage or constraint gaps.

## Safety and authorization

Request `account:read` only when current holdings are necessary. Account read
does not grant any write or trading scope. Do not copy account state into
public feeds or Arrays requests. Do not construct or submit a live order
payload, call trading endpoints, or imply execution. Keep suitability and
personal-finance assumptions outside scope unless a separately approved policy
provides them.

## Composition

Use `portfolio-intelligence` for current-state facts, `screen-and-rank` for an
open candidate universe, and `research-and-compare` for finite finalists. Use
earnings or event goals only for bounded supporting evidence, and
`backtest-and-validate` when historical robustness is requested. Keep this goal
primary whenever the final output is target weights, resize amounts, rotation,
or a rebalance model; supporting goals cannot broaden authorization.
