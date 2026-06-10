# alva-skill-doc-regression

Source: `/Users/ming/workspace/alva/mono-meta/code/public/skills/.worktrees/financial-ask-quality-gates/skills/alva`

SKILL.md lines: 776

Cases: 31/31

Checks: 253/253 (100.00%)

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

## target

9/9 cases, 116/116 checks

### PASS target.top-level-size

Top-level SKILL.md is in the requested encyclopedia/guide size band.

- [x] line count >= 650 (actual 776)
- [x] line count <= 850 (actual 776)

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

- [x] version: v1.11.2
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
