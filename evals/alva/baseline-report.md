# Alva Skill Capability Map Eval — baseline

- Cases: 4/22
- Checks: 204/234
- Score: 87.18%

## Case Results

### FAIL rule0_preflight_memory

Prompt: Use Alva to answer a finance question in a new session.

Checks: 10/11

Missing:
- skill_ref: references/preflight.md

### FAIL skillhub_quant_template

Prompt: /use-skill:alva/quant-research-lab build a factor research playbook.

Checks: 11/13

Missing:
- skill_ref: references/request-routing.md
- skill_pattern: fresh through the Skillhub workflow

### FAIL skillhub_backtest_template

Prompt: /use-skill:alva/backtest create a what-if event study.

Checks: 8/11

Missing:
- skill_ref: references/request-routing.md
- skill_ref: references/playbook-release.md
- corpus_pattern: never in a feed-side

### FAIL content_legitimacy

Prompt: Build a dashboard with charts and metrics from market data.

Checks: 8/11

Missing:
- skill_ref: references/content-legitimacy.md
- skill_ref: references/feed-lifecycle.md
- skill_pattern: not to be the data source

### FAIL data_skills_pipeline

Prompt: Find the right Alva API for equity fundamentals and call it from a feed.

Checks: 9/11

Missing:
- skill_ref: references/data-skills.md
- corpus_pattern: Do not use X-API-Key

### FAIL feed_lifecycle_release_gate

Prompt: Create and release a scheduled BTC EMA feed.

Checks: 12/13

Missing:
- skill_ref: references/feed-lifecycle.md

### FAIL html_build_gate

Prompt: Write playbook HTML for a dashboard.

Checks: 12/13

Missing:
- skill_ref: references/playbook-release.md

### FAIL playbook_draft_gate

Prompt: Create a playbook draft after feeds and HTML are ready.

Checks: 10/11

Missing:
- skill_ref: references/playbook-release.md

### FAIL playbook_release_gate

Prompt: Publish a finished playbook.

Checks: 11/12

Missing:
- skill_ref: references/playbook-release.md

### FAIL push_notifications

Prompt: Enable push alerts for a released signal playbook.

Checks: 10/11

Missing:
- skill_ref: references/push-notifications.md

### FAIL search_content

Prompt: Add social/news search context to a market narrative playbook.

Checks: 8/10

Missing:
- skill_ref: references/data-skills.md
- skill_ref: references/content-legitimacy.md

### PASS secret_manager

Prompt: Use a third-party API key in an Alva Cloud script.

Checks: 8/8

### FAIL adk_narrative

Prompt: Create a scheduled digest that summarizes real feed data.

Checks: 7/9

Missing:
- skill_ref: references/content-legitimacy.md
- skill_pattern: may not invent factual

### FAIL jagent_runtime

Prompt: Write an Alva runtime script that fetches HTTP data and writes ALFS files.

Checks: 8/10

Missing:
- skill_pattern: top-level await
- corpus_pattern: no process

### PASS altra_strategy

Prompt: Backtest a crypto allocation strategy and publish results.

Checks: 11/11

### FAIL onnx_model

Prompt: Deploy a trained ONNX model for scheduled inference.

Checks: 9/10

Missing:
- skill_ref: references/playbook-release.md

### FAIL remix_workflow

Prompt: Remix an existing public playbook with a new universe.

Checks: 8/9

Missing:
- skill_ref: references/content-legitimacy.md

### FAIL annotation_edits

Prompt: Apply an annotation to change one chart in an existing playbook.

Checks: 7/8

Missing:
- skill_pattern: edit the generator

### FAIL fundamentals_periods

Prompt: Compare quarterly fundamentals for NVDA and AAPL.

Checks: 7/9

Missing:
- skill_ref: references/content-legitimacy.md
- corpus_pattern: period is fiscal

### PASS voice_language_creators_note

Prompt: Write final user-facing copy and a creator's note for a released playbook.

Checks: 10/10

### PASS api_reference_routing

Prompt: Use fs, release, and trading CLI commands safely.

Checks: 13/13

### FAIL operational_pitfalls

Prompt: Debug stale feed data, path issues, and runtime limits.

Checks: 7/10

Missing:
- skill_ref: references/operational-pitfalls.md
- corpus_pattern: @last returns chronological
- corpus_pattern: Quote ~ paths

