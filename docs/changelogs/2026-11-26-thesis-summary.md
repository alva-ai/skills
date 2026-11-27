# feat(alva): the Thesis summary is its one-line card name; no Thesis title

Local record. The CLI side is alva-ai/toolkit-ts#229
(`docs/changelogs/2026-11-26-thesis-summary.md` there): `--summary` on
`thesis create` / `thesis update`, sent only when given.

## Change

- `references/thesis.md` gains "Summary" under Publication preview, the one
  place the rule lives: the summary is the one-line name on the Thesis card
  next to the author; optional, and Alva writes one after publication when
  none is sent; proposed only with a new Thesis candidate the Agent drafts,
  as one sentence on one line (at most 1000 UTF-8 bytes) in the body's
  language, through `--summary`; none for a body the author supplied to
  publish as is unless the author gives one (a heading stays in the body);
  omitted on `update`, the current one is kept. The skill names no Thesis
  title at all: Alva no longer stores or returns one, and the CLI has no
  `--title` (alva-ai/toolkit-ts#229).
- Every former title mention points there or names the summary instead:
  Authorship ("may propose a summary"), Guided creation step 4, the verbatim
  body rule (no summary the author did not give or the Agent did not propose
  with it, replacing "generate a title"), the preview field list, what voids a
  confirmation, the `create` command line, and the 500-byte title limit
  (removed). The Update section's "omitting optional fields clears them"
  excepts `--summary`.
- Evals: new `target.thesis-summary` case with two mutations (summary
  invented for a verbatim body; cleared on update); the
  `thesis-create-omits-visibility` mutation anchor follows the new create
  line; a third mutation (`thesis-create-sends-title`) fails the case when the
  create line sends `--title`.

No version bump in this change.

## Rollout

Merge after alva-ai/toolkit-ts#229 is released: an older CLI rejects
`--summary` as an unknown flag.

## Verification

`node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva` (no
failed cases), `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir
skills/alva` (126/126), `node --test evals/alva-skill-docs/durable-agent.test.mjs`
(5/5); alva-skill-standard `audit.sh` (no broken links or orphans) and a cold
subagent judgment pass, whose findings are applied.
