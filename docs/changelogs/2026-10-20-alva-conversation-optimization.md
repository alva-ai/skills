# Alva conversation-first Skill

## 1. Context

Alva's primary interaction is investment research and thesis discussion in an
ongoing conversation. The Full entry repeated operational procedures and made
simple questions inherit setup, discovery and build requirements. The ALPI Slim
entry offered a smaller structure but did not cover all Sandbox capabilities.

This is the consolidated record for the batch. The companion
[Sandbox changelog](../../../../backend/sandbox-agent-ts/docs/changelogs/2026-10-20-alva-conversation-optimization.md)
covers communication, context use and background-task handoff.

## 2. Intended behavior

- Choose the smallest deliverable that completes the request. Explain stable
  concepts and discuss supplied ideas directly; verify current claims and
  apply analysis gates to the judgment actually requested.
- Reduce repeated preparation by reusing supplied context and applicable
  documentation. Preserve current contracts, source provenance and result
  verification.
- Keep useful Full capabilities available on demand: quoted Thesis versions,
  publication, charts, Platform Data, Automations, schedules, Playbooks,
  Altra, trading, memory and support.
- Use relevant user context without treating reading, saving or following as
  agreement, holdings or a durable preference.

## 3. Design decisions

Use Slim's smallest-deliverable structure within the existing `alva` bundle;
Sandbox continues loading that bundle. The Slim reference was sdk-monorepo
`340a301a5ea211e0b61edcd6b99c9a4125274018`. Runtime-specific ALPI tools remain
in their own references.

SKILL.md selects capabilities; references own their procedures. Keep a compact
command index so compression does not turn known navigation into tool calls.
The MUSE review informed shorter execution paths, selective follow-up suggestions
and removal of repetitive process prose; final answers remain self-contained.

Thesis authorship follows upstream #648: the user owns their claims, and the
Agent's editorial assessment belongs in unpublished Notes. Explicit selection
of the final body authorizes that payload; a newly drafted candidate still
requires selection. These Notes are separate from Playbook Creator Notes.

## 4. Implementation

- **Entry and routing:** 212-line SKILL.md, command index, simple price/identity
  path separate from company analysis, and judgment-based research triggers.
  Detailed build, chart and scheduled-trading procedures remain in references.
- **Data access:** reuse applicable documentation; known US equity price/history
  requests fetch the current stocks-kline contract directly, with discovery
  fallback. Intraday requirements for current prices remain.
- **Price basis:** missing adjusted-close fields do not establish unadjusted
  prices. Check documented basis and event coverage by effective date; query
  dates may differ. Stop guessed-document and generic-search exploration when
  authoritative documentation leaves the basis unresolved. Never invent an
  adjustment or relabel ordinary closes.
- **Context:** independently reuse identity, global memory and channel memory
  prefill. Fetch relevant missing/stale state within its allowed scope.
  Explicit profile inspection reads stored state; an unqualified request to
  ignore memory covers both scopes for that request.
- **Thesis:** focused discussion, author-preserving drafts and rewrites, exact
  selected-body publication, asset resolution, version-aware quoted context,
  GET-backed creation preview and existing lifecycle controls. Material internal
  inconsistencies or unfinished passages are flagged in Notes before create;
  an explicit request still authorizes the unchanged body without another
  confirmation. Notes never enter the publication payload.
- **Reference cleanup:** remove Creator Notes; avoid mandatory pipelines for
  chat answers, repeated reads, unnecessary search expansion and producer
  reruns for metadata-only changes. Reuse the shared CSS bundle.
- **Preserved capabilities:** Playbook reuse, feed reads, README, lint, release,
  screenshots and remix lineage; Altra/broker approvals; Trade Setup unchanged;
  conditional disclaimers; scope and provenance for memory writes.

## 5. Verification approach

Run documentation regression, mutation smoke and durable-agent tests; inspect
reference links, deleted-file references, conflict markers and whitespace.
Check the actual Sandbox consumer and backend contracts with the companion
change. Static assertions check instruction coverage, not model compliance.

E2E Required: no for this documentation integration. Real-turn acceptance uses
the existing Eval effort and must verify which Skill bundle was loaded.

## 6. Scope and approval

User approved the minimal Skill/Sandbox optimization, removal of Creator Notes,
upstream integration, local commits and one consolidated changelog per repository.
Keep Trade Setup and trading/publication boundaries. Memory schema renaming is
deferred. Work remains local for cross-review.

Upstream comparison base: Skills `411ea14`; companion Sandbox `89639fd`.
Backend `f6cebd5` supplies the current task-mailbox contract without local edits.

## 7. Outcome and evidence

The merged implementation preserves the compact entry and upstream v1.25.0
authorship rules. Final product-tree checks:

| Command, from this repository | Result |
| --- | --- |
| `node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/alva-final-notes-check.md` | 100/100 cases; 1090/1090 checks |
| `node evals/alva-skill-docs/mutation-smoke.mjs` | 28/28 mutations detected |
| `node --test evals/alva-skill-docs/durable-agent.test.mjs` | 5/5 |
| `git diff --check` and reference/conflict checks | Passed; existing memory example link to `user.md` unchanged |

The current CLI successfully retrieved the known stocks-kline contract.
This establishes endpoint availability, not adjustment semantics or latency.

The Oct 20 paired Eval compared the Oct 18 frozen candidate with the version
before the final direct-endpoint, concise-preference and bounded-search edits.
Current quote, historical close and security identity took approximately
38→33, 32→29 and 59→43 seconds; research, background handoff and backtests held
in those cases. Concise-preference replies remained around 400 words, and the
adjusted-price chart remained incomplete. The final edits and mailbox prompt
integration have not yet received real-turn acceptance.

## 8. Remaining work

- Verify direct price entry and unknown-endpoint fallback, concise-first replies
  with explicit-depth override, and bounded adjustment verification.
- Obtain authoritative price-basis semantics; do not claim adjusted-chart
  recovery from correct reported-close calculations alone.
- Verify merged author-preserving edits, unpublished Notes and explicit
  selected-body publication in real turns, including Notes-before-create ordering
  without redundant confirmation.
- Exercise a new Playbook build and a remix before release; recent targeted
  Eval did not cover them. Background child traces were collected in the latest
  Eval and are no longer an outstanding collection prerequisite.
- Publish/load this candidate Skill with the matching Sandbox prompts after
  acceptance; the upstream dependency-lock version alone does not identify
  the local candidate.
