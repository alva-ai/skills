# Trim conversation overhead

## 1. Context
Human approved a minimal follow-up to the Claude/MUSE review while real-turn EVAL
runs separately. Preserve final-answer usability and background evidence handoff.

## 2. Behavior
Avoid redundant process/explanation in final answers, do not repeat unaccepted
ordinary next-step suggestions without renewed relevance, and stop requiring
unsupported completion estimates for custom automation dispatch.

## 3. Decisions
Keep capability selection in SKILL.md; remove the duplicate numbered decision
order from request-routing.md. Retain quoted-Thesis retrieval precedence and the
Routes table's operational contracts (including alertOutput, source gates and
CLI fallbacks). Channel keeps execution placement. No wholesale routing rewrite.

## 4. Implementation
- [x] request-routing.md: entry pointer replaces duplicate decision order;
  concise final-result guidance and contextual suggestion suppression.
- [x] CLAUDE.md: omit redundant recaps, retain self-contained results and sources.
- [x] CHANNEL.md: replace mandatory rough ETA with a qualified estimate condition.
- [x] agent.test.ts: update existing static expectation that required rough ETA.
- [x] Existing cases.json/scenarios.json assertions now check equivalent retained
  entry constraints and reference pointer instead of deleted duplicate wording.
The prose reference already says not to retell the process, so it needs no edit.
Trade Setup and memory rules stay unchanged. No runtime/API changes.

## 5. Verification
Existing doc regression, mutation smoke, Sandbox agent/Codex tests, lint-fix,
link check and diff checks. Compare Trade Setup and memory against pre-turn files.
Real-turn follow-up: repeated ignored ordinary suggestion; user revisits it or
new evidence changes its relevance; useful interim findings followed by a concise
self-contained final answer; custom automation dispatch without invented ETA;
quoted Thesis and ordinary idea discussion routes after decision-order removal.

## 6. Approval
User authorized this local minimal implementation. No messaging other sessions,
publication, or new EVAL run. Current EVAL keeps its frozen snapshot; the next run
must freeze these later changes separately.

## 7. Results
Final checks passed:
- `node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/alva-polish-check.md`:
  97/97 cases and 1050/1050 checks. Initial failures were exact matches against
  removed duplicates; equivalent retained entry constraints are now checked.
- `node evals/alva-skill-docs/mutation-smoke.mjs`: 24/24 rejected mutations.
- `bun test src/agent.test.ts src/codex.test.ts`: 94/94, 405 assertions, rerun
  after formatting.
- Sandbox `make lint-fix`: only wrapped the changed test assertion; no unrelated
  edits. Skills has no lint-fix target.
- Both `git diff --check` passed. New SKILL.md#routing pointer resolves.
- ticker-read.md, memory.md, SKILL.md and the request-routing Trade Setup block
  are byte-identical to pre-turn snapshots.
Reviewed all incremental edits. Static assertions do not prove model behavior.

## 8. Remaining work
Combine current EVAL findings with these changes before the next real-turn run.
