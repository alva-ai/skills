# Drop built-in automation routes and offer actions for predictable next steps

The channel profile no longer exposes `CreateAutomation`, so new daily briefs,
portfolio monitors, and market screens follow the custom automation workflow.
This skill record removes the matching routes: the `CreateAutomation` mention in
SKILL.md, the `alva/alpha-radar-setup` and `alva/portfolio-watch-setup` fast
paths, and the Alpha Radar / Portfolio Watch naming in request routing and the
ticker-read Trade Setup follow-up. `alva/trade-setup-automation` stays the one
official fast path. Existing automations and their `alva automation` management
are unchanged.

Next-step wording now matches the channel profile: a suggested next step pairs
one short sentence, not necessarily a question, with a `PresentActions` action
when available; actions appear only when the next message is predictable, and
free-form answers or requests for the user's own reasoning stay plain text.
`AskUserQuestion` covers questions needed before any substantive reply.

Primary implementation record:
sandbox-agent-ts docs/changelogs/2026-11-04-remove-builtin-automation-routes.md

Verification: skill-doc-eval (no failed cases), mutation-smoke (49/49), and
durable-agent tests (5 pass). No release or runtime deployment was performed.
