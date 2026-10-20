# fix: trim conflicting references and allow progressive answers

## 1. Background and Current State

The Slim-based alva entry is integrated locally. References retain unconditional
pipeline, repeated-read, search, update and CSS rules that contradict it.
Sandbox still directs all substantive content into the final reply.

## 2. Problem Model and End-to-End Behavior

B1: Remove the Skill's Creator Notes workflow and active references.
B2: Answer from verified evidence without requiring a persistent pipeline;
label user-provided inputs and retain current-fact provenance requirements.
B3: Reuse applicable current-session documentation; expand search only when
needed, without discarding evidence solely for zero engagement.
B4: Metadata-only Automation updates do not rerun producers. New pages use
the existing CSS bundle rather than copying its source.
B5: Task 3 permits useful supported findings before the final response,
focused Thesis discussion, and existing background-task handoff.
F1: Never fill missing live facts with invented values or premature conclusions.
F2: Dispatch and unverified task updates must not be reported as completed work.

## 3. Research, Findings, and Architecture Decision

D1: Edit existing instructions only; preserve Trade Setup verbatim, existing
capabilities, trading consent, Thesis publication/version and visibility rules.
D2: Apply evidence requirements to claims being made; retain method-specific
requirements for the requested final analysis. No new profile or runtime layer.
D3: Remove Creator Notes from the Skill; generic platform comments remain.

## 4. Implementation Design

- [x] Apply the six approved reference fixes and remove Creator Notes.
- [x] Align base/Channel communication and relevant Ask/Thesis instructions.
- [x] Adapt existing structural checks and verify actual profile materialization.
- [x] Review the incremental and complete diffs and record limitations.

Companion: sandbox-agent-ts/docs/changelogs/2026-10-13-progressive-answers.md.

## 5. Verification and E2E Design

Run existing skill-doc-eval, mutation-smoke and durable-agent tests; Sandbox
agent/profile tests; the actual materialization probe; Markdown link checks;
git diff --check. Compare the protected Trade Setup block with the turn-start
snapshot. Inspect current streaming/projection code for multipart support.
E2E Required: no for this instruction-only local change. Real-turn quality,
latency and device rendering remain subject to the separately owned EVAL.
Structural checks do not prove model behavior or user-visible speed.

## 6. Human Decisions and Interaction

User approved the six-item minimal list and starting task 3 on 2026-10-13.
Trade Setup stays unchanged. Continue locally; no release is performed here.

## 7. Outcome and Evidence

Implemented B1-B5 as instruction changes; F1/F2 remain explicit boundaries.
Creator Notes is deleted with no active Skill references. Trade Setup trigger
and follow-up blocks are byte-identical to the turn-start tree; Altra, broker,
trading and schedule consent references are also unchanged.

Task 3 now permits supported intermediate findings, claim-scoped evidence gates,
focused Thesis follow-ups and proportional plans. The user-requested
`📌 Memory updated: {one-sentence summary}` receipt remains unchanged in both
the base prompt and memory reference.
Existing Channel handoff is preserved; relay acceptance must be verified.

Verification after final product edits:
- `node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/alva-refs-task3-docs.md`:
  97/97 cases, 1050/1050 structural assertions.
- `node evals/alva-skill-docs/mutation-smoke.mjs`: 24/24 mutations rejected.
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`: 5/5 passed.
- Companion `bun test src/agent.test.ts src/codex.test.ts`: 94/94 passed.
- `bun /tmp/alva-refs-task3-materialize.ts`: ask/channel/channel_group,
  current instruction copies, reuse and existing-session refresh passed;
  removing a retired reference removes it from the refreshed session bundle.
- Checked 233 local Markdown links against the turn-start bundle: no newly
  broken targets or anchors. CSS generation blocks unchanged.
- Both repositories: `git diff --check` passed. Companion `make lint-fix`:
  38 files checked, no fixes applied.

Reviewed incremental changes against `/tmp/alva-refs-task3-before` and the
existing net diff. Removed incidental JSON Unicode-escaping churn. Existing
assertions were adapted where they required the superseded mandatory pipeline,
repeat-read or final-only gates; retained safety contracts still pass.

Runtime inspection: Sandbox forwards Claude stream events as received;
Codex emits each completed assistant item before turn completion. This supports
multiple text blocks at the runtime boundary, not a claim of token-by-token
Codex output. Feed App's checkout is unpopulated here; device rendering and
real-turn timing were not verified. No runtime implementation changed.

User clarification: prefer a complete, self-contained final answer; supported
interim findings are optional when useful during longer work. Base, Channel
and Ask rules now express that preference without enforcing segmentation.
Fresh checks after this clarification: skill-doc-eval 97/97, Sandbox agent/Codex
tests 94/94, and both diff whitespace checks passed.

User clarified that hiding tool activity behind a typing indicator is a global
design. The base Communication Style owns this rule; Channel inherits it.
Longer work now invites concise, proactive explanations of the next useful
check and meaningful progress, even before a finding is ready. Ordinary chat
uses natural short replies rather than a report template. Final answers remain
self-contained and proportional; the prose reference no longer asks for a
delta-only closeout that depends on interim messages.
Fresh verification: existing skill-doc-eval and agent/Codex suites passed;
both git diff whitespace checks passed. Reports: `/tmp/alva-conversational-progress.md`
and `/tmp/alva-conversational-progress-sandbox.log`.

Final Task 3 review found and fixed one ambiguity: Thesis discussion's ban on
"saving" could also suppress valid Memory writes. It now limits creation or
modification of a Thesis and refers Memory writes to the existing memory rules.
Reviewed Ask, Channel and group overlays, evidence gates, final-answer rules
and runtime text forwarding; no further blocking instruction conflict found.
Fresh final-tree checks: skill-doc-eval 97/97; Sandbox tests 94/94; actual
ask/channel/channel_group materialization, reuse and refresh passed; both
repositories passed `git diff --check`. Protected Trade Setup, trading/schedule
consent and the Memory reference remain byte-identical to the starting snapshot;
the formatted Memory receipt is retained. These checks do not prove live model
behavior or frontend rendering.

## 8. Remaining Work

Real-turn comparison and mobile observation through the separate EVAL effort.
