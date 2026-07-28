# Goal contracts

Use these contracts after selecting a primary goal with
[goal-routing.md](goal-routing.md). Keep intent, evidence, state, authorization,
and delivery separate so a successful analysis cannot silently become a side
effect.

## GoalRequest

Normalize only the fields relevant to the request. Preserve unknown values as
unknown; do not invent defaults that materially change the result.

```text
goal_id and goal_contract_version
operations[] and requested_outputs[]
primary_subject and comparison subjects
known_at or as_of boundary
horizon, interval, timezone, and trading session
base currency, price type, and adjustment policy
universe, benchmark, and comparison set
hard constraints and configurable assumptions
freshness requirement
account reference and approved read scope, or an explicit current-turn
portfolio snapshot, when applicable
delivery route, requested resource operations, and execution handoff
```

Account and memory data stay referenced and minimized. Do not copy full account
state into prompts, public feeds, or Arrays requests.

## EvidencePacket

Every material fact must be independently traceable. Use the relevant subset of
these fields:

```text
canonical issuer and instrument IDs
instrument type, venue, quote/base currency
effective, available, observed, ingested, retrieved, and generated times
timezone, market session, fiscal period, event time, and publication time
provider, source type, source URL, endpoint, schema version, and request ID
revision or vintage, adjustment policy, immutable snapshot or content hash
typed value, unit, currency, price type, and missing reason
formula, formula version/hash, input refs, result, rounding, and tie-break
requested/returned coverage, exclusions, and issues
```

At minimum, distinguish `missing`, `zero`, `stale`, `unsupported`, `partial`,
`noncomparable`, `upstream_failed`, and `permission_denied`. A URL or request ID
alone is not a reproducible snapshot.

## GoalResult

```text
goal ID and contract version
completion_state and completion_reason
domain_verdict, when defined, and goal-specific minimum outputs
evidence packet refs
assumptions and user-confirmed constraints
coverage and unresolved gaps
risk and invalidation conditions
actionability_state and allowed next actions
created artifact refs, if authorized
authorization scopes actually used
```

## State axes

Never overload one `status` field:

| Axis | Meaning | Values or source |
|---|---|---|
| `completion_state` | Did the controller complete? | `complete`, `complete_with_gaps`, `needs_user_input`, `insufficient_data`, `blocked`, `failed` |
| `domain_verdict` | What is the goal-specific conclusion? | Defined by the selected goal when applicable |
| `artifact_state` | What is the persistent artifact lifecycle? | `draft`, `active`, `paused`, `expired`, `archived` |
| `runtime_run_state` | What happened in one scheduled execution? | Use the Alva cronjob run contract |
| `condition_result` | Did a compiled condition match? | `true`, `false`, `indeterminate` |
| `delivery_decision` | Should this run notify? | `push`, `no_push` |
| `actionability_state` | What may happen next? | `informational`, `model_only`, `ready_for_review`, `dry_run_ready` |

`no_push` is a successful monitor run when the condition did not warrant a
notification. `healthy`, `fragile`, and `no_setup` are verdicts, not execution
states.

## Authorization

Authorization is a set of independent scopes, not a linear ladder:

```text
account_context: none | required | loaded | user_snapshot | invalid
decision_stage: research | model | decision_card | dry_run
authorization_scopes: account:read, filesystem:write, feed:write,
                      cronjob:write, notification:write, release:write,
                      trading:execute, trading:subscription:write,
                      trading:risk-rules:write
requested_resource_operations[]: save | publish | create | update | pause |
                                 resume | clone | archive | delete | schedule |
                                 notify | subscribe | unsubscribe |
                                 update_risk_rules
execution_handoff: none | paper_requested | live_requested
```

Request only the scopes required by the selected goal and delivery route. A
read scope never grants a write scope. A Feed write never grants notification
delivery. Bind authorization to the exact resource and requested operation;
authorization to create or update does not authorize publish or delete.

These are logical policy scopes, not claims that fine-grained backend scope
tokens already exist. Phase 0 satisfies them with concrete workflow evidence:

| Logical scope | Required evidence before the operation |
|---|---|
| `account:read` | Authenticated user, explicitly selected account, backend ownership check, and only the requested fields |
| `filesystem:write` | `alva whoami`, exact user-owned path and operation, and confirmed delivery plan |
| `feed:write` | Exact user-owned Feed or proposed Feed spec, operation, and confirmed delivery plan |
| `cronjob:write` | Exact user-owned cronjob, cadence/config diff, operation, and confirmed delivery plan |
| `notification:write` | Bound channel, exact recipient, rule, delivery policy, operation, and an explicit request or approved delivery plan |
| `release:write` | Exact user, artifact, version, visibility, a request or approved plan that includes publication, and the completed pre-release gate |
| `trading:execute` | Separate trading workflow; ordinary interactive execution needs dry-run and exact confirmation, while the narrow channel-loop consent exception must be independently verified; never a GoalResult |
| `trading:subscription:write` | Exact account, source owner, Feed, playbook/version, `execute-latest` value, and the current trading workflow's authorization evidence |
| `trading:risk-rules:write` | Current rule snapshot, exact diff, affected account scope, and the current trading workflow's authorization evidence |

The backend or CLI continues to enforce authentication and resource ownership;
the agent enforces operation binding and route-specific gates where no finer
backend primitive exists. If either layer cannot produce its required evidence,
block the operation rather than treating the logical scope as granted.

Trading actions are outside this goal contract. A GoalResult may be an input to
the separate [trading workflow](api/trading.md), but it never supplies trading
authorization or consent. Apply the current interactive and channel-loop rules
from that workflow unchanged; goal selection cannot create or widen an
exception. Trading scopes are never goal-owned and never appear in the goal
registry. Bind each account, subscription flag, or rule diff independently.

## Deterministic computation

Run material math in code:

- Use Arrays for stable, data-local calculations shared by multiple consumers.
- Use Alva runtime or Altra for user-, strategy-, portfolio-, or artifact-specific calculations.
- Use the LLM to clarify intent, define and explain formulas, and synthesize sourced evidence.
- Never let the LLM silently calculate rankings, return alignment, FX,
  covariance, threshold crossings, attribution, or backtest results.

## Delivery independence

Goal intent describes why the user is asking. Delivery route describes how the
result is returned. A `research-and-compare` result may be a direct answer or a
saved Playbook. A `screen-and-rank` result may be a one-shot table or a Feed.
Apply existing Guided Planning and Completion Gate rules based on delivery
route, not goal name.

Goal controllers add an outcome contract; they never replace the matching
[Complex Ask Router](request-routing.md#complex-ask-router), provenance, or
content-legitimacy gates. A named-ticker request still follows
[ticker-read.md](ticker-read.md), and a durable workflow still loads its current
automation, Feed, release, and notification references.

A request such as "publish directly" or "just do it" follows the existing
Guided Planning policy: it may skip further clarifying questions, but the agent
still presents the short plan and completes every route-specific hard gate.
Goal routing does not add a second release confirmation, nor can it waive the
delivery workflow's current publication rules.

Registry `side_effect_scopes` describe operations owned by the goal controller
itself. Writes owned by Playbook Creation, Automation / Push, Debug / Edit,
release, or trading stay in their existing delivery workflows and require their
own authorization evidence.

## Unknown

Use `unknown` when the final requested output is not clear enough to select one
owner. Ask one question about the missing completion contract. Do not force a
goal merely to improve routing coverage.
