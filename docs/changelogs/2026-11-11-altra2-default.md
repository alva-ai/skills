# Teach altra2 as the trading engine and deprecate v1 FeedAltra (v1.30.0)

## Why

`@alva/altra2` is on PRD (1.0.0 and 1.0.1 on 2026-11-11; 1.1.0, which lets every user-written
function be async, ships with this change). The skill still taught only v1 `FeedAltra`, and the
altra2 README is not reachable from the runtime (`alva sdk doc --name @alva/altra2` returns
404), so agents could not learn v2 anywhere else. The owner asked that v1 become legacy and
deprecated, that new work use v2, that the v1 documentation stay for existing scripts, and that
the canonical ticker lookup be explained clearly because altra2 accepts nothing else.

## Change

- `skills/alva/references/altra-trading.md` now teaches altra2: research contract, canonical
  trading-pair lookup (venue symbols, 4-digit HK codes, no company names, ambiguous and
  unsupported pairs), run timing, a complete backtest, strategy fields, decide context,
  commands, triggers, features (async allowed), events, LLM/model guidance, rules, results,
  a live strategy as an Automation, reading a live Feed, testing, validity, limitations and a
  v1 → v2 table. Keeping the file name sends every existing link to v2.
- `skills/alva/references/altra-v1-legacy.md`: the previous v1 text, unchanged except for a
  deprecation banner: read only to maintain an existing v1 script or Feed.
- `SKILL.md` (v1.30.0): the trading principle and the backtest route name `@alva/altra2` and
  mark v1 deprecated; the route points to the legacy file only for existing v1 scripts.
- `onnx.md`: ONNX inference runs in an async altra2 feature (was FeedAltra).
- `design-playbook-trading-strategy.md`: how to project an altra2 Feed into the page schema.
- `request-routing.md`, `operational-pitfalls.md`, `jagent-runtime.md`, `README.md`: wording.
- Evals: new cases `target.altra2-default`, `target.altra-canonical-lookup`,
  `target.altra-v1-legacy`; `retained.altra` and the backtest scenario require
  `@alva/altra2`; three new mutations; version case v1.30.0.

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`: no failed cases.
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`: 57/57.
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`: 5 passed.
- On PRD with the altra2 1.1.0 build: the documented backtest (complete, 96 decisions, 147
  fills, no gaps), the live producer twice on a test Feed (complete, manifest readable), the
  testing snippet and an async ONNX feature all ran as documented.

The in-product ALPI slim skill (sdk-monorepo `skills/alpi-slim-skill`) gets the same change.
