# alva-skill-doc-regression

Source: `origin/main`

SKILL.md lines: 780

Cases: 47/47

Checks: 403/403 (100.00%)

## Scoring Diagnosis

Eval score is diagnostic: use every failed check to find a skill gap, not as user-facing scoring copy.
Classify the gap before editing: missing capability summary, missing routing pointer, missing guardrail, missing reference detail, or missing eval coverage.
Do not expose eval scores as product copy, and do not patch demos to hide a weak result.
Instead, fix the canonical skill text or eval case, then rerun baseline and final reports so the regression mechanism proves the gap is closed.

No failed cases. Keep the eval in place as a regression mechanism.

## retained

17/17 cases, 98/98 checks

### PASS retained.platform-panorama

SKILL.md still teaches the Alva platform, not only routes to files.

- [x] 250+ financial data sources
- [x] cloud-side analytics
- [x] Altra trading engine
- [x] hosted playbook
- [x] Skillhub
- [x] remix

### PASS retained.rule-zero-preflight

Agents still run help-first preflight and session setup.

- [x] alva <command> --help
- [x] scripts/version_check.sh
- [x] alva whoami
- [x] ARRAYS_JWT
- [x] alva fs read --path '~/memory/MEMORY.md'

### PASS retained.request-routing

Routing preserves the major user intents and Guided Planning discipline.

- [x] Financial Analysis / Ask Question
- [x] Playbook Creation
- [x] Strategy / Trading Analysis
- [x] Remix
- [x] /use-skill:<username>/<name>
- [x] Exactly one blocking question

### PASS retained.skillhub

Skillhub blueprint retrieval remains mandatory and fresh when directed.

- [x] alva skillhub get
- [x] alva skillhub file
- [x] fetch it fresh
- [x] Do not bulk-download
- [x] --skill-id

### PASS retained.content-legitimacy

The core data provenance and anti-fabrication rules remain intact.

- [x] build the pipeline
- [x] not to **be
- [x] WebSearch
- [x] LLM / alpi output
- [x] user-pasted snapshots
- [x] Never hardcode data as inline JavaScript literals
- [x] Feed Scope Isolation
- [x] Data Convention Alignment

### PASS retained.data-skills

Data Skills discovery, endpoint lookup, and auth details survive.

- [x] alva data-skills list
- [x] alva data-skills summary
- [x] alva data-skills endpoint
- [x] Authorization: Bearer <ARRAYS_JWT>
- [x] Do not use `X-API-Key`

### PASS retained.search-routing

Search routing keeps structured data, Twitter/X, and non-US finance guidance.

- [x] unified_search
- [x] Twitter/X routing
- [x] searchPerplexityFinance
- [x] non-US equities
- [x] structured Alva data

### PASS retained.runtime

Jagent runtime constraints and heap override remain discoverable.

- [x] sandboxed V8 isolate
- [x] no `process`
- [x] no timer globals
- [x] Top-level `await`
- [x] --max-heap-size-mb
- [x] 256 MB

### PASS retained.feed-lifecycle

Feed build, grant, deploy, and release hard gate remain preserved.

- [x] Feed SDK
- [x] alva run --entry-path
- [x] special:user:*
- [x] alva deploy create
- [x] alva release feed
- [x] before-feed-release

### PASS retained.playbook-release

Playbook release, README, screenshot, lint, pro/free, and visibility rules remain intact.

- [x] before-build-html
- [x] before-playbook-draft
- [x] before-playbook-release
- [x] alva lint playbook
- [x] readme-url
- [x] related people
- [x] alva screenshot
- [x] set-visibility

### PASS retained.design-system

Design system and linter references remain reachable.

- [x] design.md
- [x] design-widgets.md
- [x] design-components.md
- [x] design-playbook-trading-strategy.md
- [x] design-contract.yaml
- [x] required-stylesheets
- [x] requestAnimationFrame

### PASS retained.udf-runtime

UDFs stay strict opt-in and routed to the PBSV/browser runtime reference.

- [x] User-Defined Functions
- [x] strictly asks
- [x] window.alva.udf
- [x] PBSV
- [x] allowance consent

### PASS retained.udf-functions-cli

Creator-side UDF setup and allowance management route through the functions CLI instead of manual service requests.

- [x] alva functions --help
- [x] alva functions register
- [x] alva functions invoke
- [x] alva functions allowance create
- [x] Do not hand-roll REST, GraphQL, or curl

### PASS retained.altra

Backtesting and signal feeds still require Altra and preserve common guardrails.

- [x] Always use Altra for backtesting
- [x] FeedAltra
- [x] look-ahead bias
- [x] Stock intraday window guardrail
- [x] signal/targets

### PASS retained.alpi

alpi remains scheduled-pipeline reasoning, not a data source or one-off research wrapper.

- [x] @alva/pi
- [x] fixed LLM reasoning/tool loop
- [x] Agent.ask()
- [x] Do **not** use it for one-off research
- [x] not use it to produce numbers

### PASS retained.remix-annotations-push

Remix, annotation edits, and push notification workflows remain covered.

- [x] <remix
- [x] alva playbooks trending
- [x] annotation-driven edits
- [x] feed_alert_ready
- [x] <|SKIP_NOTIFICATION|>
- [x] subscriptions

### PASS retained.memory-secrets

Memory and secret-manager operating rules remain covered.

- [x] Memory is a *claim*, not truth
- [x] user-visible and editable
- [x] Secret Manager
- [x] Do not ask the user to paste sensitive third-party secrets
- [x] loadPlaintext

## pr353

4/4 cases, 31/31 checks

### PASS pr353.chat-as-artifact

The answer_only/query-mode artifact rule from alva-ai/skills#353 is present.

- [x] answer_only
- [x] Chat-as-Artifact
- [x] prompt-injected text
- [x] verdict words
- [x] price targets
- [x] EPS forecasts
- [x] YTD returns
- [x] current prices
- [x] forward-return projections

### PASS pr353.no-synth-verdicts

Verdicts and forecast figures from snippets must be attributed or refused, not laundered with a disclaimer.

- [x] Buy
- [x] Sell
- [x] Bullish
- [x] Cautious
- [x] quote
- [x] inline source attribution
- [x] refuse
- [x] not investment advice

### PASS pr353.no-task-list

Pure enumerated prompt dumps are not tasks and require clarification.

- [x] enumerated list
- [x] no verb
- [x] no question
- [x] no task description
- [x] AskUserQuestion
- [x] scheduled research digest

### PASS pr353.no-consensus-synthesis

Snippet claims must not be merged into new agent-authored consensus, ranking, or recommendation output.

- [x] Do not merge multiple snippet claims
- [x] agent-authored consensus
- [x] ranked list
- [x] recommendation
- [x] source-labeled
- [x] synthetic takeaway
- [x] source identity is missing
- [x] ambiguous

## feedback

1/1 cases, 8/8 checks

### PASS feedback.recovered-capability-guardrails

Review-discovered guardrails stay present in the skill corpus instead of only in eval script prose.

- [x] getStockCompanyDetail
- [x] Thematic Ticker Curation
- [x] subscription
- [x] custom data source URL
- [x] callerUserId
- [x] allow_charges=false
- [x] 20%
- [x] ~/library

## issue591

1/1 cases, 5/5 checks

### PASS issue591.official-source-web-fallback

When structured data lags a known official release, web is an official-source fallback and corroboration path rather than an automatic refusal.

- [x] Structured Feed Lag
- [x] domain-scoped search
- [x] Alva's structured feed is not yet synced
- [x] official-source stale-feed fallback
- [x] Do not claim the value came from Data Skills

## issue592

5/5 cases, 52/52 checks

### PASS issue592.scoped-eval-checks

The eval runner can verify scoped behavior and scenario contracts instead of only corpus-wide string presence.

- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes file_includes
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes section_includes
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes hard_gate_includes
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes scenariosPath
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes evaluateScenario
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes scenarioAsCase
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes expected route
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes extractMarkdownSection
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes extractHardGate
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes getFileText
- [x] scenarios: evals/alva-skill-docs/scenarios.json includes prompt
- [x] scenarios: evals/alva-skill-docs/scenarios.json includes "route"
- [x] scenarios: evals/alva-skill-docs/scenarios.json includes Capability Verification
- [x] scenarios: evals/alva-skill-docs/scenarios.json includes before-playbook-release

### PASS issue592.financial-ask-contract

Financial Analysis / Ask Question remains a small answer route with fresh evidence, prose, and confidence gates instead of inheriting playbook workflow.

- [x] answer route: references/request-routing.md#Routes includes Financial Analysis / Ask Question
- [x] answer route: references/request-routing.md#Routes includes fresh data/search/`alva run` evidence
- [x] answer route: references/request-routing.md#Routes includes Every answer must read [user-facing-prose.md](user-facing-prose.md)
- [x] answer route: references/request-routing.md#Routes includes ask evidence gate
- [x] answer gate: references/request-routing.md#Guided Planning includes decomposition
- [x] answer gate: references/request-routing.md#Guided Planning includes source path
- [x] answer gate: references/request-routing.md#Guided Planning includes coverage gaps
- [x] answer gate: references/request-routing.md#Guided Planning includes sourced-vs-inference boundary
- [x] answer gate: references/request-routing.md#Guided Planning includes Simple asks can satisfy the gate with one hop
- [x] answer gate: references/request-routing.md#Guided Planning includes Only complex judgment asks also pass the Complex Ask Router
- [x] top-level route: SKILL.md#Financial Analysis / Ask Question Tree includes It is not merely "Data Query"
- [x] top-level route: SKILL.md#Financial Analysis / Ask Question Tree includes data access and execution are steps inside an analysis answer
- [x] top-level route: SKILL.md#Financial Analysis / Ask Question Tree includes Simple latest-fact asks stop there after one sourced hop
- [x] top-level route: SKILL.md#Financial Analysis / Ask Question Tree includes Do not answer until you can name the decomposition

### PASS issue592.capability-verification-before-refusal

Capability gaps are verified against live Alva surfaces and reduced-scope/BYOD fallbacks before the agent refuses.

- [x] before refusal: references/request-routing.md#Capability Verification includes Before saying Alva lacks a capability
- [x] before refusal: references/request-routing.md#Capability Verification includes alva data-skills list | grep -i <topic>
- [x] before refusal: references/request-routing.md#Capability Verification includes Decompose compound asks
- [x] before refusal: references/request-routing.md#Capability Verification includes Never reject the whole as one unit from memory
- [x] fallback behavior: references/data-skills.md#Failure And Fallback includes same-domain Alva endpoints cannot answer the task
- [x] fallback behavior: references/data-skills.md#Failure And Fallback includes custom data source URL / BYOD source
- [x] fallback behavior: references/data-skills.md#Failure And Fallback includes Never stop with zero useful output
- [x] fallback behavior: references/data-skills.md#Failure And Fallback includes Never replace a missing data source with LLM-fabricated values

### PASS issue592.playbook-release-behavior

Playbook release remains protected by behavior-level gates for feed freshness, live data reads, README, lint, and screenshot verification.

- [x] visual verification: references/playbook-creation.md#Screenshot includes A PNG or page shell is not enough
- [x] visual verification: references/playbook-creation.md#Screenshot includes real feed-backed chart marks
- [x] visual verification: references/playbook-creation.md#Screenshot includes headers-only tables
- [x] visual verification: references/playbook-creation.md#Screenshot includes fetch failures are data-rendering failures
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes Every backing feed passed `before-feed-release`
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes HTML fetches quantitative data from feeds, not inline literals
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes Latest data from each referenced feed is fresh
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes README exists, is current, and is passed via absolute `--readme-url`
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes alva lint playbook ./index.html

### PASS issue592.push-delivery-behavior

Push setup is evaluated as a full delivery path instead of a single publisher flag.

- [x] push setup: references/push-notifications.md#Configure And Verify includes A push is set up only after all of these succeed
- [x] push setup: references/push-notifications.md#Configure And Verify includes before-feed-release
- [x] push setup: references/push-notifications.md#Configure And Verify includes alva deploy update --id <ID> --push-notify
- [x] push setup: references/push-notifications.md#Configure And Verify includes alva subscriptions subscribe-feed
- [x] push setup: references/push-notifications.md#Configure And Verify includes alva subscriptions subscribe-playbook
- [x] push setup: references/push-notifications.md#Configure And Verify includes read `@last/1` of the sidecar
- [x] push setup: references/push-notifications.md#Configure And Verify includes do not claim push is set up

## target

9/9 cases, 115/115 checks

### PASS target.top-level-size

Top-level SKILL.md stays below the current guide ceiling without forcing a minimum size that would block future compression.

- [x] line count <= 850 (actual 780)

### PASS target.playbook-task-offload

Playbook creation is a concrete task reference rather than the dominant top-level body.

- [x] playbook-creation.md
- [x] Playbook Creation Tree
- [x] The playbook tree has subroutes
- [x] hosted or shareable playbook surface
- [x] ordinary financial-analysis questions should answer directly
- [x] before-playbook-release
- [x] AlvaToolkit.AlvaClient
- [x] Free users
- [x] Pro users

### PASS target.top-level-playbook-routing

Top-level routing and final checklist keep playbook work in its concrete reference without making all routing playbook-centric.

- [x] Playbook Creation Tree
- [x] Durable Artifacts / Playbook Tree
- [x] Subroutes are new build, Skillhub-guided build, remix, annotation/edit, release/version update, and push after release
- [x] do not let every financial question inherit playbook gates
- [x] route through [playbook-creation.md](references/playbook-creation.md)
- [x] Did playbook work read [playbook-creation.md](references/playbook-creation.md)
- [x] relevant hard gates

### PASS target.financial-analysis-routing

Ask-question work is grouped as financial analysis instead of a low-level Data Query route.

- [x] Shared Data And Execution Layer
- [x] Do not treat data access or `alva run` as playbook-only
- [x] A direct answer may still need Alva Cloud execution
- [x] Execution: Jagent Runtime And `alva run`
- [x] Financial Analysis / Ask Question
- [x] Financial Analysis / Ask Question Tree
- [x] It is not merely "Data Query"
- [x] data access and execution are steps inside an analysis answer
- [x] an `alva run` computation over live data
- [x] latest fact
- [x] comparison/valuation
- [x] Data Access: Data Sources
- [x] Data Access: Content Search And BYOD
- [x] comparison baselines are financial facts
- [x] historical average
- [x] peer multiple
- [x] Do not let playbook creation become the default
- [x] Do not turn every Skillhub task into a playbook

### PASS target.ask-evidence-gate

Direct financial asks have compact evidence gates instead of a free-form memo contract.

- [x] ask evidence gate
- [x] Do not answer until
- [x] decomposition
- [x] data/source path for each hop
- [x] fetched vs missing coverage
- [x] sourced facts, computed values, or inference
- [x] Simple latest-fact asks stop there after one sourced hop
- [x] Simple/latest-fact asks stop there
- [x] cap confidence when required evidence
- [x] KPI coverage
- [x] computation is missing

### PASS target.financial-ask-quality-gates

Complex financial asks classify the problem type and apply source, methodology, KPI, and confidence gates.

- [x] Complex Ask Router
- [x] Only complex judgment asks also pass the Complex Ask Router
- [x] treat complex judgments as high-risk financial analysis
- [x] Simple/latest-fact asks stop there
- [x] Complex Ask Router only for complex judgment asks
- [x] thesis/fundamental
- [x] earnings/catalyst
- [x] event-study/backtest
- [x] screener/ranking
- [x] macro/cross-asset
- [x] news/social sentiment
- [x] portfolio/scenario
- [x] valuation/accounting
- [x] event definition
- [x] sample count
- [x] non-overlap rule
- [x] look-ahead control
- [x] benchmark/sector ETF
- [x] missing-field handling
- [x] evidence table with source
- [x] authority/relevance
- [x] duplicate status
- [x] synchronized as-of time
- [x] implied-probability source/proxy
- [x] weights/exposure assumption
- [x] beta/correlation/proxy method
- [x] drawdown table
- [x] current multiple/FCF/EPS
- [x] multiple/earnings sensitivity
- [x] attempted/found/missing/impact
- [x] required calculation not done caps at B-/C
- [x] hard cap

### PASS target.financial-analysis-prose-gate

Financial Analysis answers must read the merged user-facing prose reference before answering.

- [x] Financial-analysis answer gate
- [x] before answering any Financial Analysis / Ask Question
- [x] read [user-facing-prose.md](references/user-facing-prose.md)
- [x] then satisfy the ask evidence gate
- [x] Every answer must read [user-facing-prose.md](user-facing-prose.md)
- [x] user-facing prose reference read
- [x] Product vocabulary, voice rules, and alpi prose prompt block
- [x] Chat answers for Financial Analysis / Ask Question

### PASS target.pitfalls-stepwise-required

Operational pitfalls are a mandatory stepwise gate, not an optional debugging appendix.

- [x] step by step
- [x] before each step
- [x] mandatory
- [x] runtime, feed, ALFS, playbook HTML, deploy, release, chart, or cron work
- [x] Write or run jagent code
- [x] Touch ALFS paths
- [x] Build or edit playbook HTML/charts

### PASS target.mainline-updates

Latest mainline Alva skill updates remain integrated after rebasing the refactor.

- [x] version: v1.12.1
- [x] Capability Help
- [x] Reply 1, 2, or 3 to start
- [x] feedback
- [x] api/feedback.md
- [x] alva feedback --help
- [x] subscriptions subscribe-feed
- [x] subscriptions subscribe-playbook
- [x] publish publicly by default
- [x] registered UDFs
- [x] implementation internals
- [x] Skillhub to users as a catalog of methodologies
- [x] callerUserId
- [x] allow_charges=false
- [x] no-charge
- [x] Browser request rule
- [x] AlvaToolkit.AlvaClient
- [x] api_origin
- [x] public and private playbooks
- [x] real feed-backed chart marks
- [x] headers-only tables
- [x] fetch failures

## scenarios.ask

2/2 cases, 19/19 checks

### PASS scenario.simple-latest-price

A simple latest-fact ask stays in Financial Analysis, uses fresh sourced evidence, and does not inherit playbook gates.

Prompt: `What is BTC doing right now?`

- [x] Simple latest-fact asks stop there after one sourced hop
- [x] user-facing-prose.md
- [x] content-legitimacy.md
- [x] Direct latest price for covered US equities and crypto: intraday klines, not daily close
- [x] Do not answer until you can name the decomposition
- [x] Do not let playbook creation become the default
- [x] not automatically to a playbook
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.complex-valuation-ask

A complex valuation ask uses the ask evidence gate plus Complex Ask Router without becoming a playbook by default.

Prompt: `Is NVDA cheap versus peers after the latest earnings revision?`

- [x] request-routing.md
- [x] user-facing-prose.md
- [x] fundamentals-periods.md
- [x] Complex Ask Router
- [x] valuation/accounting
- [x] comparison baselines are financial facts
- [x] current multiple/FCF/EPS
- [x] multiple/earnings sensitivity
- [x] cap confidence when required evidence
- [x] not automatically to a playbook
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

## scenarios.capability

1/1 cases, 8/8 checks

### PASS scenario.capability-gap-before-refusal

A capability-gap question verifies live coverage before saying no or moving to BYOD.

Prompt: `Does Alva have darkpool L2 realtime data?`

- [x] data-skills.md
- [x] search.md
- [x] Before saying Alva lacks a capability
- [x] alva data-skills list | grep -i <topic>
- [x] Decompose compound asks
- [x] Never reject the whole as one unit from memory
- [x] custom data source URL / BYOD source
- [x] expected route: references/request-routing.md#Routes includes Capability Verification

## scenarios.playbook

3/3 cases, 31/31 checks

### PASS scenario.dashboard-playbook-build

A hosted dashboard enters the Playbook Creation route and preserves feed-first, live-read, README, lint, release, and screenshot gates.

Prompt: `Build and publish a live dashboard for BTC dominance breakouts.`

- [x] Publication Layer: Playbook Creation Tree
- [x] playbook-creation.md
- [x] feed-lifecycle.md
- [x] design.md
- [x] api/release.md
- [x] AlvaToolkit.AlvaClient
- [x] Build live feeds first
- [x] HTML fetches quantitative data from feeds, not inline literals
- [x] Every release needs a current README
- [x] screenshot verification must show real feed-backed marks
- [x] expected route: references/request-routing.md#Routes includes Playbook Creation
- [x] playbook release: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes Every backing feed passed `before-feed-release`
- [x] playbook release: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes README exists, is current, and is passed via absolute `--readme-url`
- [x] playbook release: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes alva lint playbook ./index.html

### PASS scenario.remix-existing-playbook

A remix reads source artifacts and preserves lineage instead of regenerating from memory.

Prompt: `<remix https://alva.ai/u/alva/playbooks/screener> make my own version`

- [x] Playbook Subroute: Remix
- [x] remix-workflow.md
- [x] playbook-creation.md
- [x] Extract source owner/name from the tag URL
- [x] read the source feed scripts, HTML, README, and playbook metadata
- [x] preserve them unless the user explicitly asks otherwise
- [x] Do not regenerate from memory
- [x] expected route: references/request-routing.md#Routes includes Debug / Edit

### PASS scenario.annotation-edit

An annotation edit changes the generator behind the element and re-enters HTML gates.

Prompt: `<annotation id="hero-title">make this chart title shorter</annotation>`

- [x] Playbook Subroute: Annotation Edits
- [x] annotation-edits.md
- [x] playbook-creation.md
- [x] change the generator behind the selected element
- [x] Never freeze rendered feed values into static text
- [x] HTML edits re-enter `before-build-html`
- [x] expected route: references/request-routing.md#Routes includes Debug / Edit
- [x] html gate: references/playbook-creation.md<HARD-GATE:before-build-html> includes The HTML follows the Browser request rule
- [x] html gate: references/playbook-creation.md<HARD-GATE:before-build-html> includes Do not rely on memory of prior sessions

## scenarios.push

1/1 cases, 9/9 checks

### PASS scenario.alert-push-monitor

A monitoring request routes to Automation / Push and validates sidecar, release, subscription, and real-run delivery.

Prompt: `Track BTC dominance and notify me when it breaks out.`

- [x] push-notifications.md
- [x] feed-lifecycle.md
- [x] Build or modify a feed that emits actionable `signal/targets` or `notify/message`
- [x] A push is set up only after all of these succeed
- [x] alva deploy update --id <ID> --push-notify
- [x] alva subscriptions subscribe-feed
- [x] read `@last/1` of the sidecar
- [x] do not claim push is set up
- [x] expected route: references/request-routing.md#Routes includes Automation / Push

## scenarios.strategy

1/1 cases, 8/8 checks

### PASS scenario.backtest-strategy

A backtest routes through Strategy / Trading Analysis and requires Altra instead of hand-rolled loops.

Prompt: `Backtest a weekly NVDA momentum strategy and show drawdowns.`

- [x] altra-trading.md
- [x] api/trading.md
- [x] Always use Altra for backtesting
- [x] FeedAltra
- [x] look-ahead bias
- [x] drawdown
- [x] package results as a concise answer, feed, signal, or visual playbook depending on the request
- [x] expected route: references/request-routing.md#Routes includes Strategy / Trading Analysis

## scenarios.skillhub

1/1 cases, 10/10 checks

### PASS scenario.skillhub-method

A Skillhub directive fetches the blueprint fresh, avoids bulk download, and only becomes a playbook if the user or blueprint asks.

Prompt: `/use-skill:alva/thesis NVDA AI capex read-through`

- [x] request-routing.md
- [x] playbook-creation.md
- [x] api/release.md
- [x] If the user's message contains `/use-skill:<username>/<name>`, the Skillhub path is mandatory
- [x] alva skillhub get
- [x] alva skillhub file
- [x] Do not bulk-download
- [x] Do not turn every Skillhub task into a playbook
- [x] --skill-id <username>/<name>
- [x] expected route: references/request-routing.md#Routes includes Playbook Creation

## scenarios.udf

1/1 cases, 9/9 checks

### PASS scenario.udf-strict-opt-in

A UDF request is explicit opt-in and routes to the PBSV/browser runtime and functions CLI checks.

Prompt: `Add a button so viewers can run my custom analysis function.`

- [x] api/udf-runtime.md
- [x] playbook-creation.md
- [x] User-Defined Functions are strict opt-in
- [x] registerable/shareable interactive function
- [x] window.alva.udf
- [x] alva functions
- [x] allowance consent
- [x] Never hand-write bearer headers
- [x] expected route: references/request-routing.md#Routes includes Playbook Creation
