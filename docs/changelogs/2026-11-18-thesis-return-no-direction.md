# fix(alva): an Update may leave a Thesis with no direction (v1.32.2)

## 1. Background and Current State

The Agent told authors that a Thesis tracking its return must keep a long or
short ticker, and refused to offer publishing when `returnPreview.lastLegRemoved`
was true, because the Backend refused such a write (`THESIS_RETURN_LAST_LEG`).

## 2. Problem Model and End-to-End Behavior

Product decision (2026-11-18): having no direction is a view. alva-ai/alva-backend#3794
publishes an Update that leaves no long or short ticker, and holds the return
at its value until a later Update adds one; archiving does the same.

- B1: `lastLegRemoved` true → the Update publishes like any other: no
  separate confirmation, no explanation unless asked (Zet: removing a ticker is
  already the author's explicit choice).
- B2: a kept exit (`keptEntityIds`) explains that only removing the ticker
  leaves no direction.
- B3: the Thesis return definitions say an Update with no direction or an
  archive holds the return. The Agent still answers only what is asked.
- F1: an older Backend may still refuse with `THESIS_RETURN_LAST_LEG`; its
  message stays.

## 3. Research, Findings, and Architecture Decision

The editors likewise publish it without a confirmation
(alva-ai/frontend-monorepo#5571).

## 4. Implementation Design

`references/thesis.md` (Directions and the Thesis return, preview, Thesis
return); `SKILL.md` version v1.32.2; the eval case pins the new rule.

## 5. Verification and E2E Design

`evals/alva-skill-docs/cases.json` includes still match; no model run is
claimed.

## 6. Human Decisions and Interaction

Zet: no confirmation step; say "no direction" to users, never positions.

## 7. Outcome and Evidence

Docs only.

## 8. Remaining Work

Ship after or with alva-ai/alva-backend#3794.
