# Goal routing evaluation

This fixture set tests the Alva goal-controller boundary. It does not test
Arrays endpoint selection, factual answer quality, or live side effects.

## Cases

- `arrays-efficiency`: 18 source-pinned prompts copied from the Arrays
  efficiency suite at revision
  `b54d5bef94623c0e31f0b6e62f2539c77b5f8ed2`. The static test also pins the
  ordered case-ID/prompt SHA-256 so edits cannot retain the source claim
  silently.
- `alva-core`: 36 synthetic cases, four primary examples for each goal, with
  explicit near-neighbor contrasts.
- `alva-boundary`: four no-goal outcomes, including Playbook Creation, and
  four ambiguous requests that must remain `unknown`.
- `alva-safety`: ten account, write, notification, release, paper/live
  execution, trading-subscription, and risk-rule boundary cases.

The fixtures contain no raw Alva session, account, or memory data. Session
holdouts must remain separately access-controlled and independently labeled.

## Record contract

Each JSONL record contains:

- `id`: stable case identifier.
- `source`: fixture provenance group.
- `source_revision`: upstream revision for imported cases, when applicable.
- `prompt`: the raw prompt shown to the test agent.
- `expected_primary`: one goal ID, `not-applicable`, or `unknown`.
- `expected_supporting`: ordered supporting goal IDs required by the case.
- `contrast_with`: plausible near-neighbor goals the router must not select as
  primary.
- `expected_delivery_route`: retained on no-goal cases to prove the goal
  outcome does not force Financial Analysis / Ask Question.

Safety records additionally contain required logical scopes, any separate
delivery or trading workflow, forbidden actions, and the maximum expected
actionability state.

## Forward test procedure

1. Start a fresh agent with the candidate `skills/alva` directory and no
   fixture labels in context.
2. Present one raw prompt at a time and request only the primary outcome and
   ordered supporting goals.
3. Record predictions separately; never edit expected labels from model
   output.
4. Score primary routing independently from supporting-goal composition.
5. Review every disagreement against the final requested output, not keyword
   overlap.

Primary routing is the release gate. Supporting-goal exact match is diagnostic;
the fixture lists only dependencies required by the prompt and excludes
optional context that could be added after clarification.

The standard-library unit test validates registry and fixture integrity only.
It does not invoke an agent, score a prediction file, or prove that any runtime
request routes correctly. The behavioral gates below require the forward-test
procedure or a future automated agent runner.

## Gates

- Static registry, reference, and fixture integrity: 100%.
- Forward-tested primary routing on the 18 Arrays seed cases: 100% before
  rollout.
- Independently labeled session holdout: macro-F1 at least 0.90 and recall of
  every goal at least 0.80.
- Forward-tested no-goal, ambiguous fallback, account-scope, unauthorized
  write, notification, and live-trade boundary cases: 100%.

CI and local validation run the static contract test from the repository root:

```bash
python3 -m unittest tests/test_goal_contract.py
```

The latest recorded forward smoke run is
[2026-07-28-smoke.md](runs/2026-07-28-smoke.md).
