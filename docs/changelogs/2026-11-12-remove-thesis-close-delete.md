# feat(alva): stop closing or deleting Theses from chat

Follow-up to `2026-11-10-disable-thesis-edit.md` (alva-ai/skills#674).

## 1. Background and Current State

- `references/thesis.md` taught `alva thesis close`, `alva thesis delete` and
  `alva thesis version delete` ("Deleting a Thesis or one Update"), and the
  SKILL.md routing row listed close and deletion.
- Product decision: a Thesis's published tickers and long/short directions
  stay on the record, so authors must not quietly withdraw or alter a
  published Thesis. #674 already withdrew editing (`--editorial`).

## 2. Problem Model and End-to-End Behavior

- B1: Alva no longer closes a Thesis, deletes a whole Thesis, or removes one
  published Update. Asked to, it says so in one or two plain sentences and
  offers what remains: archive (hidden, restorable) or a new Update stating the
  changed view.
- B2: abandoning an unpublished draft still needs no call; the body is never
  rewritten, and assets or directions never dropped, to imitate deletion.

## 3. Research, Findings, and Architecture Decision

- D1: replace the deletion section with a short decline rule under
  "Closing or deleting a Thesis", and keep close/delete requests routed to
  `thesis.md` so the Agent declines correctly instead of improvising.
- D2: tell the Agent not to run close/delete even where an older CLI still
  lists them, and tighten "never pass `--editorial`" the same way.
- D3: the decline does not explain the product reason to users; it only
  says the published record stays.
- toolkit-ts removes the CLI commands and `--editorial`; alva-gateway removes
  the REST routes. Archive/unarchive, set-visibility, update, version list/get
  stay.

## 4. Implementation Design

- `skills/alva/references/thesis.md`: drop the `close` and `delete --id`
  lifecycle bullets and "Deleting a Thesis or one Update" (including its
  `version list` / `version delete` usage); add "Closing or deleting a
  Thesis". Descriptive mentions of closed or deleted Theses stay.
- `skills/alva/SKILL.md`: routing row drops close/deletion as capabilities and
  routes close/delete requests to the decline section; version v1.30.1.
- `evals/alva-skill-docs`: `target.thesis-update-delete-media` becomes
  `target.thesis-update-media-no-delete` (asserts the decline rule, excludes
  `alva thesis delete`, `alva thesis version delete`, `alva thesis close`);
  `target.thesis-conversation-flow` drops the delete-confirmation checks; new
  `scenario.thesis-delete-request-declined`; new mutation
  `thesis-delete-request-runs-delete`; version include v1.30.1.

## 5. Verification and E2E Design

- `node evals/alva-skill-docs/skill-doc-eval.mjs` (exit 0, 124/124 cases,
  1460/1460 checks), `node evals/alva-skill-docs/mutation-smoke.mjs` (58/58),
  `node --test evals/alva-skill-docs/durable-agent.test.mjs` (5/5).
- Against `main` text the new and inverted cases fail (120/124), so they guard
  the change.

## 6. Human Decisions and Interaction

- 2026-11-12, Zet: the Agent loses Close, Delete Thesis and Delete Update
  so published Theses stay on the record.

## 7. Outcome and Evidence

- Checks above pass.

## 8. Remaining Work

- Ship together with the toolkit-ts CLI removal and alva-gateway route
  removal; until users upgrade, older CLIs may still list the commands, which
  the skill text covers.
