# Skill trace upload (`finalize`) — aligned with platform reference

Use this document when executing the **Alva skill**. Behavior matches the Alva backend **`skill_trace_full_reference.md`** (current implementation). Admin list/query APIs are not covered here.

---

## 1. What you must do

- For any interaction that should be persisted, complete the upload with **one** HTTP call **before** you give the user your **final answer**:

  **`POST /api/v1/skill-trace/finalize`**

- **Do not** rely on `POST /api/v1/fs/write` to `~/skill-trace/<trace_id>` followed by a second step. **Body and metadata go only in the finalize request**; the **server** generates `trace_id` and `createdAt`, writes ALFS, and creates the aggregate symlink.

---

## 2. Auth and environment

- Header: `X-Alva-Api-Key: $ALVA_API_KEY` (same as `ALVA_API_KEY` / `.alva.json` in this skill).
- Base URL: `$ALVA_ENDPOINT`; if unset, default `https://api-llm.prd.alva.ai`.
- Traces are written only for the **currently authenticated user** (same as gateway auth).

---

## 3. Request body (only four top-level keys)

The gateway accepts **only** the following top-level fields; **any extra key returns 400**.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `question` | string | yes | Full user question or trigger text (non-empty after trim) |
| `blockers` | array | yes | Use `[]` if none |
| `spans` | array | yes | Use `[]` if none (if there were tool/model calls, populate truthfully) |
| `skill_name` | string | no | Audit/logging only; **not** written into the trace file |

**Do not** send `trace_id` or `createdAt` in the body (server-generated).

### 3.1 `spans[]` entries (same as reference)

Each span must include (all string fields; `input` / `output` are **JSON strings**):

- `span_id`, `parent_id` (root = `""`)
- `span_name`, `span_type` (e.g. `model` / `tool` / `agent` / `chain`)
- `input`, `output`

### 3.2 `blockers[]` entries

Must include: `span_id`, `type`, `tool`, `message`, `resolved`.

**Rule:** every `blockers[].span_id` must appear as some `spans[].span_id` in the **same** request (otherwise backend validation fails).

Example `type` values: `sdk_error`, `rate_limit`, `data_unavailable`, `validation_error`, `runtime_error`, `auth_error`, `network_error`, `other`.

---

## 4. Success response (excerpt)

HTTP 200; JSON includes at least:

- `trace_id`
- `owner_path`
- `admin_path`

If the gateway/backend returns `createdAt`, it matches the persisted TraceLine.

---

## 5. cURL template

```bash
curl -s -X POST "${ALVA_ENDPOINT:-https://api-llm.prd.alva.ai}/api/v1/skill-trace/finalize" \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Full user question text",
    "blockers": [],
    "spans": [
      {
        "span_id": "…",
        "parent_id": "",
        "span_name": "ChatModel",
        "span_type": "model",
        "input": "{}",
        "output": "{}"
      }
    ],
    "skill_name": "alva"
  }'
```

---

## 6. Common errors (aligned with reference)

| HTTP | Meaning (excerpt) |
| --- | --- |
| 400 | Missing fields, invalid JSON, unknown top-level keys, or client-sent `trace_id` / `createdAt` |
| 401 | Not authenticated or invalid API key |
| 412 | ALFS write failed or trace file incomplete |

---

## 7. Relation to the list API

- **`GET /api/v1/skill-trace`** is **admin-only**; skill executors normally only need **finalize**.
- List behavior (cursor, `omit_body`, etc.) is defined in **`skill_trace_full_reference.md`** in the backend repo; not repeated here.

---

## 8. Ordering when you write a plan

In a multi-step **plan**, the **last step** must be: **call finalize** with the `question` / `blockers` / `spans` (and optional `skill_name`) collected for this turn. Do not end the plan with “reply to the user” only and skip finalize; **run finalize before** the final user-visible answer.
