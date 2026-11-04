# feat(alva): route Thesis corrections to editorial edits

Primary record: alva-ai/alva-backend `docs/changelogs/2026-11-04-thesis-edit.md` (behaviors B1–B10, failures F1–F5, decisions D1–D10, risks R1–R7, implementation and verification design).

## 1. Background and Current State

- `skills/alva/references/thesis.md` "Existing Thesis lifecycle" sends every
  text change to `alva thesis update` (whole-body replacement with preview);
  the only `--editorial` guidance is not to use it to bypass a conflict.
  A typo fix in chat therefore publishes a material Update.
- Toolkit already supports `alva thesis update ... --editorial`.

## 2. Problem Model and End-to-End Behavior

- B7: fixing, rewording or correcting the current Thesis is previewed as the
  full revised version (plus changed assets/directions), labelled as an edit
  that readers will see marked "Edited", and published with `--editorial`
  after the author selects it. A new or changed view uses the Update flow,
  which now always publishes an Update when anything changed (B9). Unclear
  intent gets one question offering both, as actions when `PresentActions`
  is available.
- B6: edits target the current version only.
- F1: conflicts are reported; `--editorial` is never a conflict bypass.

## 3. Research, Findings, and Architecture Decision

- D4/D7: no field locks. An explicit "edit"/"fix" request is followed as an
  edit and an explicit "update" request as an Update; only unclear intent gets
  one question. The preview lists any changed assets or directions.

## 4. Implementation Design

New subsection "Editing the current version" in `references/thesis.md`
(when, exact `alva thesis update --editorial` command with retained fields,
preview wording, limits), linked from the lifecycle list and the `SKILL.md`
routing row; the maintenance-controls `--editorial` sentence points to it.
Version v1.28.0, new `cases.json`/`scenarios.json` cases, `mutation-smoke.mjs`
needles. Details in the primary record section 4 ("Skill design").

## 5. Verification and E2E Design

`skill-doc-eval.mjs`, `mutation-smoke.mjs`, `durable-agent.test.mjs` (commands
in the primary record section 5).

## 6. Human Decisions and Interaction

See the primary record.

## 7. Outcome and Evidence

- "Editing the current version" section (no note edits), routing row, v1.28.0; doc eval and mutation smoke pass.

## 8. Remaining Work

See the primary record section 8.
