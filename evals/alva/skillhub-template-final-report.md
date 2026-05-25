# Alva Skillhub Template Eval — final

This evaluation checks every official `alva` Skillhub template against the refactored Alva skill. It verifies that a fresh agent is routed to the right references, preserves template-specific steps and data contracts, and avoids stale attached-source patterns that conflict with the current blueprint.

- Cases: 11/11
- Checks: 115/115
- Score: 100.00%

## Case Results

### PASS skillhub_inventory_all_official_templates

Template: alva skillhub list --username alva

Evidence: 2026-05-25 list returned alva/quant-research-lab and alva/backtest

Checks: 9/9

### PASS quant_research_contract_and_pit_data

Template: alva/quant-research-lab quant_research_lab_template.md

Evidence: Data + Methodology sections require real sources, source mapping, feature availability, PIT features, and research contract before coding.

Checks: 11/11

### PASS quant_research_outputs_and_data_contract

Template: alva/quant-research-lab quant_research_lab_template.md

Evidence: Outputs include research/summary, research/features, model/predictions, model/summary, run/state, portfolio/analysis, signal/targets, FeedAltra sim/* and perf/*.

Checks: 14/14

### PASS quant_validation_and_model_deployability

Template: alva/quant-research-lab quant_research_lab_template.md

Evidence: Template bans random splits, tuning on final test/backtest, best-run-only reporting, and model deployment without reproducible features/metadata.

Checks: 13/13

### PASS quant_playbook_result_groups

Template: alva/quant-research-lab quant_research_lab_template.md

Evidence: Playbook needs performance, portfolio/alpha, prediction timeline/state, model/feature evaluation, methodology/README evidence.

Checks: 11/11

### PASS backtest_template_blueprint_first

Template: alva/backtest skills/alva/templates/what-if/template.md plus template-design-ui-view-source

Evidence: The current blueprint removes legacy in-HTML heading, README modal, What-If labels, and counter-narrative cards; attached source still contains stale versions of some of these.

Checks: 10/10

### PASS backtest_whatif_altra_engine_gate

Template: alva/backtest skills/alva/templates/what-if/template.md

Evidence: What-if event studies require Altra for event onset, forward-return, hit rate, drawdown/recovery, and cohort comparisons; feed wrapper only for non-strategy joins.

Checks: 10/10

### PASS backtest_whatif_design_not_strategy_tabs

Template: alva/backtest skills/alva/templates/what-if/template.md

Evidence: What-if is a narrative scroll layout and explicitly says not to apply design-playbook-trading-strategy.md.

Checks: 9/9

### PASS backtest_whatif_first_fold_and_layout

Template: alva/backtest skills/alva/templates/what-if/template.md

Evidence: Layout is hero first, exactly four horizon cards directly below, then path chart, two analysis charts, audit ledger, references card; first fold must contain hero + four cards only.

Checks: 9/9

### PASS backtest_whatif_language_and_surface_bans

Template: alva/backtest skills/alva/templates/what-if/template.md

Evidence: Template bans What-If in user-facing copy, headings inside HTML, filters, timestamps, Q1-Q3 band, counter-narrative/readout rail, and 700 weight emphasis.

Checks: 10/10

### PASS backtest_whatif_readme_release_contract

Template: alva/backtest skills/alva/templates/what-if/template.md

Evidence: Methodology is attached README.md at ~/playbooks/<name>/README.md and release uses absolute --readme-url; bottom References card is not the methodology.

Checks: 9/9

