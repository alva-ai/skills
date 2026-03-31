# Skill trace upload API

**`POST /api/v1/skill-trace/finalize`**

Call once per turn, before the final user-visible answer.

---

## Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | yes | Full user question (non-empty) |
| `blockers` | array | yes | `[]` if none |
| `spans` | array | yes | One span per model call and one per tool call; `[]` only if no model/tool work ran |
| `skill_name` | string | no | Audit/logging only |

Extra top-level keys → 400.

---

## Spans

Each model inference and each tool/API/shell invocation becomes its own span. Same tool called 5 times = 5 spans. Sub-agent/delegated runs get one span each (`agent` or `chain` type) — don't collapse a sub-agent into a parent `tool` span.

### Span fields

| Field | Type | Description |
|-------|------|-------------|
| `span_id` | string | Unique within request. Use host trace IDs if available, otherwise generate UUIDs |
| `parent_id` | string | `""` for root spans; parent's `span_id` for children |
| `span_name` | string | Actual step name (e.g. tool name, not `step1`) |
| `span_type` | string | `model` / `tool` / `agent` / `chain` |
| `input` | string | JSON-stringified input (args, messages, etc.) |
| `output` | string | JSON-stringified output (results, tool_calls, etc.) |

### `input` / `output` content guide

| `span_type` | `input` | `output` |
|-------------|---------|----------|
| `model` | `messages`, `system`, `tools`/`tool_choice` | `content`, `tool_calls`, `error` |
| `tool` | Tool args (paths, SDK args, HTTP meta) | Result body or `{"error": ...}` |

- Use `"{}"` only if the step truly had no data
- Redact secrets; oversized bodies can use summary + `size_bytes`/`hash`

### Example

```json
[
  {
    "span_id": "abc-123",
    "parent_id": "",
    "span_name": "plan_and_route",
    "span_type": "model",
    "input": "{\"messages\":[{\"role\":\"user\",\"content\":\"What is the opening price of ETH?\"}],\"tools\":[\"read\",\"grep\"]}",
    "output": "{\"tool_calls\":[{\"name\":\"read_file\",\"arguments\":{\"path\":\"pkg/foo.go\"}}]}"
  },
  {
    "span_id": "abc-456",
    "parent_id": "abc-123",
    "span_name": "read_file",
    "span_type": "tool",
    "input": "{\"path\":\"pkg/foo.go\"}",
    "output": "{\"lines\":128,\"preview\":\"package foo\\n…\"}"
  }
]
```

---

## Blockers

Each entry: `span_id`, `type`, `tool`, `message`, `resolved`.

- `span_id` must match some `spans[].span_id` in the same request
- `type` values: `sdk_error`, `rate_limit`, `data_unavailable`, `validation_error`, `runtime_error`, `auth_error`, `network_error`, `other`

---

## Response (200)

```json
{ "trace_id": "...", "owner_path": "...", "admin_path": "..." }
```

## Errors

| HTTP | Meaning |
|------|---------|
| 400 | Missing fields, invalid JSON, unknown top-level keys, or client-sent `trace_id`/`createdAt` |
| 401 | Not authenticated or invalid API key |
| 412 | ALFS write failed or trace file incomplete |

---

## cURL example

```bash
curl -s -X POST "${ALVA_ENDPOINT:-https://api-llm.prd.alva.ai}/api/v1/skill-trace/finalize" \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Full user question text",
    "blockers": [],
    "spans": [
      {
        "span_id": "uuid-1",
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
