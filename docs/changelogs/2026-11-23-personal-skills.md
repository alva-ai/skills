# 2026-11-23 Personal Skills Prompting & Agent Link Import

## Summary

- Added `skills/alva/references/personal-skills.md` documenting `alva my-skills`, private routing precedence (`personal:<public_id>` -> explicit user request -> `<session-prefill-personal-skills>` -> Skillhub), targeted multi-file edits with `--expected-rev`, low-friction `PresentActions` semi-auto capture (at most once per session, never silent), missing-runtime inertness, and `channel_group` / shared chat non-disclosure.
- Updated `skills/alva/SKILL.md` (Runtime Contract, Command Index, Routing) and `skills/alva/references/request-routing.md` (`Useful Next Step After Ask`, `Skillhub Blueprint`).
- Bumped `skills/alva/BOOTSTRAP.md` to `version: 2` (lightweight upfront pitch; optional **one-time** local investing-skill import offer in `Wrap up`, never scanning unless explicitly confirmed), kept `skills/alva/references/agent-routine.md` strictly free of local skill scanning or automation, and documented `## Optional One-Time Import From Local Agent Skills` in `skills/alva/references/personal-skills.md` with strict investing/trading/finance domain filtering, credential rejection, user confirmation checklist, and `--expected-rev` overwrite confirmation.

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs`
- `node evals/alva-skill-docs/mutation-smoke.mjs`
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`
