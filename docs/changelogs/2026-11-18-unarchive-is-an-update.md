# fix(alva): unarchiving a Thesis is publishing an Update (v1.32.3)

## 1. Background and Current State

The skill told the Agent to restore an archived Thesis with the Thesis CLI
restore command, a state change without an Update.

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

## 3. Research, Findings, and Architecture Decision

`alva thesis update --archived false` ships in alva-ai/toolkit-ts#213, which
also removes `thesis restore`.

## 4. Implementation Design

`references/thesis.md` (maintenance controls, closing or deleting, publish
errors, Thesis return); `SKILL.md` v1.32.3; eval cases pin the new rules and
the version.

## 5. Verification and E2E Design

`evals/alva-skill-docs` includes match; no model run is claimed.

## 6. Human Decisions and Interaction

Jaxon, 2026-11-18: "skills：写明取消归档就是发一条 Update".

## 7. Outcome and Evidence

Docs only.

## 8. Remaining Work

Ship after alva-ai/skills#687, once the Toolkit release with
alva-ai/toolkit-ts#213 is the pinned CLI.
