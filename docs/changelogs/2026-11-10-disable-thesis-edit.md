# feat(alva): stop offering Thesis edits in chat

Follow-up to `2026-11-04-thesis-edit.md` (alva-ai/skills#665).

## 1. Background and Current State

- #665 added "Editing the current version" to `references/thesis.md`: chat
  corrections were saved with `alva thesis update --editorial` and shown to
  readers as "Edited".
- 2026-11-10: product decided to withhold Thesis editing from users for now,
  in both the App/web entry and chat.

## 2. Problem Model and End-to-End Behavior

- B1: Alva no longer offers or performs an edit of the current version. Every
  author-approved change, including a typo fix, is published through `update`
  as a new Update, as before #665.

## 3. Research, Findings, and Architecture Decision

- D1: revert #665's skill text (section, routing row, eval case, mutation)
  and replace the old conflict-only `--editorial` sentence with an explicit
  "never pass `--editorial`", so an "edit" request does not reach the flag.
- Backend, Gateway and toolkit keep the editorial capability; only the user
  entry points are withdrawn.

## 4. Implementation Design

- `skills/alva/references/thesis.md`: remove "Editing the current version"
  and its link from `update`; maintenance controls say never to pass
  `--editorial`.
- `skills/alva/SKILL.md`: routing row back to publication, update, close,
  deletion, maintenance, polishing; version v1.29.2.
- `evals/alva-skill-docs`: remove `target.thesis-edit-current-version` and the
  `thesis-edit-uses-editorial` mutation; version include v1.29.2.

## 5. Verification and E2E Design

- `node evals/alva-skill-docs/skill-doc-eval.mjs` (exit 0),
  `node evals/alva-skill-docs/mutation-smoke.mjs` (50/50),
  `node --test evals/alva-skill-docs/durable-agent.test.mjs` (5/5).

## 6. Human Decisions and Interaction

- 2026-11-10: the human asked for the smallest change that withdraws Thesis
  editing from the GUI entry and from chat.

## 7. Outcome and Evidence

- Checks above pass.

## 8. Remaining Work

- Restore the section from #665 when editing is offered again.
