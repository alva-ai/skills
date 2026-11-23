# fix(alva): follow the host's auto-trade consent creation contract (v1.32.7)

## 1. Background and Current State

v1.32.1 (alva-ai/skills#683) added a creation step to Auto-Trading Consent:
write `~/memory/auto-trade-consent.md` with `granted_at`, the Schedule name, the
account, and the scope. The in-app chat Agent also loads sandbox-agent
`config/profiles/CHANNEL.md` ("Auto-trading schedules (consent required)",
since 2026-07, sandbox-agent-ts#288), which owns the creation side and says the
opposite.

## 2. Problem Model and End-to-End Behavior

| | CHANNEL.md (creation contract) | Full before this change |
|---|---|---|
| Consent scope | per user, one-time, permanent until revoked | read as per new Schedule |
| Disclaimer | recited in full; only an explicit affirmative reply counts | not mentioned |
| Record | exactly `granted_at`, `channel`, `source_message`, `disclaimer_recited`, `user_reply`; no account, symbol, or other per-Schedule data | Schedule name, account, scope |

Both texts reach the same Agent, so the creation flow for live trading was
undefined. CHANNEL.md states the fire-side rule lives in the alva skill; that
part (one-read existence check, bounded recurrence, dry run first) already
matches and is unchanged.

## 3. Research, Findings, and Architecture Decision

Full follows the host contract for creation. On PRD there are no Agent
Schedules carrying the consent reference line (0 of 1529 on 2026-11-23), so no
existing record needs migration.

## 4. Implementation Design

- `references/agent-schedules.md`: item 1 points to the disclaimer; new
  "Creating an auto-trading Schedule" (reuse an existing record, recite the
  disclaimer, strict reply, closed five-field record, revoke Schedules before
  the record); migration sentence points to it; the v1.32.1 per-Schedule record
  fields are removed.
- `SKILL.md`: version v1.32.7.
- `evals/alva-skill-docs`: new `target.auto-trade-consent-creation`.

## 5. Verification and E2E Design

`node evals/alva-skill-docs/skill-doc-eval.mjs` passes; mutation smoke 83/83.

## 6. Human Decisions and Interaction

The skill owner chose to align with the host contract.

## 7. Outcome and Evidence

Full, Slim (alva-ai/sdk-monorepo, 0.1.83), and the channel profile now give one
creation flow.

## 8. Remaining Work

The same rule is written in three places; a single owner should keep it, with
the others referencing it.
