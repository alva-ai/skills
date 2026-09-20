# docs: mention the Thesis visibility command

Primary design record:
alva-ai/toolkit-ts/docs/changelogs/2026-09-20-add-thesis-set-visibility.md.

## 1. Background and Current State

Toolkit adds a dedicated Thesis visibility command. The Skill already routes
existing-Thesis maintenance to references/thesis.md.

## 2. Problem Model and End-to-End Behavior

- B1 — The existing lifecycle list mentions thesis set-visibility for public or
  private access changes.
- B2 — The note distinguishes visibility changes from publishing a new author
  version.
- Non-goal: prescribe a separate agent workflow for this minor CLI feature.

## 3. Research, Findings, and Architecture Decision

- D1 — Add one lifecycle bullet rather than a dedicated subsection or workflow.
- D2 — Fold regression coverage into the existing Thesis documentation case.
- R1 — The command depends on alva-gateway#987 and toolkit-ts#178.

## 4. Implementation Design

- Add one set-visibility bullet to skills/alva/references/thesis.md.
- Add two include checks to target.thesis-create-preview-card.

### Serial Implementation Checklist

- [x] Mention the CLI and no-new-version behavior.
- [x] Keep eval coverage proportional to the feature.
- [x] Run the existing documentation checks.

## 5. Verification and E2E Design

- Run skill-doc-eval, mutation-smoke, durable-agent tests, and git diff --check.
- E2E Required: no — this repository only documents an existing CLI contract.

## 6. Human Decisions and Interaction

- The human corrected the initial design after PR creation: this is a minor
  feature, and the Skill should only mention the CLI instead of teaching a
  get/set/get workflow.

## 7. Outcome and Evidence

- The Skill now adds one lifecycle bullet and two checks in an existing eval
  case; the dedicated subsection and target case were removed.
- Skill doc eval passed 92/92 cases and 982/982 checks; mutation smoke passed
  21/21; durable-agent tests passed 5/5; git diff --check passed.
- PR: alva-ai/skills#639. No merge or publication was authorized.

## 8. Remaining Work

- Merge after alva-gateway#987 and toolkit-ts#178.
