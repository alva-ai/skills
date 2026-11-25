# feat(alva): let a Thesis's author choose which Signals it shows (v1.34.0)

Primary record: alva-ai/alva-backend
`docs/changelogs/2026-11-19-thesis-signal-preferences.md` (alva-ai/alva-backend#3771),
sections 1-6 approved by the owner on 2026-11-23. This record covers checklist step 13 (the skill)
and behavior B13.

## Change

- `references/thesis.md`: a new "Signal settings" section: read the setting, map the request
  ("no technicals", "only major") onto kinds and a minimum importance, say that it applies to
  every reader, pushes and the next daily Overview, wait for confirmation, then write only what
  changes. Only the author can set it; for another's Thesis the agent says so.
- The create command gains `--signal-kinds` and `--signal-min-importance`, passed only when the
  author asked to limit Signals; a new Thesis otherwise shows everything. The creation preview
  lists Signals ("all" by default) and a changed setting voids the confirmation.
- "What the author asks for" routes "show only some kinds of Signals" to the new section.
- `SKILL.md`: the Thesis maintenance routing row names the setting; version v1.34.0.
- `evals/alva-skill-docs/cases.json`: the `target.mainline-updates` version pin follows to
  `v1.34.0` (main was v1.33.1 when merged in).

## Dependencies and release

The commands come from toolkit-ts (`alva thesis signal-preferences get|set`, the create options),
checklist step 12, which follows the backend and the gateway. Merge this after that CLI is
released, so the agent never routes to a command the installed CLI lacks.

## Verification

Audited cold by a subagent against `alva-skill-standard` (`scripts/audit.sh` and the judgment pass
in its `references/audit.md`), 2026-11-23. `audit.sh`: no broken links or orphan references. All
seven text findings applied: the preview lists Signals and a change to them voids the confirmation;
the create flags are independent; the non-author case is triggered by the refused read; "fewer
notifications" now offers Signal settings before pausing research; hiding every kind routes to
stopping Signals; the Overview timing reads "from its next daily run". The eighth (B13 asks the
agent to tell the user a new Thesis shows every Signal) is met by the preview's Signals line, which
shows "all" by default.
