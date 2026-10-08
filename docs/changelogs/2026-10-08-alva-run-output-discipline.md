# docs(alva): return values from `alva run` and read large results from a file

Primary design record:
alva-ai/toolkit-ts/docs/changelogs/2026-10-08-compact-run-output.md
(alva-ai/toolkit-ts#189).

## 1. Background and Current State

A prd task turn left a 10.4 MB Codex transcript, large enough to stall the
channel runtime reconciler on 2026-10-07. Most of it was `alva run` output.
The agent's scripts returned `JSON.stringify(...)`, so the result arrived
escaped inside the CLI envelope. The agent unpacked it with
`jq '.result|fromjson|fromjson'` and re-ran the same heavy script 17 times to
read different fields. Codex records each command's output three times, so
every rerun multiplied the cost.

The Skill gave no guidance on how to return or read `alva run` results.
toolkit-ts#189 now prints `result` decoded and prints compact JSON when stdout
is not a TTY.

## 2. Problem Model and End-to-End Behavior

- B1: Runtime scripts end with the value itself, not `JSON.stringify(value)`.
- B2: Scripts return only what the next step needs.
- B3: A large result, or one that will be inspected more than once, is
  produced once and the stored copy is queried; the script is not re-run to
  read another field. Shell sessions redirect stdout to a file and use
  `jq -c`.
- B4: In ALFS-native agent tool mode (no shell, no local files), the script
  writes the full result to ALFS and returns only the path and a summary;
  later reads are short scripts that return a slice.

## 3. Research, Findings, and Architecture Decision

- D4 (withdraws D1's placement): The guidance lives under `## Runtime` in
  `references/operational-pitfalls.md`. The file's mandatory routing table
  sends "Write or run jagent code" to `Runtime`. The first placement, under
  "Data And Runtime Debugging", is routed only when wrapping a new endpoint in
  feed logic, so ordinary runs never reached it (review comment on #644).
  SKILL.md is unchanged; its routing already lands in `Runtime`, and its line
  budget stays at 911.
- D5: The read-once recipe is mode-specific (B3/B4). `preflight.md` forbids
  `--local-file` and has no shell in ALFS-native agent tool mode, so a
  redirect-only recipe had no executable path there (review comment on #644).
- D3 (withdraws D2): Read-once uses shell redirection (`alva run … > file`),
  not a CLI flag. An earlier revision taught `alva run --output`. The flag was
  dropped from toolkit-ts#189 as redundant with redirection, which also removes
  the hard `unknown flag` dependency on a new toolkit release.
- R1 (revised): The example queries `.result.<field>`, which assumes the
  decoded `result` from toolkit-ts#189. On an older CLI `.result` is still a
  string, so the query fails visibly ("Cannot index string") rather than
  silently. Bump this Skill's pin after the toolkit pin.

## 4. Implementation Design

- `references/operational-pitfalls.md`: new "Reading `alva run` Output"
  subsection under `## Runtime`.
- `evals/alva-skill-docs/cases.json`: new
  `target.alva-run-output-discipline` case, scoped with `section_includes` to
  the `Runtime` section so a misplaced subsection fails.

### Serial Implementation Checklist

- [x] Pitfalls subsection.
- [x] Eval case.
- [x] Switch from `--output` to redirection (D3); revert the SKILL.md
      sentence and its budget bump (D1).
- [x] Move under `Runtime` (D4); add the ALFS-native recipe (D5); merge main
      for #643.

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
- The operator asked for the most elegant version after the first revision.
  That produced D1 (no SKILL.md change) and D3 (redirect instead of
  `--output`).
- Review on #644 found the routing gap and the missing ALFS-native path. The
  operator asked to merge and test on stg; those fixes (D4, D5) were applied
  first.

## 7. Outcome and Evidence

All checks below were run on the final content, with main merged (#643
included).

- `skill-doc-eval`: 95/95 cases, 1032/1032 checks. SKILL.md: 911 lines,
  unchanged.
- `mutation-smoke`: 24/24 mutations failed as expected.
  `durable-agent.test.mjs`: 5/5. `git diff --check`: clean.
- Falsifiability: moving the subsection back under "Data And Runtime
  Debugging" fails `target.alva-run-output-discipline`.
- ALFS-native recipe, run verbatim on stg jagent through `alva run`: the write
  step returned `{path: "/alva/home/<user>/tmp/research.json", income: 40}`,
  and the read step returned the 4-row slice.
- Shell recipe: in a local-dev Codex turn, `alva run … > research.json`
  followed by `jq -c '.result.cashflow[:2]'` returned the slice, and the two
  commands cost 1,925 transcript bytes. Full numbers are in the primary
  changelog §7.

## 8. Remaining Work

- Bump this Skill's pin after the toolkit-ts#189 pin (R1).
