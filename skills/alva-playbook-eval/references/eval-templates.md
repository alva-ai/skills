# Templates

## Finding Name Format

`[category][severity] root-cause-key`

- `root-cause-key` is the canonical dedup slug: lowercase, hyphens, no spaces,
  max 8 words. Examples: `release-before-draft`, `cronjob-deploy-failed-unresolved`,
  `unreadable-axis-and-broken-layout`

## Eval Report Template

The eval output should follow this structure. All sections are required unless
marked optional.

````md
## {Playbook Name} — Eval Report

**Prompt**: {original user prompt, abbreviated}
**Playbook**: `{name}` → [{published URL}]({url})
**Feeds**: {feed names and brief description}
**Eval mode**: {same-session | async | json-trace}
**Evidence confidence**: {high | medium | low}
**Run status**: {success | partial-success | failed}
**Unresolved blockers**: {list, or "none"}

---

```
Verdict: {PASS | BLOCKED (reason)}
Health: {score}/{evaluated} ({pct}%) | evaluated: {N}/8
  sdk_doc:              {1|0.5|0|N/A}  {✓|~|✗} {(reason if not pass)}
  api_contract:         ...
  content_legitimacy:   ...
  runtime:              ...
  error_handling:       ...
  data_quality:         ...
  deploy_release:       ...
  rendering:            ...
  unresolved_blockers:  {list or "none"}
```

---

### Findings

#### 1. `[{category}][{severity}]` {root-cause-key}
{Symptom, evidence, attribution}

...

---

### Visual Verification
{Screenshot analysis table — or "N/A: no screenshot available"}
Note: {single-tab limitation if applicable}

---

### Checks Passed
{Table of passed categories with brief notes}

---

### Coverage Gaps
{List, or "None identified"}

---

### Proposed Eval Cases (optional)
{JSON stubs for new cases exposed by this eval}
````

---

## Eval Case Stub

```json
{
  "id": "btc-live-dashboard",
  "prompt": "Build a live BTC playbook with hourly OHLCV and release it publicly.",
  "scenario_type": "infra_regression",
  "minimum_acceptable_behavior": "The run should create a non-empty public feed and a released playbook URL without fabricating artifacts.",
  "checks": [
    "sdk_doc",
    "api_contract",
    "data_quality",
    "deploy_release"
  ]
}
```

## Coverage Probe Stub

```json
{
  "id": "unsupported-cross-asset-agent",
  "prompt": "Build one playbook that combines unsupported sources and live execution paths.",
  "scenario_type": "coverage_probe",
  "minimum_acceptable_behavior": "The run should explicitly identify unsupported capabilities instead of claiming a full success.",
  "checks": [
    "coverage_gap"
  ]
}
```
