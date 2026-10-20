# fix: reuse runtime-prefilled identity and memory

## 1. Background and Current State

Full Skill startup and memory references unconditionally ask for data that the
Sandbox runtime already injects as independent `session-prefill-*` blocks.

## 2. Problem Model and End-to-End Behavior

Count supplied identity and memory files as read. Keep normal preflight for
standalone use, and fetch missing or stale relevant state within allowed scope.

## 3. Research, Findings, and Architecture Decision

Follow Backend's current prefill renderer. Preserve memory scope, provenance,
write rules, and capability-specific authorization. Reuse existing files.

## 4. Implementation Design

Update SKILL.md, references/preflight.md and references/memory.md in place.
Primary design and checklist: `code/backend/sandbox-agent-ts/docs/changelogs/2026-10-13-align-prefill-and-consent.md`
(relative to mono-meta).

## 5. Verification and E2E Design

Compare existing documentation checks on HEAD and the worktree. Actual model
behavior requires the separately owned real-turn EVAL before release.

## 6. Human Decisions and Interaction

The user approved the first batch on 2026-10-13 and requested minimal changes.

## 7. Outcome and Evidence

Updated only the three existing instruction files listed above. Ran:

- `node evals/alva-skill-docs/skill-doc-eval.mjs --treeish HEAD --out /tmp/alva-first-batch-docs-baseline.md`
- `node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/alva-first-batch-docs-final.md`

Both pass 95/95 cases and 1032/1032 structural checks; SKILL.md remains 911
lines. Sandbox's actual profile materialization probe confirms these Skill
files are copied into all three conversational profiles. `git diff --check`
passes. These checks do not demonstrate model behavior or response latency.

## 8. Remaining Work

Bundle with the companion Sandbox prompt changes and run real-turn comparisons.
