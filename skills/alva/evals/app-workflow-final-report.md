# Alva App Workflow Eval — final

This evaluation checks whether a fresh agent has enough instruction to complete representative Alva application workflows end to end. It is intentionally broader than routing: each case requires the right references, workflow/API details, hard gates, guardrails against incorrect app behavior, and observable completion evidence.

- Cases: 10/10
- Checks: 222/222
- Score: 100.00%

## Case Results

### PASS fresh_session_finance_answer

Task class: Direct Alva data answer

Prompt: In a fresh session, answer a current finance-data question such as NVDA P/E or BTC price.

Checks: 23/23

### PASS feed_backed_playbook_build

Task class: Feed-backed playbook creation

Prompt: Build a market dashboard or playbook backed by fresh Alva data feeds.

Checks: 34/34

### PASS playbook_release_public

Task class: Public playbook release

Prompt: Release a completed playbook publicly after feeds, HTML, and metadata are ready.

Checks: 24/24

### PASS altra_backtest_strategy

Task class: Altra strategy and backtest

Prompt: Backtest a crypto or equity allocation strategy and publish a usable result.

Checks: 22/22

### PASS push_notifications_end_to_end

Task class: Push notification lifecycle

Prompt: Enable push alerts for a released signal or digest playbook.

Checks: 21/21

### PASS remix_workflow

Task class: Remix

Prompt: Remix an existing public playbook with a new universe or methodology.

Checks: 21/21

### PASS annotation_edit

Task class: Annotation-driven edit

Prompt: Apply an annotation targeting one rendered chart or card in an existing playbook.

Checks: 20/20

### PASS secret_api_key_usage

Task class: Secret-backed runtime integration

Prompt: Use a third-party API key inside an Alva Cloud runtime script.

Checks: 17/17

### PASS fundamentals_fiscal_period

Task class: Fundamentals period alignment

Prompt: Compare quarterly fundamentals across companies with different fiscal calendars.

Checks: 17/17

### PASS adk_scheduled_digest

Task class: ADK in deterministic scheduled pipeline

Prompt: Create a scheduled digest that uses LLM reasoning over real feed data.

Checks: 23/23

