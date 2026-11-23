# feat(alva): teach opaque IDs for toolkit 1.0 and /api/v2 (v1.33.0)

Local record. Primary record: alva-gateway
`docs/changelogs/2026-11-19-agent-api-permissions.md` (branch `agent-api-v2`),
which holds the design and the behavior, decision and milestone IDs referred to
below. This PR is the skills part of milestone M20 (B16, D16). The SOTA
revision of 2026-11-19 (primary record Appendix S, "the contract"; this PR is
its 10.9) made toolkit 1.0's CLI JSON the `/api/v2` shapes (D17) and froze the
browser bundle at 0.36 (D46); B6-B10 below are new, and section 7 records the
revision. The branch merged `origin/main` at `ed09b71` (v1.32.4 and v1.32.5:
author direction corrections, unarchive as an Update); the version stays
v1.33.0.

## 1. Background and Current State

- Toolkit 1.0 moves the `alva` CLI to `/api/v2`, where every entity has one
  ID: an opaque D16 string such as `thesis_001xg` (D16, B16). v1 numeric IDs
  are refused there.
- Current skill (`7b44cc6`): `references/thesis.md` tells the agent to treat
  returned IDs as decimal strings, to send decimal `entity_id` values and to
  keep quoted Thesis IDs as positive int64 decimals; its examples, the
  cronjob examples in `references/deployment.md` and the delivery example in
  `references/push-notifications.md` use numbers; the automation update gate
  in `references/feed-lifecycle.md` says "numeric ID";
  `references/jagent-runtime.md` names the `/api/v1/run` body.

## 2. Problem Model and End-to-End Behavior

- B1 (Thesis): every returned ID is an opaque string, copied exactly and never
  parsed, built or converted; `--entity-stances` carries the confirmed
  `entity_id` strings; the preview card and the quoted-Thesis examples carry
  D16 IDs; quoted IDs are passed exactly as given.
- B2 (cronjobs): the examples show a Cronjob ID and a cronjob run ID.
- B3 (automation update gate): it names the automation ID, not a numeric ID.
- B4 (delivery): `0` stays the Agent channel alias (toolkit 1.0 keeps it);
  other entries are Channel IDs.
- B5 (runtime): the heap override is `max_heap_size_mb` in the SDK and
  `maxHeapSizeMb` in the `POST /api/v2/runs` body.

- B6 (CLI JSON): every documented CLI output field is the `/api/v2` name of
  the route's answer (contract `pkg/v2/api/openapi/openapi.json`, alva-gateway
  `agent-api-v2` `4549660b`): `{items, nextPageToken}` pages, with the token
  passed back unchanged to `--cursor`; a Thesis is `id`, `number`,
  `playbookId`, `author` (`kind` `PERSON`/`USER`, `handle`, `displayName`,
  `avatarUrl`), `currentVersion` (`number`, `body`, `assets[]` with `assetId`,
  `symbol`, `logoUrl`, `stance`; `media`) and `research` (`pendingWork`,
  `readComplete`, `lastCompletedAt`); `returnPreview.stances`; the Thesis
  return under `return` and `tracking`; For You `items` with `version` and
  `thesis` apart; alert rows with `targetStatus`, `automationId`,
  `lastDeliveredAt`; the `Cronjob` (`cronExpression`, `status` `ACTIVE`,
  `argsJson`) and a `run_…` run ID; credit entries with a signed decimal
  `amount`, `reason`, `automationId`, `occurredAt`; X pages; the narrative's
  `generatedAt`; enums upper case (`BEARISH`, `PRIVATE`, `STATED`).
- B7 (Automation IDs): publish returns `automationId` (the `feed_id` of 0.x),
  which `feed set-visibility`, `automation update` and `--feeds
  '[{"automationId":…,"major":…}]'` take; a re-release resolves each
  `playbook.json` feed by name in `alva automation list`.
- B8 (Thesis numbers): quotes and Today cards carry Thesis numbers; the quote
  flow reads `GET /theses/by-number/{n}/versions/{m}` through `alva thesis
  version get --number n --version m` and uses the version's `thesisId`; a
  Today card's `thesisId` is read with `alva thesis get --number`.
- B9 (errors): the CLI error JSON is the `/api/v2` problem with `reason` and
  `type`; the agent decides on `reason` first, and the reference names the
  actionable reasons (`INSUFFICIENT_CREDITS` 409, `QUOTA_EXCEEDED`,
  `IDEMPOTENCY_KEY_REUSED` 422, `PAGE_TOKEN_INVALID`,
  `EXECUTION_DEPTH_EXCEEDED`, `PAID_RENEWALS_END_CONFIRMATION_REQUIRED` with
  `--confirm-end-paid-renewals`, `RELATED_THESES_GENERATING`).
- B10 (browser): the three page snippets load
  `https://unpkg.com/@alva-ai/toolkit@0.36/dist/browser.global.js`; Toolkit 1.x
  has no browser build.

## 3. Research, Findings, and Architecture Decision

- The example IDs are the real D16 encodings of the old example keys, made
  with alva-gateway `pkg/v2/nodeid` (Thesis 123 `thesis_001xg`, ThesisVersion
  123/456 `thesis_version_001xg1j03`, Asset 745337 `asset_003wvwb8`, Asset 789
  `asset_002agc`, Cronjob 42 `cronjob_000n0`, CronjobRun 42/123
  `cronjob_run_000n00yr`, Channel 123 `channel_001xg`).
- "Copy the ID exactly" also holds for the decimal IDs of a 0.x CLI, so the
  rules stay correct for users who have not upgraded; only the examples look
  like 1.0 output.
- Left unchanged, on purpose:
  - PBSV browser calls (`/api/v1/fs/read`, `/api/v1/service/*` in
    `api/udf-runtime.md`, `playbook-creation.md`, `feed-sdk.md`): PBSV is not
    an `/api/v2` credential (primary record, non-goals).
  - Arrays data API paths (`/api/v1/stocks/...`, `/api/v1/crypto/...` in
    `data-skills.md`, `altra-v1-legacy.md`): a different service.
  - `playbook.json` in `remix-workflow.md` and the re-release rule in
    `playbook-creation.md`: the file is a Backend dbview with numeric
    `playbook_id` and `feed_id`; it shows what the file contains (section 8).
  - jagent `env.userId` and the fintwit SDK `channel_session_id`: runtime and
    SDK fields, not `/api/v2` IDs.
- No guidance names v1 `/query`; the skill already forbids raw GraphQL.

## 4. Implementation Design

`references/thesis.md`, `deployment.md`, `feed-lifecycle.md`,
`push-notifications.md`, `jagent-runtime.md`; `SKILL.md` version v1.33.0 (a
minor version: the ID contract changes); `evals/alva-skill-docs/cases.json`
(new strings, the version, two new assertions) and `mutation-smoke.mjs` (two
new mutations).

## 5. Verification and E2E Design

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`:
  131/131 cases.
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`:
  80/80, including `thesis-quote-opaque-ids` and `thesis-returned-ids-opaque`,
  which put back the old decimal rules and fail
  `target.thesis-quote-context` and `target.thesis-create-preview-card`.
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`: 5/5.
- No model run (`llm-scenario-trace.mjs`) is claimed.

## 6. Human Decisions and Interaction

Approved plan (primary record sections 1-6); decisions inside it were
delegated for the night and are recorded in section 3 and in section 8.

## 7. Outcome and Evidence

Docs and evals only.

M20 client review (2026-11-19), against toolkit 1.0 (`agent-api-v2`
`d1e3582`) and the gateway snapshot (`b34005a9`):

- R1 (fixed, `3417cdf`): Thesis reads and links broke under toolkit 1.0.
  `publication.playbookId` is the Playbook ID there, and
  `thesis related --id <publication.playbookId>` sends it where
  `/api/v2/theses/{thesisId}` takes only a Thesis ID (400). The App's Thesis
  card and the `alva.ai/thesis/<id>` page take the Thesis number (feed-app
  `thesis-link.ts` accepts only digits; the detail read is
  `playbook:<number>`), which 0.x returned as the ID. Reads now use
  `publication.thesisId`; read links use `publication.thesisNumber`, the
  write fallback link `response.thesis.number`, and the preview card's
  `thesis-id`/`version-id` `number`/`author_version_number` (toolkit
  `d1e3582` returns them). A CLI older than 1.0 keeps `playbookId`, `id` and
  `author_version_id`, which were those numbers. This replaces the D16 IDs
  this change had put in the preview example; the ticker `entity-id` stays
  the Asset ID (there is no asset number).
- R2 (fixed, `3417cdf`): For You told the agent to keep a `--newer-than`
  bound, a flag toolkit 1.0 refuses; the alert inventory compared `items`
  with `total_count`, which 1.0 no longer returns (pages end when
  `next_cursor` is empty).
- R3 (fixed, `ed948ca`): `api/error-responses.md` listed only the 0.x error
  JSON. It now names `requiredPermission`, `invalidParams`, `retryAfter`,
  `INSUFFICIENT_PERMISSION`, `CONFLICT` and `UNAVAILABLE`, and says a
  missing permission is reported, not retried (an agent key never holds
  `trading_limits:write`).
- Evals: `target.thesis-read-card-links`, `target.thesis-create-preview-card`
  and `target.for-you-context` assert the new text; new case
  `target.platform-errors`; five new mutations (links and related by
  Playbook ID, preview from opaque IDs, `--newer-than`, retrying a missing
  permission).
- Verification: `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir
  skills/alva` 132/132 cases (1602 checks); `mutation-smoke.mjs` 85/85;
  `node --test evals/alva-skill-docs/durable-agent.test.mjs` 5/5; each
  commit's tree passes the eval and the mutation smoke on its own;
  `git diff --check` clean.

SOTA revision (2026-11-20; contract 10.9):

- Implemented B6-B10 against the generated contract and toolkit 1.0's CLI
  (`sota/tk-b` `5a0c37d` for the content resources, `sota/tk-a` `5bedcb6` for
  markets, credits, X and runs). The "CLI older than 1.0" fallbacks are gone
  (X12): links, previews and quotes name only the 1.0 fields.
- Decisions to review:
  - S1. The contract's `alva theses version --number n --version m` is
    `alva thesis version get --number n --version m`: the CLI group is
    `thesis`, and toolkit 1.0 adds exactly these flags to `version get`.
    Exact-version reads from a read result use the same command with
    `number` and `currentVersion.number`.
  - S2. Ticker identity: toolkit 1.0's `thesis list --ticker` returns the
    `ThesisList` without the resolved asset (`scope` is gone), so the lookup
    takes the `assetId` of a listed Thesis's matching `currentVersion.assets`
    entry; an empty page falls back to `asset-candidates`. A direct asset
    lookup command (`GET /assets/by-symbol/{symbol}`) would be cleaner
    (toolkit follow-up).
  - S3. Update carries omitted `--title`, `--entity-ids`, `--medias` and
    `--visibility` over (D49, toolkit 1.0); the skill no longer tells the agent
    to resend unchanged fields, and an identical Update is detected by an
    unchanged `currentVersion.id` (no `unchanged` member).
  - S4. Related Theses still being prepared is the
    `RELATED_THESES_GENERATING` problem; a failed preparation is an empty page.
  - S5. Re-releasing resolves Automation IDs by `feed_name` in
    `alva automation list`, because `playbook.json` keeps numeric `feed_id`
    values (closes the `--feeds` gap of section 8).
- Evals: `target.cli-v2-shapes` (the v2 names per file, and the 0.x names
  absent from the corpus), `target.platform-problem-reasons` and
  `target.browser-sdk-pinned` are new; 14 cases and one scenario assert the
  new strings; six
  new mutations (cursor, publish ID, Today card ID, message-first errors, page
  token retry, unpinned bundle) and nine retargeted ones.
- Verification: `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir
  skills/alva` 136/136 cases; `node evals/alva-skill-docs/mutation-smoke.mjs
  --skill-dir skills/alva` 96/96; `node --test
  evals/alva-skill-docs/durable-agent.test.mjs` 5/5; each commit's tree passes
  the eval and the mutation smoke on its own; `git diff --check` clean. No
  model run (`llm-scenario-trace.mjs`) is claimed.

## 8. Remaining Work

- Release with toolkit 1.0.0 in the M20 window (primary record 4.6 step 7):
  pin this version in the sandbox (`alva-deps.lock.json`) together with
  toolkit 1.0.0.
- Gaps outside this repository that the new rules depend on:
  - (Resolved by B8.) The App writes `<reply_to context-type="thesis">` with
    numbers; the quote flow now reads them by number.
  - The preview card's ticker `entity-id` is a D16 Asset ID (toolkit 1.0
    has no asset number); the App's share sheet reads it as an entity ID.
    The Thesis and version attributes are numbers again (section 7, R1).
  - (Resolved by B7 and S5.) `playbook.json` keeps numeric `feed_id` values;
    the flows now pass Automation IDs.
  - Toolkit 1.0 must ship `thesis version get --number --version` and
    `thesis get --number` (on `sota/tk-b`) before this version is pinned.
  - The sandbox prefill `channel-id` is numeric; `--channel-id` under toolkit
    1.0 needs a Channel ID (the sandbox part of M20).

## Review (Occam and review pass, 2026-11-20)

- Occam: nothing removed.
- Checked: every `/api/v2` path the skill documents exists in alva-gateway
  P2 `pkg/v2/api/openapi/openapi.json`.
- Verification: `node evals/alva-skill-docs/skill-doc-eval.mjs`: every check
  passed (1,708 checked, 0 open); `node
  evals/alva-skill-docs/mutation-smoke.mjs`: 96/96 mutations failed as
  expected.

## 2026-11-22: merge of `main`

Conflicts, each resolved by keeping both changes:
- `jagent-runtime.md`: the `POST /api/v2/runs` heap field (this PR), plus
  `main`'s list of the Node built-ins a script may import.
- `playbook-creation.md`: `main` reads `releases[0].feeds` (newest first);
  this PR passes them as Automation IDs with their major.
- `remix-workflow.md`: `main`'s step numbers (a step was added before them),
  with this PR's `automationId` feeds.
