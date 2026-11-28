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
  publish as is unless the author gives one (a heading stays in the body).
  On `update`, `--summary` is sent when the author asks to change it; an
  omitted one is kept only while the body is unchanged, because a body change
  without it makes Alva clear the summary and write a new one (Backend
  `publishedSummary` with async summaries). So with a body change the Agent
  resends the current summary (from `alva thesis get`) when the author gave or
  approved it, and otherwise omits it without saying it is kept. The skill
  names no Thesis
  title at all: Alva no longer stores or returns one, and the CLI has no
  `--title` (alva-ai/toolkit-ts#229).
- Every former title mention points there or names the summary instead:
  Authorship ("may propose a summary"), Guided creation step 4, the verbatim
  body rule (no summary the author did not give or the Agent did not propose
  with it, replacing "generate a title"), the preview field list, what voids a
  confirmation, the `create` command line, and the 500-byte title limit
  (removed). The Update section's "omitting optional fields clears them"
  excepts `--summary` with a short note of that rule and a pointer to it. The verbatim-body rule
  states the summary limit as its own sentence, and "Summary" is listed with
  tickers and entity IDs as optional.
- Evals: new `target.thesis-summary` case, which also excludes the old
  "omitting `--summary` keeps the current one" promise. Mutations that fail
  it: a summary invented for a verbatim body; `--title` sent on create; an
  update that always keeps an omitted summary; no resend of the current
  summary on a body change; the Update carve-out reverting to "omit unless
  changing it". The `thesis-create-omits-visibility` mutation anchor follows
  the new create line.

No version bump in this change.

## Rollout

Ship this skill in an environment only after both of these are out there:

1. the npm release of alva-ai/toolkit-ts#229, and
2. the matching SDK Dispatch release in that environment. Publishing the npm
   package does not update the embedded Dispatch (ALPI), and sdk-monorepo
   main still pins the Dispatch submodule to toolkit 0.39.0 (`6ab40b8`),
   which has no `--summary`.

Until then the skill would emit a flag the CLI rejects: `--summary is not
supported for 'thesis create'`. toolkit-ts#229 itself requires
alva-ai/alva-backend#3996 to be deployed first.

## Verification

`node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva` (no
failed cases), `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir
skills/alva` (133/133, after merging main), `node --test evals/alva-skill-docs/durable-agent.test.mjs`
(5/5); alva-skill-standard `audit.sh` (no broken links or orphans) and a cold
subagent judgment pass, whose findings are applied.
