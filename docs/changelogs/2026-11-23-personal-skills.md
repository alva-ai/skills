# 2026-11-23 Personal Skills Prompting & Agent Link Import

## Summary

- Added `skills/alva/references/personal-skills.md` documenting `alva my-skills`, private routing precedence (`personal:<public_id>` -> explicit user request -> `<session-prefill-personal-skills>` -> Skillhub), targeted edits with `--expected-rev`/`--request-id`, low-friction `PresentActions` semi-auto capture (at most once per session, never silent), missing-runtime inertness, and `channel_group` / shared chat non-disclosure.
- Updated `skills/alva/SKILL.md` (Runtime Contract, Command Index, Routing) and `skills/alva/references/request-routing.md` (`Useful Next Step After Ask`, `Skillhub Blueprint`).
- Bumped `skills/alva/BOOTSTRAP.md` to `version: 2` and added Section `C. Local investing skills (one-way import)` to `skills/alva/references/agent-routine.md` (scan standard local agent skill dirs, filter investing/research skills only, sanitize/reject credentials, show confirmation checklist when user present, unattended = notify only, surface 409 conflicts without blind overwrite).

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`
