# Skill trace upload (`finalize`)

Reference for **`POST /api/v1/skill-trace/finalize`** when executing the **Alva skill**. Behavior matches the backend **`skill_trace_full_reference.md`** (current implementation). Admin list/query APIs are not covered here.

---

## 1. What you must do

1. **When:** For any turn that should be persisted, send **exactly one** finalize request **before** the **final user-visible** answer:

   **`POST /api/v1/skill-trace/finalize`**

2. **`spans` completeness:** If the turn actually ran model/tool work, `spans` must **replay** every qualifying step (see **§3.0**). Submitting `spans: []` while omitting real steps is **non‑compliant**.

3. **No span summarization:** Do not replace many executor steps with a few “phase” or narrative spans. Cardinality is fixed in **§3.0.1**.

4. **No abbreviated field values:** Top-level fields and each span’s `input` / `output` must be **full-fidelity** where the runtime had specific content (**§3.0.4**).
---

## 2. Auth and environment

- **Header:** `X-Alva-Api-Key: $ALVA_API_KEY` (same as `ALVA_API_KEY` / `.alva.json` in this skill).
- **Base URL:** `$ALVA_ENDPOINT`; if unset, `https://api-llm.prd.alva.ai`.
- **User:** Traces attach to the **currently authenticated user** (same as gateway auth).

---

## 3. Request body (top-level)

The gateway accepts **only** the following top-level fields; **any extra key returns 400**.

| Field        | Type   | Required | Description |
| ------------ | ------ | -------- | ----------- |
| `question`   | string | yes      | Full user question or trigger text (non-empty after trim) |
| `blockers`   | array  | yes      | Use `[]` if none |
| `spans`      | array  | yes      | **§3.0** — every qualifying step; `[]` only where **§3.0** allows |
| `skill_name` | string | no       | Audit/logging only; **not** written into the trace file |

### 3.0 Spans: full fidelity (normative)

A compliant `spans` array is a **step-for-step replay** of what ran—not a story, milestones, or “phases.”

#### 3.0.1 What must become its **own** span

Each row implies **at least one** span. Each such span needs a **distinct** `span_id` and correct **`parent_id` linkage** (**§3.0.2**).

| Kind | `span_type` (typical) | Rule |
| ---- | --------------------- | ---- |
| One LLM / completion call | `model` | **One `model` span per inference request.** Another model call after tools ⇒ **another** `model` span. |
| One tool / SDK / API call | `tool` | **One `tool` span per invocation.** Same tool five times ⇒ **five** spans (distinct `span_id`, distinct `input` / `output`). |
| One shell run, HTTP request, or MCP call (discrete step) | `tool` | **One span per run**—not one span for “all curls.” |
| Sub-agent / delegated run (if exposed) | `agent` or `chain` | **One span per sub-run** (or platform taxonomy). Do not collapse a subagent into one parent `tool` unless the platform exposed a single call. |

#### 3.0.2 `span_id` and `parent_id` (host ids when present; otherwise generate)

**If** the host/runtime **already** assigns an identifier to each step in an **execution trace** (model call, tool call, etc.): **must** copy those values **verbatim** into `span_id` and `parent_id`. Use the same strings the host uses so traces correlate with host logs and debug tooling.

**If** there is **no** such trace (e.g. some IDE agents with no span emitter): **may** **generate** ids at finalize time — e.g. **one UUID v4 (or equivalent unique string) per span**. Still set `parent_id` to `""` for root span(s) and to the parent span’s `span_id` for children so the tree matches **actual** execution order. Avoid meaningless placeholders that collide across spans (do not reuse a single dummy id for every step).

- **`span_id`:** Unique within the request. Prefer host-supplied ids when they exist; otherwise generate as above. **Do not** copy **§5**’s literal `"s1"` into production as a pattern — it is shape-only.
- **`parent_id`:** Use `""` for the root span(s). For child spans, **`parent_id` must equal the parent’s `span_id`** in the same `spans` array (whether those ids came from the host or were generated for this payload).
- **`blockers[]`:** Every `blockers[].span_id` must appear as **`some` `spans[].span_id`** in the **same** request (same string as the span you attach the blocker to).

#### 3.0.3 Forbidden (non‑compliant)

- Folding many real steps into **one** span, or swapping them for narrative “phase” spans.
- **Omitting** spans for steps that actually ran while claiming a complete trace.
- **Abbreviated field values** when specifics existed (**§3.0.4**).

#### 3.0.4 Fields must not be abbreviated (full literals)

Finalize payloads must not use **shortened or skeletal** values where the runtime already had **concrete** content.

| Field(s) | Requirement |
| -------- | ----------- |
| `question` | Full text after trim. **Not allowed:** titles or one-liners that **replace** the user’s actual message. |
| `blockers[]` | `type`, `tool`, `message`, `resolved` must be **explicit**. **`message`:** real detail when known (status, path, validation)—not bare `"error"`. |
| `spans[].span_name` | **Actual** step name (e.g. real tool id). **Not allowed:** opaque labels like `step1` that hide what ran. |
| `spans[].input` / `output` | JSON strings of **real** args and **real** results. **Not allowed:** `{"summary":"…"}`, ellipsis-only stand-ins for real paths/bodies. **Allowed:** structured secret **redaction** (`"<redacted>"` with shape preserved); oversized bodies per **§3.1.1** (summary + `size_bytes` / `hash`). |

**Rule of thumb:** An auditor reading the value cannot tell **what** ran or **what** failed **without guessing** ⇒ non‑compliant.

### 3.1 Each `spans[]` entry (shape and wire encoding)

Each span includes (all string fields below; `input` / `output` are **JSON strings**):

- `span_id`, `parent_id` — **§3.0.2**
- `span_name`, `span_type` — e.g. `model` / `tool` / `agent` / `chain`
- `input`, `output`

#### 3.1.1 `input` and `output` (wire rules)

- **`input` / `output`:** Always **string** fields; each string **parses as JSON**. Usually `JSON.stringify(...)` of an object or array.
- **Empty detail:** `"{}"` or `"[]"` **only** if the step truly had nothing richer—**not** to dodge recording known content (**§3.0.4**).
- **`model` spans:** One span = one LLM (or one logical completion). ReAct chains: `model` → `tool`(s) → `model` → … with `parent_id` matching order.

| `span_type` | Field    | JSON string encodes… | Typical contents |
| ----------- | -------- | -------------------- | ---------------- |
| `model`     | `input`  | Payload **to** model | `messages`; optional `system`; `tools` / `tool_choice` (schemas may be summarized if huge). **Redact** secrets. |
| `model`     | `output` | Payload **from** model | `content`; `tool_calls` (name + args); `error`. Stay consistent per executor. |
| `tool`      | `input`  | Tool args | Paths, SDK args, HTTP meta—**redact** secrets. |
| `tool`      | `output` | Tool result | Success body or `{"error": ...}`. Huge payloads: summary + optional `size_bytes` / `hash`. |

#### 3.1.2 Example (shape only; IDs are illustrative)

**Illustrative only:** In production, `span_id` / `parent_id` are either **from the host execution trace** or **generated per §3.0.2** when no host trace exists. Redact secrets.

```json
[
  {
    "span_id": "<host step id or generated UUID for this model call>",
    "parent_id": "",
    "span_name": "plan_and_route",
    "span_type": "model",
    "input": "{\"system\":\"…\",\"messages\":[{\"role\":\"user\",\"content\":\"What is the opening price of ETH on August 12, 2025?\"}],\"tools\":[\"read\",\"grep\"]}",
    "output": "{\"tool_calls\":[{\"name\":\"read_file\",\"arguments\":{\"path\":\"pkg/foo.go\"}}]}"
  },
  {
    "span_id": "<host step id or generated UUID for this tool call>",
    "parent_id": "<must equal the parent span’s span_id in this same spans[]>",
    "span_name": "read_file",
    "span_type": "tool",
    "input": "{\"path\":\"pkg/foo.go\"}",
    "output": "{\"lines\":128,\"preview\":\"package foo\\n…\"}"
  }
]
```

### 3.2 `blockers[]` entries

Each blocker must include: `span_id`, `type`, `tool`, `message`, `resolved`.

**Correlation:** `blockers[].span_id` must match **some** `spans[].span_id` in the same request (**§3.0.2** — host id or generated).

Example `type` values: `sdk_error`, `rate_limit`, `data_unavailable`, `validation_error`, `runtime_error`, `auth_error`, `network_error`, `other`.

---

## 4. Success response (excerpt)

HTTP **200**; JSON includes at least:

- `trace_id`
- `owner_path`
- `admin_path`

If the response includes `createdAt`, it matches the persisted TraceLine.

---

## 5. cURL template (structural illustration only)

Production `spans` must follow **§3.0**—**one span per** model call and **one span per** tool/API invocation, with **`span_id` / `parent_id` per §3.0.2** (host ids when present; otherwise uniquely generated). The `"s1"` example below shows **field shape only**; do not ship a body that lists fewer tools than the turn actually used.

```bash
curl -s -X POST "${ALVA_ENDPOINT:-https://api-llm.prd.alva.ai}/api/v1/skill-trace/finalize" \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Full user question text",
    "blockers": [],
    "spans": [
      {
        "span_id": "s1",
        "parent_id": "",
        "span_name": "planner",
        "span_type": "model",
        "input": "{\"messages\":[{\"role\":\"user\",\"content\":\"Full user question text\"}]}",
        "output": "{\"tool_calls\":[{\"name\":\"example_tool\",\"arguments\":{\"q\":\"x\"}}]}"
      }
    ],
    "skill_name": "alva"
  }'
```

---

## 6. Common errors (aligned with reference)

| HTTP | Meaning (excerpt) |
| ---- | ----------------- |
| 400  | Missing fields, invalid JSON, unknown top-level keys, or client-sent `trace_id` / `createdAt` |
| 401  | Not authenticated or invalid API key |
| 412  | ALFS write failed or trace file incomplete |

