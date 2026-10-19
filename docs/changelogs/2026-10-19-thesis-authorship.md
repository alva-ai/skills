# docs(thesis): make the user the author of every Thesis claim

## 1. Background and Current State

`references/thesis.md` protects publication with an exact-payload confirmation,
and its Rewrite section says all modes "preserve language, stance, uncertainty,
facts, and conclusions". Guided creation has no equivalent rule. Its research
step says "Use verified facts, label assumptions and inference" and its drafting
step says "Draft one candidate from the user's stated view and verified
evidence", which reads as permission to merge research verdicts into the
author's body. A "revise" request goes through guided drafting, not
`thesis rewrite`, so the preservation rule never applies to it.

The skill also gives the agent nowhere to put its own assessment. Contrary
evidence can only go into the body, and an internally inconsistent final body
(a stated count that does not match the listed points, an unfinished point) is
never mentioned because the confirmation step forbids correcting it.

## 2. Problem Model and End-to-End Behavior

A production session on 2026-10-19 showed the failure. A user supplied three
claims and asked the agent to check them. Research found one premise
unsupported, and the follow-up "revise and send out" produced a candidate that
reversed that claim and hedged another. The user rewrote the candidate by hand
and published a body that no longer contained the original claim. The backend
and CLI stored the confirmed text byte-for-byte; the loss happened in drafting.

- B1 — Every path that produces body text (guided drafting, revision requests,
  `thesis rewrite`, `update`) keeps each author claim with its direction and
  conviction unless the author asks for a change.
- B2 — Expression is the agent's to improve: wording, order, structure,
  formatting, asset naming, and drafting additions such as a title, a verified
  supporting fact, or an invalidation condition, with the agent's own inference
  labelled.
- B3 — Contrary evidence, unverified premises, suggested substantive changes,
  and inconsistencies inside the body go to Notes after the body. Notes are
  short, ordered by impact, never published, and never block publication.
- B4 — The confirmation step still shows the selected body unchanged, and reads
  it once as an editor so that self-contradictions surface in Notes.
- F1 — Notes must not become a publication gate, a correction pass, or a list
  of wording nits on the author's own text.

## 3. Research, Findings, and Architecture Decision

- The failing turn read `references/thesis.md` and followed it as written: the
  drafting steps invite evidence-driven edits, and the only stance-preservation
  rule lives in Rewrite.
- A replay of the failing turns on the production model reproduced the problem
  with the current file: 0/2 revise replays kept the contradicted claim, and
  1/2 confirmation replays flagged the count mismatch.
- D1 — Model authorship explicitly rather than patching the drafting steps: the
  user is the author and owns what the Thesis claims, and the agent is the
  editor and owns how it reads and how well it is grounded. One `## Authorship`
  section defines claims, expression, and Notes, and the drafting, rewrite,
  confirmation, and update paths refer to it instead of carrying their own
  partial rules.
- D2 — Add Notes as the agent's channel instead of new prohibitions. The agent
  edited claims because the body was its only outlet; giving it a sanctioned
  place for disagreement removes the pressure to edit. One short contrastive
  example (a moat claim vs. competing evidence) anchors the boundary on an
  unrelated asset.
- D3 — Keep the check in the agent, not in the CLI or backend. Count and
  completeness problems are semantic and language-dependent, and the backend
  deliberately has no publication validation gate.

## 4. Implementation Design

- `skills/alva/references/thesis.md`: add a short purpose statement and the
  `## Authorship` section; reword Guided creation steps 3 and 4 so evidence
  informs the author through Notes; add the optional `Notes:` line and the
  editor read to the Create confirmation; point Rewrite and `update` at
  Authorship.
- `skills/alva/references/request-routing.md` and `skills/alva/SKILL.md`:
  state the authorship rule in the Thesis route rows without adding lines.
- `evals/alva-skill-docs/{cases,scenarios}.json`: add
  `target.thesis-authorship`, `scenario.thesis-revise-keeps-author-claims`, and
  `scenario.thesis-confirm-flags-inconsistent-body`.
- `evals/alva-skill-docs/mutation-smoke.mjs`: prove that removing the
  claim-keeping rule, the Notes line, or the editor read fails those cases.
- `evals/alva-skill-docs/cases.json`: update the stale `version: v1.24.1` pin
  in `target.mainline-updates` to `v1.25.0`. The v1.25.0 bump (#647) left main
  red on this check, which also blocked mutation smoke.

Core documentation impact: the Thesis reference is the authoritative agent
workflow and is updated in scope; routing summaries were kept consistent.

### Serial Implementation Checklist

- [x] Add the authorship model and route every body-producing path through it.
- [x] Add Notes to candidate and confirmation output with an impact budget.
- [x] Add deterministic corpus, scenario, and mutation coverage.
- [x] Repair the stale version pin that kept main red.
- [x] Replay the production failure against the old and new reference.

## 5. Verification and E2E Design

- Deterministic gate: skill-doc eval, mutation smoke, durable-agent tests, JSON
  parsing, and `git diff --check`.
- Behavioral check: replay the two failing turns (a revise request after
  contradicting research, and confirmation of a user-edited inconsistent body)
  on the production model, `gpt-6.1-sol`, with only the Thesis reference
  swapped. The fixtures contain a user's private conversation and are not
  committed.
- E2E required: no; no CLI, API, or runtime contract changes.

## 6. Human Decisions and Interaction

The reviewer asked for a principled redesign of the prompt rather than an added
rule, and confirmed that the inconsistency check belongs to the agent rather
than to a deterministic validator.

## 7. Outcome and Evidence

- Outcome: Thesis drafting now separates the author's claims from the agent's
  assessment. Revision keeps every claim, and contrary evidence and body
  inconsistencies reach the author as short, unpublished Notes.
- Replays on `gpt-6.1-sol`:
  - Old reference: revise kept the contradicted claim 0/2; confirmation flagged
    the count mismatch 1/2.
  - First draft of the new reference: revise 3/3 and confirmation 3/3, but
    Notes ran to five to seven items including wording nits.
  - Final reference, with the Notes impact budget: revise 2/2 kept all claims
    with contrary evidence in Notes; confirmation 2/2 showed the body unchanged
    and led Notes with the count mismatch, three items each.
- Tests and verification:
  - `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva` —
    98/98 cases and 1069/1069 checks passed (main before this change: 94/95,
    failing only the stale version pin).
  - `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva` —
    27/27 mutations failed as expected.
  - `node --test evals/alva-skill-docs/durable-agent.test.mjs` — 5/5 passed.
  - JSON parsing for `cases.json` and `scenarios.json` passed; `git diff
    --check` passed.
  - `make lint-fix` was unavailable because this repository has no Makefile.
- Deviations: none.
- Migration: none.

## 8. Remaining Work

- Release through the normal skills bump so production agents load the new
  reference.
- A separate frontend change fixes web rendering of numbered lists in Thesis
  bodies, which hid list markers and spacing on the web Thesis page.
