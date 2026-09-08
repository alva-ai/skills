# Durable Agent admission (#142 / #143)

The user requested implementation of ALPI architecture PR #143. Update canonical durable-Agent guidance to describe host-selected Sessions, Agent-before-Session ownership, zero-user-code duplicate/empty preflight, terminal failures after first user evaluation, exact Backend acknowledgement checks, live source updates and conservative joined-owner recovery. Main implementation and verification record: ALPI `changelogs/2026-09-08-durable-agent-admission.md`. No Skill publication or deployment is implied by source changes.

Canonical CI commands passed with Node 20.19.0 in the cached Linux image:
`node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`
(91 cases, 944 checks) and
`node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`
(21 mutations detected). These prove documentation regressions, not runtime E2E.
