# Alva App Workflow Eval — baseline (main)

This evaluation checks whether a fresh agent has enough instruction to complete representative Alva application workflows end to end. It is intentionally broader than routing: each case requires the right references, workflow/API details, hard gates, guardrails against incorrect app behavior, and observable completion evidence.

- Cases: 0/10
- Checks: 132/222
- Score: 59.46%

## Case Results

### FAIL fresh_session_finance_answer

Task class: Direct Alva data answer

Prompt: In a fresh session, answer a current finance-data question such as NVDA P/E or BTC price.

Checks: 13/23

Missing:
- skill_ref_exists_and_routed: references/preflight.md
- skill_ref_exists_and_routed: references/data-skills.md
- skill_ref_exists_and_routed: references/content-legitimacy.md
- workflow_step_or_api_detail: agent's job is to build the pipeline
- workflow_step_or_api_detail: not legitimate data sources
- guardrail_against_bad_app_behavior: Do not use WebSearch
- guardrail_against_bad_app_behavior: Never guess endpoint paths
- guardrail_against_bad_app_behavior: do not answer financial figures
- observable_outcome_or_evidence: verify any feed, cronjob, preference, or parameter
- observable_outcome_or_evidence: could not be fetched

### FAIL feed_backed_playbook_build

Task class: Feed-backed playbook creation

Prompt: Build a market dashboard or playbook backed by fresh Alva data feeds.

Checks: 22/34

Missing:
- skill_ref_exists_and_routed: references/request-routing.md
- skill_ref_exists_and_routed: references/content-legitimacy.md
- skill_ref_exists_and_routed: references/data-skills.md
- skill_ref_exists_and_routed: references/feed-lifecycle.md
- skill_ref_exists_and_routed: references/playbook-release.md
- skill_routing_pattern: Feed Build
- workflow_step_or_api_detail: choose the data source, schema, data modeling pattern
- workflow_step_or_api_detail: absolute `--readme-url`
- guardrail_against_bad_app_behavior: Do not use WebSearch
- guardrail_against_bad_app_behavior: If any evidence is missing or stale
- stale_or_conflicting_pattern_absent: "$ALVA_ENDPOINT/api/v1/fs/read
- stale_or_conflicting_pattern_absent: const { getCryptoKline } = require("@arrays

### FAIL playbook_release_public

Task class: Public playbook release

Prompt: Release a completed playbook publicly after feeds, HTML, and metadata are ready.

Checks: 15/24

Missing:
- skill_ref_exists_and_routed: references/feed-lifecycle.md
- skill_ref_exists_and_routed: references/playbook-release.md
- skill_routing_pattern: Screenshot Verification
- workflow_step_or_api_detail: enumerate every feed output path
- workflow_step_or_api_detail: every push sidecar
- workflow_step_or_api_detail: absolute `--readme-url`
- workflow_step_or_api_detail: verify the file is really a PNG
- guardrail_against_bad_app_behavior: Do not present `published_url` as the canonical share link
- guardrail_against_bad_app_behavior: If any required release input is missing

### FAIL altra_backtest_strategy

Task class: Altra strategy and backtest

Prompt: Backtest a crypto or equity allocation strategy and publish a usable result.

Checks: 13/22

Missing:
- skill_ref_exists_and_routed: references/feed-lifecycle.md
- skill_ref_exists_and_routed: references/playbook-release.md
- workflow_step_or_api_detail: Overview/Analytics/Strategy/Feed
- workflow_step_or_api_detail: feed-lifecycle.md
- workflow_step_or_api_detail: playbook-release.md
- guardrail_against_bad_app_behavior: hand-rolled loops
- guardrail_against_bad_app_behavior: not a `{symbol, side, qty}` order shape
- observable_outcome_or_evidence: usable result
- observable_outcome_or_evidence: visual evidence

### FAIL push_notifications_end_to_end

Task class: Push notification lifecycle

Prompt: Enable push alerts for a released signal or digest playbook.

Checks: 13/21

Missing:
- skill_ref_exists_and_routed: references/push-notifications.md
- skill_ref_exists_and_routed: references/playbook-release.md
- skill_routing_pattern: Push Alerts
- skill_routing_pattern: real-run `@last/1`
- workflow_step_or_api_detail: current released feed
- guardrail_against_bad_app_behavior: Do not use legacy event names
- observable_outcome_or_evidence: Trigger a real run
- observable_outcome_or_evidence: current released feed

### FAIL remix_workflow

Task class: Remix

Prompt: Remix an existing public playbook with a new universe or methodology.

Checks: 11/21

Missing:
- skill_ref_exists_and_routed: references/content-legitimacy.md
- skill_ref_exists_and_routed: references/feed-lifecycle.md
- skill_ref_exists_and_routed: references/playbook-release.md
- workflow_step_or_api_detail: source playbook files
- workflow_step_or_api_detail: read through ALFS
- workflow_step_or_api_detail: v{feed_major}
- workflow_step_or_api_detail: source README
- guardrail_against_bad_app_behavior: alva remix is only for lineage
- guardrail_against_bad_app_behavior: must pass a content legitimacy audit
- guardrail_against_bad_app_behavior: Do not use WebSearch

### FAIL annotation_edit

Task class: Annotation-driven edit

Prompt: Apply an annotation targeting one rendered chart or card in an existing playbook.

Checks: 11/20

Missing:
- skill_ref_exists_and_routed: references/feed-lifecycle.md
- skill_ref_exists_and_routed: references/playbook-release.md
- skill_routing_pattern: Annotation Edit
- skill_routing_pattern: edit the generator
- workflow_step_or_api_detail: visual region
- workflow_step_or_api_detail: feed-derived or computation-derived
- guardrail_against_bad_app_behavior: Never freeze rendered live feed values
- guardrail_against_bad_app_behavior: Do not edit a screenshot
- observable_outcome_or_evidence: rerun the relevant feed

### FAIL secret_api_key_usage

Task class: Secret-backed runtime integration

Prompt: Use a third-party API key inside an Alva Cloud runtime script.

Checks: 11/17

Missing:
- skill_ref_exists_and_routed: references/content-legitimacy.md
- skill_routing_pattern: Secret Use
- workflow_step_or_api_detail: loadPlaintext(name) returns `null`
- guardrail_against_bad_app_behavior: Do not log raw secret values
- guardrail_against_bad_app_behavior: Do not read secret values back
- observable_outcome_or_evidence: clear missing-secret error

### FAIL fundamentals_fiscal_period

Task class: Fundamentals period alignment

Prompt: Compare quarterly fundamentals across companies with different fiscal calendars.

Checks: 11/17

Missing:
- skill_ref_exists_and_routed: references/content-legitimacy.md
- skill_ref_exists_and_routed: references/data-skills.md
- workflow_step_or_api_detail: period is fiscal
- guardrail_against_bad_app_behavior: Do not rename fiscal periods
- guardrail_against_bad_app_behavior: do not compare raw `period` strings
- guardrail_against_bad_app_behavior: do not infer a calendar quarter

### FAIL adk_scheduled_digest

Task class: ADK in deterministic scheduled pipeline

Prompt: Create a scheduled digest that uses LLM reasoning over real feed data.

Checks: 12/23

Missing:
- skill_ref_exists_and_routed: references/content-legitimacy.md
- skill_ref_exists_and_routed: references/feed-lifecycle.md
- skill_routing_pattern: ADK Narrative
- workflow_step_or_api_detail: Do not use ADK for one-off interactive research
- workflow_step_or_api_detail: prefer the AlvaAsk pattern
- workflow_step_or_api_detail: feed summarizer
- guardrail_against_bad_app_behavior: may not invent factual numbers or events
- guardrail_against_bad_app_behavior: not legitimate data sources
- observable_outcome_or_evidence: feed summarizer
- stale_or_conflicting_pattern_absent: require("@arrays/data
- stale_or_conflicting_pattern_absent: log(result.turns)

