# Bound preliminary thesis research and preserve background results

## 1. Context
Round-one C04 expanded a preliminary hypothesis into extensive research. After
an added capex condition, the last background answer omitted earlier evidence;
the foreground incorrectly described this as research finding no evidence.

## 2. Behavior
Respond to the point under discussion, keep hypotheses tentative, and match
research depth to the request without prescribing an answer structure. Verify
needed facts. Background revisions integrate relevant earlier findings and
sources; foreground conclusions stay within the returned material and preserve
uncertainty when it is incomplete.

## 3. Decisions
Use existing entry, routing and Sandbox communication rules. Preserve factual
evidence requirements and explicit deep research. No runtime/schema changes.

## 4. Implementation
- [x] skills/alva/SKILL.md: proportionate research depth without a fixed answer structure.
- [x] references/request-routing.md: apply that scope within Financial Analysis.
- [x] Companion Sandbox CLAUDE.md: integrated final background results.
- [x] Companion CHANNEL.md: keep conclusions within the returned material.

## 5. Verification
Run existing skill-doc-eval and Sandbox agent tests, lint-fix and diff checks.
Behavioral acceptance belongs to the separate Eval session. Target scenarios:
1. Preliminary falsifiable thesis, then a hypothetical capex/FCF revision:
   useful hypothesis before comprehensive research, no invented factual claims.
2. Explicit deep research with sourced baselines: retain research/evidence depth.
3. Background research with one, then two queued follow-ups: final return keeps
   relevant sources and findings, incorporates conditions and corrects superseded
   conclusions. Check child final text and foreground text separately.
4. A return omitting sources versus an explicit unsuccessful search: accurately
   distinguish missing returned evidence from a supported negative search result.
Repeat targeted cases using the same fixtures; freeze the revised entire bundle
and Sandbox config. Do not compare against a silently updated previous snapshot.

## 6. Approval
User explicitly authorized these two minimal fixes on 2026-10-14. Local changes
only; the user will coordinate the next real-turn EVAL.

## 7. Results
Verified on the final prompt text:
- `node evals/alva-skill-docs/skill-doc-eval.mjs --out /tmp/alva-c04-doc-check.md`:
  97/97 cases, 1050/1050 checks.
- Sandbox `bun test src/agent.test.ts`: 47 pass, 0 fail, 227 assertions.
- Sandbox `make lint-fix`: 38 files, no edits. Skills has no lint-fix target.
- Both repositories: `git diff --check` passed.
- Reviewed this patch against the pre-fix files: only four prompt locations
  changed; no Trade Setup, memory, publication or runtime edits.
Static checks cannot prove model adherence; no real-turn EVAL was run here.

## 8. Remaining work
Targeted real-turn EVAL; prompt instructions do not mechanically guarantee
complete background handoff. Runtime changes require separate consideration if
these cases still lose evidence.
