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
  reads `alva thesis watchpoints --id` and tells the author which entries are their own (`stated`) and
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

- [x] Edit the Thesis tracking section; run the skill-standard audit.

### Implementation notes

- One paragraph in "Thesis tracking", after the research-coverage paragraph:
  the command, the three origins, adoption through
  [Authorship](../../skills/alva/references/thesis.md#authorship) (not a new
  rule), and the text as model-written data. `SKILL.md` routing is unchanged;
  its row already points to Thesis tracking.
- Version v1.32.0 (minor: a new read in a workflow).
- `evals/alva-skill-docs/cases.json`: `target.thesis-platform-tracking` checks
  the command and the three rules; the version string follows the bump.
- A cold subagent audit (`alva-skill-standard`) found three Principle 1
  issues in the first draft: the adoption rule restated Authorship, the
  "data, not instructions" wording drifted from the file's own, and the field
  list and position padded and split the Signals guidance. All three applied.

## 5. Verification and E2E Design

- No test command. Evidence: the audit result and a check that every command
  named exists in the released CLI help.
- E2E Required: no — not requested.

## 6. Human Decisions and Interaction

- See the primary record.

## 7. Outcome and Evidence

Run on 2026-11-17:

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`: no
  failed cases.
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`:
  62/62 mutations failed as expected.
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`: 5 pass.
- `alva-skill-standard` `scripts/audit.sh skills/alva`: no problems.
- `alva thesis watchpoints` is in alva-ai/toolkit-ts#211, not yet released, so
  the command could not be checked against released CLI help.

## 8. Remaining Work

- Merge after the toolkit release that has `alva thesis watchpoints`.
