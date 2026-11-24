# feat(alva): positions on a Thesis: confirm shares, publish weights, read the allocation (v1.35.0)

Local record. The primary record is alva-backend
`docs/changelogs/2026-11-23-thesis-weights.md` (per-Thesis positions on the
Thesis return, PRD "让 Thesis return 有仓位"); this record covers B19.

## Change

- `references/thesis.md` gains "Positions": without sizing from the author,
  publish without weights, never suggest sizing, and say the result in one
  preview line; when the author states sizing, staged buying or a wait for a
  condition, settle every long and short's share and publish explicit
  `weight`s for all of them (or none), preview each share and the cash and an
  Update's before → after from `allocation`; ask for a number when an amount
  has none; a ticker already full takes no more; share counts and money are
  not shares; a wait-to-buy ticker is none and does not count yet; selling all
  of a ticker is an Update, and archiving is offered only when asked; weights
  shown by `get` are resent unless the sizing changes;
  `THESIS_WEIGHTS_INCOMPLETE` is handled.
- The preview lists Positions. "What the author asks for" replaces the 11-19
  rules (views only, weights cannot be set) with a size change through an
  Update with weights and the current position from `allocation`; unarchiving
  keeps the pre-archive shares and says so.
- "Thesis return" describes shares and cash, the weighted Update return,
  positions' `weight` and the allocation.
- `SKILL.md`: the Thesis return route also covers the current position;
  version v1.35.0.
- Evals: `target.thesis-author-intent` and `target.thesis-return-preview`
  assert the new rules and exclude the old ones; mutation smoke replaces the
  equal-split mutation with partial-weights and unasked-sizing mutations.

## Rollout

Release after toolkit-ts 0.38.0 (weights in `--entity-stances` and the
allocation in `thesis return --detail`) is published (D13).

## Verification

`node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`
(135/135), `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir
skills/alva` (96/96), `node --test evals/alva-skill-docs/durable-agent.test.mjs`.
