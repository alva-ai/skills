# alva-skill-doc-regression

Source: `/Users/ming/workspace/alva/mono-meta/code/public/skills/.worktrees/skill-eval-diagnosis/skills/alva`

SKILL.md lines: 678

Cases: 23/23

Checks: 141/141 (100.00%)

## Scoring Diagnosis

Eval score is diagnostic: use every failed check to find a skill gap, not as user-facing scoring copy.
Classify the gap before editing: missing capability summary, missing routing pointer, missing guardrail, missing reference detail, or missing eval coverage.
Do not expose eval scores as product copy, and do not patch demos to hide a weak result.
Instead, fix the canonical skill text or eval case, then rerun baseline and final reports so the regression mechanism proves the gap is closed.

No failed cases. Keep the eval in place as a regression mechanism.

## retained

16/16 cases, 92/92 checks

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

- [x] Dashboard / Playbook
- [x] Backtest / Strategy
- [x] Data Query
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
- [x] push-subscriptions

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

1/1 cases, 10/10 checks

### PASS feedback.eval-diagnosis

Eval scoring feedback is used to diagnose skill gaps, not exposed as user-facing scoring copy.

- [x] score is diagnostic
- [x] skill gap
- [x] missing capability summary
- [x] missing routing pointer
- [x] missing guardrail
- [x] missing reference detail
- [x] missing eval coverage
- [x] Do not expose eval scores as product copy
- [x] fix the canonical skill text or eval case
- [x] regression mechanism

## target

2/2 cases, 8/8 checks

### PASS target.top-level-size

Top-level SKILL.md is in the requested encyclopedia/guide size band.

- [x] line count >= 650 (actual 678)
- [x] line count <= 850 (actual 678)

### PASS target.playbook-task-offload

Playbook creation is a concrete task reference rather than the dominant top-level body.

- [x] playbook-creation.md
- [x] Playbook Creation
- [x] before-playbook-release
- [x] PUBLIC_ALFS_READ_URL
- [x] Free users
- [x] Pro users
