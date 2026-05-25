# Alva Skillhub Template Eval — baseline (main)

This evaluation checks every official `alva` Skillhub template against the refactored Alva skill. It verifies that a fresh agent is routed to the right references, preserves template-specific steps and data contracts, and avoids stale attached-source patterns that conflict with the current blueprint.

- Cases: 0/11
- Checks: 64/115
- Score: 55.65%

## Case Results

### FAIL skillhub_inventory_all_official_templates

Template: alva skillhub list --username alva

Evidence: 2026-05-25 list returned alva/quant-research-lab and alva/backtest

Checks: 6/9

Missing:
- workflow_step_or_api_detail: template-specific hard rules
- workflow_step_or_api_detail: instructional blueprint wins
- workflow_step_or_api_detail: source samples can be stale implementation examples

### FAIL quant_research_contract_and_pit_data

Template: alva/quant-research-lab quant_research_lab_template.md

Evidence: Data + Methodology sections require real sources, source mapping, feature availability, PIT features, and research contract before coding.

Checks: 7/11

Missing:
- skill_ref_exists_and_routed: references/content-legitimacy.md
- skill_ref_exists_and_routed: references/data-skills.md
- workflow_step_or_api_detail: agent builds the pipeline, not to be the data source
- workflow_step_or_api_detail: research contract

### FAIL quant_research_outputs_and_data_contract

Template: alva/quant-research-lab quant_research_lab_template.md

Evidence: Outputs include research/summary, research/features, model/predictions, model/summary, run/state, portfolio/analysis, signal/targets, FeedAltra sim/* and perf/*.

Checks: 8/14

Missing:
- skill_ref_exists_and_routed: references/feed-lifecycle.md
- workflow_step_or_api_detail: research/summary
- workflow_step_or_api_detail: research/features
- workflow_step_or_api_detail: model/predictions
- workflow_step_or_api_detail: run/state
- workflow_step_or_api_detail: portfolio/analysis

### FAIL quant_validation_and_model_deployability

Template: alva/quant-research-lab quant_research_lab_template.md

Evidence: Template bans random splits, tuning on final test/backtest, best-run-only reporting, and model deployment without reproducible features/metadata.

Checks: 10/13

Missing:
- skill_ref_exists_and_routed: references/content-legitimacy.md
- workflow_step_or_api_detail: Raw model outputs are not trading instructions
- guardrail_against_bad_app_behavior: Do not present paper results as live performance

### FAIL quant_playbook_result_groups

Template: alva/quant-research-lab quant_research_lab_template.md

Evidence: Playbook needs performance, portfolio/alpha, prediction timeline/state, model/feature evaluation, methodology/README evidence.

Checks: 7/11

Missing:
- skill_ref_exists_and_routed: references/playbook-release.md
- workflow_step_or_api_detail: Prediction Timeline
- workflow_step_or_api_detail: Model And Feature Evaluation
- workflow_step_or_api_detail: README evidence

### FAIL backtest_template_blueprint_first

Template: alva/backtest skills/alva/templates/what-if/template.md plus template-design-ui-view-source

Evidence: The current blueprint removes legacy in-HTML heading, README modal, What-If labels, and counter-narrative cards; attached source still contains stale versions of some of these.

Checks: 2/10

Missing:
- skill_ref_exists_and_routed: references/request-routing.md
- skill_ref_exists_and_routed: references/playbook-release.md
- workflow_step_or_api_detail: instructional blueprint wins
- workflow_step_or_api_detail: Source samples can be stale implementation examples
- workflow_step_or_api_detail: in-HTML README modal
- workflow_step_or_api_detail: template label
- workflow_step_or_api_detail: do not reintroduce it from an attached source file
- workflow_step_or_api_detail: Do not add an in-HTML README chip or methodology modal

### FAIL backtest_whatif_altra_engine_gate

Template: alva/backtest skills/alva/templates/what-if/template.md

Evidence: What-if event studies require Altra for event onset, forward-return, hit rate, drawdown/recovery, and cohort comparisons; feed wrapper only for non-strategy joins.

Checks: 3/10

Missing:
- skill_ref_exists_and_routed: references/feed-lifecycle.md
- workflow_step_or_api_detail: event onset detection
- workflow_step_or_api_detail: forward-return calculation
- workflow_step_or_api_detail: hit-rate
- workflow_step_or_api_detail: drawdown/recovery
- workflow_step_or_api_detail: cross-asset cohort comparison
- workflow_step_or_api_detail: never in a feed-side loop

### FAIL backtest_whatif_design_not_strategy_tabs

Template: alva/backtest skills/alva/templates/what-if/template.md

Evidence: What-if is a narrative scroll layout and explicitly says not to apply design-playbook-trading-strategy.md.

Checks: 5/9

Missing:
- skill_ref_exists_and_routed: references/playbook-release.md
- skill_routing_pattern: only for strategy dashboards or Skillhub blueprints that use the Overview/Analytics/Strategy/Feed tab structure
- workflow_step_or_api_detail: padding: var(--spacing-m) var(--spacing-xxl) var(--spacing-xxxxl)
- workflow_step_or_api_detail: If a Skillhub blueprint is active, read its layout and data contract before HTML work starts

### FAIL backtest_whatif_first_fold_and_layout

Template: alva/backtest skills/alva/templates/what-if/template.md

Evidence: Layout is hero first, exactly four horizon cards directly below, then path chart, two analysis charts, audit ledger, references card; first fold must contain hero + four cards only.

Checks: 3/9

Missing:
- skill_ref_exists_and_routed: references/request-routing.md
- skill_ref_exists_and_routed: references/playbook-release.md
- workflow_step_or_api_detail: hero card + four horizon cards
- workflow_step_or_api_detail: four horizon metric cards
- workflow_step_or_api_detail: widget-subtitle
- workflow_step_or_api_detail: Skillhub template's default sections are a floor, not a ceiling

### FAIL backtest_whatif_language_and_surface_bans

Template: alva/backtest skills/alva/templates/what-if/template.md

Evidence: Template bans What-If in user-facing copy, headings inside HTML, filters, timestamps, Q1-Q3 band, counter-narrative/readout rail, and 700 weight emphasis.

Checks: 7/10

Missing:
- workflow_step_or_api_detail: Do not add an in-HTML README chip or methodology modal
- workflow_step_or_api_detail: template-specific hard rules
- guardrail_against_bad_app_behavior: user-facing prose may not use the banned AI-tell shapes

### FAIL backtest_whatif_readme_release_contract

Template: alva/backtest skills/alva/templates/what-if/template.md

Evidence: Methodology is attached README.md at ~/playbooks/<name>/README.md and release uses absolute --readme-url; bottom References card is not the methodology.

Checks: 6/9

Missing:
- skill_ref_exists_and_routed: references/playbook-release.md
- skill_ref_exists_and_routed: references/content-legitimacy.md
- workflow_step_or_api_detail: References card

