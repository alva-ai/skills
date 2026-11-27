# fix(alva): drop the screenshot step; the screenshot command is retired (v1.36.2)

## 1. Background and Current State

- The screenshot endpoint is retired and the Toolkit removes `alva screenshot`
  and the embedded `playbooks screenshot`. Older CLIs get 404 from it.
- v1.36.1 still asks agents to capture the deployed `published_url` after a
  Playbook release:
  - `references/playbook-creation.md`: Build Order step 7, the Static Snapshot
    note, the `## Screenshot` section and the closing `published_url` line;
  - `SKILL.md`: the CLI table row, the Playbook route and the Playbook
    completion criterion;
  - `references/preflight.md`, `content-legitimacy.md` and
    `user-facing-prose.md` mention screenshots as evidence or a local-file flag.
- Evals assert the step: `retained.playbook-release` (`alva screenshot`),
  `issue592.playbook-release-behavior` and `scenario.dashboard-playbook-build`
  (the `Screenshot` section), `target.top-level-playbook-routing`, and
  `target.mainline-updates` (phrases from that section and the version).

## 2. Problem Model and End-to-End Behavior

- B1 — A Playbook build ends at draft, lint and release; no capture step.
  Feed reads, freshness, README and lint stay gated before release.
- B2 — The skill never teaches `alva screenshot` or `playbooks screenshot`.
- B3 — `published_url` stays for verification only, never as the share link.
- Unchanged: chart-preview images that `PublishChartHTML` and the price chart
  SDK return, and user-provided screenshots as inputs.

## 3. Research, Findings, and Architecture Decision

- D1 — Delete the step and the sentences that depend on it rather than replace
  it with a new verification method.
- D2 — `retained.playbook-release` now `excludes` both command names, so the
  corpus cannot teach the retired command again.
- D3 — Patch release v1.36.2, and its literal eval assertion in
  `target.mainline-updates`.
- D4 — Regenerate `baseline-report.md` (`--treeish origin/main`) and
  `final-report.md` with `skill-doc-eval.mjs` (separate commit).

## 4. Implementation Design

- Docs: `skills/alva/SKILL.md`, `references/playbook-creation.md`,
  `references/preflight.md`, `references/content-legitimacy.md`,
  `references/user-facing-prose.md`.
- Evals: `evals/alva-skill-docs/cases.json`, `scenarios.json`, the two reports.

### Serial Implementation Checklist

- [x] Remove the screenshot step and its dependent sentences (B1, B3).
- [x] Update the eval cases and scenario; add the exclusion (B2, D2).
- [x] Bump to v1.36.2 with its eval assertion (D3).
- [x] Regenerate the reports (D4).

## 5. Verification and E2E Design

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`:
  136/136 cases, 1746/1746 checks.
- Baseline (`--treeish origin/main`): 133/136; the three failures are
  this change (routing phrase, version, the exclusion).
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`:
  123/123 mutations fail as expected.
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`: 5/5.
- Falsification: putting `alva screenshot` back into a reference fails
  `retained.playbook-release` (`excludes alva screenshot`).
- E2E Required: no; documentation and eval change.

## 6. Human Decisions and Interaction

- 2026-11-26: the human retired the screenshot endpoint and asked to drop the
  verification step, the eval expectations, the `SKILL.md` mentions, the
  scenario and the reports.

## 7. Outcome and Evidence

- B1-B3 and D1-D4 done as designed; no deviations.
- Evidence is section 5 (doc eval 136/136, baseline 133/136 with the three
  expected failures, mutation smoke 123/123, durable tests 5/5, the
  exclusion falsified by re-adding the command). CI `eval`: pass.

## 8. Remaining Work

- Release v1.36.2 after the Toolkit release that removes the command; the
  release then syncs to the packaged skill copy.
- An open docs PR about WebP screenshot validation (#464) is superseded.
