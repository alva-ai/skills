# feat(alva): positions on a Thesis: confirm shares, publish weights, read the allocation (v1.35.0)

Local record. The primary record is alva-backend
`docs/changelogs/2026-11-23-thesis-weights.md` (per-Thesis positions on the
Thesis return, PRD "让 Thesis return 有仓位"); this record covers B19.

## Change

- `references/thesis.md` gains "Positions": publishing with weights sets the
  shares exactly; without weights the default rules apply and Alva also reads
  the published body for sizing. Sizing the author states in the conversation
  or in the body is converted to explicit weights for every long and short
  (four decimals, total at most 1; asks which ticker gives up share past
  100%) and confirmed; with no sizing anywhere, publish without weights and
  never suggest sizing; a wording fix whose body repeats earlier size words
  sends the current shares so they are not applied twice; a size change alone
  is a new Update in the author's words; the preview shows each share and the
  cash and an Update's before → after (archived Theses read the last Update's
  positions); a wait-to-buy ticker has no direction from `returnPreview`;
  selling all is an Update; readback, `THESIS_WEIGHTS_INCOMPLETE` and totals
  above 1 are handled.
- The preview lists Positions. "What the author asks for" replaces the 11-19
  rules (views only, weights cannot be set) with a size change through an
  Update with weights and the current position from `allocation`; unarchiving
  keeps the pre-archive shares and says so.
- "Thesis return" describes shares and cash, the weighted Update return,
  positions' `weight` and the allocation.
- `SKILL.md`: the Thesis return route also covers the current position; the
  Altra principle points a Thesis's shares at Positions; version v1.35.0.
- Evals: `target.thesis-author-intent` and `target.thesis-return-preview`
  assert the new rules and exclude the old ones; mutation smoke replaces the
  equal-split mutation with partial-weights, body-sizing and unasked-sizing
  mutations.

## Rollout

Release after toolkit-ts 0.38.0 (weights in `--entity-stances` and the
allocation in `thesis return --detail`) is published (D13).

## Verification

`node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`
(135/135), `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir
skills/alva` (97/97), `node --test evals/alva-skill-docs/durable-agent.test.mjs`.
