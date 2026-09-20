# docs: guide Thesis visibility updates

Primary design record:
alva-ai/toolkit-ts/docs/changelogs/2026-09-20-add-thesis-set-visibility.md.

## 1. Background and Current State

- Thesis guidance currently treats visibility as part of create or full update.
- The approved dedicated Toolkit command changes current access without
  republishing Thesis content.
- Existing guidance already requires thesis get as the authoritative readback
  source and forbids GraphQL/secondary lookup supplementation.

## 2. Problem Model and End-to-End Behavior

- B1 — Route explicit public/private changes to thesis set-visibility, not
  thesis update or Playbook visibility commands.
- B2 — Read the current Thesis, show the current-to-target visibility change,
  execute the explicit request once, then read back with thesis get.
- B3 — Verify visibility changed while body and author version remain unchanged;
  report returned identity and state without inventing evidence.
- F1 — Invalid, unauthorized, missing, or ambiguous-result operations stop and
  report the error without fallback or automatic retry.
- Explicit visibility requests do not add a second formal confirmation gate.

## 3. Research, Findings, and Architecture Decision

- D1 — Extend the existing Thesis lifecycle section and routing/eval coverage;
  do not create a new top-level skill route.
- D2 — Preserve the implementation-neutral GET-only readback contract and use
  the dedicated Toolkit command as the sole write path.
- Alternatives rejected: reconstructing a full update payload risks content
  changes and version conflicts; using Playbook commands targets the wrong
  resource.
- External research is unnecessary because this is a documentation/eval update
  for an approved local command contract.
- R1 — The Skill documentation can merge independently but the command is not
  operational until the Gateway and Toolkit dependencies are available.

## 4. Implementation Design

- Extend skills/alva/references/thesis.md under Existing Thesis lifecycle with
  a visibility-only sequence: get current Thesis, state current-to-target
  visibility, call thesis set-visibility once, then get again.
- Require comparison of Thesis ID, body, author_version_id,
  material_version_id, title, and ordered entity_ids so a visibility-only claim
  cannot hide a publication change.
- Invalid/unauthorized/ambiguous results stop without retries or fallback to
  thesis update, GraphQL, or Playbook commands.
- Do not add a second formal confirmation gate for an explicit request and do
  not emit the creation-only preview XML as part of this maintenance action.
- Add one target eval case in evals/alva-skill-docs/cases.json; SKILL.md routing
  already sends all Thesis maintenance to the reference and needs no change
  unless implementation review proves otherwise.

### Serial Implementation Checklist

- [x] Add the dedicated workflow and guardrails to the Thesis reference.
- [x] Add eval coverage without weakening retained create/preview behavior.
- [x] Run doc eval, mutation smoke, durable-agent tests, and diff review.

## 5. Verification and E2E Design

- The target eval requires the command, get/set/get flow, immutable-field
  comparison, public/private restriction, direct explicit execution, and
  no-fallback/no-retry guidance.
- Existing thesis-create-preview-card coverage must stay green.
- Commands: node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir
  skills/alva; node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir
  skills/alva; node --test evals/alva-skill-docs/durable-agent.test.mjs;
  git diff --check.
- E2E Required: no — local-stack work was explicitly excluded. The Skill can
  prove routing guidance, not deployed command availability.

## 6. Human Decisions and Interaction

- The human approved direct execution for an explicit visibility request and
  GET-only readback.
- The human explicitly excluded alva-local-dev on 2026-09-20, so the final
  record must distinguish documentation/eval evidence from live execution.

## 7. Outcome and Evidence

- The Thesis reference now requires the dedicated get/set/get workflow,
  public/private-only target, immutable publication-field comparison, direct
  execution for explicit requests, and stop/no-retry/no-fallback behavior.
- Added target.thesis-set-visibility without changing top-level routing or the
  creation confirmation/preview contract.
- Skill doc eval passed 93/93 cases and 994/994 checks; mutation smoke passed
  21/21; durable-agent tests passed 5/5; git diff --check passed.
- This proves documentation routing and regression coverage only. Toolkit and
  Gateway availability were not exercised through a live stack.
- PR/CI/review outcome: Ready PR #639 created with alva-gateway#987 and
  toolkit-ts#178 recorded as dependencies. Current-head CI/review state is
  monitored in the push stage; no merge or publication was authorized.

## 8. Remaining Work

- Merge after alva-gateway#987 and toolkit-ts#178.
- Live/deployed command verification remains outside this task.
