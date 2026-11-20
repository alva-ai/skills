# fix(alva): unarchiving a Thesis is publishing an Update (v1.32.5)

## 1. Background and Current State

The skill told the Agent to restore an archived Thesis with the Thesis CLI
restore command, a state change without an Update. It also said a direction
judged from the text never takes away the last long or short
(`keptEntityIds`), and mapped `THESIS_RETURN_LAST_LEG`. An Agent asked to keep
two tickers with no direction sent them as unknown, which keeps a carried
direction; the update changed nothing and looked saved
(alva-ai/alva-backend#3809).

## 2. Problem Model and End-to-End Behavior

Product decision (2026-11-18, alva-ai/alva-backend#3794): unarchiving is
publishing an Update, as the App and web already do; an archived Thesis takes
no other Update (`THESIS_ARCHIVED`).

- B1: to restore a Thesis, the Agent publishes an Update with
  `--archived false` through the normal Update preview; it may keep the
  current text, tickers and directions. It never runs `thesis restore`.
- B2: with `THESIS_ARCHIVED`, the Agent says the Thesis is archived and that
  publishing the Update also unarchives it, and previews it with
  `--archived false`.
- B3: the Thesis return definition says the unarchiving Update starts the
  return moving again; declining close or delete offers archiving, which an
  Update later restores.
- B4 (#3809): to keep a ticker with no direction, the body says so and the
  previewed `none` is published, also for the last long or short; the Agent
  never sends `unknown` to clear a direction. The `keptEntityIds` and
  `THESIS_RETURN_LAST_LEG` guidance is removed (the Backend no longer keeps
  exits or refuses).
- B5 (#3809): when `thesis update` returns `unchanged: true`, the Agent says
  the Update changed nothing, never that it was published.

## 3. Research, Findings, and Architecture Decision

`alva thesis update --archived false` and `unchanged` ship in
alva-ai/toolkit-ts#213, which also removes `thesis restore`. Storing `none` as
sent for the last long or short is alva-ai/alva-backend#3794 (D6).

## 4. Implementation Design

`references/thesis.md` (maintenance controls, closing or deleting, publish
errors, Thesis return); `SKILL.md` v1.32.5 (after #689 and #691 took v1.32.3 and v1.32.4 on `main`); eval cases pin the new rules and
the version.

## 5. Verification and E2E Design

`evals/alva-skill-docs` includes match; no model run is claimed.

## 6. Human Decisions and Interaction

- Jaxon, 2026-11-18: "skills：写明取消归档就是发一条 Update".
- Jaxon, 2026-11-19 (alva-ai/alva-backend#3809): an author's none is stored as
  sent; the CLI and the skill say when an Update changed nothing.

## 7. Outcome and Evidence

Docs only. 2026-11-19: `node evals/alva-skill-docs/skill-doc-eval.mjs
--skill-dir skills/alva` exit 0; mutation smoke 78/78; durable agent 5/5.

2026-11-20, after merging `main` (#691) and bumping to v1.32.5: doc eval exit 0;
mutation smoke 83/83; durable agent 5/5.

## 8. Remaining Work

Ship once alva-ai/alva-backend#3794 is on PRD and the Toolkit release with
alva-ai/toolkit-ts#213 is the pinned CLI (alva-ai/skills#687 is merged).
#3794 reached PRD in alva-backend v0.55.0 on 2026-11-20; the stable Toolkit is
v0.37.0 (alva-ai/toolkit-ts#216).
