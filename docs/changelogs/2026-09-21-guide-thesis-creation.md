# docs: guide Thesis creation from rough intent

## 1. Background and Current State

The Thesis route already protects publication with an exact-payload
confirmation and hydrates its completion card only from `thesis get`. Unlike
Playbook creation, it does not currently explain how to help a user who asks to
create a Thesis but supplies only a topic or rough viewpoint.

## 2. Problem Model and End-to-End Behavior

- B1 — A finished Thesis body skips drafting and goes directly to the existing
  exact-payload confirmation.
- B2 — A rough publication request gets at most one blocking question, one
  short plan, and one evidence-bounded candidate before confirmation.
- B3 — Research-dependent drafting completes the Financial Analysis evidence
  route first and separates verified facts from assumptions and inference.
- F1 — Guidance must not invent evidence, turn discussion into publication
  consent, auto-publish a candidate, or use `thesis rewrite` as a first-draft
  prerequisite.

## 3. Research, Findings, and Architecture Decision

- Playbook guidance uses route selection, at most one blocking question, and a
  single short plan before execution. Thesis already owns the final publication
  and readback contract, so the missing seam is the stage before confirmation.
- D1 — Add Thesis as a first-class request-routing route and add a focused
  guided-creation section to `references/thesis.md`. Preserve the existing
  create command, confirmation, retry, and GET preview contracts.

## 4. Implementation Design

- `skills/alva/references/request-routing.md`: distinguish Thesis publication
  intent from ordinary analysis and extend Guided Planning with Thesis fields.
- `skills/alva/references/thesis.md`: guide rough intent to a candidate, then
  hand off to the unchanged exact-payload confirmation.
- `skills/alva/SKILL.md`: make the new behavior discoverable from the top-level
  route.
- `evals/alva-skill-docs/{cases,scenarios}.json`: protect the guided route and
  its publication/evidence boundaries.

Core documentation impact: the Alva Skill and its Thesis/request-routing
references are the authoritative agent workflow and are updated in scope.

### Serial Implementation Checklist

- [x] Add first-class Thesis routing and guided-planning fields.
- [x] Add the guided candidate workflow without weakening confirmation.
- [x] Add deterministic documentation and prompt-scenario coverage.
- [x] Run the complete Skills documentation verification gate.

## 5. Verification and E2E Design

- Affected components: Alva Skill documentation and deterministic doc evals.
- Relevant dependents: none; no executable CLI/API contract changes.
- Focused commands: skill-doc eval, mutation smoke, durable-agent tests, JSON
  parsing, and `git diff --check`.
- Escalation trigger: any existing scenario or mutation regression.
- Full suite required: no; the repository's complete Alva doc-eval workflow is
  the affected suite.
- E2E required: no; this change only guides agent interaction.
- PR timing: after-verification because the final gate is fast and docs-only.
- Final gate: all commands above pass on the exact tree and diff self-review
  finds no weakened publication, retry, or GET preview boundary.

## 6. Human Decisions and Interaction

The user requested that Thesis creation adopt the guided interaction style used
by Playbook creation. The implementation keeps the existing confirmation gate
and improves only the path from rough intent to the final candidate.

## 7. Outcome and Evidence

- Outcome: an explicit Thesis publication request can now start from a topic or
  rough viewpoint. The agent asks at most one material question, presents one
  short plan, uses the Financial Analysis evidence route when facts are needed,
  and produces a candidate before the existing exact-payload confirmation.
- Changes: Thesis is now a first-class request-routing route; the focused Thesis
  reference owns guided creation; top-level routing exposes the behavior; one
  deterministic prompt scenario and expanded corpus checks protect the flow.
- Checklist: `DONE` — routing; `DONE` — guided candidate workflow; `DONE` —
  regression coverage; `DONE` — complete local verification.
- Deviations: none. The create command, confirmation, retry, visibility,
  lifecycle, and GET preview contracts were not changed.
- Tests and verification:
  - `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva
    --out /tmp/improve-thesis-guidance-final-report.md` — 93/93 cases and
    1008/1008 checks passed.
  - `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva` —
    21/21 mutations failed as expected.
  - `node --test evals/alva-skill-docs/durable-agent.test.mjs` — 5/5 passed.
  - JSON parsing for `cases.json` and `scenarios.json` passed; `git diff
    --check` passed.
  - `make lint-fix` was unavailable because this repository has no Makefile; no
    substitute lint command was used.
  - E2E and broader product suites were skipped because no executable CLI, API,
    runtime, or service contract changed.
- Authoritative docs: `SKILL.md`, `references/request-routing.md`, and
  `references/thesis.md` were updated and checked together against the final
  diff.
- Migration: none.

## 8. Remaining Work

Create the ready PR and let repository CI/review run as merge gates. No product
implementation or migration work remains.
