# alva-skill-doc-regression

Source: `origin/main`

SKILL.md lines: 1876

Cases: 16/27

Checks: 132/191 (69.11%)

## Scoring Diagnosis

Eval score is diagnostic: use every failed check to find a skill gap, not as user-facing scoring copy.
Classify the gap before editing: missing capability summary, missing routing pointer, missing guardrail, missing reference detail, or missing eval coverage.
Do not expose eval scores as product copy, and do not patch demos to hide a weak result.
Instead, fix the canonical skill text or eval case, then rerun baseline and final reports so the regression mechanism proves the gap is closed.

- retained.request-routing: inspect for a skill gap before editing. Missing checks: Financial Analysis / Ask Question; Strategy / Trading Analysis
- pr353.chat-as-artifact: inspect for a skill gap before editing. Missing checks: answer_only; Chat-as-Artifact; prompt-injected text; verdict words; EPS forecasts; YTD returns; current prices; forward-return projections
- pr353.no-synth-verdicts: inspect for a skill gap before editing. Missing checks: Cautious; inline source attribution; not investment advice
- pr353.no-task-list: inspect for a skill gap before editing. Missing checks: enumerated list; no verb; no question; no task description; scheduled research digest
- pr353.no-consensus-synthesis: inspect for a skill gap before editing. Missing checks: Do not merge multiple snippet claims; agent-authored consensus; ranked list; source-labeled; synthetic takeaway; source identity is missing; ambiguous
- target.top-level-size: inspect for a skill gap before editing. Missing checks: line count <= 850 (actual 1876)
- target.playbook-task-offload: inspect for a skill gap before editing. Missing checks: playbook-creation.md; Playbook Creation Tree; The playbook tree has subroutes; hosted or shareable playbook surface; ordinary financial-analysis questions should answer directly
- target.top-level-playbook-routing: inspect for a skill gap before editing. Missing checks: Playbook Creation Tree; Durable Artifacts Tree; Subroutes are new build, Skillhub-guided build, remix, annotation/edit, release/version update, and push after release; do not let every financial question inherit playbook gates; route through [playbook-creation.md](references/playbook-creation.md); Did playbook work read [playbook-creation.md](references/playbook-creation.md); relevant hard gates
- target.financial-analysis-routing: inspect for a skill gap before editing. Missing checks: Financial Analysis / Ask Question; Financial Analysis / Ask Question Tree; It is not merely "Data Query"; data fetch is one step inside an analysis answer; latest fact; comparison/valuation; Source Layer: Data Sources; Source Layer: Content Search And BYOD; comparison baselines are financial facts; peer multiple; Do not let playbook creation become the default; Do not turn every Skillhub task into a playbook
- target.pitfalls-stepwise-required: inspect for a skill gap before editing. Missing checks: step by step; before each step; runtime, feed, ALFS, playbook HTML, deploy, release, chart, or cron work; Write or run jagent code; Touch ALFS paths; Build or edit playbook HTML/charts
- target.mainline-updates: inspect for a skill gap before editing. Missing checks: publish publicly by default; implementation internals; Skillhub to users as a catalog of methodologies

## retained

15/16 cases, 90/92 checks

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

### FAIL retained.request-routing

Routing preserves the major user intents and Guided Planning discipline.

- [ ] Financial Analysis / Ask Question
- [x] Playbook Creation
- [ ] Strategy / Trading Analysis
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
- [x] LLM / ADK output
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

### PASS retained.altra

Backtesting and signal feeds still require Altra and preserve common guardrails.

- [x] Always use Altra for backtesting
- [x] FeedAltra
- [x] look-ahead bias
- [x] Stock intraday window guardrail
- [x] signal/targets

### PASS retained.adk

ADK remains scheduled-pipeline reasoning, not a data source or one-off research wrapper.

- [x] @alva/adk
- [x] fixed LLM reasoning step
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

0/4 cases, 8/31 checks

### FAIL pr353.chat-as-artifact

The answer_only/query-mode artifact rule from alva-ai/skills#353 is present.

- [ ] answer_only
- [ ] Chat-as-Artifact
- [ ] prompt-injected text
- [ ] verdict words
- [x] price targets
- [ ] EPS forecasts
- [ ] YTD returns
- [ ] current prices
- [ ] forward-return projections

### FAIL pr353.no-synth-verdicts

Verdicts and forecast figures from snippets must be attributed or refused, not laundered with a disclaimer.

- [x] Buy
- [x] Sell
- [x] Bullish
- [ ] Cautious
- [x] quote
- [ ] inline source attribution
- [x] refuse
- [ ] not investment advice

### FAIL pr353.no-task-list

Pure enumerated prompt dumps are not tasks and require clarification.

- [ ] enumerated list
- [ ] no verb
- [ ] no question
- [ ] no task description
- [x] AskUserQuestion
- [ ] scheduled research digest

### FAIL pr353.no-consensus-synthesis

Snippet claims must not be merged into new agent-authored consensus, ranking, or recommendation output.

- [ ] Do not merge multiple snippet claims
- [ ] agent-authored consensus
- [ ] ranked list
- [x] recommendation
- [ ] source-labeled
- [ ] synthetic takeaway
- [ ] source identity is missing
- [ ] ambiguous

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

0/6 cases, 26/60 checks

### FAIL target.top-level-size

Top-level SKILL.md is in the requested encyclopedia/guide size band.

- [x] line count >= 650 (actual 1876)
- [ ] line count <= 850 (actual 1876)

### FAIL target.playbook-task-offload

Playbook creation is a concrete task reference rather than the dominant top-level body.

- [ ] playbook-creation.md
- [ ] Playbook Creation Tree
- [ ] The playbook tree has subroutes
- [ ] hosted or shareable playbook surface
- [ ] ordinary financial-analysis questions should answer directly
- [x] before-playbook-release
- [x] AlvaToolkit.AlvaClient
- [x] Free users
- [x] Pro users

### FAIL target.top-level-playbook-routing

Top-level routing and final checklist keep playbook work in its concrete reference without making all routing playbook-centric.

- [ ] Playbook Creation Tree
- [ ] Durable Artifacts Tree
- [ ] Subroutes are new build, Skillhub-guided build, remix, annotation/edit, release/version update, and push after release
- [ ] do not let every financial question inherit playbook gates
- [ ] route through [playbook-creation.md](references/playbook-creation.md)
- [ ] Did playbook work read [playbook-creation.md](references/playbook-creation.md)
- [ ] relevant hard gates

### FAIL target.financial-analysis-routing

Ask-question work is grouped as financial analysis instead of a low-level Data Query route.

- [ ] Financial Analysis / Ask Question
- [ ] Financial Analysis / Ask Question Tree
- [ ] It is not merely "Data Query"
- [ ] data fetch is one step inside an analysis answer
- [ ] latest fact
- [ ] comparison/valuation
- [ ] Source Layer: Data Sources
- [ ] Source Layer: Content Search And BYOD
- [ ] comparison baselines are financial facts
- [x] historical average
- [ ] peer multiple
- [ ] Do not let playbook creation become the default
- [ ] Do not turn every Skillhub task into a playbook

### FAIL target.pitfalls-stepwise-required

Operational pitfalls are a mandatory stepwise gate, not an optional debugging appendix.

- [ ] step by step
- [ ] before each step
- [x] mandatory
- [ ] runtime, feed, ALFS, playbook HTML, deploy, release, chart, or cron work
- [ ] Write or run jagent code
- [ ] Touch ALFS paths
- [ ] Build or edit playbook HTML/charts

### FAIL target.mainline-updates

Latest mainline Alva skill updates remain integrated after rebasing the refactor.

- [x] version: v1.11.2
- [x] Capability Help
- [x] Reply 1, 2, or 3 to start
- [x] feedback
- [x] api/feedback.md
- [x] alva feedback --help
- [x] subscriptions subscribe-feed
- [x] subscriptions subscribe-playbook
- [ ] publish publicly by default
- [x] registered UDFs
- [ ] implementation internals
- [ ] Skillhub to users as a catalog of methodologies
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
