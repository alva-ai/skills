# docs(alva): return values from `alva run` and read large results from a file

Primary design record:
alva-ai/toolkit-ts/docs/changelogs/2026-10-08-compact-run-output.md.

## 1. Background and Current State

A prd task turn left a 10.4 MB Codex transcript, large enough to stall the
channel runtime reconciler on 2026-10-07. Most of it was `alva run` output.
The agent's scripts returned `JSON.stringify(...)`, so the result arrived
escaped inside the CLI envelope. The agent unpacked it with
`jq '.result|fromjson|fromjson'` and re-ran the same heavy script 17 times to
read different fields. Codex records each command's output three times, so
every rerun multiplied the cost.

The Skill gave no guidance on how to return or read `alva run` results. Toolkit
now decodes results, prints compact JSON off a TTY, and adds
`alva run --output <file>`.

## 2. Problem Model and End-to-End Behavior

- B1: Runtime scripts end with the value itself, not `JSON.stringify(value)`.
- B2: Scripts return only what the next step needs.
- B3: A large result, or one that will be inspected more than once, is
  produced once with `--output` and then queried with `jq -c` against the file.
  The script is not re-run to read another field.
- B4: The guidance states that `--output` is unavailable in the embedded Agent
  runtime.

## 3. Research, Findings, and Architecture Decision

- D1: The detail lives in `references/operational-pitfalls.md` under "Data And
  Runtime Debugging", the section SKILL.md already sends agents to before each
  run/debug step.
- D2: SKILL.md gets one sentence in the existing runtime paragraph. The
  habit it corrects is common enough to need top-level visibility. The
  top-level size budget rises by exactly that one line (911 → 912), following
  the #596 precedent.
- R1: `--output` exists only in a toolkit release that includes
  alva-ai/toolkit-ts `jaxxjj/compact-cli-output`. Merge this after that release
  and the sandbox pin bump, or the agent may hit `unknown flag`.

## 4. Implementation Design

- `references/operational-pitfalls.md`: new "Reading `alva run` Output"
  subsection.
- `SKILL.md`: one sentence in "Execution: Jagent Runtime And `alva run`".
- `evals/alva-skill-docs/cases.json`: new
  `target.alva-run-output-discipline` case, and `target.top-level-size`
  raised to 912.

### Serial Implementation Checklist

- [x] Pitfalls subsection.
- [x] SKILL.md pointer within one extra line.
- [x] Eval case and size budget.

## 5. Verification and E2E Design

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`,
  `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`,
  `node --test evals/alva-skill-docs/durable-agent.test.mjs`,
  `git diff --check`.
- E2E: covered by the toolkit local-dev run. The sandbox image used there
  carries this branch's skill files.

## 6. Human Decisions and Interaction

- The operator ruled out changing Codex's native rollout format. The fix stays
  on Alva's side: CLI output and Skill guidance.

## 7. Outcome and Evidence

- `skill-doc-eval`: 94/95 cases, 1025/1026 checks. The one failure is
  `target.mainline-updates` (`version: v1.22.2` pin vs SKILL.md v1.23.0),
  which also fails on main since #642 and is fixed by open PR #643. With
  that pin aligned locally: 95/95 and 1026/1026. `mutation-smoke`: 24/24
  mutations failed as expected. `durable-agent.test.mjs`: 5/5.
  `git diff --check`: clean.
- Falsifiability: deleting the new pitfalls subsection fails
  `target.alva-run-output-discipline` on all six of its pitfalls checks.
- E2E: the toolkit local-dev run baked these skill files into the sandbox
  image. In a Codex turn, `alva run --output` followed by `jq -c` returned
  the 215-byte summary and the queried slice. Full numbers are in the primary
  changelog §7.

## 8. Remaining Work

- Rebase after #643 merges so CI's base eval is green.
- Merge only after the toolkit release and the sandbox toolkit pin bump (R1).
