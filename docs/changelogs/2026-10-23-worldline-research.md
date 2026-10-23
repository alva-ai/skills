# Worldline as an optional research source

## 1. Context
Worldline was removed from search guidance. Read-only production probes on 2026-10-23 found useful captured passages and working asynchronous reads, with relevance, attribution and coverage limits. SDK main is 1.12.0. The user approved restoring research access in Full and Slim EN/CN, letting the conversation model choose whether and how deeply to query.

## 2. Behavior
B1: Make curated statements/transcripts/event context discoverable early in investment research and Thesis discussion, without a mandatory call or failed-search prerequisite.
B2: Explain semantic/keyword, entity/attribution and follow-up reads; reuse current evidence and Signals.
B3: Prefer async independent reads, retain partial successes, preserve provenance and time/coverage limits. Unavailable Worldline does not block other supported research or bypass access restrictions.

## 3. Design
Use the existing capability index and search.md; Fintwit points to the same section. Full uses alva run, Slim its native javascript tool. No new runtime/profile/tool, no new model invocation, no API or deployment change. Existing X live-search and structured-data contracts remain. User approval covers this document-only scope; language sync retains each runtime's execution form.

## 4. Implementation checklist
- [x] Add one capability row and one Fintwit pointer per variant.
- [x] Add capability/method/evidence/depth guidance and executable async example to search.md.
- [x] Remove the superseded Full doc assertion forbidding Worldline; update the existing search case.
- [x] Verify examples and documentation, review complete scoped diff.

## 5. Verification
From Skills: node evals/alva-skill-docs/skill-doc-eval.mjs; node evals/alva-skill-docs/mutation-smoke.mjs; node --test evals/alva-skill-docs/durable-agent.test.mjs; git diff --check.
From sdk-monorepo with Node >=24.20: node --test skills/alpi-slim-skill/test/*.test.mjs; git diff --check. Execute the examples extracted from final Markdown, including a mixed-success async probe. Neither repo defines make lint-fix. Full local stack E2E not required for documentation; real-chat quality/latency belongs to targeted Eval before rollout.

## 6. Decisions and boundaries
Reuse existing content-legitimacy rather than adding a policy layer. The initial lookback/count are examples, not research caps. Parallel awaits do not promise nonblocking chat delivery. Preserve the prior uncommitted agent-reliability changes; no production configuration or data writes.

## 7. Outcome and evidence
B1-B3 implemented in Full / Slim EN / Slim CN. Full doc 110/110, 1281 checks; mutation 48/48; durable-agent 5/5. Slim tests 61/61. Extracted final Markdown examples passed 34 execution checks (normal, concurrent partial/all failure, missing async relay; EN/CN snippet parity). Full example executed read-only via production alva run: completed, 5 hits, budgetExceeded retained, CLI 2.35s. Both repos git diff --check clean; no make lint-fix target.

Review: checked capability discovery, X/general search coexistence, source legitimacy, Signals reuse, pagination, mixed outcomes and Full/Slim execution differences. Corrected pagination wording to make expansion discretionary and distinguish budget paging from increasing ranked-hit count. Runtime protocols and existing permissions unchanged. Static/example evidence does not prove real-chat quality or speed. No push/deployment; awaiting targeted Eval as requested.

Handoff: /Users/leozhou/.codex/visualizations/2026/10/10/01a124ea-73ec-7172-a50f-509e64b334f3/phase4-worldline-20261023/Worldline-改动与定向Eval说明.md.

## 8. Remaining work
Targeted Eval: discretionary selection, retrieval value, attribution, partial/empty/failure handling, Signals reuse, latency/turns, Full/Slim runtime parity. No release or production activation is claimed.

Entry-point refinement: at the user’s request, the existing Worldline capability row now explicitly encourages consideration in investment research and Thesis discussions, with reads and depth chosen as needed. Applied to Full and Slim EN/CN; no mandatory lookup, additional routing step, or changes to search.md.

Entry refinement verification: reran `node evals/alva-skill-docs/skill-doc-eval.mjs` in Skills and `node --test skills/alpi-slim-skill/test/*.test.mjs` in sdk-monorepo; both passed (110/110 documentation cases, 61/61 Slim tests). Both `git diff --check` passed. Reviewed the three entry rows for EN/CN parity, unchanged reference targets and discretionary wording. No tests or runtime files changed for this refinement.

Source-link refinement: user-facing claims using Worldline material now cite original URLs beside the supported point. Links are woven naturally into the answer with program/channel names or source titles as Markdown labels, using person/event names when unambiguous; no bare URLs or fixed Source suffix. Playback time may appear in the label. Prefer recorded passage timestamps for supported audio/video links; context offsets may reference a different speaker turn. Unknown seek support falls back to original URL plus known playback time, with no invented offset. Synchronized Full/Slim EN/CN search.md only. Fresh read-only Contribution probe returned a YouTube source with [01:14:01] evidence and an MP3 source with [spk 3 @ 109.42]; source.url is the original URL, not a dedicated passage URL. No end-to-end player seek guarantee is claimed.

Source-link validation: reran Skills `node evals/alva-skill-docs/skill-doc-eval.mjs` (110/110, 1281 checks) and sdk-monorepo `node --test skills/alpi-slim-skill/test/*.test.mjs` (61/61), plus both `git diff --check`; all passed. Reviewed citation wording against provenance rules and current SDK SourceMetadata/ContextPassage contracts; no runtime or SDK changes. Added citation/seek checks to existing interview Eval scenario.

## Targeted Eval refinement (2026-10-23)

Approved scope: clarify only research follow-through, publication cutoff parameters and long-transcript reading in Full/Slim EN/CN search.md. Preserve autonomous selection, async examples, citation rules and existing source/permission boundaries. No new tests, runtime, SDK or routing changes.

Evidence: Worldline Full Eval W03 r3/r4 stopped at attributed market claims despite existing central-check guidance; this is an observed behavior, not proof of a unique prompt cause. S13-A attempted unsupported publishedToMs. W04 r2 returned a full Observation then fetched it again to slice text after truncation. Current SDK 1.12.0 recall.ts supports publishedFromMs but no publishedToMs; indexedBefore is an indexing boundary. batch-reads.ts/index.ts accept ids/view for Observations, with full adding transcript.turns alongside payloadJson; no passage-range API. Existing repository code and captured traces settle these contracts; external research unnecessary.

Implementation: retain attributed viewpoints, and connect consequential factual claims to available original evidence without a mandatory extra source; explicitly describe local publication-cutoff filtering and the indexing/publication distinction; start with recall evidence/context, expand through an Observation when needed and select passages in the script while preserving source, speaker, offset and sufficient surrounding context. No fixed passage/query limit. Changes are limited to the three search references and existing changelogs, plus an external Eval handoff.

Verification plan: run existing Full doc/mutation/durable checks and Slim tests, review the three-language incremental diff and full Worldline section. No new string-matching tests for prose edits. Real conversational behavior requires targeted paired Eval: W03, W04, S13-A, with S10-E/W01/W02 controls. Preserve the pre-refinement search files externally so the next comparison isolates these three refinements from the already-added entry/citation wording.

Refinement validation and review: Skills `node evals/alva-skill-docs/skill-doc-eval.mjs` passed 110/110 cases (1281 checks), `node evals/alva-skill-docs/mutation-smoke.mjs` passed 48/48, and `node --test evals/alva-skill-docs/durable-agent.test.mjs` passed 5/5. sdk-monorepo `node --test skills/alpi-slim-skill/test/*.test.mjs` passed 61/61. Both `git diff --check` passed. Reviewed the complete Worldline section, capability/Fintwit pointers and existing evidence gates; Full/Slim English differ only in the intended execution wrapper, and Chinese preserves the same scope. Existing executable examples are unchanged; no new test files or assertions. No changes to prior agent-reliability edits. Real research depth, transcript selection and latency remain unverified pending Eval; no commit, push or deployment.

Latest handoff: /Users/leozhou/.codex/visualizations/2026/10/10/01a124ea-73ec-7172-a50f-509e64b334f3/phase4-worldline-20261023/research-refinement/Worldline-研究核验与读取-定向复测说明.md.

Time semantics refinement: distinguish source publication timestamps, schema-specific event dates (including scheduled vs occurred), and cluster member publication ranges. Per user direction, observed/indexed processing times are not shown or used to date/rank/judge content freshness; retain index boundaries solely as required SDK retrieval/pagination inputs. Missing source/event dates require source verification. Synchronized Full/Slim EN/CN and updated the existing targeted Eval date scenario and candidate hashes. No runtime/test changes.

Time refinement verification: Full documentation 110/110 (1281 checks), Slim tests 61/61 and both diff checks passed. Reviewed EN/CN field semantics against SDK SourceMetadata/RecallHit/ClusterState and the unchanged retrieval contract; Full/Slim English time paragraphs match. Existing earlier mutation/durable results are not a new run for this prose-only follow-up. Actual conversational date handling remains for targeted Eval.

PR preparation: synchronized current main and preserved its Thesis preview fixes. Candidate Full version is v1.26.5. Fresh checks after synchronization: docs 110/110 (1282 checks), mutation 49/49, durable-agent 5/5. Latest SDK main is Worldline 1.13.0; these examples retain the compatible 1.12.0+ async read subset and need no new API. Reviewed the net diff against main, including disclaimer, Thesis, Automation and Worldline changes.

SDK 1.13.0 follow-up: reviewed merged sdk-monorepo #398 and Gateway #1085 contracts. Added optional matchContributions guidance to Full/Slim EN/CN for attribution-scoped multi-angle reads, with required inputs, OR/AND meaning, output size, distinct pagination, separate match evidence and old-host fallback. Existing recall examples remain unchanged. Merge status does not establish production availability or latency; validate before relying on the new route.

Combined-read guidance validation: Full docs 110/110, mutation 49/49, durable 5/5; Slim 61/61. Reviewed method/field names against SDK 1.13.0 source and README. No runtime call or speed claim for matchContributions; include attribution-scoped coverage, empty-page continuation, large-output selection and old-Gateway fallback in targeted Eval.
