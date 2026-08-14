# alva-skill-doc-regression

Source: `/Users/yimingchen/alva/mono-meta/.codex-worktrees/notification-delivery-aip/skills/skills/alva`

SKILL.md lines: 911

Cases: 84/84

Checks: 857/857 (100.00%)

## Scoring Diagnosis

Eval score is diagnostic: use every failed check to find a skill gap, not as user-facing scoring copy.
Classify the gap before editing: missing capability summary, missing routing pointer, missing guardrail, missing reference detail, or missing eval coverage.
Do not expose eval scores as product copy, and do not patch demos to hide a weak result.
Instead, fix the canonical skill text or eval case, then rerun baseline and final reports so the regression mechanism proves the gap is closed.

No failed cases. Keep the eval in place as a regression mechanism.

## retained

20/20 cases, 126/126 checks

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
- [x] alva skillhub list
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

Feed build, deploy, automation publish, and visibility hard gate remain preserved.

- [x] Feed SDK
- [x] alva run --entry-path
- [x] alva deploy create
- [x] alva automation publish
- [x] alva feed set-visibility --id <feed_id> --visibility public
- [x] before-automation-publish

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

### PASS retained.udf-author-owned-contract

UDF authoring keeps params, result shape, entry script, and HTML renderer tied to one contract.

- [x] Author-Owned UDF Contract
- [x] result_contract
- [x] params_schema is input-only
- [x] entry script, registration, smoke test, and browser renderer
- [x] Do not ask the user to restate that return shape
- [x] smoke tests must assert the returned `result` shape
- [x] references/api/udf-runtime.md includes The result contract is author-owned.
- [x] references/api/udf-runtime.md includes The browser renderer must consume the exact declared result fields.
- [x] references/api/udf-runtime.md includes If the smoke result and browser renderer disagree, fix the script or renderer before release.
- [x] references/playbook-creation.md includes result shape
- [x] references/playbook-creation.md includes HTML renderer fields
- [x] references/playbook-creation.md includes Do not ask the user to restate the return shape after you created the function.
- [x] references/playbook-creation.md<HARD-GATE:before-playbook-release> includes UDF result contract
- [x] references/playbook-creation.md<HARD-GATE:before-playbook-release> includes smoke invoke returned the declared result shape
- [x] references/playbook-creation.md<HARD-GATE:before-playbook-release> includes HTML consumes the declared result fields

### PASS retained.credits-cli

Viewer-scoped credit balance and consumption-history lookup remains discoverable through the credits CLI.

- [x] alva credits --help
- [x] alva credits wallet
- [x] alva credits items --today
- [x] alva credits items --last 7d
- [x] alva credits items --start 2026-06-23 --end 2026-06-24
- [x] --session-id <session_id>
- [x] viewer-scoped
- [x] Do not invent or request a `--user-id` flag
- [x] Do not use raw GraphQL
- [x] items.pageInfo.hasNextPage

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
- [x] alertOutput(typeDoc)
- [x] <|SKIP_NOTIFICATION|>
- [x] subscriptions

### PASS retained.memory-secrets

Memory and secret-manager operating rules remain covered.

- [x] Memory is a *claim*, not truth
- [x] user-visible and editable
- [x] Secret Manager
- [x] Do not ask the user to paste sensitive third-party secrets
- [x] loadPlaintext

### PASS retained.order-confirmation-rule

Interactive orders keep the per-order confirmation rule: the exemption does not weaken it.

- [x] explicit user confirmation before non-dry-run execution

## target

15/15 cases, 172/172 checks

### PASS target.automation-publish-side-effects

Automation publish documents its owner binding and first-run side effects, including the run-only opt-out and duplicate-trigger guardrail.

- [x] references/feed-lifecycle.md#Lifecycle includes Publish creates an ACTIVE owner alert binding
- [x] references/feed-lifecycle.md#Lifecycle includes Default: let publish start the producer
- [x] references/feed-lifecycle.md#Lifecycle includes do not call `alva deploy trigger` again
- [x] references/feed-lifecycle.md#Lifecycle includes `--skip-auto-trigger` suppresses only the publish-time run
- [x] references/feed-lifecycle.md#Lifecycle includes It does not suppress the owner alert binding

### PASS target.top-level-size

Top-level SKILL.md stays below the current guide ceiling without forcing a minimum size that would block future compression.

- [x] line count <= 911 (actual 911)

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

Top-level routing keeps playbook work as route-plus-boundary-plus-pointer instead of duplicating the manual.

- [x] playbook route: SKILL.md#Publication Layer: Playbook Creation Tree includes Enter this branch only when the user wants a hosted/shareable surface
- [x] playbook route: SKILL.md#Publication Layer: Playbook Creation Tree includes Read [playbook-creation.md](references/playbook-creation.md)
- [x] playbook route: SKILL.md#Publication Layer: Playbook Creation Tree includes owns the build order, Browser-safe feed reads, README, draft/release gates, screenshot verification, tier/visibility flow, and push-after-release handoff
- [x] playbook route: SKILL.md#Publication Layer: Playbook Creation Tree includes feed-first and live-read
- [x] playbook route: SKILL.md#Publication Layer: Playbook Creation Tree includes Keep procedure, release, screenshot, and tier details in the owning references
- [x] playbook route: SKILL.md#Publication Layer: Playbook Creation Tree includes Do not let every financial question inherit playbook gates
- [x] common workflow: SKILL.md#Hosted Playbook Workflow includes First choose the artifact shape
- [x] common workflow: SKILL.md#Hosted Playbook Workflow includes turn the request into a data contract before UI work
- [x] common workflow: SKILL.md#Hosted Playbook Workflow includes they own the procedure
- [x] final checklist: SKILL.md#Final Sanity Checklist includes Did playbook work read [playbook-creation.md](references/playbook-creation.md)
- [x] final checklist: SKILL.md#Final Sanity Checklist includes relevant hard gates

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

### PASS target.useful-next-step-actions

Useful post-answer suggestions pair explanatory prose with the correct compact action when the tool is available.

- [x] If `PresentActions` is available
- [x] `send_prompt` when the Agent should continue
- [x] `open_url`
- [x] short imperative
- [x] button condenses the action
- [x] Required questions use `AskUserQuestion`

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

### PASS target.mandatory-investment-disclaimer

Security-price and investment-strategy answers have a mandatory disclaimer, while explicit advice requests also receive the required opening header.

- [x] top-level requirement: SKILL.md#First Principles includes Mandatory investment framing
- [x] top-level requirement: SKILL.md#First Principles includes Any answer involving a security price or investment strategy MUST include an investment disclaimer
- [x] top-level requirement: SKILL.md#First Principles includes financial advice
- [x] top-level requirement: SKILL.md#First Principles includes analyst advice
- [x] top-level requirement: SKILL.md#First Principles includes exact advice-request header
- [x] user-facing prose requirement: references/user-facing-prose.md#Investment Disclaimer includes investment disclaimer is required
- [x] user-facing prose requirement: references/user-facing-prose.md#Investment Disclaimer includes security price or investment strategy
- [x] user-facing prose requirement: references/user-facing-prose.md#Investment Disclaimer includes This content is for informational purposes only and does not constitute investment advice.
- [x] user-facing prose requirement: references/user-facing-prose.md#Investment Disclaimer includes begin the response with this exact header
- [x] user-facing prose requirement: references/user-facing-prose.md#Investment Disclaimer includes I'll share an analysis, but keep in mind I'm not a licensed analyst or adviser, and this isn't personalized advice for you specifically.
- [x] user-facing prose requirement: references/user-facing-prose.md#Investment Disclaimer includes This advice-request header is additive
- [x] Ask and strategy routing: references/request-routing.md#Routes includes apply its required Investment Disclaimer
- [x] Ask and strategy routing: references/request-routing.md#Routes includes Strategy answers apply the required [Investment Disclaimer]

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

- [x] version: v1.21.2
- [x] Capability Help
- [x] Reply 1, 2, or 3 to start
- [x] feedback
- [x] api/feedback.md
- [x] alva feedback --help
- [x] alva alert enable --automation
- [x] alva alert enable --automation-ids
- [x] There is no playbook alert target
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

### PASS target.one-off-lightweight-charts

One-off price-series artifacts route to a pinned Lightweight Charts v5 reference by intent — including price-level annotation — without changing Playbook rendering.

- [x] excludes Charts** thereafter.
- [x] references/design-widgets.md includes Renderer Routing
- [x] references/design-widgets.md includes a price series over time
- [x] references/design-widgets.md includes annotates price levels such as support, resistance, entry, target, or stop
- [x] references/design-widgets.md includes Use ECharts for non-price chart types
- [x] references/design-widgets.md includes lightweight-charts.md
- [x] references/design-widgets.md includes Existing Playbook charts remain on ECharts
- [x] references/lightweight-charts.md includes lightweight-charts@5.2.0/dist/lightweight-charts.standalone.production.js
- [x] references/lightweight-charts.md includes window.LightweightCharts
- [x] references/lightweight-charts.md includes chart.addSeries(LightweightCharts.CandlestickSeries
- [x] references/lightweight-charts.md includes chart.addSeries(LightweightCharts.LineSeries
- [x] references/lightweight-charts.md includes LightweightCharts.HistogramSeries
- [x] references/lightweight-charts.md includes Unix timestamps are seconds, not milliseconds
- [x] references/lightweight-charts.md includes chart.timeScale().fitContent()
- [x] references/lightweight-charts.md includes createPriceLine()
- [x] SKILL.md includes [lightweight-charts.md](references/lightweight-charts.md)

### PASS target.auto-trade-consent-exemption

A consent-referenced, record-verified channel-loop tick is exempt from per-order confirmation while staying dry-run/intent-id/risk bound.

- [x] auto-trade-consent:
- [x] ~/memory/auto-trade-consent.md
- [x] one-read verification
- [x] place live orders without per-order user confirmation
- [x] missing or unreadable record
- [x] applies only to loop ticks
- [x] verification checks only that the consent record exists
- [x] timestamp is provenance, not a match key
- [x] is not a mismatch

### PASS target.auto-trade-consent-references

The broker and trading references reconcile their per-order confirm lines with the loop-tick consent exemption instead of demanding unqualified confirmation.

- [x] consented auto-trading loop tick
- [x] recorded consent
- [x] stands in for this per-order confirmation

## alerts

1/1 cases, 13/13 checks

### PASS alerts.portable-actions-and-cards

Declared Feed alerts can carry portable CTA actions and card presentation without confusing them with conversational PresentActions.

- [x] rich alert summary: SKILL.md#Action Layer: Alerts includes portable actions and card presentation
- [x] rich alert summary: SKILL.md#Action Layer: Alerts includes [push-notifications.md](references/push-notifications.md)
- [x] Feed SDK rich alert authoring: references/feed-sdk.md#Portable Actions And Card Presentation includes messageActionsField()
- [x] Feed SDK rich alert authoring: references/feed-sdk.md#Portable Actions And Card Presentation includes messagePresentationField()
- [x] Feed SDK rich alert authoring: references/feed-sdk.md#Portable Actions And Card Presentation includes openUrlAction(
- [x] Feed SDK rich alert authoring: references/feed-sdk.md#Portable Actions And Card Presentation includes sendPromptAction(
- [x] Feed SDK rich alert authoring: references/feed-sdk.md#Portable Actions And Card Presentation includes cardPresentation(
- [x] Feed SDK rich alert authoring: references/feed-sdk.md#Portable Actions And Card Presentation includes accentColor
- [x] Feed SDK rich alert authoring: references/feed-sdk.md#Portable Actions And Card Presentation includes Discord can render the card and both action kinds on the same final message
- [x] Feed SDK rich alert authoring: references/feed-sdk.md#Portable Actions And Card Presentation includes never call it from a Feed script
- [x] rich alert delivery boundary: references/push-notifications.md#Configure And Verify includes A free-standing `url` field does not become a button
- [x] rich alert delivery boundary: references/push-notifications.md#Configure And Verify includes conversational `PresentActions` must not be used by a Feed
- [x] rich alert delivery boundary: references/push-notifications.md#Configure And Verify includes falls back to canonical `title` + `body`

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

## platform-data

4/4 cases, 74/74 checks

### PASS platform-data.kol-surfaces

KOL data and the KOL digest SDK are routed together as Alva-maintained Platform Data.

- [x] platform data section: SKILL.md#Data Access: Platform Data includes Platform Data is Alva-maintained data and SDK surface
- [x] platform data section: SKILL.md#Data Access: Platform Data includes Fintwit Intelligence / KOL data
- [x] platform data section: SKILL.md#Data Access: Platform Data includes Read [fintwit.md](references/fintwit.md)
- [x] platform data section: SKILL.md#Data Access: Platform Data includes Fintwit Digest SDK
- [x] platform data section: SKILL.md#Data Access: Platform Data includes Read [fintwit-digest-sdk.md](references/fintwit-digest-sdk.md)
- [x] platform data section: SKILL.md#Data Access: Platform Data includes do not copy private runtime internals
- [x] request routing: SKILL.md#Request Routing includes Platform Data: Fintwit Intelligence
- [x] request routing: SKILL.md#Request Routing includes Platform Data: Fintwit Digest SDK

### PASS platform-data.ticker-read-sources

A single-ticker read routes through the five official Skillhub sources as a first-tier Platform Data lane with explicit read, build, freshness, and fallback boundaries.

- [x] excludes company-anomaly.md
- [x] excludes /alva/home/mia/feeds/<ticker-slug>-portfolio-watch-anomaly/v1
- [x] excludes anomaly/timeline/@last/1
- [x] platform data section: SKILL.md#Data Access: Platform Data includes Ticker Read
- [x] platform data section: SKILL.md#Data Access: Platform Data includes Read [ticker-read.md](references/ticker-read.md)
- [x] platform data section: SKILL.md#Data Access: Platform Data includes first-tier sources
- [x] platform data section: SKILL.md#Data Access: Platform Data includes select the smallest sufficient combination
- [x] ticker read route: SKILL.md#Request Routing includes ticker read, analyze a named ticker
- [x] ticker read route: SKILL.md#Request Routing includes read [ticker-read.md](references/ticker-read.md) before source selection
- [x] official source router: references/ticker-read.md#Source Router includes alva/company-anomaly-read
- [x] official source router: references/ticker-read.md#Source Router includes alva/company-move-attribution
- [x] official source router: references/ticker-read.md#Source Router includes alva/company-data-aggregate
- [x] official source router: references/ticker-read.md#Source Router includes alva/what-investors-are-looking-for
- [x] official source router: references/ticker-read.md#Source Router includes alva/query-breaking-news-feed
- [x] official source router: references/ticker-read.md#Source Router includes Direct-read lane
- [x] official source router: references/ticker-read.md#Source Router includes Build-on-demand lane
- [x] official source router: references/ticker-read.md#Source Router includes Use `alva/company-anomaly-read` as the first direct-read check for intraday and hourly-scale market tracking
- [x] profile availability: references/ticker-read.md#Availability Gate includes Local source files are not proof that a method is published
- [x] profile availability: references/ticker-read.md#Availability Gate includes Continue with the remaining available Platform Data sources
- [x] profile availability: references/ticker-read.md#Availability Gate includes do not bypass an unavailable Skillhub method
- [x] profile availability: references/ticker-read.md#Availability Gate includes Method availability is rollout state, not company coverage
- [x] ticker read directory: references/request-routing.md#Official Ticker Read Sources includes [ticker-read.md](ticker-read.md) owns source selection
- [x] ticker read directory: references/request-routing.md#Official Ticker Read Sources includes alva/company-anomaly-read
- [x] ticker read directory: references/request-routing.md#Official Ticker Read Sources includes alva/what-investors-are-looking-for
- [x] ticker read directory: references/request-routing.md#Official Ticker Read Sources includes alva/query-breaking-news-feed
- [x] ticker read directory: references/request-routing.md#Official Ticker Read Sources includes alva/company-data-aggregate
- [x] ticker read directory: references/request-routing.md#Official Ticker Read Sources includes alva/company-move-attribution

### PASS platform-data.markets-context-routing

Named-ticker narrative and earnings questions route through one compact Markets Context contract without fixed source-count wording or internal addressing details.

- [x] excludes Treat the five official methods
- [x] excludes staging owner
- [x] excludes production owner
- [x] markets intent and anti-drift route: SKILL.md#Request Routing includes company narrative, earnings, earnings call
- [x] markets intent and anti-drift route: SKILL.md#Request Routing includes Use the smallest sufficient source set
- [x] markets intent and anti-drift route: SKILL.md#Request Routing includes read [ticker-read.md](references/ticker-read.md) before source selection
- [x] named-ticker markets intent: references/request-routing.md#Routes includes company narrative, earnings, or earnings call questions
- [x] named-ticker markets intent: references/request-routing.md#Routes includes first opens [ticker-read.md](ticker-read.md)
- [x] markets context contract: references/ticker-read.md#Markets company context includes alva markets --help
- [x] markets context contract: references/ticker-read.md#Markets company context includes alva markets narrative --ticker <TICKER>
- [x] markets context contract: references/ticker-read.md#Markets company context includes alva markets earnings --ticker <TICKER>
- [x] markets context contract: references/ticker-read.md#Markets company context includes --event next-confirmed
- [x] markets context contract: references/ticker-read.md#Markets company context includes --fiscal-year
- [x] markets context contract: references/ticker-read.md#Markets company context includes --fiscal-quarter
- [x] markets context contract: references/ticker-read.md#Markets company context includes --fiscal-year 2026 --fiscal-quarter Q3
- [x] markets context contract: references/ticker-read.md#Markets company context includes Do not read WILF in parallel for the same request
- [x] markets context contract: references/ticker-read.md#Markets company context includes Price-only and fundamentals-only asks do not call Markets for enrichment
- [x] markets context contract: references/ticker-read.md#Markets company context includes Markets returns the current backend view, not historical point-in-time truth
- [x] markets context contract: references/ticker-read.md#Markets company context includes do not construct GraphQL, ALFS paths, owners, or environment mappings

### PASS platform-data.ticker-read-trade-setup-follow-up

A named single-instrument ticker read can suggest Trade Setup automation after the normal answer, and accepting that suggestion routes through the official setup skill.

- [x] post-answer pointer: SKILL.md#Useful Next Step After Ask includes Trade Setup follow-up rules
- [x] post-answer pointer: SKILL.md#Useful Next Step After Ask includes references/ticker-read.md#trade-setup-follow-up
- [x] post-answer pointer: SKILL.md#Useful Next Step After Ask includes Preferred Automation Setup Skills
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes end with one short Trade Setup automation follow-up
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes mandatory for setup-like asks
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes can I go long/short
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes The follow-up must be the final sentence or final short paragraph
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes the answer is incomplete without this final invitation
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes trade thesis
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes entry or exit area
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes confirmation condition
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes invalidation condition
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes After answering a named single-instrument ticker read
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes after the normal answer
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes simple fact lookups
- [x] ticker-read follow-up rule: references/ticker-read.md#Trade Setup follow-up includes Alpha Radar / Portfolio Watch
- [x] accepted follow-up route: references/request-routing.md#Preferred Automation Setup Skills includes alva/trade-setup-automation
- [x] accepted follow-up route: references/request-routing.md#Preferred Automation Setup Skills includes accepting a post-answer Trade Setup suggestion after a named single-instrument ticker read
- [x] accepted follow-up route: references/request-routing.md#Preferred Automation Setup Skills includes reuse the answered ticker
- [x] accepted follow-up route: references/request-routing.md#Preferred Automation Setup Skills includes fetch the blueprint fresh before building

## issue592

5/5 cases, 82/82 checks

### PASS issue592.scoped-eval-checks

The eval runner can verify scoped behavior and scenario contracts instead of only corpus-wide string presence.

- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes file_includes
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes section_includes
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes hard_gate_includes
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes scenariosPath
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes mutation-smoke.mjs
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes evaluateScenario
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes scenarioAsCase
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes requirements.sections
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes expected route
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes extractMarkdownSection
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes extractHardGate
- [x] runner: evals/alva-skill-docs/skill-doc-eval.mjs includes getFileText
- [x] scenarios: evals/alva-skill-docs/scenarios.json includes prompt
- [x] scenarios: evals/alva-skill-docs/scenarios.json includes "route"
- [x] scenarios: evals/alva-skill-docs/scenarios.json includes "sections"
- [x] scenarios: evals/alva-skill-docs/scenarios.json includes Capability Verification
- [x] scenarios: evals/alva-skill-docs/scenarios.json includes before-playbook-release
- [x] mutation smoke: evals/alva-skill-docs/mutation-smoke.mjs includes MUTATIONS
- [x] mutation smoke: evals/alva-skill-docs/mutation-smoke.mjs includes simple-latest-one-hop
- [x] mutation smoke: evals/alva-skill-docs/mutation-smoke.mjs includes scenario.simple-latest-price
- [x] mutation smoke: evals/alva-skill-docs/mutation-smoke.mjs includes capability-before-refusal
- [x] mutation smoke: evals/alva-skill-docs/mutation-smoke.mjs includes issue592.capability-verification-before-refusal
- [x] mutation smoke: evals/alva-skill-docs/mutation-smoke.mjs includes playbook-release-readme
- [x] mutation smoke: evals/alva-skill-docs/mutation-smoke.mjs includes before-playbook-release
- [x] mutation smoke: evals/alva-skill-docs/mutation-smoke.mjs includes udf-strict-opt-in
- [x] mutation smoke: evals/alva-skill-docs/mutation-smoke.mjs includes scenario.udf-strict-opt-in
- [x] mutation smoke: evals/alva-skill-docs/mutation-smoke.mjs includes expectFailedCases

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

Playbook draft and release remain protected by behavior-level gates for visibility-aware reads, feed freshness, README, lint, and screenshot verification.

- [x] visual verification: references/playbook-creation.md#Screenshot includes A PNG or page shell is not enough
- [x] visual verification: references/playbook-creation.md#Screenshot includes real feed-backed chart marks
- [x] visual verification: references/playbook-creation.md#Screenshot includes headers-only tables
- [x] visual verification: references/playbook-creation.md#Screenshot includes fetch failures are data-rendering failures
- [x] draft gate: references/playbook-creation.md<HARD-GATE:before-playbook-draft> includes for public playbooks
- [x] draft gate: references/playbook-creation.md<HARD-GATE:before-playbook-draft> includes for private or paid playbooks
- [x] draft gate: references/playbook-creation.md<HARD-GATE:before-playbook-draft> includes authenticated SDK/PBSV read instead
- [x] draft gate: references/playbook-creation.md<HARD-GATE:before-playbook-draft> includes do not make the feed public solely to pass this gate
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes Every backing feed passed `before-automation-publish`
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes for public playbooks
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes for private or paid playbooks
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes authenticated SDK/PBSV read instead
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes do not make the feed public solely to pass this gate
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes HTML fetches quantitative data from feeds, not inline literals
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes Latest data from each referenced feed is fresh
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes README exists, is current, and is passed via absolute `--readme-url`
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes New feeds declare push-worthy outputs with
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes existing Altra `signal/targets` or legacy
- [x] release gate: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes alva lint playbook ./index.html

### PASS issue592.push-delivery-behavior

Push setup is evaluated as a full delivery path instead of a single publisher flag.

- [x] push setup: references/push-notifications.md#Configure And Verify includes A push is set up only after all of these succeed
- [x] push setup: references/push-notifications.md#Configure And Verify includes before-automation-publish
- [x] push setup: references/push-notifications.md#Configure And Verify includes alva deploy update --id <ID> --push-notify
- [x] push setup: references/push-notifications.md#Configure And Verify includes alva alert enable --automation
- [x] push setup: references/push-notifications.md#Configure And Verify includes alva alert enable --automation-ids
- [x] push setup: references/push-notifications.md#Configure And Verify includes There is no playbook alert target
- [x] push setup: references/push-notifications.md#Configure And Verify includes read `@last/1` of the declared output
- [x] push setup: references/push-notifications.md#Configure And Verify includes do not claim push is set up
- [x] automation push default: references/deployment.md#Create Cronjob includes new Automation producer
- [x] automation push default: references/deployment.md#Create Cronjob includes `--push-notify` by default
- [x] automation push default: references/deployment.md#Create Cronjob includes only when the user explicitly asks
- [x] push inventory: references/push-notifications.md#Inventory And Unsubscribe includes alva alert list --first 200
- [x] push inventory: references/push-notifications.md#Inventory And Unsubscribe includes alva alert follows --limit 100
- [x] push inventory: references/push-notifications.md#Inventory And Unsubscribe includes has_next

## subscriptions

1/1 cases, 28/28 checks

### PASS subscriptions.delivery-destination

The skill models concurrent Alva and email destinations, distinguishes the default personal destination from an Alva topic channel, and keeps external-group operations profile-owned.

- [x] excludes External IM group
- [x] excludes alva alert group
- [x] excludes group-subscriptions
- [x] excludes active_channel
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes Default personal destination
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes Alva topic channel
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes --automation-ids <id,id> --channel-id <channel_id>
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes <session-prefill-channel-memory channel-id="…">
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes a non-`alva` slug denotes a topic channel
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes delivery is web-only
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes current Alva topic channel (channel id <id>)
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes `channel_id=0`
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes `active_im_provider`
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes active IM provider
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes can contain Alva channel destinations and verified-account email at the same time
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes Updating email does not move or clear the current Alva/IM destination
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes alva automation delivery get --id <automation_id>
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes alva automation delivery update --id <automation_id> --email-enabled
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes Do not read-modify-write the whole resource
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes `open_url` action
- [x] alert destination: references/push-notifications.md#Choose The Delivery Destination includes https://alva.ai/settings?tab=alvaAgent
- [x] destination verification: references/push-notifications.md#Configure And Verify includes intended destination
- [x] destination verification: references/push-notifications.md#Configure And Verify includes global "subscribed" state is not sufficient
- [x] destination verification: references/push-notifications.md#Configure And Verify includes report it as an Alva web topic channel with its id
- [x] destination verification: references/push-notifications.md#Configure And Verify includes never as Telegram or another external DM
- [x] destination verification: references/push-notifications.md#Configure And Verify includes fix it when alert delivery was requested
- [x] destination verification: references/push-notifications.md#Configure And Verify includes when optional, explain the benefit
- [x] destination verification: references/push-notifications.md#Configure And Verify includes `send_prompt` action to enable the named Automation's alert

## automation

1/1 cases, 10/10 checks

### PASS automation.explicit-update-lifecycle

Existing automations retain identity and subscriptions through the explicit ID-scoped update flow instead of publish or delete-and-recreate workarounds.

- [x] automation update lifecycle: references/feed-lifecycle.md#Updating An Existing Automation includes ALFS source writes take effect without republishing
- [x] automation update lifecycle: references/feed-lifecycle.md#Updating An Existing Automation includes alva automation update --id <feed_id>
- [x] automation update lifecycle: references/feed-lifecycle.md#Updating An Existing Automation includes Omitted fields keep their current values
- [x] automation update lifecycle: references/feed-lifecycle.md#Updating An Existing Automation includes explicit empty metadata string clears
- [x] automation update lifecycle: references/feed-lifecycle.md#Updating An Existing Automation includes alert subscriptions remain intact
- [x] automation update lifecycle: references/feed-lifecycle.md#Updating An Existing Automation includes do not delete and recreate an automation to work around `ALREADY_EXISTS`
- [x] automation update gate: references/feed-lifecycle.md<HARD-GATE:before-automation-update> includes target numeric ID belongs to the intended owned automation
- [x] automation update gate: references/feed-lifecycle.md<HARD-GATE:before-automation-update> includes replacement cronjob exists
- [x] automation update gate: references/feed-lifecycle.md<HARD-GATE:before-automation-update> includes resulting producer's exact script ran successfully via `alva run`
- [x] automation update gate: references/feed-lifecycle.md<HARD-GATE:before-automation-update> includes do not fall back to delete-and-recreate

## deployment

1/1 cases, 9/9 checks

### PASS deployment.manual-trigger-optional

Manual trigger commands remain discoverable without becoming a required deployment, update, or push-verification workflow.

- [x] excludes Trigger an Out-of-Schedule Run
- [x] excludes Immediately after enabling the alert, trigger one out-of-schedule run
- [x] excludes alva deploy run-status --id
- [x] excludes Verify the deployment via `alva deploy trigger`
- [x] excludes Any producer change, including a producer-only update, requires
- [x] excludes `--trigger` is present only when an immediate post-update run is intended
- [x] excludes Trigger or wait for a real run
- [x] deploy command index: SKILL.md includes Cronjob lifecycle for producer scripts: schedule, args, trigger, run-status, runs, logs.
- [x] deploy command inventory: references/deployment.md includes `pause`, `resume`, `trigger`, `run-status`, `runs`, `run-logs`

## communication

2/2 cases, 24/24 checks

### PASS communication.company-page-links

User-facing replies link high-confidence U.S.-listed company mentions to production Alva company pages without extra lookups or ambiguous company matches.

- [x] excludes https://alva.ai/company/
- [x] excludes https://stg.alva.ai/markets/
- [x] excludes https://stg.alva.xyz/markets/
- [x] excludes https://alva.ai/markets/3986.HK
- [x] company page link contract: SKILL.md#Company Page Links includes In every user-facing Alva response
- [x] company page link contract: SKILL.md#Company Page Links includes each covered U.S.-listed company to its Alva company page
- [x] company page link contract: SKILL.md#Company Page Links includes [visible wording](https://alva.ai/markets/{CANONICAL_TICKER})
- [x] company page link contract: SKILL.md#Company Page Links includes semantically clear company names
- [x] company page link contract: SKILL.md#Company Page Links includes common names, or localized aliases
- [x] company page link contract: SKILL.md#Company Page Links includes Apple
- [x] company page link contract: SKILL.md#Company Page Links includes Use semantic context, not token shape alone
- [x] company page link contract: SKILL.md#Company Page Links includes Only link U.S.-listed companies
- [x] company page link contract: SKILL.md#Company Page Links includes non-U.S. listings such as `3986.HK`
- [x] company page link contract: SKILL.md#Company Page Links includes never strip or rewrite an exchange suffix
- [x] company page link contract: SKILL.md#Company Page Links includes company/ticker mapping and U.S. listing status already resolved by Alva data
- [x] company page link contract: SKILL.md#Company Page Links includes mapping, listing market, share class, or page coverage
- [x] company page link contract: SKILL.md#Company Page Links includes do not call a tool just to add a link
- [x] company page link contract: SKILL.md#Company Page Links includes Link each company at most once per reply
- [x] company page link contract: SKILL.md#Company Page Links includes non-company assets
- [x] company page link contract: SKILL.md#Company Page Links includes Never use a staging host or relative URL for a company page
- [x] company page link contract: SKILL.md#Company Page Links includes Do not add a separate company-page footer

### PASS communication.concise-completion

Post-deployment and multi-step updates report only new outcome evidence and unresolved issues instead of replaying the work.

- [x] concise completion update: SKILL.md#User-Facing Communication includes After a deployment or other multi-step build
- [x] concise completion update: SKILL.md#User-Facing Communication includes keep the final update delta-only
- [x] concise completion update: SKILL.md#User-Facing Communication includes do not recap earlier details

## scenarios.ask

6/6 cases, 42/42 checks

### PASS scenario.simple-latest-price

A simple latest-fact ask stays in Financial Analysis, uses fresh sourced evidence, and does not inherit playbook gates.

Prompt: `What is BTC doing right now?`

- [x] Simple latest-fact asks stop there after one sourced hop
- [x] user-facing-prose.md
- [x] content-legitimacy.md
- [x] Direct latest/realtime price for covered US equities and crypto: intraday klines, not daily-level bars or closes
- [x] Do not answer until you can name the decomposition
- [x] Do not let playbook creation become the default
- [x] not automatically to a playbook
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.equity-price-disclaimer

A direct equity-price Ask applies the mandatory disclaimer rule.

Prompt: `What is NVDA trading at right now?`

- [x] user-facing-prose.md
- [x] Any answer involving a security price or investment strategy MUST include an investment disclaimer
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.explicit-analyst-advice-header

An explicit analyst-advice request begins with the required header and retains the investment disclaimer.

Prompt: `Give me your analyst advice on whether I should buy NVDA.`

- [x] user-facing-prose.md
- [x] If the user asks for any "financial advice" or "analyst advice," the response MUST also begin with the exact advice-request header
- [x] I'll share an analysis, but keep in mind I'm not a licensed analyst or adviser, and this isn't personalized advice for you specifically.
- [x] This advice-request header is additive
- [x] This content is for informational purposes only and does not constitute investment advice.
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

### PASS scenario.one-off-technical-chart

A one-off technical chart stays in chat, routes financial time-series rendering to Lightweight Charts, and does not become a Playbook.

Prompt: `Draw a one-off BTC candlestick chart with volume, EMA20, support, and resistance in this chat.`

- [x] design-widgets.md
- [x] lightweight-charts.md
- [x] TradingView Lightweight Charts
- [x] a price series over time
- [x] annotates price levels
- [x] Use ECharts for non-price chart types
- [x] Existing Playbook charts remain on ECharts
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.one-off-price-trend-no-keyword

A price-trend question with no chart-form keyword still routes to Lightweight Charts and reads its reference, because intent — a price series over time plus price-level annotation — is the trigger, not the words OHLC or candlestick.

Prompt: `How has BTC been trending lately? Mark the key levels I should watch.`

- [x] design-widgets.md
- [x] lightweight-charts.md
- [x] TradingView Lightweight Charts
- [x] a price series over time
- [x] annotates price levels
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

## scenarios.capability

1/1 cases, 8/8 checks

### PASS scenario.capability-gap-before-refusal

A capability-gap question verifies live coverage before saying no or moving to BYOD.

Prompt: `Does Alva have darkpool L2 realtime data?`

- [x] data-skills.md
- [x] search.md
- [x] custom data source URL / BYOD source
- [x] expected route: references/request-routing.md#Routes includes Capability Verification
- [x] before refusal: references/request-routing.md#Capability Verification includes Before saying Alva lacks a capability
- [x] before refusal: references/request-routing.md#Capability Verification includes alva data-skills list | grep -i <topic>
- [x] before refusal: references/request-routing.md#Capability Verification includes Decompose compound asks
- [x] before refusal: references/request-routing.md#Capability Verification includes Never reject the whole as one unit from memory

## scenarios.playbook

3/3 cases, 35/35 checks

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
- [x] expected route: references/request-routing.md#Routes includes Playbook Creation
- [x] readme freshness: references/api/release.md#Freshness and version updates includes Every `alva release playbook` call needs a freshly reviewed README
- [x] readme freshness: references/api/release.md#Freshness and version updates includes regenerate the README
- [x] readme freshness: references/api/release.md#Freshness and version updates includes `~/playbooks/<name>/README.md`
- [x] readme freshness: references/api/release.md#Freshness and version updates includes before release
- [x] visual verification: references/playbook-creation.md#Screenshot includes Pass screenshot verification only when
- [x] visual verification: references/playbook-creation.md#Screenshot includes real feed-backed chart marks
- [x] playbook release: references/playbook-creation.md<HARD-GATE:before-playbook-release> includes Every backing feed passed `before-automation-publish`
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

3/3 cases, 61/61 checks

### PASS scenario.alert-push-monitor

A monitoring request routes to Automation / Push, compares bounded history, suppresses repeated content, and validates delivery.

Prompt: `Track BTC dominance and notify me when it breaks out.`

- [x] alva-knowledge.md
- [x] push-notifications.md
- [x] feed-lifecycle.md
- [x] Build or modify a feed that declares actionable outputs with `alertOutput(typeDoc)`
- [x] bounded history source and lookback window
- [x] Notification deduplication is semantic
- [x] If no material delta exists
- [x] A push is set up only after all of these succeed
- [x] alva deploy update --id <ID> --push-notify
- [x] alva alert enable --automation
- [x] read `@last/1` of the declared output
- [x] A quiet V2 run does not append an alert record
- [x] `alva deploy trigger` is not a dry run
- [x] do not claim push is set up
- [x] expected route: references/request-routing.md#Routes includes Automation / Push
- [x] Alva Knowledge (Required Reading): SKILL.md#Alva Knowledge (Required Reading) includes [alva-knowledge.md](references/alva-knowledge.md)
- [x] Alva Knowledge (Required Reading): SKILL.md#Alva Knowledge (Required Reading) includes Every automation must decide
- [x] Reference Library: SKILL.md#Reference Library includes [alva-knowledge.md](references/alva-knowledge.md)
- [x] Reference Library: SKILL.md#Reference Library includes Required automation reasoning
- [x] Push Monitor: SKILL.md#Push Monitor includes declared `alertOutput(typeDoc)`
- [x] Push Monitor: SKILL.md#Push Monitor includes quiet branch that does not append
- [x] Push Monitor: SKILL.md#Push Monitor includes `signal/targets` or `notify/message` only when maintaining an existing
- [x] Push Monitor: SKILL.md#Push Monitor includes recognized legacy producer
- [x] Action Layer: Alerts: SKILL.md#Action Layer: Alerts includes New feeds declare push-worthy outputs with `alertOutput(typeDoc)`
- [x] Action Layer: Alerts: SKILL.md#Action Layer: Alerts includes legacy `signal/targets` or `notify/message` producer
- [x] Routes: references/request-routing.md#Routes includes Read [alva-knowledge.md](alva-knowledge.md) before design
- [x] Configure And Verify: references/push-notifications.md#Configure And Verify includes Declare the intended output with `alertOutput(typeDoc)`
- [x] automation knowledge: references/feed-lifecycle.md<HARD-GATE:before-automation-publish> includes [Alva Knowledge](alva-knowledge.md)
- [x] automation knowledge: references/feed-lifecycle.md<HARD-GATE:before-automation-publish> includes longitudinal or decision automations compare bounded history
- [x] automation knowledge: references/feed-lifecycle.md<HARD-GATE:before-automation-publish> includes push-capable automations suppress non-material repeats

### PASS scenario.rich-feed-alert

A rich Feed alert uses the declared portable action and presentation fields, preserving title/body fallback and keeping PresentActions out of Feed code.

Prompt: `Create a scheduled market Feed alert with a red Discord card, a View report link button, and an Analyze impact follow-up button.`

- [x] feed-sdk.md
- [x] push-notifications.md
- [x] messageActionsField()
- [x] messagePresentationField()
- [x] openUrlAction(
- [x] sendPromptAction(
- [x] cardPresentation(
- [x] Discord can render the card and both action kinds on the same final message
- [x] Clients without card support retain `title` + `body`
- [x] `PresentActions` is a conversation-reply tool, not a Feed API
- [x] A free-standing `url` field does not become a button
- [x] never call it from a Feed script
- [x] expected route: references/request-routing.md#Routes includes Automation / Push
- [x] Portable Actions And Card Presentation: references/feed-sdk.md#Portable Actions And Card Presentation includes accentColor: "#FF2020"
- [x] Portable Actions And Card Presentation: references/feed-sdk.md#Portable Actions And Card Presentation includes openUrlAction("View report"
- [x] Portable Actions And Card Presentation: references/feed-sdk.md#Portable Actions And Card Presentation includes sendPromptAction(
- [x] Portable Actions And Card Presentation: references/feed-sdk.md#Portable Actions And Card Presentation includes cardPresentation({

### PASS scenario.current-topic-channel-alert

A request made in an Alva web topic channel binds the feed to that exact channel id and never invents Telegram delivery.

Prompt: `<session-prefill-channel-memory channel-id="44" root="/alva/home/ymchcom/channels/research/memory"> Notify this channel every minute with hello111.`

- [x] push-notifications.md
- [x] a non-`alva` slug denotes a topic channel
- [x] delivery is web-only
- [x] alva alert enable --automation-ids <id,id> --channel-id <channel_id>
- [x] do not silently fall back to the default destination
- [x] Do not infer Telegram, Discord, Slack, or another transport
- [x] current Alva topic channel (channel id <id>)
- [x] Do not trigger the cronjob or wait for its next scheduled run solely to verify setup
- [x] A successful partial update proves that alert delivery is configured
- [x] it does not prove that a message has already been delivered
- [x] An ALFS record alone is also not delivery proof
- [x] report it as an Alva web topic channel with its id
- [x] never as Telegram or another external DM
- [x] expected route: references/request-routing.md#Routes includes Automation / Push

## scenarios.strategy

1/1 cases, 10/10 checks

### PASS scenario.backtest-strategy

A backtest routes through Strategy / Trading Analysis and requires Altra instead of hand-rolled loops.

Prompt: `Backtest a weekly NVDA momentum strategy and show drawdowns.`

- [x] altra-trading.md
- [x] api/trading.md
- [x] user-facing-prose.md
- [x] Always use Altra for backtesting
- [x] FeedAltra
- [x] look-ahead bias
- [x] drawdown
- [x] package results as a concise answer, feed, signal, or visual playbook depending on the request
- [x] Any answer involving a security price or investment strategy MUST include an investment disclaimer
- [x] expected route: references/request-routing.md#Routes includes Strategy / Trading Analysis

## scenarios.skillhub

2/2 cases, 22/22 checks

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

### PASS scenario.skillhub-referenced-method

A user skill reference searches Skillhub for relevant catalog matches, resolves one obvious id, and then fetches the blueprint fresh.

Prompt: `Use the thesis skill for NVDA AI capex read-through.`

- [x] request-routing.md
- [x] playbook-creation.md
- [x] api/release.md
- [x] references a skill without an exact id
- [x] alva skillhub list
- [x] search for relevant catalog matches
- [x] Proceed only when exactly one match is obvious
- [x] alva skillhub file
- [x] Do not bulk-download
- [x] Do not turn every Skillhub task into a playbook
- [x] --skill-id <username>/<name>
- [x] expected route: references/request-routing.md#Routes includes Playbook Creation

## scenarios.ticker-read

4/4 cases, 46/46 checks

### PASS scenario.ticker-read-broad-analysis

A broad single-ticker assessment checks the official direct-read sources, adds latest completed Earnings, and still uses Data Skills for live financial facts without running every source.

Prompt: `分析一下 MU 最近的公司表现，重点说清楚市场现在在看什么、最近异动和催化剂。`

- [x] ticker-read.md
- [x] request-routing.md
- [x] user-facing-prose.md
- [x] Treat these as first-tier ticker-read sources
- [x] For every broad ticker read, check the Direct-read lane before generic search
- [x] alva/what-investors-are-looking-for
- [x] alva/company-anomaly-read
- [x] alva/query-breaking-news-feed
- [x] Add latest completed Earnings for a broad company assessment or thesis
- [x] Data Skills remain the source for live price, fundamentals, valuation
- [x] Do not execute every source by default
- [x] Continue with the remaining available Platform Data sources
- [x] do not bypass an unavailable Skillhub method
- [x] Use `alva/company-anomaly-read` as the first direct-read check for intraday and hourly-scale market tracking
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question
- [x] ticker read route: SKILL.md#Request Routing includes read [ticker-read.md](references/ticker-read.md) before source selection

### PASS scenario.ticker-read-hourly-tracking

An hour-scale ticker check fresh-loads the published Company Anomaly method before slower investor-focus or generic discovery sources.

Prompt: `帮我看看 NVDA 过去一小时有没有异常，为什么？`

- [x] ticker-read.md
- [x] data-skills.md
- [x] Use `alva/company-anomaly-read` as the first direct-read check for intraday and hourly-scale market tracking
- [x] roughly every 15 minutes during US market hours
- [x] Fetch the selected method's current instructions from Skillhub before using it
- [x] do not bypass an unavailable Skillhub method
- [x] A quiet state does not prove that price was flat
- [x] Data Skills for the live price
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.ticker-read-uncovered-move

An uncovered or non-US move falls back from the published anomaly feed to custom aggregation and attribution without pretending that aggregation itself detected an anomaly.

Prompt: `三星电子 005930.KS 昨天为什么大涨？`

- [x] ticker-read.md
- [x] request-routing.md
- [x] data-skills.md
- [x] off-list, non-US, user-defined, or otherwise uncovered move
- [x] alva/company-data-aggregate
- [x] alva/company-move-attribution
- [x] Attribution assumes an already-identified anomalous move
- [x] no web search inside attribution
- [x] does not silently become an Automation or Playbook
- [x] If either method is unavailable in the active profile
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.ticker-read-investor-news

Investor-focus and breaking-event questions use Markets Narrative as the canonical company-context reader, then add the macro breaking-news feed without a parallel WILF read.

Prompt: `TSLA 现在投资者最关注什么？今天有没有可能影响它的突发事件？`

- [x] ticker-read.md
- [x] request-routing.md
- [x] Use Narrative as the default reader
- [x] Do not read WILF in parallel for the same request
- [x] Report `asOf` and `generatedAtMs`
- [x] current macro/cross-market event discovery
- [x] supports_event: true
- [x] not a company-by-company news feed
- [x] did not surface a matching event
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

## scenarios.ticker-read.markets

7/7 cases, 40/40 checks

### PASS scenario.ticker-read-markets-narrative

An explicit Markets Narrative request uses the normalized narrative command and preserves the current-view boundary.

Prompt: `给我看 TSLA 当前 Company Narrative 和最近的 narrative change。`

- [x] ticker-read.md
- [x] request-routing.md
- [x] Current Company Narrative, Narrative history, or change log
- [x] alva markets narrative --ticker <TICKER>
- [x] Markets returns the current backend view, not historical point-in-time truth
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.ticker-read-markets-latest-earnings

A latest-results question uses the default latest-completed Earnings selector and preserves evidence roles.

Prompt: `NVDA 最新财报怎么样？`

- [x] ticker-read.md
- [x] request-routing.md
- [x] Latest completed earnings
- [x] alva markets earnings --ticker <TICKER>
- [x] Treat Pre as a dated expectation baseline
- [x] Release as the official source for reported facts
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.ticker-read-markets-earnings-call

An earnings-call question uses latest-completed Earnings and treats Transcript as management evidence without discarding other valid stages.

Prompt: `管理层在 NVDA 最新电话会怎么说毛利率？`

- [x] ticker-read.md
- [x] request-routing.md
- [x] alva markets earnings --ticker <TICKER>
- [x] Transcript as management statements
- [x] Preserve valid stages when another is unavailable
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.ticker-read-markets-next-earnings

A next-event question uses next-confirmed and never substitutes another fiscal event.

Prompt: `AAPL 下一次财报看什么？`

- [x] ticker-read.md
- [x] request-routing.md
- [x] Next confirmed earnings
- [x] alva markets earnings --ticker <TICKER> --event next-confirmed
- [x] never substitute a different event for the requested one
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.ticker-read-markets-explicit-period

An explicit fiscal-period thesis question pairs fiscal flags and can combine Earnings with the requested Company Narrative context.

Prompt: `AAPL FY2026 Q3 怎么改变公司叙事？`

- [x] ticker-read.md
- [x] request-routing.md
- [x] --fiscal-year 2026 --fiscal-quarter Q3
- [x] alva markets earnings --ticker <TICKER>
- [x] alva markets narrative --ticker <TICKER>
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.ticker-read-markets-price-only

A price-only request stays on Data Skills and does not call Markets for enrichment.

Prompt: `AAPL 现在多少钱？`

- [x] ticker-read.md
- [x] data-skills.md
- [x] Data Skills remain the source for live price
- [x] Price-only and fundamentals-only asks do not call Markets for enrichment
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

### PASS scenario.ticker-read-markets-point-in-time

A historical point-in-time request discloses the current-view limitation instead of reconstructing past truth.

Prompt: `一月十五日当时 Alva 怎么看 AAPL？`

- [x] ticker-read.md
- [x] request-routing.md
- [x] Markets returns the current backend view, not historical point-in-time truth
- [x] expected route: references/request-routing.md#Routes includes Financial Analysis / Ask Question

## scenarios.udf

1/1 cases, 11/11 checks

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
- [x] result contract
- [x] smoke invoke returned the declared result shape
- [x] expected route: references/request-routing.md#Routes includes Playbook Creation
