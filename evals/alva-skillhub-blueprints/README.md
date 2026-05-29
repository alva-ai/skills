# Alva Skillhub Blueprint Baseline

This directory defines a baseline eval set for every blueprint returned by:

```bash
alva --profile prd skillhub list --json
```

Each case starts with an explicit `/use-skill:<username>/<name>` directive. That
forces the Alva skill eval to cover the full Skillhub path in its rubric:
pre-flight, `get`, fresh blueprint `file`, Guided Planning, data discovery, Alva
runtime work, playbook release verification, and evidence packaging.

## Files

- `cases.json` - machine-readable baseline cases and rubrics.
- `scripts/verify.mjs` - manifest/catalog verifier.
- `scripts/run-and-score.mjs` - evidence runner and deterministic scorer.
- `results/run-summary.json` - latest committed run summary.
- `results/scorecards.json` - latest committed per-case rubric scorecards.
- `results/report.md` - latest committed human-readable score report.
- `results/scoring-issue-report.md` - explanation of what the score measures,
  where points were lost, and why it is not a blueprint-quality score.

## Verify The Baseline

Manifest only:

```bash
node evals/alva-skillhub-blueprints/scripts/verify.mjs --offline
```

Against production Skillhub:

```bash
node evals/alva-skillhub-blueprints/scripts/verify.mjs --profile prd
```

One case:

```bash
node evals/alva-skillhub-blueprints/scripts/verify.mjs \
  --profile prd \
  --case alva/backtest
```

The live verifier checks that:

- `cases.json` covers every skill returned by the production catalog.
- each manifest case points at the current `skillhub get` file listing.
- each blueprint can be fetched with `skillhub file`.
- required marker text appears in the fetched blueprint.
- shared rubric points total 70 and every case-specific rubric totals 30.

## Scoring

Each run is scored out of 100:

- 70 shared points cover the end-to-end Alva skill chain.
- 30 case-specific points cover the blueprint's unique contract.

To reproduce the latest committed baseline run:

```bash
node evals/alva-skillhub-blueprints/scripts/run-and-score.mjs \
  --profile prd \
  --run-id skillhub-baseline-2026-05-29 \
  --timeout-ms 240000
```

The committed run uses `mode=evidence-slice`: every catalog case is run through
the Alva skill, production Skillhub blueprint retrieval, data-skills discovery,
and evidence summarization, but it does not deploy or release 17 playbooks.
Runtime, release, screenshot, and UI artifact checks are scored only when the
trace contains direct evidence; otherwise those checks remain unearned. Each
criterion in `results/scorecards.json` includes a `status` label (`full`,
`partial`, or `zero`) plus `passed_checks`, `failed_checks`, and evidence
snippets for later re-grading.

Read `results/scoring-issue-report.md` before interpreting the number as a
quality score. The committed score is an evidence-slice execution score for the
Alva skill plus each blueprint, not a standalone blueprint-quality benchmark.

Use the rubric tags as labels in whatever evaluation store consumes the run
result. The intended tags are small and stable: `skillhub`, `blueprint`, `data`,
`feed`, `release`, `ui`, `provenance`, plus case-domain tags such as `dcf`,
`comps`, or `earnings-preview`.

## Disabled Blueprints

The production list currently returns disabled entries with fetchable
blueprints. They are included as explicit-directive regression cases. An agent
must not recommend them organically while disabled, but if the user provides an
exact `/use-skill:` directive, the eval checks that the agent records the
disabled state and either completes the full chain or returns a precise platform
blocker.

## Evidence Package

A passing baseline run should keep enough evidence to re-grade later:

- `alva --version`, profile, auth, and Arrays JWT status.
- `alva --profile prd skillhub get <id> --json`.
- `alva --profile prd skillhub file <id> <blueprint_path>`.
- data-skills discovery and endpoint shape-check output.
- runtime script/feed paths, job ids, feed release ids, and playbook URL.
- README text, screenshot path, lint output, and release command output.
- rubric self-assessment with one label per criterion id.

Live financial numbers drift; grade provenance, field shape, and artifact
behavior instead of exact market values.
