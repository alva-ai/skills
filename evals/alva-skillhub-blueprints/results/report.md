# Skillhub Blueprint Baseline Run

- Run id: `skillhub-baseline-2026-05-29`
- Generated at: 2026-05-29T02:00:00Z
- Profile: `prd`
- Mode: `evidence-slice`
- Cases scored: 17
- Average score: 73.14/100
- Score range: 65..80
- Agent run statuses: 0=17
- Agent timeouts: 0

## Scope

This run executed the evidence-gathering slice for every case. It did not
deploy/release 17 playbooks, so runtime/release/UI rubric points are awarded
only where direct evidence exists and otherwise remain unearned.

## Scores

| Case                                    | Skill                          | Disabled | Total | Shared | Case-specific |
| --------------------------------------- | ------------------------------ | -------- | ----: | -----: | ------------: |
| baseline-alva-thesis                    | alva/thesis                    | no       |    65 |     65 |             0 |
| baseline-alva-screener                  | alva/screener                  | no       | 73.33 |  68.33 |             5 |
| baseline-alva-backtest                  | alva/backtest                  | no       | 71.67 |  66.67 |             5 |
| baseline-alva-ai-digest                 | alva/ai-digest                 | no       |    75 |     70 |             5 |
| baseline-alva-earnings                  | alva/earnings                  | no       |    70 |     65 |             5 |
| baseline-alva-asset-deepdive            | alva/asset-deepdive            | no       | 73.33 |  68.33 |             5 |
| baseline-anthropic-catalyst-weekly      | anthropic/catalyst-weekly      | no       | 73.33 |  68.33 |             5 |
| baseline-anthropic-competitive-analysis | anthropic/competitive-analysis | no       |    75 |     70 |             5 |
| baseline-anthropic-comps-analysis       | anthropic/comps-analysis       | no       | 68.33 |  68.33 |             0 |
| baseline-anthropic-dcf-model            | anthropic/dcf-model            | no       | 68.33 |  68.33 |             0 |
| baseline-anthropic-idea-generation      | anthropic/idea-generation      | no       |    75 |     70 |             5 |
| baseline-anthropic-morning-note         | anthropic/morning-note         | no       |    75 |     70 |             5 |
| baseline-anthropic-model-update         | anthropic/model-update         | no       |    70 |     70 |             0 |
| baseline-anthropic-sector-overview      | anthropic/sector-overview      | no       |    80 |     70 |            10 |
| baseline-anthropic-thesis-tracker       | anthropic/thesis-tracker       | yes      |    75 |     70 |             5 |
| baseline-anthropic-earnings-preview     | anthropic/earnings-preview     | yes      |    80 |     70 |            10 |
| baseline-anthropic-earnings-analysis    | anthropic/earnings-analysis    | yes      |    75 |     70 |             5 |

## Evidence

Each scorecard records deterministic command evidence, agent Bash commands,
per-criterion status labels, passed/failed checks, and the agent's terminal
result.

Rubric status counts:

- all: full=158, partial=10, zero=87
- shared: full=143, partial=10, zero=0
- case-specific: full=15, partial=0, zero=87
