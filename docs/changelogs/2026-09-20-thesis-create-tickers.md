# docs: Show tickers in Thesis creation guidance

Primary design: [Backend Thesis create tickers](https://github.com/alva-ai/alva-backend/blob/main/docs/changelogs/2026-09-20-thesis-create-tickers.md).

## 1. Background and Current State

- `skills/alva/references/thesis.md` currently asks for the exact create payload and lists only Entity IDs. It prohibits inferring entities from the body and requires confirmation before creation. This worktree starts at fetched `origin/main` on September 20, 2026.

## 2. Problem Model and End-to-End Behavior

- B1 — The exact creation confirmation shows supplied tickers and entity IDs separately, including an explicit none/empty value. After confirmation, `alva thesis create` may pass `--tickers` and `--entity-ids` together. Preview still uses the authoritative `thesis get` result.
- F1 — Do not infer or add tickers from body text, silently replace a user's ticker with another entity, or claim a failed create succeeded. Backend resolves ticker-bearing retries live; reuse the same `request_id` only while the effective mapping is unchanged. Mapping drift needs fresh confirmation and a new `request_id`.

## 3. Research, Findings, and Architecture Decision

- The existing Thesis skill's create confirmation and GET-only preview rules are the reference. CLI/SDK, REST, and Backend add ticker input to create; this record does not invent a parallel lookup workflow or change update behavior.
- D1 — Document optional plural ticker inputs in the existing confirmation and command while preserving publication consent and GET hydration rules. Follow the primary record's Backend-owned exact STOCK resolution and retry semantics.

## 4. Implementation Design

- In `skills/alva/references/thesis.md` show both supplied ticker and ID lists in the full pre-create payload; update the create command example with optional `--tickers`. Do not change confirmation, no inference, GET-only preview or update guidance.

### Serial Implementation Checklist

- [x] Update exact confirmation and command guidance, then review sample payload and command against actual CLI help.

## 5. Verification and E2E Design

- Review the complete rendered example and a manual CLI-help readback; Toolkit command tests cover flag mechanics, local-dev owns cross-service E2E. Check the docs diff for contradictory ID-only wording.

## 6. Human Decisions and Interaction

- User wants direct plural ticker input with optional IDs, only on create, and approved this code-level plan.

## 7. Outcome and Evidence

- Create confirmation and command guidance now show tickers and IDs separately, forbid inference/alias substitution, describe live retry resolution and mapping-drift conflicts without claiming snapshot storage, and preserve GET-only preview. Toolkit help readback includes the create-only `--tickers` flag. The complete skill doc eval passed 980/980 checks, and mutation smoke passed 21/21 expected failures.

## 8. Remaining Work

- Backend is merged; Gateway PR #986 and Toolkit PR #177 are open. The local-dev full-stack test passed through Gateway, Backend and llm-data (`TestThesisCreateTickers`, local-dev PR #387). Merge this documentation after the executable API/CLI chain; no deployment or production proof is included.
