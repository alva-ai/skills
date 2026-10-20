# fix: use existing context and read memory only as needed

## 1. Background and Current State

Global and Channel memory, prefill reuse, storage scopes and writing rules
already exist. Conversation guidance under-specifies how context shapes answers;
some reading rules still imply unconditional reads or ignore only global memory.

## 2. Problem Model and End-to-End Behavior

B1: Use relevant supplied context to focus answers and avoid repeated questions.
B2: Read missing or stale memory only as needed; explicitly checking the stored
profile still reads its current contents.
B3: An unqualified request to ignore memory covers global and Channel memory,
including supplied memory and Journal carry-forward, for that request.
F1: Third-party views and behavioral signals do not become confirmed user facts.
F2: Hypothetical scenarios do not overwrite durable preferences.

## 3. Research, Findings, and Architecture Decision

Reuse the existing entry, memory reference and Sandbox base prompt. No new
storage or retrieval mechanism. Current memory scope and writing conditions
remain authoritative. This local instruction correction needs no external research.
Companion: ../../../../backend/sandbox-agent-ts/docs/changelogs/2026-10-13-use-existing-conversation-context.md.

## 4. Implementation Design

- [x] Add concise context-use guidance to memory.md and update the existing entry link.
- [x] Align conditional reads, ignore scope and durable-correction semantics.
- [x] Synchronize the Sandbox base and inspect the incremental diff.

## 5. Verification and E2E Design

Run existing skill-doc-eval; Sandbox agent/Codex tests; the existing actual
profile materialization probe; both repositories' git diff --check.
Compare memory writing rules and the formatted receipt with the turn-start tree.
E2E Required: no for local instruction edits; structural checks do not prove
live conversational quality. Real-turn evaluation remains separately owned.

## 6. Human Decisions and Interaction

2026-10-13: User approved Task 4 items 1 and 2 only, with minimal changes.
Item 3 (retrieval of saved/read/followed content) is deferred. Continue locally.

## 7. Outcome and Evidence

Implemented B1-B3 and F1-F2 in three existing instruction files. Reviewed the
incremental diff against `/tmp/alva-task4-context-before`; existing storage
layout, writing conditions and formatted memory receipt remain unchanged.
No runtime, API, retrieval or test implementation changed.

Verification:
- `node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/alva-task4-context-check.md`:
  97/97 cases, 1050/1050 structural assertions.
- Companion `bun test src/agent.test.ts src/codex.test.ts`: 94 passed, 0 failed.
- `bun /tmp/alva-refs-task3-materialize.ts`: actual prompt assembly and reference
  copying for ask/channel/channel_group, reuse and refresh passed.
- Both repositories: `git diff --check` passed.

These checks establish instruction consistency and loading, not model behavior.

Follow-up: retain the existing Investment Thesis name and add only a boundary
in the Skill memory reference and Sandbox base: memory preserves the user's
thinking and qualifications; updating it does not create, publish or modify a
product Thesis. User deferred the broader Investment Thoughts rename. Backend
initialization and maintenance rules are unchanged. Fresh verification passed:
97/97 Skill cases, 94/94 Sandbox tests, actual prompt materialization and both
repositories' `git diff --check`.

## 8. Remaining Work

Real-turn behavior remains unverified.
