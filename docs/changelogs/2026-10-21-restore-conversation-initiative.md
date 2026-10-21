# fix: restore initiative and complete research delivery

## 1. Background and Current State

Production conversation review found repeated prompting needed to advance company research, missing useful follow-ups, long initial responses, and a full background report reduced to a chat summary without its file. The old Full Skill kept next-step guidance in its entry; current guidance is mostly in request-routing.md. These are observed behavior gaps, not proof of a single prompt-level cause.

## 2. Problem Model and End-to-End Behavior

- B1: Actively complete the current authorized goal, carry forward accepted choices, and repair missing delivery without repeated prompting. Stop execution at completion or a material blocker; propose useful extensions rather than silently expanding scope.
- B2: Look for helpful next steps across conversations, including discussion and clarification. Use natural, specific follow-ups, not mandatory questions or footers. Preserve publication and trading approval.
- B3: Long requests get an early useful portion when supported, then further findings and the complete requested result. Short questions remain direct; neither a preamble nor segmentation is mandatory.
- B4: Deep research delivers a concise chat result plus the complete report through an existing file tool. Background results carry that link to the main chat. Brief initial answers do not reduce the research scope.
- F1: A missing/failed file delivery is reported and completed where possible, not treated as a complete handoff. No fabricated link or sandbox-only path as a delivered file.

## 3. Research, Findings, and Architecture Decision

D1: Edit existing rules in place; retain evidence checks, ownership, task routing and approvals. Do not add a persona/profile, tool, service or fixed output template. Next-step guidance remains in the existing reference with its core principle restored to the entry.
D2: Reuse UploadFile and existing task-result relay. General research delivery belongs in CLAUDE.md; TASK.md and CHANNEL.md own handoff responsibilities.
R1: Prompt checks cannot prove initiative, timing, or end-to-end attachment accessibility. Real-turn evaluation remains necessary. Automation execution efficiency is separate research and not changed here.
External research is unnecessary for this local prompt/contract correction; inspected current prompt files and observed production transcript evidence instead.

## 4. Implementation Design

Skills: SKILL.md intent principle and request-routing.md next-step guidance.
Sandbox: CLAUDE.md communication and report delivery; TASK.md report handoff; CHANNEL.md preserve report link. Reuse existing document/profile checks; add no wording assertions. No runtime implementation, schema, dependencies or deployment changes.

### Serial Implementation Checklist

- [x] Update the approved plan with completion and scope boundaries.
- [x] Restore initiative and useful follow-ups in existing entry/reference rules.
- [x] Adjust natural phrasing, early useful responses and complete research delivery.
- [x] Run scoped checks and review the complete local diff for contradictions and scope.

## 5. Verification and E2E Design

- Skills: `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva --out /tmp/alva-initiative-doc-check.md`; `node evals/alva-skill-docs/mutation-smoke.mjs`; `node --test evals/alva-skill-docs/durable-agent.test.mjs`; `git diff --check`.
- Sandbox: `bun test src/agent.test.ts src/report-progress.test.ts`; `make lint-fix` (inspect and remove unrelated formatting); `git diff --check`.
- E2E Required: no for this local prompt-only edit; it makes no runtime changes. Real conversational evaluation is required before claiming behavioral improvement or release readiness.
- B1/B2: discussion to concrete candidates, accepted next step, completed goal with optional extension, no useful follow-up, repeated/rejected suggestion, retained publish approval.
- B3: long mixed question, quote-only question, preliminary answer plus background work; measure first response, first reliable finding, final delivery separately.
- B4/F1: foreground and background deep research, full-source report coverage, preserved link, failed upload and requested missing report.

## 6. Human Decisions and Interaction

User requested no test changes; removed this round's new text assertions and mutation case. Existing tests are unchanged.

User explicitly approved local implementation and whole-diff review of initiative, natural follow-ups, flexible early segments and full research artifacts. Completion is a stopping boundary; next steps are not restricted to research. Automation optimization is separate. No further confirmation is needed for these approved edits.

## 7. Outcome and Evidence

Implemented B1/B2 in the existing entry and next-step section; B3 in the existing communication guidance; B4/F1 in general delivery plus task/main-chat handoff responsibilities. Full-report delivery is explicitly part of the requested research, preserving the separate publication consent boundary.

Whole-diff review checked scope completion versus proactive extensions, natural follow-ups versus mandatory questions, early findings versus unsupported current facts, and short summaries versus complete report delivery. Existing Thesis/Trade Setup/trading rules and runtime source remain unchanged. No in-scope conflict remains identified. Parent-worktree changes were pre-existing and untouched.

Verification on final content:
- Document regression: 106/106 cases, 1252/1252 checks.
- Mutation smoke: 43/43 detected.
- Durable-agent checks: 5/5.
- Sandbox agent/report-progress tests: 62/62.
- Sandbox `make lint-fix`: 39 files checked, no fixes.
- Both repositories: `git diff --check` clean.

These are structural/contract checks, not proof of model behavior. Rebased onto current main, preserving the prior merged prompt cleanup. Prepared for review; no deployment performed. Skills has no Makefile/lint-fix target; no substitute lint command was introduced.

## 8. Remaining Work

Real-turn Eval and file handoff verification; no timing or initiative improvement is claimed from static checks. Release the new Skills bundle and update the production Sandbox pin before rolling out the combined behavior.
