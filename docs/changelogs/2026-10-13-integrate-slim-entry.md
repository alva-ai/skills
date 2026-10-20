# refactor: integrate Slim entry with Full capabilities

## 1. Background and Current State

Sandbox loads `skills/alva`, while the ALPI Slim entry lives in sdk-monorepo.
The existing Full entry repeats procedures already owned by references.

## 2. Problem Model and End-to-End Behavior

B1: Preserve Slim's smallest-deliverable routing, restrained clarification,
current contracts, evidence boundaries, and outcome verification.
B2: Retain Full's quoted Thesis versions, guided drafting and GET preview,
one-off chat charts, Platform Data, background work, schedules, trading,
Automation, Playbook, memory and support paths.
B3: Explicit selection of original or displayed Thesis text authorizes that
payload; newly generated candidates still need selection. Preserve exact text.

## 3. Research, Findings, and Architecture Decision

D1: Use sdk-monorepo `340a301a5ea211e0b61edcd6b99c9a4125274018`
Slim's structure as the basis; adapt tools and memory to Sandbox.
D2: Keep the existing `alva` identity and loading path. Procedures belong to
existing references. ALPI-only Steward and native tools remain with that runtime.
D3: Preserve the conditional Full disclaimer and chart behavior. Scheduled
trading consent stays explicit and distinct from interactive order consent.

## 4. Implementation Design

Serial checklist:
- [x] Replace the Full entry with Slim-based routing and Full capability links.
- [x] Move unique Ask, chart, communication and build procedures to their owners.
- [x] Integrate original-text Thesis consent with guided drafting and previews.
- [x] Check reference reachability, retained contracts, and actual materialization.
- [x] Review complete diff and record focused verification.

Companion Sandbox record:
`code/backend/sandbox-agent-ts/docs/changelogs/2026-10-13-slim-skill-integration.md`
(relative to mono-meta). First-batch prefill fixes remain in place.

## 5. Verification and E2E Design

Migrate existing documentation assertions to canonical locations without
removing the capability or safety assertions. Run documentation and mutation
checks, durable-agent checks, link validation, and actual Sandbox profile
materialization. Runtime model behavior and latency need the separately owned
real-turn comparison before release; structural checks do not establish them.

## 6. Human Decisions and Interaction

User approved tasks 1 and 2 on 2026-10-13: integrate from Slim, retain useful
Full capabilities, and make only necessary changes with no extra Chat profile.

## 7. Outcome and Evidence

Entry: 911 -> 182 lines (72,723 -> 14,796 UTF-8 bytes). The existing
`alva` bundle and profiles remain the loading contract. No runtime code changed.

Verified against the final tree:

- `node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/alva-tasks12-docs-final.md`: 96/96 cases, 1029/1029 checks.
- `node evals/alva-skill-docs/mutation-smoke.mjs`: 24/24 deleted-rule mutations rejected.
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`: 5/5 passed.
- Markdown link comparison against the pre-change bundle: no new broken file
  or anchor links; all 43 direct entry reference targets exist.
- `bun /tmp/alva-tasks12-materialize.ts`: real materializer passed for ask,
  channel, and channel_group; exact reference copies, reuse and existing-session
  refresh checked. Chart procedure is copied on demand, not inlined into base.
- `git diff --check`: passed.

The existing checks now follow the moved rules. Chart assertions formerly in
Sandbox's base-prompt test moved to the design-reference checks. Full evidence,
release, consent, exact-version, retry and XML contracts remain covered.

| Item | Implementation and evidence | Status |
| --- | --- | --- |
| B1 / D1 | Slim-shaped entry, Sandbox tool adaptation, focused question/help rules; structural and materialization checks | DONE |
| B2 / D2 | Existing references retain Full capabilities and receive former inline rules; links, contract and mutation checks | DONE |
| B3 | Explicit original/candidate selection authorizes exact payload; unselected drafts remain gated; documentation checks | DONE, real-turn behavior pending |
| D3 | Conditional disclaimer and one-off chart flow retained; scheduled consent moved intact; mutation/contract checks | DONE |

Reviewed the complete local Skill and companion Sandbox diff. Fixed stale
references to removed entry sections and kept scheduled consent in its owner.
These are source/loading checks, not model-quality or latency evidence.

### Follow-up clarity review

Reviewed the entry, owning references and Sandbox profile together, following
ordinary concept discussion, quoted Thesis, Thesis lifecycle, resource changes,
current-topic scheduling and Playbook visibility requests.

| Finding | Risk before correction | Minimal correction | Status |
| --- | --- | --- | --- |
| R1 / P2 | Generic Ask and keyword-based complex gates could override direct concept answers or fetch a quote unnecessarily | Scope gates to evidence-dependent claims; add concept/current-evidence examples and preserve no-fetch paraphrasing | Fixed |
| R2 / P2 | The combined Thesis row implied a creation preview after update, close or delete | Scope preview to creation and verify each other operation's requested state | Fixed |
| R3 / P1 | Schedule CLI defaults could override current-topic targeting supplied by channel tools | Prioritize self-bound channel tools; explicitly distinguish CLI default channel and ALPI Inbox targets | Fixed |
| R4 / P2 | Resource management pointed to an unspecified lifecycle and could inherit creation gates | Map existing resource operations to their owners and verify only the requested state | Fixed |
| R5 / P1 | Copied “Grant read” rule could cause a forbidden ALFS grant or publicize private data | Use feed visibility for public access; preserve and verify private viewer access; respect draft stopping points | Fixed |

Fresh verification after these corrections:
- Documentation checks: 97/97 cases, 1045/1045 assertions
  (`/tmp/alva-review-clarity.md`).
- Mutation smoke: 24/24; durable-agent tests: 5/5.
- Materialization probe: ask/channel/channel_group, reference copies and refresh passed.
- All 101 Markdown links/anchors in the four edited instruction files resolve.
- `git diff --check` passed. No runtime implementation or additional profile changed.

At that follow-up stage, the communication policy still concentrated substantive content
in the final message, and ticker setup follow-ups still retain their mandatory
rule. Those remain visible follow-up work under the conversation task; this
review does not claim multipart behavior or measured latency improvements.

### Final combined review before EVAL (2026-10-13)

Reviewed all local Skill/reference, Sandbox base/persona/Channel, and existing
check changes against Skills `6ab926e95df8247bd16e98ccb878a4924358eda4` and
Sandbox `b69be4b17672502ac5cdc4e2170ee2bfa2fb48e0`. No staged changes or runtime
implementation changes are included. Backend and local-dev are outside this diff.

- R6 / P2 fixed: generic "sharing" could select Playbook for ordinary shared
  research or Thesis content. The entry now names shareable investing apps.
- R7 / P2 fixed: the default persona demanded a live URL for every build.
  This now applies only to a published Playbook; other work returns its own result.
- R8 / P2 fixed: the authorized static-snapshot exception conflicted with the
  unconditional feed-build step, edit rule and screenshot/completion wording.
  The existing Playbook branch now consistently accepts sourced, dated snapshots;
  live Playbook data still requires feeds and rendered-data verification.
- User clarification: unconditional memory reading is acceptable; no further
  change was made to standalone preflight during this review. Existing task-4
  context reuse rules remain. Broader Investment Thoughts renaming is deferred.

Final checks: skill-doc-eval 97/97 cases and 1050/1050 assertions;
mutation-smoke 24/24 rejected mutations; durable-agent tests 5/5;
Sandbox agent/Codex tests 94/94; `make typecheck` passed; `make lint-fix`
checked 38 files without edits; actual ask/channel/channel_group materialization,
reference copying, reuse and refresh passed; 232 Markdown links/anchors resolve;
both `git diff --check` checks passed. Trade Setup blocks, Altra/broker rules,
CSS source blocks and the formatted memory receipt remain intact.

No further blocking issue found in the changed instructions or loading paths.
These are source/structure/loading checks, not proof of model behavior or speed.
Handoff: `/Users/leozhou/.codex/visualizations/2026/10/10/01a124ea-73ec-7172-a50f-509e64b334f3/alva-skill-final-review.md`.

## 8. Remaining Work

Real-turn EVAL is owned by the other session. Publish the compatible Skill
bundle with the companion Sandbox prompt changes after acceptance.
