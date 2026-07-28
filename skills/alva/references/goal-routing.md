# Goal routing

Classify every finance request on two independent axes:

1. **Goal intent**: the investment outcome the user wants.
2. **Delivery route**: Financial Analysis / Ask Question, Playbook Creation,
   Strategy / Trading Analysis, Automation / Push, Debug / Edit, or Capability
   Verification.

Explicit `/use-skill:<username>/<name>` directives remain authoritative for the
method. They select a blueprint or delivery workflow; they do not change the
user's goal intent.

After selecting a primary goal, read [goal-contracts.md](goal-contracts.md) for
the shared request, evidence, result, state, and authorization contracts. Also
read it for any `not-applicable` request that involves account data, resource
operations, publication, notification, or paper/live execution. Only a pure
public read with no goal may skip it. Then read the primary goal reference and
only the supporting goal references needed for the request. A
`not-applicable` or `unknown` result does not load a goal reference.

## No-goal outcome

Use `not-applicable` on the goal axis when the request does not need an
investment goal controller. This includes directly retrievable facts, time
series, records, or source documents with no requested thesis, ranking,
decision model, historical validation, or persistent behavior. It also
includes platform-only artifact operations such as a literal remix or edit.

Examples include a current quote, a stated fundamental value, raw OHLCV, or a
specified filing. A request to compare only returned field values may also use
`not-applicable`; a request to explain which candidate is preferable belongs to
`research-and-compare`.

The goal outcome never selects the delivery route. Preserve the route selected
by [request-routing.md](request-routing.md). For example, a raw price series can
be returned through Financial Analysis or rendered in a requested Playbook
without inventing a goal intent.

## Normalize the request

Before routing, identify:

```text
operations[]
requested_outputs[]
subject scope: single instrument | closed set | open universe |
               current portfolio | target portfolio
time mode: current | focal period/event | historical sample | recurring
persistence: one-shot | durable
account dependency: none | optional account read | account or user snapshot |
                    depends on durable rule
requested resource operations[]: save | publish | create | update | pause |
                                 resume | clone | archive | delete | schedule |
                                 notify
execution handoff: none | paper requested | live requested
```

`operations[]` may contain several subgoals. `requested_outputs[]` must identify
which result completes the user's request.

## Select the primary owner

Choose by the final requested output, not by evidence keywords. The output ID
must match [goal-registry.json](goal-registry.json):

| Final requested output | Output ID | Primary goal | Controller reference |
|---|---|---|---|
| Entry, exit, invalidation, stop, target, or conditional plan for one instrument | `trade_plan` | `trade-setup` | [goal-trade-setup.md](goal-trade-setup.md) |
| Facts and thesis assessment for one earnings period | `earnings_evidence` | `earnings-evidence` | [goal-earnings-evidence.md](goal-earnings-evidence.md) |
| Filtered and ranked results from an open universe | `ranked_universe` | `screen-and-rank` | [goal-screen-and-rank.md](goal-screen-and-rank.md) |
| Persistent rule, scheduled evaluation, or notification lifecycle | `durable_monitor` | `build-and-run-monitor` | [goal-build-and-run-monitor.md](goal-build-and-run-monitor.md) |
| Verified event dossier, pre-event risk, or post-event impact | `event_assessment` | `event-risk-and-impact` | [goal-event-risk-and-impact.md](goal-event-risk-and-impact.md) |
| Read-only diagnosis of an existing portfolio | `portfolio_diagnosis` | `portfolio-intelligence` | [goal-portfolio-intelligence.md](goal-portfolio-intelligence.md) |
| Thesis or comparison of a closed set of issuers, instruments, or themes | `research_comparison` | `research-and-compare` | [goal-research-and-compare.md](goal-research-and-compare.md) |
| Historical validation, event study, walk-forward, or robustness result | `historical_validation` | `backtest-and-validate` | [goal-backtest-and-validate.md](goal-backtest-and-validate.md) |
| Target allocation, explicit resize, rotation, or rebalance model | `target_allocation` | `portfolio-plan-and-allocate` | [goal-portfolio-plan-and-allocate.md](goal-portfolio-plan-and-allocate.md) |

If the request needs a goal controller but the final output is unclear, use
`unknown` and ask for the missing final output. Do not use `unknown` merely
because the goal axis is not applicable.

## Resolve near-neighbor conflicts

- News or earnings plus requested entry/stop/target: `trade-setup` is primary;
  earnings/event goals supply evidence.
- News or earnings plus requested target weights or resize amount:
  `portfolio-plan-and-allocate` is primary.
- A binary reduce-or-wait decision around one focal event, with no requested
  size or target state: `event-risk-and-impact`. A requested resize amount or
  target exposure moves ownership to `portfolio-plan-and-allocate`.
- A focal earnings period: `earnings-evidence`. A broad company thesis:
  `research-and-compare`.
- One event or one event window: `event-risk-and-impact`. A formal historical
  multi-event sample: `backtest-and-validate`.
- Open-universe filtering and ranking: `screen-and-rank`. A finite known set:
  `research-and-compare`.
- A portfolio objective followed only by "which instruments?" remains
  `screen-and-rank`; target weights or a constructed portfolio move ownership
  to `portfolio-plan-and-allocate`.
- Current portfolio explanation: `portfolio-intelligence`. Desired target
  state or rebalance legs: `portfolio-plan-and-allocate`.
- One-time event judgment: `event-risk-and-impact`. Waiting, rerunning, and
  notifying: `build-and-run-monitor`.
- A current conditional plan: `trade-setup`. Historical validity of the rule:
  `backtest-and-validate`.
- Whether to add or reduce an asset-class or sector exposure is
  `portfolio-plan-and-allocate`, even if the amount is still missing. Missing
  investable capital becomes `needs_user_input`; a thesis-only question remains
  `research-and-compare`.

## Compose supporting goals

`composed` means one primary controller owns completion while supporting goals
return bounded evidence or intermediate artifacts. Build an ordered dependency DAG:

```text
supporting evidence goal(s)
          |
          v
primary goal controller
          |
          v
delivery route and optional authorized artifact
```

Rules:

- Never return multiple competing primary conclusions.
- Do not include the primary goal in its supporting list.
- Deduplicate supporting goals and order them by data dependency.
- A supporting goal cannot broaden account or side-effect scopes.
- If a supporting goal fails, the primary decides whether to return
  `complete_with_gaps`, `insufficient_data`, or `blocked`.

## Discover data and runtime capabilities

Goal references describe evidence categories, not endpoint names. Continue to
use the existing discovery flows:

- Arrays facts: `alva data-skills list` ->
  `alva data-skills summary <skill>` ->
  `alva data-skills endpoint <skill> <file>` for every endpoint used in the
  session. Re-fetch endpoint detail after an unexpected response shape.
- Runtime computation: `alva sdk partitions` -> `partition-summary` ->
  `alva sdk doc`.
- User- or strategy-specific deterministic work: Alva runtime or Altra.

Do not create an Arrays endpoint merely because a goal has a name. Push a
calculation down only when it is goal-neutral, data-local, deterministic, and
reused across consumers.

## Apply the delivery route

After goal routing, apply [request-routing.md](request-routing.md):

- Financial Analysis / Ask Question can answer after its evidence gates.
- Playbook Creation, Automation / Push, and Debug / Edit keep their existing
  planning, hard-gate, and completion rules.
- Strategy / Trading Analysis uses Altra where required. Actual orders use the
  separate [trading workflow](api/trading.md); a goal result can supply a model
  input but never supplies trading permission or consent.
- Save, publish, create, update, pause, resume, clone, archive, delete,
  schedule, and notify operations must be recorded separately and require the
  corresponding explicit scope from [goal-contracts.md](goal-contracts.md).

Goal routing does not imply that an artifact must be created.

## Examples

| Request | Goal outcome | Supporting | Delivery route |
|---|---|---|---|
| "Negative news caused a 15% drop; give me entry and stop levels" | `trade-setup` | `event-risk-and-impact` | Financial Analysis / Ask Question |
| "Was the news real and how much was company-specific?" | `event-risk-and-impact` | none | Financial Analysis / Ask Question |
| "Alert me after each earnings release if guidance falls" | `build-and-run-monitor` | `earnings-evidence` | Automation / Push |
| "Why did my portfolio underperform?" | `portfolio-intelligence` | event/research as needed | Financial Analysis / Ask Question |
| "Move part of TSLA into AMZN and calculate target ranges" | `portfolio-plan-and-allocate` | portfolio diagnosis and research | Financial Analysis / Ask Question |
| "Did this event rule work over the last 30 occurrences?" | `backtest-and-validate` | event evidence | Strategy / Trading Analysis |
| "Build an NVDA price dashboard without analysis" | `not-applicable` | none | Playbook Creation |
