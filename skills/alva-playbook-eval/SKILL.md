---
name: alva-playbook-eval
description: >-
  Evaluate playbooks produced with the Alva skill. Use when you need to find
  infrastructure issues in SDK/doc usage, API flow, content legitimacy,
  runtime/data/release quality, or convert real user examples into reusable
  eval cases and coverage gaps.
---

# Alva Playbook Eval

Use this skill when the job is to evaluate output from the `alva` skill, not to
build the environment itself.

## What This Skill Owns

- Find infra issues in generated Alva playbooks and feeds
- Separate infra bugs from `coverage_gap` cases
- Report findings with structured evidence and health score
- Sync all findings to Notion (single source of truth for tracking)
- On user confirmation: fix issues via PR to `alva-ai/mono-meta` (routed to the right subdirectory)
- Turn useful user examples into reusable eval cases

## Runtime Context

This skill typically runs in the same Forge session immediately after the
`alva` skill completes. When that is the case, the full execution trace is
already in your conversation context — use it directly instead of re-fetching.

**Trace available in same-session runs:**

- The original user prompt
- Every API request and response (SDK doc lookups, feed creation, deploy,
  grant, release)
- Generated feed script source (`index.js`)
- Generated playbook HTML (`index.html`)
- Test execution output from `/api/v1/run` (`status`, `result`, `logs`,
  `stats.duration_ms`)
- Final `published_url` from `/api/v1/release/playbook`

**Fallback for async / follow-up evals:**

If the session trace is missing (async triage, rerun, or issue follow-up),
you cannot judge checks that depend on the API call sequence (`sdk_doc`,
`api_contract`). In async mode, only run checks against static artifacts:

| Check scope | Categories | Requires |
|---|---|---|
| **Full** (same-session only) | `sdk_doc`, `api_contract`, `content_legitimacy` (trace checks) | API trace in context |
| **Post-run observable** (async-safe) | `deploy_release` | Published URL + public read paths |
| **Post-run observable** (async-safe) | `rendering` | Playbook HTML + optionally published URL |
| **Static artifact** (async-safe) | `runtime`, `data_quality`, `content_legitimacy` (script + HTML checks) | Feed script + feed data + playbook HTML |
| **Blocker log** (async-safe if trace has blockers) | `error_handling` | Trace blocker list or span error outputs |

All API call ordering checks (deploy before release, grant before public read,
draft before release) belong to `api_contract` and require the trace.
`deploy_release` only checks post-run observable state: URL resolves, data is
publicly readable, cronjob is active.

Fetch these artifacts before running static checks:

1. The user prompt or replay prompt (ask the caller if not provided)
2. Feed script: `GET /api/v1/fs/read?path=~/feeds/{name}/v1/src/index.js`
3. Playbook HTML: `GET /api/v1/fs/read?path=~/playbooks/{name}/index.html`
4. Feed data sample: `GET /api/v1/fs/read?path=~/feeds/{name}/v1/data/{group}/{output}/@last/100`
5. Feed latest point: `GET /api/v1/fs/read?path=~/feeds/{name}/v1/data/{group}/{output}/@now` (for freshness check)
6. Cronjob status: `GET /api/v1/deploy/cronjob/{id}`
7. Published URL existence: check if `published_url` resolves
8. Screenshot: extract URL from trace's `screenshot_playbook` span output,
   then `Read` the image for visual verification (see rubric § Rendering)

If a run transcript or API trace log is available (e.g. persisted by Forge),
also fetch it — this upgrades the eval to full scope.

Do not guess or hallucinate evidence. Do not attempt `sdk_doc` or
`api_contract` checks without the API trace.

**JSON trace vs same-session trace:**

A persisted JSON trace (e.g. from Forge trace export) typically records API
spans but may lack:

- Feed script and playbook HTML source code (only `bytes_written` recorded)
- Agent's own tool calls (WebSearch/WebFetch) — critical for content
  legitimacy trace checks
- Model reasoning about why decisions were made

When evaluating from a JSON trace, explicitly note which checks are degraded
due to missing artifact content. If the published URL is accessible, fetch the
HTML via WebFetch to partially compensate. Feed scripts cannot be recovered
without authenticated API access.

## Workflow

### 1. Reconstruct the intended Alva flow

Read the main `alva` skill and only the relevant references for this case. Map
the request to the expected path:

- Data/dashboard: SDK doc lookup -> runtime/feed -> grant -> deploy -> release
- Strategy/backtest: Altra/feed flow -> output validation -> release
- Content routing: refer to the main `alva` skill's SKILL.md § Content Search
  and § SDK Partition Index for current routing rules. Do not hardcode routing
  expectations here — the main skill is the source of truth
- Remix: source read -> child creation -> lineage registration

### 2. Run deterministic checks

Use these categories exactly:

- `sdk_doc`
- `api_contract`
- `content_legitimacy`
- `runtime`
- `error_handling`
- `data_quality`
- `deploy_release`
- `rendering`
- `coverage_gap`

For the detailed checklist and severity rules, read
[references/eval-rubric.md](references/eval-rubric.md).

### 3. Attribute the result

Prefer explicit attribution over vague failure summaries.

- `infra issue`: the skill chose the wrong doc, wrong API order, wrong runtime pattern, bad data, bad release behavior, or injected illegitimate content
- `coverage_gap`: the request is not reliably supported by the current skill/tool surface
- `needs more evidence`: there is not enough trace or artifact evidence to decide yet

Never mark an unsupported request as a success.

### 4. Report findings

The default eval output is a **findings report**. Do not auto-fix or auto-file
issues unless the user explicitly asks. The eval's primary value is accurate
diagnosis, not immediate action — misidentifying a root cause and pushing a
wrong fix is worse than leaving a finding open.

#### After reporting: fix on request

When the user confirms a finding should be fixed, submit a PR. All findings
(fixed or not) are tracked in Notion — GitHub is only for PRs that fix issues,
not for tracking.

| Attribution | Action |
|---|---|
| `infra issue` — fixable in code/docs | **Fix → PR** to `alva-ai/mono-meta` (user must confirm) |
| `coverage_gap` | **Notion only** (tracked as expansion opportunity) |
| `needs more evidence` | **Notion only** (Action = Pending) |

**PR target** — route to the right subdirectory in `alva-ai/mono-meta`:

| Problem area | Path in mono-meta |
|---|---|
| Skill docs, workflow, references | `code/public/skills/` |
| Forge (agent execution, trace) | `code/forge/forge/` |
| Frontend (playbook rendering, design system) | `code/frontend/frontend-monorepo/` |
| Backend (API contract, deploy/release logic) | `code/backend/alva-backend/` |
| Jagent runtime | `code/backend/jagent/` |
| SDKHub (SDK docs, modules) | `code/backend/sdkhub/` |

Only submit a PR when **all three** conditions are met:
1. The root cause is locatable in the mono-meta codebase
2. The evidence is high-confidence (not inferred from partial trace)
3. The user explicitly confirms the fix direction

If unsure, don't PR — just let it sit in Notion.

#### Fix → PR workflow (on confirmation)

1. Clone `alva-ai/mono-meta` (or reuse existing clone)
2. Create a branch: `fix/<root-cause-key>` (e.g. `fix/cronjob-limit-error-handling`)
3. Edit the relevant skill files to address the root cause
4. Commit with a message that references the eval finding and trace
5. Push and create a PR with:
   - Summary of what was broken and why
   - Link to the eval trace or playbook that exposed the issue
   - Test plan describing how to verify the fix
6. Update the Notion page: Action → `PR submitted`, Action Link → PR URL

#### Output discipline

- 1 PR per distinct root cause
- prefer the top 1-3 important findings over long checklists
- include category, severity, symptom, evidence, and action taken (PR link if any)

### 5. Sync findings to Notion

Every eval run automatically syncs its findings to the **Alva Eval Tracker**
Notion database. This is the single source of truth for all eval findings —
every finding goes here regardless of whether a PR is submitted.

#### Notion config

Stored locally at `~/.claude/skills/alva-playbook-eval/.notion-config` (not
checked into version control). Read this file at runtime to get the values.

```
NOTION_API_KEY=ntn_...
NOTION_DATABASE_ID=32fc6bac30df807cad33c161b9ef9da8
```

#### What to sync

Create **one Notion page per finding** (not per eval run). Each finding becomes
a row in the table.

#### Notion database schema (8 columns)

| Column | Notion Type | Content |
|---|---|---|
| `Name` | title | `[category][severity] root-cause-key` |
| `Category` | select | `sdk_doc` / `api_contract` / `content_legitimacy` / `runtime` / `error_handling` / `data_quality` / `deploy_release` / `rendering` / `coverage_gap` |
| `Severity` | select | `critical` / `high` / `medium` / `low` |
| `Playbook Link` | url | playbook published URL |
| `Symptom` | rich_text | one-sentence description |
| `Action` | select | `PR submitted` / `Issue filed` / `Report only` / `Pending` |
| `Action Link` | rich_text | PR or issue URL |
| `Eval Date` | date | ISO date of the eval |

#### Dedup before creating

Query the Notion database for existing pages where `Name` matches the
`root-cause-key`. Same slug = same finding.

- **Match found, same playbook**: update the existing page (bump eval date,
  update action/link if changed)
- **Match found, different playbook**: this is the same root cause appearing
  in a new playbook — create a new page (append playbook name to title for
  disambiguation)
- **No match**: create a new page

#### Sync implementation

```bash
python3 -c "
import json
payload = {
    'parent': {'database_id': '<DATABASE_ID>'},
    'properties': {
        'Name': {'title': [{'text': {'content': '<NAME>'}}]},
        'Category': {'select': {'name': '<CATEGORY>'}},
        'Severity': {'select': {'name': '<SEVERITY>'}},
        'Playbook Link': {'url': '<PLAYBOOK_URL>'},
        'Symptom': {'rich_text': [{'text': {'content': '<SYMPTOM>'}}]},
        'Action': {'select': {'name': '<ACTION>'}},
        'Action Link': {'rich_text': [{'text': {'content': '<ACTION_LINK>'}}]},
        'Eval Date': {'date': {'start': '<DATE>'}}
    }
}
print(json.dumps(payload))
" | curl -s -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer <NOTION_API_KEY>" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d @-
```

Replace `<PLACEHOLDER>` values with actual finding data. Run once per finding.

#### Update existing pages (after PR or issue is filed)

When an action is taken on a finding (PR submitted, issue filed), update the
corresponding Notion page. Query by `Name` to find the page ID, then patch:

```bash
# 1. Find the page ID by querying the database
curl -s -X POST "https://api.notion.com/v1/databases/<DATABASE_ID>/query" \
  -H "Authorization: Bearer <NOTION_API_KEY>" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter": {"property": "Name", "title": {"contains": "<ROOT_CAUSE_KEY>"}}}' \
  # → extract page_id from results[0].id

# 2. Update the page
curl -s -X PATCH "https://api.notion.com/v1/pages/<PAGE_ID>" \
  -H "Authorization: Bearer <NOTION_API_KEY>" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties": {
    "Action": {"select": {"name": "PR submitted"}},
    "Action Link": {"rich_text": [{"text": {"content": "<PR_URL>"}}]}
  }}'
```

#### Sync timing

- Sync happens **after** the report is output to the user
- When a PR is submitted or issue is filed, **update** the Notion page's
  `Action` and `Action Link` using the update flow above
- Sync failures should be logged but not block the eval output

### 6. Expand the eval corpus

When a real user example reveals a new blind spot, convert it into a normalized
eval case stub. Use the case template in
[references/eval-templates.md](references/eval-templates.md).

Every case should capture:

- `id`
- `prompt`
- `scenario_type`: `infra_regression` or `coverage_probe`
- `minimum_acceptable_behavior`
- the checks that should fire next time

## Default Evaluation Priorities

If you need to prioritize, do it in this order:

1. Release path correctness
2. Content legitimacy (all content from Alva pipeline or user BYOD)
3. Error handling (blockers resolved before proceeding)
4. Wrong SDK/doc or routing choice
5. Runtime contract violations
6. Data emptiness, NaN, timestamp/order issues
7. Rendering issues
8. Coverage expansion opportunities

## Good Output Shape

A strong eval response usually has:

- A one-paragraph run summary
- **Health score** (see rubric for scoring rules) — always include this
- A short findings list ordered by severity, each with action taken:
  - `infra issue` fixable in skill → PR link (e.g. `alva-ai/skills#69`)
  - `infra issue` requiring platform change → GitHub issue link
  - `coverage_gap` → GitHub issue link
- A separate `Coverage Gaps` list when applicable
- One or two proposed new eval cases if the example exposed a new blind spot
