# fix(alva): a Today reply without its own thesisId changes no Thesis (v1.32.8)

Primary record: alva-ai/alva-backend
`docs/changelogs/2026-11-23-today-research-reply-no-publish.md`.

## 1. Background and Current State

"Replies from Alva Today" says a `thesisId` on the selected TASK reply
identifies the reader's own target and that selecting it confirms publishing
a scoped Update directly. It does not say what a selected reply without a
`thesisId` means when the card itself is anchored to the reader's Thesis.

## 2. Problem Model and End-to-End Behavior

A research reply on a card anchored to the reader's own Thesis was handled as
an approved edit: the card's anchor and sources carry that Thesis's id, the
reply mentions the Thesis in words, and the Agent published an Update the
reader never asked for.

- B1: only the selected reply's own `thesisId` is an edit target. A
  `thesisId` on the card anchor or its sources, or a Thesis named in the reply
  text, is not.
- B2: a selected reply without a `thesisId` asks for research, an answer, or
  a new Thesis and confirms no change to an existing Thesis. The Agent does
  that work and reports it; when the result bears on one of the reader's
  Theses it says what it would change and publishes only after the reader
  asks, through the normal Update preview.
- B3: a selected reply with a `thesisId` keeps direct publication of the
  scoped Update.

## 3. Research, Findings, and Architecture Decision

The reply instruction sent with the card is corrected in alva-ai/alva-backend
and is the direct fix. This reference states the same rule so the skill and
the instruction do not disagree.

## 4. Implementation Design

`references/thesis.md`, "Replies from Alva Today": one paragraph after the
existing-Thesis rule. `SKILL.md` v1.32.8 (after #694 and #696 took v1.32.6 and v1.32.7 on `main`); eval cases pin the two new
sentences and the version.

## 5. Verification and E2E Design

`evals/alva-skill-docs` includes match; no model run is claimed.

## 6. Human Decisions and Interaction

- 2026-11-20 (product): selecting an edit reply with `thesisId` publishes
  directly. Unchanged.
- 2026-11-23 (product): replies without a `thesisId` must not publish; align
  the skill with the backend instruction.

## 7. Outcome and Evidence

Docs only. 2026-11-23: `node evals/alva-skill-docs/skill-doc-eval.mjs
--skill-dir skills/alva` exit 0; mutation smoke 83/83; durable agent 5/5.

After merging `main` (#694, #696) and bumping to v1.32.8: doc eval exit 0;
mutation smoke 83/83; durable agent 5/5.

## 8. Remaining Work

Takes effect with the next skill release that includes v1.32.8.
