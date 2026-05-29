# Skillhub Blueprint Baseline Scoring Issue Report

## Executive Summary

The current baseline scores are valid for an `evidence-slice` execution run, but
they are easy to misread. They do not measure blueprint quality by itself, and
they do not prove that the Alva skill can complete every production playbook
build. They measure how much evidence was collected for the skill-plus-blueprint
execution contract in this run.

The main scoring issue is scope mismatch:

- `cases.json` defines a full-live-playbook rubric: Skillhub routing, blueprint
  retrieval, data discovery, runtime feed creation, playbook release, UI
  verification, and blueprint-specific artifacts.
- `scripts/run-and-score.mjs` intentionally runs only an evidence-gathering
  slice. It asks the agent not to deploy, release, send notifications, or create
  persistent user-facing artifacts.
- As a result, shared chain checks mostly pass, while case-specific artifact,
  UI, runtime, release, and README checks mostly fail.

Therefore the score is best read as:

> Evidence-slice coverage for Alva skill execution against each production
> Skillhub blueprint.

It should not be presented as:

> Blueprint quality, production playbook quality, or full Alva skill success
> rate.

## What Was Actually Run

For each of the 17 production Skillhub blueprints, the runner:

1. Spawned a Claude Code agent in an isolated temporary home.
2. Installed the local `skills/alva` skill into that temporary home.
3. Passed the case prompt, which starts with `/use-skill:<id>`.
4. Required the agent to run preflight, `skillhub get`, `skillhub file`, and
   data-skills discovery.
5. Required the agent to summarize the selected blueprint, disabled state, data
   discovery, blueprint-specific requirements, and remaining full-build steps.
6. Explicitly instructed the agent not to deploy, release, send notifications,
   or create persistent user-facing artifacts.

The runner also collected deterministic command evidence outside the agent:

- `alva --version`
- `alva --help`
- `alva skillhub --help`
- `alva --profile prd whoami`
- `alva --profile prd skillhub get <id> --json`
- `alva --profile prd skillhub file <id> <blueprint_path>`
- `alva data-skills --help`
- `alva --profile prd data-skills list --json`

All 17 agent runs exited with status `0` and no timeout. The committed
scorecards were recomputed from the raw traces, so `reused_raw: true` means
"rescored from the real raw run" rather than "not run".

## How Scores Are Computed

Every rubric criterion has a point value and a list of observable checks. The
scorer awards points linearly:

```text
points_awarded = points_possible * passed_checks / total_checks
```

Each criterion also receives a status label:

- `full` means all checks passed.
- `partial` means at least one check passed and at least one failed.
- `zero` means no checks passed.

Each case has 100 possible points:

- 70 shared points for the common Alva skill chain.
- 30 case-specific points for the blueprint's unique contract.

## Overall Deduction Summary

| Area          | Possible | Awarded |   Lost |
| ------------- | -------: | ------: | -----: |
| Shared        |     1190 | 1168.32 |  21.68 |
| Case-specific |      510 |      75 |    435 |
| Total         |     1700 | 1243.32 | 456.68 |

The important observation is that 95% of all lost points are case-specific:

- Shared lost: 21.68 points.
- Case-specific lost: 435 points.

This is expected for an evidence-slice run because most case-specific checks
require real runtime outputs, released feeds, rendered UI, screenshots,
methodology README content, scheduled jobs, or notification behavior.

## Shared Rubric Deductions

Only two shared criteria lost points.

| Criterion                   | Cases affected |  Lost | Why it lost points                                                                               |
| --------------------------- | -------------: | ----: | ------------------------------------------------------------------------------------------------ |
| `communication.user-facing` |              7 | 11.69 | Final agent result did not fully prove result, verification, risk, or visible-copy expectations. |
| `chain.runtime-release`     |              3 |  9.99 | The trace did not prove frozen feed partition names and record fields for runtime outputs.       |

Affected shared cases:

| Case                        | Shared lost | Failed shared criteria                               |
| --------------------------- | ----------: | ---------------------------------------------------- |
| `alva/thesis`               |        5.00 | `chain.runtime-release`, `communication.user-facing` |
| `alva/screener`             |        1.67 | `communication.user-facing`                          |
| `alva/backtest`             |        3.33 | `chain.runtime-release`                              |
| `alva/earnings`             |        5.00 | `chain.runtime-release`, `communication.user-facing` |
| `alva/asset-deepdive`       |        1.67 | `communication.user-facing`                          |
| `anthropic/catalyst-weekly` |        1.67 | `communication.user-facing`                          |
| `anthropic/comps-analysis`  |        1.67 | `communication.user-facing`                          |
| `anthropic/dcf-model`       |        1.67 | `communication.user-facing`                          |

The shared rubric mostly measures whether the Alva skill followed the Skillhub
path and gathered current production evidence. Those checks largely passed:
preflight, `skillhub get`, `skillhub file`, profile/auth evidence, blueprint
path matching, and data-skills discovery were captured for every case.

## Case-Specific Deductions

Case-specific criteria account for nearly all lost points. These deductions are
not evidence that the blueprints are bad. They mostly mean the evidence-slice
run did not produce the full artifacts needed to verify each blueprint's unique
contract.

| Skill                            | Case-specific awarded | Case-specific lost | Main missing evidence                                                                      |
| -------------------------------- | --------------------: | -----------------: | ------------------------------------------------------------------------------------------ |
| `alva/thesis`                    |                     0 |                 30 | Reference clone, tabs, feed contract, basket data, push alignment, methodology.            |
| `alva/screener`                  |                     5 |                 25 | Scoring methodology, feed contract, tabs, factor flags, digest behavior.                   |
| `alva/backtest`                  |                     5 |                 25 | Altra runtime computation, verdict hero, title/copy rule, runtime feed fetch, methodology. |
| `alva/ai-digest`                 |                     5 |                 25 | Cadence config, source mix, feed contract, push behavior, feed-stream UI.                  |
| `alva/earnings`                  |                     5 |                 25 | Hero structure, tab set, KOL gate, sell-side boundary, frozen schema.                      |
| `alva/asset-deepdive`            |                     5 |                 25 | Scaffold leak guard, tabs, neutrality, SEC/EDGAR data, monitoring cadence.                 |
| `anthropic/catalyst-weekly`      |                     5 |                 25 | Covered event types, quant/narrative feeds, frozen contract, impact labeling, UI.          |
| `anthropic/competitive-analysis` |                     5 |                 25 | Metrics consistency, schema, ADK labeling, no fabricated TAM, UI.                          |
| `anthropic/comps-analysis`       |                     0 |                 30 | Peer quality, metric period, schema, statistics, negative EBITDA handling, UI.             |
| `anthropic/dcf-model`            |                     0 |                 30 | Fidelity disclaimer, feed inputs, schema, client-side math, base valuation anchor, UI.     |
| `anthropic/idea-generation`      |                     5 |                 25 | Metric filters, schema, candidates-not-conclusions framing, crowding data, UI.             |
| `anthropic/morning-note`         |                     5 |                 25 | Cadence, schema, top call, data-vs-opinion labeling, readability.                          |
| `anthropic/model-update`         |                     0 |                 30 | Consensus-not-private disclaimer, actuals, schema, delta focus, DCF leg, labeling.         |
| `anthropic/sector-overview`      |                    10 |                 20 | Schema, market-share proxy labeling, no TAM fabrication, UI.                               |
| `anthropic/thesis-tracker`       |                     5 |                 25 | Falsifiable pillars, schema, static-vs-feed split, labeling, review cadence.               |
| `anthropic/earnings-preview`     |                    10 |                 20 | Consensus selection, schema, beat-history math, UI.                                        |
| `anthropic/earnings-analysis`    |                     5 |                 25 | Latest-quarter confirmation, pre-print consensus, schema, delta focus, UI.                 |

## Why This Can Be Misleading

The current score number combines several things:

1. Skill routing quality.
2. Live Skillhub fetch quality.
3. Agent evidence-gathering quality.
4. Blueprint-specific implementation evidence.
5. Runtime/release/UI evidence that the run intentionally did not create.

Because those dimensions are collapsed into one 0-100 score, the result can look
like a blueprint-quality benchmark even though it is not. A low case-specific
score may mean "the blueprint was not implemented in this run", not "the
blueprint is low quality".

## What This Report Says About The Current Baseline

The current baseline is useful as a regression baseline for the early Skillhub
path:

- Did the agent honor `/use-skill:<id>`?
- Did it run Alva preflight?
- Did it fetch the current production blueprint?
- Did it discover data-skills before claiming data work?
- Did it record what would still be needed for a full build?

It is not sufficient as a pass/fail baseline for complete playbook production:

- It does not release feeds.
- It does not build or publish playbook HTML.
- It does not screenshot or lint a released artifact.
- It does not verify scheduled jobs.
- It does not prove notification behavior.
- It does not prove most blueprint-specific UI or schema contracts.

## Recommended Fix

Split the evaluation into two explicit score families instead of presenting one
combined score as the main result.

### 1. Evidence-Slice Score

Keep the current runner and make this the documented score:

- Scope: Alva skill routing, Skillhub fetch, blueprint inspection, data-skills
  discovery, and explicit full-build gap reporting.
- Expected high scores: preflight, current blueprint retrieval, evidence
  packaging, and communication.
- Expected low or excluded scores: real runtime, release, screenshot, UI, and
  blueprint artifact checks.

This is the score already produced by the current run.

### 2. Full-Build Score

Add a separate runner for real build/release cases:

- Scope: runtime scripts, feeds, jobs, playbook HTML, README, screenshot/lint,
  release URL, and blueprint-specific UI/schema behavior.
- Expected evidence: feed paths, job ids, release ids, playbook URL,
  screenshots, lint output, README, and source links.
- This score can grade the case-specific 30 points fairly.

### 3. Blueprint-Quality Score

If the goal is to evaluate the blueprint documents themselves, create a third
rubric that never runs the Alva skill as if it were building a playbook. It
should inspect the blueprint text for:

- Internal consistency.
- Clear required inputs and assumptions.
- Explicit data/source requirements.
- Stable feed contracts and field names.
- UI requirements that can be implemented and tested.
- Release and disabled-state guardrails.
- Missing or contradictory implementation guidance.

That would answer "is this blueprint good?" The current score answers "how much
of this blueprint execution path was evidenced by this run?"

## Immediate PR Follow-up

The current PR should keep the scorecards because they are honest about the
run's scope. It should also keep this report so reviewers do not confuse the
numbers with blueprint quality or full production success.

For the next iteration, the most important mechanical change is to make the
report generator emit the deduction summary automatically from
`scorecards.json`, so future baseline runs always explain their lost points
without manual analysis.
