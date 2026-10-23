# fix: third-batch agent reliability

Check model stopReason before extracting final text in existing Full alpi.md example.

Primary design: mono-meta/code/backend/alva-backend/docs/changelogs/2026-10-23-agent-reliability.md. User approved the minimal scope on 2026-10-23. No production deployment.

## Verification

Full doc 110/110 (1277 checks), mutation48/48, durable5/5; actual Markdown result examples exercised in combined41-check probe. Full malformed-JSON fallback removed to preserve errors, matching existing contract. git diff --check passed. Complete local diff reviewed; no make lint-fix target. No production rollout or push.
