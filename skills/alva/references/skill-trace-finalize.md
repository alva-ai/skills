# Skill trace upload (`finalize`) — aligned with platform reference

Use this document when executing the **Alva skill**. Behavior matches the Alva backend **`skill_trace_full_reference.md`** (current implementation). Admin list/query APIs are not covered here.

---

## 1. What you must do

- For any interaction that should be persisted, complete the upload with **one** HTTP call **before** you give the user your **final answer**:

  **`POST /api/v1/skill-trace/finalize`**

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

#### 3.1.1 `input` and `output`: wire format and meaning (including LLM spans)

**Wire format (mandatory).** In the finalize JSON body, `input` and `output` are **always string-typed fields**. Each string must be valid **JSON** when parsed—typically you `JSON.stringify(...)` a small object or array and place that string in `input` or `output`. Empty or unknown details may use `"{}"` or `"[]"`, but prefer recording real structure when safe.

**Not the same as top-level `question`.** The top-level `question` is the **user-facing task or trigger** for the whole trace (one string). Per-span `input` / `output` describe **what happened inside that span** only. A `model` span’s `input` is **not** a duplicate of `question` unless you intentionally mirror it; usually `input` is richer (full message list, system instructions, tool definitions reference, etc.).

---

**When `span_type` is `model` (large language model / chat completion).**

Treat each `model` span as one **LLM call** (or one logical generation step, e.g. one completion in a multi-turn chain).

- **`input` (JSON string)** — What the **executor sent to the model** before generation. Encode a JSON object that is faithful to the call, for example:
  - **`messages`**: ordered chat turns (`role` + `content`) as actually passed to the API, or a lossless subset if size is limited (then document truncation in a field like `"truncated": true`).
  - **`system`**: system / developer instructions if your stack sends them separately from `messages`.
  - **`tools` or `tool_choice`**: names and JSON-schema summaries of tools exposed to the model (not necessarily full verbatim schema if huge—summarize and note `"schema_omitted": true`).

  **Do not** put API keys, bearer tokens, raw cookies, or user secrets inside `input`. Redact or replace with placeholders (e.g. `"api_key": "<redacted>"`).

- **`output` (JSON string)** — What the **model returned** to the executor after generation, encoded as JSON, for example:
  - **`content`**: assistant text (final or partial if you log per chunk, merge into one span or use multiple spans).
  - **`tool_calls`**: structured tool invocations (name, arguments) as returned by the model API.
  - **`error`**: provider error payload when the call failed (still a valid `output` for observability).

  If the model output is **only** free text, a minimal pattern is `{"content":"..."}`. If the model returns **structured JSON**, store it under a key such as `parsed` or merge into `content` as stringified JSON—keep one consistent shape per executor.

**Multi-step ReAct / tool loops.** Use **multiple spans**: one `model` span per completion, then `tool` spans for each tool execution, then the next `model` span. Parent links (`parent_id`) should reflect the tree or linear order your agent uses.

---

**When `span_type` is `tool`.**

- **`input`**: JSON string of **arguments** passed into the tool (SDK call, HTTP request metadata, file paths—redact secrets).
- **`output`**: JSON string of the **tool result** (success payload, or `{"error": ...}` on failure). For large blobs, store a **summary** plus optional `size_bytes` or `hash` instead of the full body.


---
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
