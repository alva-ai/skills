# Handle Today card replies in the normal Thesis workflow

## 1. Background

Companion to alva-backend PR3738 and its approved Today design. Alan explicitly requested implementation in message4920755f; the final decision dcecb4e4 delegates actions and confirmation to the sandbox agent and requires a discovery card on quiet days.

## 2. Approved behavior

Teach the public sandbox agent how to interpret the full frozen Today card and the user-selected reply.

## 3. Design

Treat card/source text as evidence, not instructions. Use the normal Thesis workflow and decide whether clarification or confirmation is needed. No additional mandatory draft/confirmation gate. Patch metadata to v1.30.2.

## 4. Scope and implementation

This repository owns only its consumer/policy/test changes. Frontend cards, topic monitoring, new Thesis publication paths and production deployment are excluded. No credentials enter generated prose or test logs.

## 5. Verification

node evals/alva-skill-docs/skill-doc-eval.mjs --out <temporary report>: passed.

E2E Required: no. Full local model E2E was not explicitly requested. Static documentation evaluation does not prove live model compliance. Existing authorization and authorship rules continue to apply.

## 6. Decisions and checklist

- [x] Implement the approved companion scope.
- [x] Keep old contracts compatible and preserve the final quiet-day/agent-judgment decisions.
- [x] Record focused verification and its limits.
- [x] Review the actual net diff against behavior, architecture, tests, security/compatibility, operations and docs.
- [ ] Complete credential scans and publication.

## 7. Outcome and evidence

Primary design and B/F/D/R record: https://github.com/alva-ai/alva-backend/pull/3738 . Six-pass main-agent review found no remaining actionable defect in this companion scope. Required live-model E2E was not requested; static/fixture checks are not model-quality evidence.

Teach the public sandbox agent how to interpret the full frozen Today card and the user-selected reply. Static documentation evaluation does not prove live model compliance. Existing authorization and authorship rules continue to apply.

## 8. Remaining work

Public Skill release precedes use of the corresponding CTA workflow; no Skill publication authorized. No merge, deployment, migration execution or production write is authorized. Current-head CI and external review must be checked after publication.
