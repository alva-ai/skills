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
Agent's editorial assessment belongs in unpublished Notes. Show the final body
or a clear reference to it, visibility and resolved assets/stances before
creation. One confirmation of that preview authorizes the exact payload; an
unchanged confirmed preview needs no second approval. These Notes are separate
from Playbook Creator Notes.

## 4. Implementation

- **Entry and routing:** compact SKILL.md, command index, simple price/identity
  path separate from company analysis, and judgment-based research triggers.
  Detailed build, chart and scheduled-trading procedures remain in references.
  Company-page linking and user-confirmed feedback for Alva-owned blockers
  remain explicit at entry. Completion no longer requires a whole-prose read;
  Thesis/raw-text link exceptions and exact existing disclaimer/header copy
  are available at entry. Detailed triggers remain unchanged. Feedback uses
  the user's language and still requires consent.
- **Data access:** six verified common recipes cover US kline (intraday and
  daily), company detail, SEC earnings releases, transcripts, search and URL
  reading. Four HTTP endpoints share one authenticated call with a fixed Arrays host
  and validated `/api/v1/` path; a current-price variant calculates a seven-day
  window at runtime and retains stale/empty-result boundaries. The two runtime
  SDKs retain their own auth. Recipe reads skip rediscovery/runtime-manual reads;
  mismatches return to current endpoint/SDK docs. Other work keeps discovery and
  runtime requirements. Markets selectors are documented without a mandatory
  help call; known independent reads can share a tool invocation. Security existence is verified, never denied from memory
  or a single missing result. Intraday requirements for current prices remain.
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
  inconsistencies or unfinished passages not yet considered by the author are
  shown in Notes and await their decision before create. An original-body request
  also gets a short visibility/assets/stances preview and awaits one approval;
  an unchanged confirmed preview needs no further confirmation. Notes
  never enter the publication payload. Reuse selected text without repeating it;
  show new/changed candidates in full. Keep internal IDs/API fields out of the
  preview and omit absent optional fields. Optional confirmation buttons have
  the same scope as a typed reply; old/repeated actions must not change the
  selected version or create duplicates. Existing Thesis
  status reads platform Signals without creating duplicate monitors; quoted
  versions, research gaps and source timing remain distinct. An unpublished
  viewpoint needs consent before publication, including private publication.
- **Recommendations and context:** For You exposes chronological and ranked
  reads with their different cursors, partial-page and access boundaries. Cards
  retain the selected author version. Discussion can naturally lead to a Thesis;
  capability help has no fixed footer and Automation is suggested for actual
  recurring value, without changing Trade Setup.
- **Reference cleanup:** remove Creator Notes; avoid mandatory pipelines for
  chat answers, repeated reads, unnecessary search expansion and producer
  reruns for metadata-only changes. Reuse the shared CSS bundle.
- **Evidence presentation:** retain source, timing, methodology, KPI and
  uncertainty checks while removing mandatory evidence/drawdown tables and
  KPI status lists. Cite key quantitative and qualitative facts; surface
  limitations that affect the judgment. Ticker synthesis checks selected
  layers without requiring a separate visible section for each.
- **Preserved capabilities:** Playbook reuse, feed reads, README, lint, release,
  screenshots and remix lineage; Altra/broker approvals; Trade Setup unchanged;
  conditional disclaimers; scope and provenance for memory writes.

PresentActions: show the substantive answer, suggestion or publication preview
and Notes before registering actions, then end the turn. Retain the existing
answer-before-actions sequence: Feed App and Web render action rows in call order,
so the proposed actions-before-final-reply timing has been withdrawn. Align the
Skill, chart-upgrade instruction, tool description and tool-result instruction.
Keep concise labels, typed/button consent equivalence, candidate scope and
ordinary AskUserQuestion clarification unchanged. Use authoritative Thesis URLs
with the existing completion-card fallback. No frontend or transport change is
included; invocation frequency and delivery across clients still need live Eval.

## 5. Verification approach

Run documentation regression, mutation smoke and durable-agent tests; inspect
reference links, deleted-file references, conflict markers and whitespace.
Check the actual Sandbox consumer and backend contracts with the companion
change. Static assertions check instruction coverage, not model compliance.

E2E Required: no for this documentation integration. Real-turn acceptance keeps effort fixed and runs both arms on fast, recording
the actual service tier and loaded Skill hashes. Earlier Standard timings are
not a directly comparable baseline.

Evidence-format verification: compare short news and ticker follow-ups,
missing-KPI judgments, and portfolio scenarios against the preceding candidate.
Check retained sources and uncertainty alongside reduced unnecessary structure.
An explicit request for a detailed comparison must still receive useful tables
and calculation assumptions. Keep persona and runtime identical between sides.

## 6. Scope and approval

User approved the minimal Skill/Sandbox optimization, removal of Creator Notes,
upstream integration, local commits and one consolidated changelog per repository.
Keep Trade Setup and trading/publication boundaries. Memory schema renaming is
deferred. Work remains local for cross-review.

The user approved a separate minimal evidence-format edit; persona stays for
the next batch. Checklist: update the two evidence references, align existing
doc assertions, run repository doc checks, and inspect the complete scoped diff.

The user approved restoring only the company-link and platform-feedback entry
triggers and removing the residual whole-prose read, with existing doc assertions
updated to cover those boundaries. Other capability-audit suggestions stay deferred.

Upstream comparison base: Skills `411ea14`; companion Sandbox `89639fd`.
Backend `f6cebd5` supplies the current task-mailbox contract without local edits.

Approved follow-up: repair entry link exceptions, inline existing disclaimer
copy, restore security-existence checks and user-language feedback; connect
platform Thesis research, selected-version Signals, recent notifications and
For You; simplify capability suggestions. Include all six verified read-only
recipes. Trade Setup remains unchanged. The approved small follow-up adds bounded recipe
arguments and a current-price variant, documented Markets selectors, batching of
independent reads, corrected Toolkit prerequisites and candidate version v1.26.0.
The companion Sandbox preserves the existing Codex runtime; the optional
summary override and its new tests are removed. Instruction hierarchy migration
stays separate because persona extraction and session restore require a broader
lifecycle change.

Serial checklist: (1) verify CLI/backend contracts; (2) repair entry rules;
(3) connect read-only discussion routes; (4) document and probe six recipes;
(5) update focused assertions, run checks and review the full scoped diff;
(6) probe the revised recipes; update Eval with both arms on fast and refresh
the committed candidate freeze, without runtime experiments.

Approved Search follow-up: use Arrays X Live Search first for tweet content
(`/api/v1/social-feeds/x/live-search`) and general search when access,
coverage or freshness is insufficient. Other unstructured research uses exposed
native search. Defer Worldline and remove its guidance. Remove GrokX guidance while
preserving Arrays financial/history reads and Fintwit performance/ranking feeds.
Align source rules narrowly for verified news and attributed source statements;
search summaries and generated text are not independent factual proof.

Checklist: (1) update search/fintwit/durable routing and the search recipe note;
(2) reconcile entry/source rules and the Sandbox source sentence;
(3) update existing document checks, run document/mutation/durable checks and the
Sandbox prompt test, and review the diff. No runtime change or new E2E is needed;
real-turn routing and optional parallel behavior remain Eval checks. Preserve the
previously frozen candidate; record this follow-up as a separate comparison.

Approved review follow-up: only (1) clarify necessary evidence checks within
the Complex Ask Router, with same-window sector benchmarks and contract/capex
examples in their corresponding rows; (2) remove mandatory Skillhub help for
known commands and make broad-read anomaly checks depend on the question;
(3) give runtime chat style precedence, preserve standalone chat guidance and
limit the strict Voice Block to artifact/pipeline copy. Keep all methods,
fallbacks, Trade Setup, source and authorization boundaries unchanged.
Checklist: edit the three references, protect the six changed rules in existing
doc cases and add a necessary-check removal mutation, run doc/mutation/durable checks,
and review the complete scoped diff and its shared prompt consumers. No Sandbox,
search, runtime, deployment, or frozen Eval changes are part of this follow-up.

Approved follow-up: restore verified external-source fallback after Alva
capability checks, keep exact requested conventions distinct from proxy results,
and clarify product-language openings in the companion Sandbox. Only these
rules change; investigate Arrays conventions and the successful Altra trace
without adding an unverified data recipe or backtest example.

Approved minimal publication/source follow-up: actively research public sources
when Alva cannot meet the request, return attributed results before asking users
to supply data, and retain convention/access checks. Preserve the production
v1.25.0 publication workflow's author-visible candidate, natural consent, exact
body, asset extraction, idempotency and GET verification. Original-body requests
also receive a short publication-details preview and
await one approval, as explicitly requested by the user. Avoid repeated
body/consent, wait for decisions on newly found material editorial issues, and
allow equivalent typed/button approval. Publication details use product language,
not catalog IDs or API fields. Companion Sandbox changes only PresentActions'
description, not its schema or handler. No routing/profile duplication or new UI.
Checklist: amend the existing fallback/Create rules; reconcile source wording;
align focused cases/scenarios and three mutation checks; run doc/mutation/durable,
Sandbox agent/MCP tests, lint/typecheck; review both complete diffs. E2E remains
Eval work; no live publication, config changes or deployment in this task.

## 7. Outcome and evidence

The review follow-up changes only three product references, aligns existing
document cases and adds six assertions for the new boundaries. A removal mutation
verifies that deleting the necessary-check rule fails its quality-gate case. Necessary checks are scoped to complex judgments; simple asks
retain their short path. Ticker reads retain all five methods, availability
fallbacks and intraday priority without mandatory help or irrelevant anomaly
reads. Chat follows supplied runtime style, with standalone guidance preserved;
the artifact Voice Block itself is unchanged. Full scoped review verified that
Trade Setup, disclaimer text/triggers, company links and source/authorization
boundaries are unchanged. No new real-turn Eval or speed claim is made.

Live-search routing checks: 106/106 document cases (1247/1247 checks),
37/37 mutation checks and 5/5 durable-agent tests passed; `git diff --check`
is clean. These structural checks do not validate the live endpoint.

Search follow-up: removed GrokX instructions (including the legacy Grok pointer
in Data Skills, guarded by a restoration mutation). The revised route uses Arrays
X Live Search for tweet content and general search when access, coverage or
freshness is insufficient. The dev-provided live-search contract uses X query
syntax, latest/top, Unix-second windows, pages of at most 20 posts and cursor
pagination; retweets require explicit include:nativeretweets when wanted.
The older x-search contract remains store-only and serves indexed history/polling.
Known URLs and account timelines retain
their direct-read endpoints; empty results do not prove absence and lookup does
not silently start paid tracking. Fintwit retains curated views, rankings and
performance. Worldline guidance and examples are removed for now. Other
unstructured research uses native search, with SDK fallback for scripts or absent
tools. Original-source verification and structured financial-data requirements
remain; a priority-reversal mutation protects the new X route.

The companion Sandbox keeps platform/account reads on Alva CLI/API. Document assertions
cover the route and provenance boundaries; real-turn behavior is not yet verified.
The previously frozen `7bb2563` / `0ebcaf3` candidate remains unchanged.


The merged implementation preserves the compact entry and upstream v1.25.0
authorship rules. Metadata names the planned v1.26.0 candidate; no tag was
created and exact file hashes still identify Eval inputs. The Search follow-up was reviewed against `7bb2563`; the publication base
remains upstream `411ea14`. Final product-tree checks:

| Command, from this repository | Result |
| --- | --- |
| `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva --out /tmp/alva-publish-doc-check.md` | 106/106 cases; 1235/1235 checks |
| `node evals/alva-skill-docs/mutation-smoke.mjs` | 35/35 mutations detected |
| `node --test evals/alva-skill-docs/durable-agent.test.mjs` | 5/5 |
| `git diff --check` and reference/conflict checks | Passed; existing memory example link to `user.md` unchanged |

| Follow-up intent | Result | Evidence / limit |
| --- | --- | --- |
| Remove repeated discovery, preserve contracts | DONE | Markets selectors and independent-read batching; doc regression passes |
| Bound authenticated recipes and compute quote window | DONE | Eight successful reads; two invalid paths rejected before credentials/fetch |
| Correct Toolkit/release prerequisites | DONE | Published 0.31.0 package has For You; v1.26.0 is local candidate metadata only |
| Conversational speed and route quality | UNVERIFIABLE locally | Targeted Eval handoff updated; no new conversation Eval run |

The three doc suites pass; they establish instruction coverage, not model
compliance. This repository has no `make lint-fix` target. Trading and Trade Setup
remain unchanged; the publication consent refinement is documented below.

All six current contracts were read with `alva data-skills endpoint` or
`alva sdk doc`. Five HTTP probes (intraday/daily kline, company detail, SEC
release, transcript) returned HTTP 200 with nonempty `data` arrays. Search and
scrape SDK probes returned `success: true` with nonempty results. The shared
HTTP command was also executed verbatim from the document. After the argument hardening, six HTTP reads (including the runtime-window
quote) and both SDK reads returned nonempty successful data. Full-URL and
relative-path arguments failed before credential loading/fetch. The quote
returned a dated bar; it is not evidence that the feed is live. Probe evidence:
`/Users/leozhou/.codex/visualizations/2026/10/10/01a124ea-73ec-7172-a50f-509e64b334f3/recipe-summary-probe-20261021/`.
These probes used public historical/example inputs through the configured CLI; they do not
establish fresh-quote latency, full Alva behavior or the price adjustment basis.

Thesis/For You contracts were checked against Toolkit resources and CLI help
source, and tracking/notification behavior against backend source. The installed
global CLI lacks `for-you`, so no live For You/Thesis workflow success is claimed.
The production lock already selects Toolkit v0.31.0 (`02b89b763a22591e4e81808aac0b58287edbd42c`),
whose published package contains both For You commands. This is not a Toolkit
upgrade prerequisite. Eval must verify the actually loaded Toolkit is >=0.31.0
and supports the commands, plus backend/data access; the older global CLI is
not evidence of a production capability gap.

The Oct 20 paired Eval compared the Oct 18 frozen candidate with the version
before the final direct-endpoint, concise-preference and bounded-search edits.
Current quote, historical close and security identity took approximately
38→33, 32→29 and 59→43 seconds; research, background handoff and backtests held
in those cases. Concise-preference replies remained around 400 words, and the
adjusted-price chart remained incomplete.

The subsequent full Eval did not establish faster ordinary Q&A: median first
response 5.96→7.95s, first substantive answer 35.77→42.52s, final 62.4→60.9s;
mean completion 62.2→67.3s. The non-interleaved runs and differing paths limit
causal attribution. The later wording Eval also did not establish stable speed
improvement (7.12→6.06s first response; 41.36→40.52s substance; 62.38→63.04s
completion). Its independent new TASK-profile case returned three substantive
updates and a complete result in about 369s, retaining follow-ups and sources;
deferred delivery was not exercised. These results cover frozen earlier trees,
not this follow-up's recipes/routes or later persona edits.

The external-source follow-up replaces user-only BYOD fallback with a verified
user-provided or agent-selected public source. Adjustment uncertainty uses the
same route; labeled proxies do not complete an unmet source/currency/return-basis
requirement. Existing source, access and durable-output boundaries remain.
Live Arrays endpoint documentation still does not state stock-close adjustment
or estimates currency/scale. Baseline S19-D used a real FeedAltra engine with a
custom provider, a raw entry event and close-triggered market exits, but synthetic
UTC ordering and crypto performance settings make it unsuitable for verbatim
reuse as a production US-stock example. No Altra product documentation changed.

Publication/source follow-up: the three product references and focused doc tests
now retain the prior workflow with informed-author consent, optional button
selection and readable previews, including a short confirmed preview for supplied
originals. Public-source research was explicitly approved by the user, not an
incidental publication-policy change. Comparing to production baseline `541aa13`
confirms asset extraction, exact-body preservation, request-ID reuse, GET-backed
preview and lifecycle commands remain. Source research stays verified and
Alva-first. Static checks protect these instructions; they do not prove actual
button rendering, stale-click handling or model compliance. No live publication
was performed.

Final pre-PR verification: documentation 106/106 cases and 1235/1235 checks;
mutation smoke 35/35; durable-agent 5/5; `git diff --check` passed.
The branch contains current upstream main `411ea14`; no upstream merge is
pending. Latest publication and source-fallback behavior still needs real-turn
Eval; these checks do not establish production readiness.

PresentActions verification: `node evals/alva-skill-docs/skill-doc-eval.mjs
--skill-dir skills/alva --out /tmp/alva-actions-doc.md` passed 106/106 cases
and 1239/1239 checks; `node evals/alva-skill-docs/mutation-smoke.mjs` passed
36/36; `node --test evals/alva-skill-docs/durable-agent.test.mjs` passed 5/5.
`git diff --check` passed. Real-turn invocation and visual placement remain
unverified; low invocation counts alone do not prove a unique cause.

## 8. Remaining work

- PresentActions targeted Eval: reuse S03-A or S13-A for a concrete next step,
  S17-B for a relevant optional chart upgrade, and supplied-original Thesis
  publication for preview/approval/delivery. Include a pure discussion control.
  Inspect actual tool calls and complete answer/preview delivery before buttons
  in Feed App and Web, plus IM delivery with stream on and off. Check click
  behavior and retained authorization boundaries. This rollback keeps the prior
  call sequence; it does not establish improved invocation frequency.
  A successful registration alone does not prove rendering or user comprehension.

- Reuse S11-C/E/F/G for original/new/edited candidates, public/private settings,
  unresolved assets, new editorial defects, informed insistence and refusal.
  Verify no redundant body/consent, no internal IDs/API labels in the preview,
  exact GET body/stances and no creation before required choice. Exercise typed
  and button approval, stale buttons after edits, repeated approval after success,
  and tool-absent text fallback; static tests do not establish these behaviors.
- Reuse S17-A and legacy 006/027/033/043 for proactive public-source recovery:
  results before a routine source-permission question, transparent provenance
  and conventions, no proxy falsely counted as the requested result, and honest
  partial status when suitable sources remain unavailable. Preserve source
  permissions and access boundaries.
- Get authoritative Arrays adjustment and estimates unit/scale definitions before
  adding a total-return recipe. S19-D needs a supported, market-time-correct
  example and actual-engine replay before an Altra example enters the Skill.

- Before rollout, Arrays must publish the live-search Data Skill contract and
  the separate billing task must be completed. The production catalog checked
  on 2026-10-21 still omitted it; the private Arrays PR could not be read. New
  parameters follow the user-supplied dev contract; no paid live search was run.
  Verify tweet-topic and author-scoped searches use Arrays X Live Search first;
  check default retweet exclusion, explicit inclusion, latest/top, Unix-second
  windows and bounded cursor paging;
  insufficient/empty/stale or inaccessible results fall back to general search
  without claiming no discussion exists or starting paid handle tracking.
  Check known URLs/timelines, preserved Fintwit ranking reads, no Worldline calls,
  original-post attribution, and general news retaining native search. Record
  source coverage and latency; no real-turn search benefit is claimed yet.

- Verify this three-reference follow-up against `43025ca`, with the same
  Sandbox/model/effort and fast tier: S10-E for contract/capex evidence and
  S13-A for same-window attribution benchmarks. Record completeness as well as
  time; do not count a faster partial result as equivalent completion.
- Contrast intraday/move questions with long-term fundamental questions to
  check retained anomaly priority and avoided irrelevant preparation. Verify
  chat style with and without a supplied runtime persona, and unchanged
  Voice Block use for generated artifact/pipeline copy. Keep existing Eval
  freezes intact; this follow-up has not been exercised in those runs.
- Verify GOOG/GOOGL company links (S02-C), uncertain/non-U.S. mentions staying
  plain, and an Alva-owned blocker offering feedback without submitting before
  consent. Check ordinary queries do not acquire a whole-prose read solely for
  completion.
- Verify evidence-format behavior in the paired scenarios in section 5:
  less unnecessary structure with sources, calculations and material gaps
  preserved; retain tables when the user requests or benefits from comparison.
- Verify all six recipe paths, discovery fallback on mismatch, current quote
  versus historical-close timing, fiscal-period semantics and bounded adjustment
  verification. Compare model/discovery calls as well as latency.
- Verify current/quoted Thesis evidence, empty/pending/denied Signals, no duplicate
  monitor, unpublished-view consent, both For You streams and ambiguous reminders.
- Verify concise-first replies with explicit-depth override.
- Obtain authoritative price-basis semantics; do not claim adjusted-chart
  recovery from correct reported-close calculations alone.
- Verify merged author-preserving edits, unpublished Notes and explicit
  selected-body publication in real turns, including author decisions on new
  material Notes before create without redundant confirmation.
- Exercise a new Playbook build and a remix before release; recent targeted
  Eval did not cover them. Background child traces were collected in the latest
  Eval and are no longer an outstanding collection prerequisite.
- Publish/load this candidate Skill with the matching Sandbox prompts after
  acceptance; the upstream dependency-lock version alone does not identify
  the local candidate. Publish a real accepted commit/tag before updating the
  Sandbox production pin; do not deploy this prompt pair against the old bundle.
