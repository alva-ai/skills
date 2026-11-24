# Retire the AlvaAsk Feed pattern (v1.33.1)

Local record. Primary record: sdkhub
`docs/changelogs/2026-11-24-retire-alvaask.md`.

The gateway no longer serves the `AlvaAsk` relay operation and the runtime no
longer loads `@alva/alvaask`, so `references/feed-sdk.md` no longer teaches
"Pattern E: AlvaAsk + Declared Alert Output". A short note in its place says
the module is retired and points bounded LLM reasoning inside a Feed at
`Agent.ask()` from `@alva/pi` (`alpi.md`), with the result in a declared alert
output (Pattern D).

Version: v1.33.0 → v1.33.1 (`skills/alva/SKILL.md`, the literal assertion in
`evals/alva-skill-docs/cases.json`).

## Checks

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`: exit 0.
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`: 95/95 mutations failed as expected.
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`: 5 pass, 0 fail.
- `git grep -n -i alvaask -- skills`: only the retirement note.
