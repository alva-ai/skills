# Reduce query startup overhead

## 1. Context
The formal Eval and cross-review found frequent top-level help calls and broad
reference loading. User approved three minimal follow-ups, then a conditional adjusted-price
verification paragraph after reviewing endpoint contracts.

## 2. Behavior
Use a compact command index and relevant help when uncertain. Route simple
price/identity lookups directly to Data Skills; retain analysis evidence gates.
Saved communication preferences set default depth, subject to the current ask.
For adjusted-return requests, investigate documented price basis and event
coverage before declaring unsupported; do not infer an adjustment convention.

## 3. Decisions
Restore command navigation without endpoint schemas or duplicate reference lists.
Narrow ticker-read entry and remove repeated prose pre-read instructions from
request-routing. Preserve source policy, Trade Setup, and memory-write behavior.

## 4. Implementation
- [x] SKILL.md: command index (including portfolio), conditional help,
  simple-fact entry; remove the duplicate prose pointer at answer completion,
  preserving the on-demand reference and disclaimer principle.
- [x] request-routing.md: matching scope and single evidence-gate reference.
- [x] ticker-read.md: scope introduction only; operational body unchanged.
- [x] Sandbox CLAUDE.md: one preference-priority sentence.
- [x] data-skills.md: one adjusted-price verification paragraph; no fixed
  window, inferred adjustment, or source-policy expansion.
- [x] Eval handoff: S06-A/S17-A and explicit child-trace collection prerequisite
  for S15-D/S19-C; Eval-session acceptance/scheduling remains unconfirmed.
- [x] cases.json: update six existing cases that asserted obsolete mandatory
  reads; keep evidence, disclaimer and analysis-source checks.

## 5. Verification
E2E Required: no for this local prompt-only handoff. Real-turn behavioral Eval
is owned by the separate Eval session before acceptance; static tests establish
only document contracts and profile compatibility.
Run docs regression, mutation smoke, durable-Agent tests, existing Sandbox
agent/Codex tests, Sandbox make lint-fix, and both repos' diff checks.

## 6. Approval
User explicitly approved the three local changes, the later adjusted-price
paragraph, and the updated targeted Eval handoff.
No runtime/data-policy change, commit, push, or independent Eval run.

## 7. Outcome and Evidence
- Docs regression: 97/97 cases, 1050/1050 checks.
- Mutation smoke: 24/24 mutations rejected; durable-agent.test.mjs: 5/5.
- Sandbox agent/Codex tests: 94/94, 405 assertions.
- Sandbox make lint-fix: no fixes; both git diff --check passed.
- Reviewed incremental diff against pre-turn files. ticker-read operational
  body and CLAUDE.md outside the new sentence remain byte-identical.
- Current CLI endpoint documentation confirms dividends filter record/payment/
  declaration dates and splits filter publication time. Kline documents close
  without an adjustment declaration. The approved Data Skills paragraph now
  describes conditional verification, not a guaranteed recovery algorithm.

After the adjusted-price paragraph was added, reran
`node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/alva-20261020-adjustment-check.md`
from the Skills repo: 97/97 cases, 1050/1050 checks; `git diff --check` passed.
Reviewed the new paragraph and handoff against the approved conditional wording.
No additional Sandbox changes; prior runtime-test results remain applicable.

After the final portfolio-index and duplicate-pointer correction, reran
`node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/alva-20261020-final-polish.md`:
97/97 cases, 1050/1050 checks; `git diff --check` passed. Reviewed the two-hunk
SKILL.md change; on-demand prose access, evidence and disclaimer rules remain.

## 8. Remaining Work
Targeted real-turn comparison: quote, historical close, security identity,
bounded thesis formation, quoted-Thesis analysis and saved response preferences.
Verify S06-A/S17-A behavior and confirm actual price basis and event completeness
before claiming recovery. Collect child-session traces before S15-D/S19-C reruns.
Static checks do not establish speed or answer quality.
