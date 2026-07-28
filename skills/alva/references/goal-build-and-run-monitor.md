# build-and-run-monitor

Compile a recurring observation into a versioned rule, operate its Alva
resources, and notify only when the rule and delivery policy both allow it.

## Trigger

Use this goal when the requested final output is a durable monitor: track a
condition repeatedly, run it on a schedule, notify on a match, or inspect,
update, pause, resume, clone, expire, archive, or delete an existing monitor.

## Does not own

- Do not use it for a one-time event assessment or research answer.
- Do not use it for historical strategy validation; use
  `backtest-and-validate`.
- Do not make it responsible for Arrays ingestion or market-data quality.
- Do not place orders or treat a notification as trading authorization.
- Do not create a separate `condition-monitor` goal. Condition evaluation is
  part of this controller.

## Required inputs

Collect the subject or universe, condition, cadence, timezone, market session,
freshness bound, and expiry. Define level versus crossing semantics,
hysteresis, cooldown, deduplication key, notification channel, and alert
budget. Collect an account reference and `account:read` only when the rule
depends on private portfolio state. Record each requested side effect and its
exact resource operation (`create`, `update`, `pause`, `resume`, `clone`,
`archive`, or `delete`) plus its matching `feed:write`, `cronjob:write`, or
`notification:write` scope. Creating or changing runtime source also requires
`filesystem:write`. Bind every operation to specific resource refs.

Use `needs_user_input` when a missing value would materially change rule
evaluation or delivery. Do not invent a threshold, schedule, recipient, or
account.

## Workflow

1. Normalize the request with [goal-contracts.md](goal-contracts.md). Keep the
   recurring goal separate from its delivery route. Read
   [alva-knowledge.md](alva-knowledge.md), [feed-lifecycle.md](feed-lifecycle.md),
   and [push-notifications.md](push-notifications.md) before designing or
   activating the durable workflow.
2. Follow [Data Skills discovery](data-skills.md#discovery-pipeline) with
   `alva data-skills list`, then `alva data-skills summary <skill>`, then
   `alva data-skills endpoint <skill> <File>`. Fetch each endpoint's detail
   before its first use in the session; re-fetch after an unexpected shape.
   Never infer an endpoint from this goal document.
3. Use Arrays for typed public observations, source clocks, freshness, and
   coverage. Keep rule compilation, user state, scheduling, deduplication, and
   delivery in Alva.
4. Compile the natural-language request into a deterministic rule spec. Pin
   its version, operands, units, session, missing-data behavior, crossing
   policy, cooldown, and expiry. Evaluate numeric conditions in code, not by
   LLM inspection.
5. Dry-run the rule against representative fresh, stale, missing, zero, and
   boundary observations. Return the compiled result before activation when
   required inputs or scopes are incomplete.
6. Authorize Feed creation, cronjob scheduling, and notification subscription
   independently. Create or update resources with idempotency keys; compensate
   partial failures and retain an auditable revision.
7. On each run, collect an EvidencePacket, evaluate the pinned rule, persist
   the run result, apply cooldown and deduplication, and deliver only when
   `condition_result=true`, `delivery_decision=push`, and the delivery scope is
   present.

## Minimum output

Return `compiled_rule`, `rule_version`, `current_config`, `resource_refs`,
`evidence_packets`, `condition_result`, `run_history`, `delivery_receipt`, and
`revision_history`. Also return assumptions, coverage, unresolved gaps, scopes
actually used, and allowed lifecycle actions. Never claim activation when only
a draft or dry run exists.

## States

Keep every state axis independent:

- Set `completion_state` from the shared contract.
- Do not duplicate the condition into `domain_verdict`; this controller's
  business outcome is represented by `condition_result`.
- Set `artifact_state` to `draft`, `active`, `paused`, `expired`, or
  `archived`.
- Reuse the Alva cronjob contract for `runtime_run_state`.
- Set `condition_result` to `true`, `false`, or `indeterminate`.
- Set `delivery_decision` to `push` or `no_push` independently of the run.
- Set `actionability_state` without implying trade execution.

Treat `condition_result=false` with `delivery_decision=no_push` as a successful
run. Do not encode artifact, execution, condition, and delivery state in one
status.

## Safety and authorization

Fail closed on stale evidence, ambiguous account context, missing scopes, or a
partially created resource graph. A read scope never grants a write scope;
Feed write never grants scheduling or notification. Keep account data in Alva,
pass only the minimum public-data query to Arrays, and never copy private
portfolio state into a public Feed. Authorization to create or update never
authorizes archive or delete. Do not broaden recipients, cadence, or resource
targets during an update. Live execution is outside this goal and remains
unauthorized.

## Composition

Keep this goal primary whenever persistence, repeated evaluation, or delivery
completes the request. Use `earnings-evidence`, `event-risk-and-impact`,
`research-and-compare`, or `screen-and-rank` only as bounded supporting goals
that define subjects or evidence. Supporting goals cannot activate resources
or broaden scopes. If supporting evidence fails, choose
`complete_with_gaps`, `insufficient_data`, or `blocked`; do not silently weaken
the rule.
