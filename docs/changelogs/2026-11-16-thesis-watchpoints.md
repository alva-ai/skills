# docs(alva): read a Thesis's watchpoints when tracking it

Local record. Primary record: alva-backend
`docs/changelogs/2026-11-16-thesis-watchpoints.md`, which holds the full
design and the behavior, failure, decision and risk IDs (B, F, D, R) referred
to below.

## 1. Background and Current State

- Problem/outcome: the author cannot see what Alva watches for a Thesis.
  This repository's part is to tell the Alva agent to read it and how to talk
  about it.
- Current implementation (`3892e5a`): `skills/alva/references/thesis.md`,
  "Thesis tracking", reads `alva thesis get` and `alva thesis signals`. It
  does not mention watchpoints.
- Runtime evidence: none.

## 2. Problem Model and End-to-End Behavior

- Carries B14 of the primary record. When tracking a Thesis the agent also
  reads `alva thesis watchpoints --id`, can group Signals by their
  watchpoint, and tells the author which entries are their own (`stated`) and
  which are Alva's reading (`inferred`, `agent`).
- An inferred entry becomes the author's only through an Update the author
  asks for, under the existing publication consent rules. The agent does not
  publish one on its own.

## 3. Research, Findings, and Architecture Decision

- Follows D6 and D14 of the primary record. The guidance goes in the existing
  Thesis reference; `SKILL.md` keeps routing to it and gains no duplicate.

## 4. Implementation Design

- `skills/alva/references/thesis.md`, "Thesis tracking": the command, the
  three origins, watchpoint text as model-written evidence, and the Update
  path for adopting an entry. Edited under the `alva-skill-standard`.
- Lands after the toolkit-ts release that has the command.

### Serial Implementation Checklist

- [ ] Edit the Thesis tracking section; run the skill-standard audit.

## 5. Verification and E2E Design

- No test command. Evidence: the audit result and a check that every command
  named exists in the released CLI help.
- E2E Required: no — not requested.

## 6. Human Decisions and Interaction

- See the primary record.

## 7. Outcome and Evidence

## 8. Remaining Work
