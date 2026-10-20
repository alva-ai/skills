# Integrate mainline Thesis authorship

## 1. Context
Sync current main with local reviewed commit 77e8137. Main 411ea14 adds v1.25.0
and Thesis authorship (#648), overlapping the compact entry/publication edits.

## 2. Behavior
Keep user claims and separate unpublished editorial Notes while preserving
exact selected bodies and avoiding repeated confirmation of an explicit request.
Discussion still does not authorize publication.

## 3. Decisions
Retain upstream authorship and its regression cases. Adapt only conflicting
entry/routing/publication wording and the test's fixed Notes-template assertion.
Thesis editorial Notes are distinct from the removed Playbook Creator Notes.

## 4. Implementation
- [x] Merge main and reconcile SKILL.md, request-routing.md and thesis.md.
- [x] Preserve compact entry and the existing discovery, evidence and memory rules.
- [x] Run doc regression, mutation smoke and durable-agent checks.

## 5. Verification
E2E Required: no for prompt integration; real publication behavior remains for
the existing Eval session. Verify links, no conflict markers, diff whitespace,
and author-preservation / exact-body / non-publication boundaries.

## 6. Approval
User authorized syncing current changes and minimal integration fixes.
Primary record: [Sandbox integration](../../../../backend/sandbox-agent-ts/docs/changelogs/2026-10-20-integrate-task-mailbox-prompts.md).

## 7. Outcome and Evidence
Integrated main 411ea14 (including v1.25.0 and #648) with all previous local
entry/reference changes. Authorship is retained verbatim; routing names it.
Notes remain separate from publication, while selected-text publication keeps
its existing authorization without a second confirmation. New upstream tests
are retained; the fixed Notes template assertion is changed to the equivalent
plain-language payload boundary, including its mutation check.

`node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/alva-merged-docs.md`:
100/100 cases, 1087/1087 checks. `node evals/alva-skill-docs/mutation-smoke.mjs`:
27/27. `node --test evals/alva-skill-docs/durable-agent.test.mjs`: 5/5.
Diff/conflict/link checks passed with the pre-existing example user.md link
unchanged. SKILL.md stays 212 lines; ticker-read and Trade Setup match 77e8137.


## 8. Remaining Work
Real-turn verification of author-preserving edits and explicit publication.
