# Thesis publishing route

## 1. Background

Implements the Skill-facing slice of mono-meta #950. Existing guidance treated
thesis trackers as Playbook builds, which is not original-viewpoint publishing.

## 2. Behavior

Route explicit Thesis publication/maintenance/polishing to a focused reference.
Preserve original text; optional title/entities; public default without a second
ritual confirmation; no implicit rewrite or publication from discussion.
Keep explicit dashboards/custom trackers on their existing route.

## 3. Decisions

Progressive disclosure: one reference, linked from the concept table, routing
table and existing tracker discussion. Help-first; no replacement infrastructure
when commands are unavailable. Rewrite guidance matches Backend thesis_rewrite.go.

## 4. Changes

- skills/alva/SKILL.md: explicit route and artifact distinction.
- skills/alva/references/thesis.md: input, UUID, update and result boundaries.

## 5. Verification

- With the Codex system Skill Creator installed: `uv run --with pyyaml python "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" skills/alva`: PASS. This uses the local Codex skill, not a validator shipped in this repository.
- `node evals/alva-skill-docs/skill-doc-eval.mjs --out /private/tmp/thesis-950-skills-eval.md`: PASS, 91/91 cases, 944/944 checks, top-level size 911 lines.
- Independent source-only simulation of publish/analysis/rewrite/dashboard/
  ambiguous-response resubmission: appropriate routing and mutation boundaries
  in all five scenarios; no material contradiction identified.
These are not proof of live Agent execution or deployed command availability.

## 6. Human direction

User approved #950 implementation and requested rebase onto main and PRs after
Backend #2508 merged. No deployment or production publication performed here.

## 7. Outcome

Focused Thesis routing and reference implemented, preserving the existing
top-level size limit and all prior documentation checks. No live publication.

## 8. Remaining work

Merge/deploy matching Backend/Gateway/Toolkit changes first. Actual loaded
runtime Skill, live Agent E2E, #939 Signal execution and #940 subscription/
delivery acceptance remain separate unverified dependencies. No closure of #950.
