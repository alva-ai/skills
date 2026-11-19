# docs(alva): explain observed entries in user.md

Local record. Primary record:
`alva-backend/docs/changelogs/2026-11-18-memory-user-initiated-intake.zh.md`
(alva-ai/alva-backend#3822).

## 1. Background and Current State

Daily Dream is learning to read the user's connected accounts (X, broker) and
what they keep on Alva (watchlist, people followed). What that shows is written
into the sections `user.md` already has (Investment Style, Interests, Investment
Thoughts), and each such entry ends with `(observed, <source>, <date>)`.

`references/memory.md` says durable user memory comes only from the user's own
statements. The conversation agent therefore has no way to tell an observed
entry from a stated one, and may quote it back as the user's view or edit it.

## 2. Problem Model and End-to-End Behavior

- B1: The agent treats an entry ending with `(observed, <source>, <date>)` as
  attention or habit seen in connected accounts, not as a user statement.
- B2: The agent may use it to choose focus and to suggest ideas worth developing
  into a Thesis, and does not present it as the user's view or intent.
- B3: The agent does not write entries with this mark. When the user confirms or
  corrects one, it records the user's statement as their own entry and removes
  the observed one it replaces.

## 3. Research, Findings, and Architecture Decision

- D1: Add one short subsection, "Observed entries", next to the existing
  investment memory examples, and one pointer from the Journal section where
  Dream's promotion rule is stated. No other rule changes: conversational writes
  still require the user's own statements.

## 4. Implementation Design

- `skills/alva/references/memory.md`: the pointer and the subsection.
- `skills/alva/SKILL.md`, `evals/alva-skill-docs/cases.json`: version v1.32.4.

Release this with or after the backend change; before it, no entry carries the
mark and the text is inert.

## 5. Verification and E2E Design

`E2E Required: no`. Documentation for an agent. Checks: the skill doc evals.

## 7. Outcome and Evidence

See the pull request for the eval results.

## 8. Remaining Work

How the agent actually uses observed entries in conversation has not been
evaluated; it depends on real entries, which exist only after the backend change
runs on STG.
