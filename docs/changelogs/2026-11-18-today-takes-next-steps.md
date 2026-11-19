# feat: align Today takes and next steps in skills

## 1. Background and Current State

Today currently couples every take to at least one reply, omits Thesis
watchpoints, and renders the full TASK label on buttons. TASK targets cannot be
supplied and accepted reply execution text is reconstructed by the current
binary. Alan's Nov18 design reports 65 of 108 STG cards had no analysis. Those
sample counts are supplied product evidence, not newly measured in this change.

## 2. Problem Model and End-to-End Behavior

- B1: TAKE supports zero to two replies; QUESTION still exactly two TASK
  answers.
- B2: Existing authored/body and card-material reads include complete watchpoint
  groups when supplied; absent/off environments provide empty groups.
- B3: TASK buttons use taskTitle; label remains the full request/chat message.
- B4: TASK may target a reader-authored Thesis independent of the card anchor.
  Current read/author/availability checks precede accepting and dispatching it.
- B5: Selecting an existing-Thesis edit consents to that scoped update and
  publication after reading the current body; a newly authored Thesis returns a
  draft for confirmation. Previously accepted replies retain original execution
  text.
- B6: ADD_TO_WATCHLIST is an ACTION on a TICKER anchor without a frozen holding
  or watchlist relation. Use canonical ticker resolution and existing idempotent
  follow owner; repeated delivery does not duplicate membership.
- F1: Foreign/inaccessible/closed targets and unknown actions fail closed.
- F2: One durable choice per card, immutable card evidence and retry identities
  remain intact. No silently dropping sources to make generation pass.

## 3. Research, Findings, and Architecture Decision

- D1: Extend existing enum/optional reply Thesis ID; do not add reply kinds or
  new endpoints. Retain separate card anchor and task target ownership.
- D2: Host still owns evidence/eligibility; English/Chinese Slim owns writing.
- D3: Store nullable private reply_execution_text at acceptance under the card
  lock. NULL on pre-change rows selects the exact legacy template. Persisting
  text is preferable to a deploy-time cutoff or inferring version from UUIDs:
  retries must preserve byte identity across rollouts and future copy changes.
- D4: Watchlist writes use Markets' existing authenticated follow service, never
  a new Today-owned membership store.
- R1: Mixed old binaries cannot accept new TASK targets or enum values; Backend
  and Gateway must deploy before new writing policy/clients.
- R2: The new reply execution column requires additive DB migration first. No
  production migration or model/device acceptance is authorized here.

## 4. Implementation Design

Backend owns JS read/compose validation, Today content/storage and reply
acceptance/dispatch, proto enum generation. Gateway adds the enum and
regenerates GraphQL from schema, using the new Backend API module. Feed/Web
choose taskTitle for TASK and render the new ACTION completion. Public Skills
owns Thesis consent.

The two existing publication selections add watchpoints { id, label, text, origin }. Complete card-material groups count toward the existing material budget; an over-budget record is
omitted with incomplete state, never clipped into an apparently complete group.

TASK.thesisId must appear in the frozen authored manifest; storage accepts only
positive IDs and server checks real caller-readable current Thesis author_kind
and author_ref. Dispatch rechecks selected targets. No foreign anchor
inheritance. Fresh normalization only removes redundant ACTION IDs, retaining
TASK targets.

reply_execution_text is nullable TEXT, set atomically with choice and turn ID;
legacy rows remain NULL and use LegacyReplyText. Reset clears this text together
with the choice. Additive nullable migration needs bounded lock/statement
timeout, no backfill; rollback keeps the inert column. Execute migration before
Backend; Backend then Gateway/API pin, then clients, then compatible Slim/public
policy. Do not publish new generation rules while old validators still serve
requests.

Authoritative docs: operations/steward_digest_run.md,
runbooks/today-reply-context.md, EN/CN steward_today.md, public thesis.md,
frontend Today feature docs.

### Serial Implementation Checklist

- [ ] Backend TAKE, watchpoints, task targets, source-safe validation and tests.
- [ ] Backend durable execution text/legacy recovery and scoped dispatch tests.
- [ ] ADD_TO_WATCHLIST proto, canonical Markets dispatch and tests.
- [x] EN/CN Slim and public Thesis policy, artifact/package validation.
- [ ] Gateway contract and generated model/client pin, focused tests/build.
- [ ] Feed/Web button/action consumer changes and focused checks.
- [ ] Full net diff six-pass review, secret scans, commits and linked PRs.
- [ ] Current-head CI/review feedback convergence and human handoff.

## 5. Verification and E2E Design

E2E Required: no — user requests implementation/PRs, not live model/device runs.
B1/B2/B4/F1: Node runner regressions plus Go Normalize/dispatcher tests. B5/F2:
real PG Today acceptance/recovery tests including legacy pending rows and
idempotent text. B6: enum roundtrip, eligibility and idempotent Markets
dispatch. B3: existing client test/type checks and focused rendered verification
where tooling exists; report missing native/web prerequisites distinctly.

Commands: node --test steward_today_run.test.mjs and adjacent Brief suites;
ENV=test TZ=UTC GOMAXPROCS=4 GOFLAGS=-p=2 go test affected packages; make repos;
make -C api proto; pinned make lint-fix (inspect unrelated churn). SDK package
and manifest tests/build-artifact; public Skills checks; Gateway make gql-gen,
go build/vet and resolver tests, pinned make lint-fix; Feed relevant Vitest,
changed-file Biome, workspace typecheck and architecture checks. No unrelated
workflow/tool/dependency upgrades; no substitute lint tool.

## 6. Human Decisions and Interaction

Alan 6d310127 (Nov18) approved this detailed direction and requested direct PRs.
Gateway and frontend are explicitly in this new scope, superseding the older
Gateway stop only for these necessary changes. Shared repositories remain
read-only; all implementation uses owned worktrees. No merge/release/deployment
authority.

## 7. Outcome and Evidence

B5 is DONE: a selected TASK may name a reader-owned edit target independent
of the anchor; fetch current body, preserve unrelated claims and publish only
the scoped agreed edit. New Theses return a draft to main chat for confirmation;
QUESTION selection is the answer. Existing GET-backed preview result/relay is
explicitly retained. Public Skill advances to v1.32.3.

`node --test evals/alva-skill-docs/durable-agent.test.mjs`: 5 PASS. This is
regression validation of existing durable-agent guidance, not behavioral proof
of a live Thesis write. The changed Thesis workflow and adjacent authorship,
publication, update and preview rules were manually reviewed for consistency.
Full offline doc regression `node evals/alva-skill-docs/skill-doc-eval.mjs
--skill-dir skills/alva`: 131 cases, 1591 checks PASS; mutation smoke: 78/78 PASS.
The version fixture was updated to v1.32.3 together with the manifest; its stale
v1.32.2 assertion caused the first CI failure. No behavioral assertion was removed.
`git diff --check`: PASS.

Main agent restarted and completed six serial passes after the version-fixture fix over the final net diff: behavior/scope,
ownership and retry boundaries, test quality, source/authentication and mixed
version safety, rollout/rollback, then documentation. No unresolved in-scope
finding remains. This is deterministic/doc validation, not a model-quality or
live publication result. No release was triggered.


## 8. Remaining Work

Wait for current-head CI/review and coordinate this policy with Backend #3808
and Slim 0.1.80. No live edit/publication, release or deployment was performed.

Primary design: alva-ai/alva-backend
docs/changelogs/2026-11-18-today-takes-next-steps.md.
