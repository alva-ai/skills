# feat(alva): teach opaque IDs for toolkit 1.0 and /api/v2 (v1.33.0)

Local record. Primary record: alva-gateway
`docs/changelogs/2026-11-19-agent-api-permissions.md` (branch `agent-api-v2`),
which holds the design and the behavior, decision and milestone IDs referred to
below. This PR is the skills part of milestone M20 (B16, D16).

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

## 8. Remaining Work

- Release with toolkit 1.0.0 in the M20 window (primary record 4.6 step 7):
  pin this version in the sandbox (`alva-deps.lock.json`) together with
  toolkit 1.0.0.
- Gaps outside this repository that the new rules depend on:
  - The App writes `<reply_to context-type="thesis">` with numeric IDs
    (feed-app `quote-context.ts` accepts only positive int64 decimals).
    Toolkit 1.0 sends them to `/api/v2`, which refuses them, so the quoted
    Thesis reads fail until the App writes D16 IDs or toolkit resolves the
    number (`GET /api/v2/theses/by-number/{number}`; there is no version
    lookup by number).
  - The preview card's ticker `entity-id` is a D16 Asset ID (toolkit 1.0
    has no asset number); the App's share sheet reads it as an entity ID.
    The Thesis and version attributes are numbers again (section 7, R1).
  - `playbook.json` carries numeric `feed_id` values, and the re-release and
    remix flows pass them to `alva release ... --feeds`; toolkit 1.0 sends
    Automation IDs, so those flows need D16 IDs in the dbview or a toolkit
    lookup by name and major.
  - The sandbox prefill `channel-id` is numeric; `--channel-id` under toolkit
    1.0 needs a Channel ID (the sandbox part of M20).
