# Refine research routing and locate handoff omissions

## 1. Current state
Targeted round two loaded the intended prompts, yet C04 still expanded preliminary
discussion into research. Complex Ask Router qualified its scope in prose but
used domain keywords as Thesis/fundamental and Valuation/accounting triggers.
This is a plausible competing instruction, not proven single-line causality.

## 2. Intended behavior
Route by the requested judgment and actual work needed. Hypothetical discussion
can use necessary fact checks without becoming a full research project. Preserve
relevant evidence when completing background work and preserve question coverage
when the main chat summarizes it. No fixed response template.

## 3. Evidence and decisions
Source: targeted-round2/representative-dialogues.md and scored-revised task records
under /Users/leozhou/.codex/visualizations/2026/10/13/01a13424-d249-7ba1-accc-0bbc67c5a422/alva-phase1-eval/.

- C04-r1: child final 1 has four URL citations; child final 2 has none and only
  refers to earlier demand evidence. Final 2 equals saved task.result_text.
  Omission begins in child answer generation, before storage/notification.
- BG1-r3: child final 2 includes B's assumptions and execution/refinancing and
  valuation caveats; it equals saved task.result_text. Parent delivery omits B.
  The child result covers the shared B baseline (not a three-way disagreement);
  a short acknowledgment can preserve that scope without reproducing the report.
- Successful C04-r3 child revision retains four URL citations and revises an
  earlier cash-flow test. Its parent answer drops direct URL citations, showing
  a second opportunity for evidence loss even after successful child integration.
- Backend completedTaskResultText selects the last assistant frame; committer
  saves the final queued turn's result; projector forwards that text. Serialized
  result fields for C04-r1 and BG1-r3 are approximately 5KB and 7KB, far below
  the notification's 256KiB limit. No size truncation explains these omissions.
- The missing facts/sources remain in child history. These observations locate
  the failures but do not prove why the model ignored the previous instruction.

Decision: replace existing prompt clauses, explain the final-only handoff to the
child and preserve question coverage in the parent. No runtime/schema change or
special case for a particular company, contract, or evidence table.

## 4. Implementation
- [x] request-routing.md: evidence-dependent intent triggers for Thesis and
  Valuation; discussion scope in the router itself.
- [x] Sandbox CHANNEL.md: dispatch based on work needed; preserve relevant
  findings and source support when summarizing.
- [x] Sandbox CLAUDE.md: whole-request final background result with needed evidence.

## 5. Verification
Existing Skill documentation regression and mutation smoke; Sandbox agent/Codex
tests and lint-fix; both git diff checks. Real-turn EVAL remains separate.
Target: C04 first reply and capex follow-up; DEEP to preserve research depth;
C04 long research with queued follow-up (child evidence survival); BG1/BG2
(parent coverage, sources and changed conclusions). Inspect each boundary rather
than only final answers. Restore search dependencies before normal-network C04.

## 6. Human decision
User approved minimal routing changes and evidence-led handoff investigation.
Keep changes local. No new profiles, tools or runtime changes.

## 7. Outcome
Final-tree checks passed:
- `node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/alva-routing-r2-check.md`:
  97/97 cases and 1050/1050 assertions.
- `node evals/alva-skill-docs/mutation-smoke.mjs`: 24/24 rejected mutations.
- Sandbox `bun test src/agent.test.ts src/codex.test.ts`: 94/94 tests,
  404 assertions.
- Sandbox `make lint-fix`: 38 files, no edits. Skills has no lint-fix target.
- Both repositories' `git diff --check` passed; backend repository stays clean.
Reviewed the incremental diff against pre-change copies: only three prompt files
changed, plus the two local changelogs. Trade Setup and memory were untouched.
Prompt changes require fresh real-turn validation; they do not mechanically
guarantee complete handoff. Previous source claims were not
independently fact-checked in this investigation.

## 8. Remaining work
Separate Eval session to test the final tree. If source loss persists, consider
handoff support separately rather than accumulating more prompt instructions.
