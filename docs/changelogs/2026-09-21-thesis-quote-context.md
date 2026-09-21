# docs: route quoted Thesis questions to existing read APIs

## 1. Background and Current State

The current Thesis reference covers publication/lifecycle. Feed Ask Alva will
carry a selected Thesis/author version in reply_to attributes.

## 2. Problem Model and End-to-End Behavior

Read-only questions must use the selected version and accessible evidence without
publishing, editing or exposing private source sessions.

## 3. Research, Findings, and Architecture Decision

Reuse exact-version/history REST, thesisSignals GraphQL and authorized numeric
chat sessions. Research runtime IDs are not ordinary session IDs. No new CLI.

## 4. Implementation Design

Append a compact Quoted Thesis context section to thesis.md and route to its
anchor from SKILL.md and request-routing.md. Preserve existing publication
sections; scope the introductory CLI-only rule to that workflow. Primary record:
frontend-monorepo repository,
`docs/changelogs/2026-09-21-feed-thesis-quote-context.md`.

## 5. Verification and E2E Design

Run doc eval and mutation smoke; inspect request examples against Gateway's pinned
schema. Live Agent read verification is separately required before release.

## 6. Human Decisions and Interaction

User approved hidden quote context and minimal scope; local review only, no PR.

## 7. Outcome and Evidence

Added `references/thesis-context.md` and minimal entry points in SKILL.md and
request-routing.md. Publication guide remains unchanged; top-level guide remains
911 lines. Existing exact-version/history REST and Signal/session GraphQL shapes
were checked against the pinned Gateway source.

From this repository:

```sh
node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva
node evals/alva-skill-docs/mutation-smoke.mjs
node --test evals/alva-skill-docs/durable-agent.test.mjs
git diff --check
```

Final results: exit 0; 93/93 cases, 1008/1008 checks; 21/21 mutation smoke;
5/5 durable-agent tests; clean diff whitespace check. Document checks prove
regression properties, not actual runtime retrieval. No commit, push or PR.

External-review follow-up: closed the JSON inline-code delimiter, replaced the
checkout-only cross-repository link with plain repository/path text, and added
`target.thesis-quote-context` covering both routing entries and read-only,
exact-version, multi-version evidence and private-session boundaries. Two mutation
checks remove the skill route and exact-version guard independently. Doc eval:
94/94 cases, 1016/1016 checks; mutation smoke: 23/23. These are documentation
regression checks; live Agent E2E remains unverified.

User-approved consolidation: removed the separate 138-line thesis-context.md
and appended a 40-line section to thesis.md. Existing headings and publication
instructions remain in their original order; only two introductory statements
were scoped to the publication workflow. Shared authentication/runtime guidance
is linked instead of repeated. Routing and regression/mutation checks now target
`thesis.md#quoted-thesis-context`. This supersedes the separate-file design above.
Validation: 94/94 doc cases (1016/1016 checks), 23/23 mutation checks, GraphQL
schema validation and whitespace checks pass. No frontend behavior changed.

## 8. Remaining Work

Live Agent context preservation, runtime authentication and permission-scoped
retrieval remain unverified. Local backend startup failed because the local-dev
submodule is uninitialized (no go.mod). See the primary changelog for evidence.
The frontend and this skill must both be available for the full feature; neither
has been deployed. The user subsequently authorized local commits after a
simplicity review; push and PR creation remain excluded.
