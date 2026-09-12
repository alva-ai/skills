# Existing Session Inbox schedules

Implements the documentation portion of alva-ai/alpi#130. Primary approved plan:
`alva-backend/docs/changelogs/2026-09-01-session-inbox-schedule.md`.

- Preserve terminal Channel defaults; document explicit canonical `--inbox-path`
  on all five lifecycle commands and self-only embedded commands.
- Explain Backend-owned durable wakes, strict same-Session restoration, busy
  deferral, no execution-error retry, and unchanged unacked Inbox replay.
- Preserve trading consent and legacy Channel Loop contracts without changes.
- Add deterministic documentation checks and mutation tests for the two most
  important failure boundaries. No Skill publication or version release.

Verification pending below; this is not a deployment record.

Verified with CI Node 20.19.0 in a network-disabled local container:
- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`:
  91/91 cases, 944/944 checks.
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`:
  21/21 mutations rejected as expected, including new retry/fallback omissions.

## 7. Outcome and review evidence

On 2026-09-02, refreshed the publication base to `e6d9c97` and reviewed the
complete documentation/evaluation diff against the approved primary sections
1-6. B2/B8, D3/D4/D5, F3 and R6 are implemented: terminal and embedded targets
are distinct; execution failure is terminal for AutoRun; normal unacked Inbox
recovery remains possible. Existing trading consent was not changed.

Fresh CI-equivalent Node 20.19.0 verification passed against that base:
`node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`
(91 cases / 944 checks), and
`node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`
(21 mutations). Both ran in the official Node container with networking disabled
and the source mounted read-only. No formatter/linter target is configured for
this documentation boundary; these are the repository's required CI commands.

Review covered behavior/scope, documentation consistency, falsifiable omission
checks, credentials/target boundaries, and publication ordering. No actionable
finding remains. E2E Required for this documentation-only PR: no; it adds no
runtime behavior. The primary feature's coordinated E2E and rollout remain
separate and are not claimed complete by these text regression tests.

## 8. Remaining work

Merge/release this documentation only with the companion Inbox Schedule
capability available. Toolkit PR #170 is the CLI provider; Backend/Gateway and
ALPI/Jagent providers remain separately reviewed. No Skill version bump, registry
publication, deployment, or live model call is authorized or performed here.
