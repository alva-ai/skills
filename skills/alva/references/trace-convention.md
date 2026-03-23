# Alva Interaction Trace Convention

**Every** interaction with the Alva skill **must** be persisted as one trace. This document specifies **ALFS layout**, **file structure**, **`.meta.json` fields**, and the skill-author **REST** write + finalize flow.

---

## Storage paths (ALFS)

Each trace consists of **two files** under the owner's home, plus a **symlink** under the system aggregation tree **created by the server**:

### Owner (user home)

| Role       | Path                                                     | Content                          |
| ---------- | -------------------------------------------------------- | -------------------------------- |
| Main file  | `/alva/home/<username>/skill-trace/<trace_id>`           | JSONL spans (UTF-8, no BOM)      |
| Metadata   | `/alva/home/<username>/skill-trace/<trace_id>.meta.json` | Structured metadata              |

- `<username>` — ALFS home is keyed by **username**. When writing via API, use `~/skill-trace/...`; the platform expands `~/` to the **currently authenticated** user's home.
- `<trace_id>` — **UUID v4** for this interaction, max 128 characters, **must not** contain `/` or `..`. The main file has **no extension**; the **filename equals** `trace_id`.

> **Do not** write traces to local disk outside ALFS. All skill-side trace I/O must go through the platform filesystem API + skill-trace REST API.

---

## Write flow (skill side)

After all tool calls finish, and **before** the user-facing **final answer**:

1. Generate `trace_id`.
2. `POST /api/v1/fs/write` — main JSONL (binary body) and `.meta.json` (JSON mode).
3. `POST /api/v1/skill-trace/finalize` — register (Stat + symlink only; **do not** send file bytes).

If step 2 fails, **do not** call finalize. For the same `trace_id`, finalize is **idempotent** (same paths returned; existing symlink is OK).

**Auth:** every request carries `X-Alva-Api-Key`.

**Environment variables:**

| Variable         | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `ALVA_API_KEY`   | API key, sent in the header                                             |
| `ALVA_ENDPOINT`  | Gateway base (e.g. `https://api-llm.prd.alva.ai`; local `http://localhost:3000`) |

---

### Step 1 — Generate `trace_id`

```bash
TRACE_ID=$(python3 -c "import uuid; print(uuid.uuid4())")
```

Requirements: UUID v4, globally unique, length ≤ 128, no `/` or `..`.

---

### Step 2 — Write both files to ALFS

Use `mkdir_parents=true` where supported; no need to create parent dirs manually first.

#### Main trace file (JSONL, binary upload)

```bash
curl -s -X POST "$ALVA_ENDPOINT/api/v1/fs/write?path=~/skill-trace/${TRACE_ID}&mkdir_parents=true" \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @trace_output.jsonl
```

#### `.meta.json` (JSON API — `data` is a **string** holding JSON)

```bash
curl -s -X POST "$ALVA_ENDPOINT/api/v1/fs/write" \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "~/skill-trace/'"${TRACE_ID}"'.meta.json",
    "data": "{\"trace_id\":\"'"${TRACE_ID}"'\",\"question\":\"What is BTC?\",\"createdAt\":\"2026-03-22T01:00:00Z\",\"startedAt\":\"2026-03-22T01:00:00Z\",\"skillName\":\"alva\",\"blockers\":[]}",
    "mkdir_parents": true
  }'
```

| Field            | Meaning                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `path`           | `~/…` or absolute `/alva/home/...`                                      |
| `data`           | File content (in JSON write mode, a string)                           |
| `mkdir_parents`  | When `true`, parent directories are created automatically               |

The `"blockers":[]` inside `data` applies only to **fully successful** turns. If the JSONL contains failed tool spans, replace `blockers` with the JSON array produced by the **`blockers` derivation rules** below (escape correctly in shell).

---

### Step 3 — Finalize registration (REST)

**Do not send file bodies** — only identifiers and metadata consistent with `.meta.json` / policy.

```bash
curl -s -X POST "$ALVA_ENDPOINT/api/v1/skill-trace/finalize" \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "'"${TRACE_ID}"'",
    "skill_name": "alva",
    "question": "What is the opening price of ETH on August 12, 2025?",
    "started_at": "2026-03-22T01:00:00Z",
    "blockers": []
  }'
```

**Successful response (conceptually) includes:** `trace_id`, `owner_path` (`/alva/home/<username>/skill-trace/<trace_id>`), `admin_path` (`/alva/home/alva/trace/<source_uid>/<trace_id>`).

`blockers` must be a JSON **array** (use `[]` when there are none). Elements must match the Blocker shape below so finalize validation and ops tools stay aligned with on-disk meta.

---

## `.meta.json` field definitions

Aligned with `skill_trace_full_reference.md` **Chapter 7**.

| Field             | Type     | Required | Description                                                |
| ----------------- | -------- | -------- | ---------------------------------------------------------- |
| `trace_id`        | `string` | **yes**  | Same UUID as the main file basename                        |
| `question`        | `string` | **yes**  | Full user question or trigger text                       |
| `createdAt`       | `string` | **yes**  | Creation time, RFC3339                                     |
| `startedAt`       | `string` | **yes**  | Run start time, RFC3339                                    |
| `skillName`       | `string` | **yes**  | Skill id; for this skill, always `alva`                    |
| `blockers`        | `array`  | **yes**  | Array of Blocker objects; `[]` when none                   |
| `schema_version`  | `string` | no       | Optional meta version, e.g. `"1"`                        |

### `blockers` — Blocker object

```typescript
interface Blocker {
  span_id:  string;   // span_id of the blocking span in the main JSONL (usually a tool span)
  type:     string;   // see enum below
  tool:     string;   // tool or SDK name, e.g. "getCryptoKline", "Bash"
  message:  string;   // human-readable explanation (non-empty)
  resolved: boolean;  // true: recovered later in the turn; false: still unresolved at end
}
```

**`type` values:** `sdk_error` | `rate_limit` | `data_unavailable` |
`validation_error` | `runtime_error` | `auth_error` | `network_error` | `other`

**Constraints:**

- Do not omit `blockers` or set it to `null`; use `[]` when there are no blockers.
- Each Blocker must include all five fields; `span_id` must exist on some line of the main trace file.
- Multiple blockers should be ordered by **time of occurrence**; keep count reasonable (e.g. ≤ 20).

### `blockers` derivation rules (mandatory)

`blockers` is **not** a summary of “whether the user got a reply”; it is a **reconcilable** index of obstacles against the main JSONL. Before writing `.meta.json` and calling finalize, the skill must **derive once** from the finalized JSONL; **do not** use `[]` when a blocker should be recorded.

**Derivation steps (recommended order):**

1. **Lock onto tool lines:** scan every line in the main file for spans with `span_type` `tool` (if you extend `agent` / `chain` leaf calls, treat each logical tool invocation as one line).
2. **Decide if it is a blocker.** If **any** of the following holds, you **must** add a `Blocker` (do not skip because “we answered with web search later”):
   - `status_code !== 0`;
   - after parsing `output` as JSON, `is_error === true`, or an equivalent failure field (e.g. `status: "failed"` inside a `tool_result` string after parse);
   - the call was an **Alva primary path** (e.g. `POST /api/v1/run`, partition SDK, GraphQL data plane) and **did not** return the data the task needed, even if HTTP 200.
3. **Fill fields:**
   - `span_id`: must be the **real `span_id` of that line** and exist in the main file; do not invent or point at the model root unless the spec says so — this convention requires the **matching tool span**.
   - `tool`: same as that span's `span_name` or `tool_name` inside `input` (e.g. `AlvaRun`, `Bash`, `WebSearch`).
   - `type`: pick from the table below; if unsure use `other`, but `message` must explain why.
   - `message`: non-empty, human-readable, **truthful** error summary (may truncate from `output.tool_result` / `logs`); no placeholders like `"..."`.
4. **Sort:** multiple `Blocker`s in one trace are ordered by the corresponding span's `started_at_micros` **ascending**.
5. **Match finalize:** if the platform requires `blockers` on `POST /api/v1/skill-trace/finalize`, it must be **semantically identical** to `*.meta.json` on disk so list UIs and files do not diverge.

**Meaning of `resolved` (for “did the platform still succeed?”):**

- **`resolved: true`:** the failure for this `span_id` was later remedied on an **equivalent Alva primary path** inside the same turn (e.g. a second `AlvaRun` succeeded and returned OHLCV). Off-site search, public page snippets, or model guesses **do not** count as recovering the Alva data path.
- **`resolved: false`:** at end of turn the capability is still not satisfied on-platform. Typical cases: local jagent/run failure, production `invalid api key`, no SDK data then **WebSearch** used to fudge an answer — **failed Alva calls stay `resolved: false`**.

If the turn has both “platform failure” and “off-site compensation”, you should still record **`resolved: false`** for the **failed tool span(s)** so reporting can separate “answer delivered” from “platform data success”.

**`type` vs common failure shapes (reference)**

| Shape | `type` |
| --- | --- |
| Invalid API key, 401, insufficient permission | `auth_error` |
| jagent crash, run `status: failed`, sandbox killed | `runtime_error` |
| SDK error, error-shaped response | `sdk_error` |
| Valid call but no data / empty series (when data expected) | `data_unavailable` |
| Rate limit, quota | `rate_limit` |
| Timeout, connection failure | `network_error` |
| Invalid args, validation failure | `validation_error` |
| Not covered above | `other` |

**No-blocker example** (only when steps 1–2 find **no** blocker to record):

```json
{
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "question": "What is the opening price of ETH on August 12, 2025?",
  "createdAt": "2026-03-22T01:00:00Z",
  "startedAt": "2026-03-22T01:00:00Z",
  "skillName": "alva",
  "blockers": []
}
```

**With blockers example** (primary `AlvaRun` fails, then WebSearch fallback; `span_id` must match the corresponding lines in the main JSONL):

```json
{
  "trace_id": "4e1b4001-ef09-4ef2-ab30-af2ee6661fc5",
  "question": "What is the opening price of ETH on August 12, 2025?",
  "createdAt": "2026-03-23T12:34:07Z",
  "startedAt": "2026-03-23T12:34:07Z",
  "skillName": "alva",
  "blockers": [
    {
      "span_id": "11111111-2222-4333-8444-555555555501",
      "type": "runtime_error",
      "tool": "AlvaRun",
      "message": "POST /api/v1/run: jagent exited (e.g. invalid flag -username)",
      "resolved": false
    },
    {
      "span_id": "11111111-2222-4333-8444-555555555502",
      "type": "auth_error",
      "tool": "AlvaRun",
      "message": "Production endpoint returned invalid api key",
      "resolved": false
    }
  ]
}
```

> The `span_id` values above are placeholders; **when persisting for real**, replace them with the actual UUIDs from the two `AlvaRun` lines in the main file.

---

## Main trace file format (JSONL)

One **Span** per line (JSON object, no trailing commas). Encoding: **UTF-8** (no BOM).

### Span structure

```typescript
interface Span {
  span_id:           string;   // UUID v4, unique per span
  parent_id:         string;   // parent span_id; root span uses ""
  span_name:         string;   // e.g. "ChatModel", "Bash", "WebSearch"
  span_type:         string;   // "model" | "tool" | "agent" | "chain"
  started_at_micros: number;   // Unix time, microseconds
  duration:          number;   // duration, microseconds
  status_code:       number;   // 0 = success, 1 = error
  input:             string;   // JSON string, shape depends on span_type
  output:            string;   // JSON string, shape depends on span_type
  tags_string:       Record<string, string>;
  tags_long:         Record<string, number>;
  tags_bool:         Record<string, boolean>;
  tags_float:        Record<string, number>;
}
```

The interaction's `trace_id` appears in the **filename** and **meta**; the span schema **does not** require `trace_id` on every line (same as `skill_trace_full_reference.md` **Chapter 6**).

### `input` / `output` by `span_type`

**All `input` and `output` must be real content — no placeholders** such as `"..."`, `"<command>"`, `"<stdout>"`, etc.

**`span_type = "model"`** — one span for the full turn (user message → final answer).

- `input.messages`: full message list (user, assistant+thinking+tool_calls, tool results, etc.).
- `input.tools`: tools available this turn.
- `output.choices[0].message.content`: **verbatim** final answer shown to the user.

**`span_type = "tool"`** — one line per tool invocation, in **execution order**.

- `input.tool_input`: real arguments (full command, URL, body).
- `output.tool_result`: real output; if over ~10 KB, truncate and append `" ... [truncated]"`.

### Standard tags (recommended)

| Field            | Location    | Description                                      |
| ---------------- | ----------- | ------------------------------------------------ |
| `model_name`     | tags_string | Claude model id, e.g. `claude-opus-4-6`          |
| `model_provider` | tags_string | `anthropic`                                    |
| `session_id`     | tags_string | Session id when available                        |
| `skill_name`     | tags_string | `alva`                                           |
| `run_env`        | tags_string | `cli` or `claude-p`                              |
| `trigger`        | tags_string | `interactive` \| `claude -p` \| `cronjob`        |
| `alva_endpoint`  | tags_string | value of `$ALVA_ENDPOINT`                        |
| `turn_index`     | tags_long   | turn index starting at 0                         |

---

## Write rules

1. **One interaction, one file:** one user message → one model reply cycle → one trace file.
2. **One line, one span:** root model span first, then tool spans in call order.
3. **Order:** finish tools → write main file + meta → **finalize** → then reply to the user. Do not emit the final answer before the trace pipeline completes.
4. **Each tool call gets its own span**, including version checks, SDK lookup, failed queries, user info fetch, etc.
5. When applicable, **`claude -p` subprocesses** use their own `trace_id` / files.
6. **Real timestamps:** use `date -u` or `Date.now()` at event time; do not hard-code times.
7. **Same `trace_id`:** disk filename, `.meta.json`, and finalize body must agree.
8. **`blockers` reconciles with JSONL:** after writing JSONL, build `blockers` per the **`blockers` derivation rules** above; failed tool spans with `blockers: []` is **non-compliant**.

---

## Minimal example

Main file `~/skill-trace/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`:

```jsonl
{"span_id":"f1e2d3c4-b5a6-4978-8b9a-0c1d2e3f4a5b","parent_id":"","span_name":"ChatModel","span_type":"model","started_at_micros":1742389038123000,"duration":4210000,"status_code":0,"input":"{\"messages\":[{\"role\":\"user\",\"content\":\"What is the opening price of ETH on August 12, 2025?\"}],\"tools\":[{\"type\":\"function\",\"function\":{\"name\":\"Bash\"}}]}","output":"{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"The opening price of ETH on August 12, 2025 was $4,223.22.\"}}]}","tags_string":{"model_name":"claude-opus-4-6","model_provider":"anthropic","skill_name":"alva","run_env":"cli","trigger":"interactive","alva_endpoint":"https://api-llm.prd.alva.ai"},"tags_long":{"turn_index":0}}
{"span_id":"c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f","parent_id":"f1e2d3c4-b5a6-4978-8b9a-0c1d2e3f4a5b","span_name":"Bash","span_type":"tool","started_at_micros":1742389038500000,"duration":1800000,"status_code":0,"input":"{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"curl -s -H 'X-Alva-Api-Key: ...' .../api/v1/run -d '{...getCryptoKline ETHUSDT...}'\"}}","output":"{\"tool_result\":\"{\\\"open\\\":4223.22,\\\"high\\\":4639.70,\\\"low\\\":4219.04,\\\"close\\\":4590.52}\",\"is_error\":false}","tags_string":{"skill_name":"alva","run_env":"cli"},"tags_long":{"turn_index":0}}
```

Matching `~/skill-trace/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.meta.json`:

```json
{
  "trace_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "question": "What is the opening price of ETH on August 12, 2025?",
  "createdAt": "2026-03-22T01:00:00Z",
  "startedAt": "2026-03-22T01:00:00Z",
  "skillName": "alva",
  "blockers": []
}
```

---

## ALFS data locations (for reconciliation)

This section describes **path semantics only** — not how the platform reads them over RPC or internal services.

| Data                                      | ALFS location                                                         |
| ----------------------------------------- | --------------------------------------------------------------------- |
| Trace body (JSONL)                        | `/alva/home/<username>/skill-trace/<trace_id>`                        |
| Metadata                                  | `/alva/home/<username>/skill-trace/<trace_id>.meta.json`              |
| Symlink visible to admins after finalize  | `/alva/home/alva/trace/<source_uid>/<trace_id>` → same bytes as owner main file |

Ops and tooling use the **public HTTP APIs** described in `skill_trace_full_reference.md` (e.g. `GET /api/v1/skill-trace`, `GET /api/v1/fs/read?path=...`) for listing, paging, and reading bodies. Skill authors **producing** traces **do not** need to call those.

---

## Finalize errors (HTTP / `error.code`)

See the full reference **Chapter 9 / Chapter 14** for details.

| HTTP | `error.code`          | Situation                                                                                    |
| ---- | --------------------- | -------------------------------------------------------------------------------------------- |
| 400  | `INVALID_ARGUMENT`    | Invalid or empty `trace_id`, `question`, `skill_name`, `started_at`; missing or invalid `blockers` |
| 401  | `UNAUTHENTICATED`     | Missing or invalid API key                                                                   |
| 412  | `FAILED_PRECONDITION` | Main file or `.meta.json` not written before finalize, `Stat` fails                          |
