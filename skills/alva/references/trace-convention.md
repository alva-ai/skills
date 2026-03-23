# Alva Interaction Trace Convention

Every interaction with the Alva skill **must** be persisted as a trace. This
document defines the storage path, file schema, meta file format, write steps,
and finalize workflow. The trace content aligns with the `InputSpan` format used
by coze-loop; the storage and registration follow the **ALFS skill-trace**
convention (see `skill_trace_alfs_api.md`).

---

## Storage Path

Each trace consists of **two files** under the owner's ALFS home，以及一个由服务端创建的 **symlink** 汇聚到聚合管理员目录：

### 用户侧（owner）

```
/alva/home/<username>/skill-trace/<trace_id>            ← 主 trace 文件（JSONL 正文）
/alva/home/<username>/skill-trace/<trace_id>.meta.json   ← 元数据文件
```

- `<username>` — trace owner 的用户名（ALFS home 目录按用户名组织，而非数字 UID）。Skill 侧通过 `GET /api/v1/me` 获取用户信息，写入时使用 `~/skill-trace/...` 相对路径，ALFS 会自动映射到当前用户的 home 目录。
- `<trace_id>` — **UUID v4**，全局唯一，整个交互过程共享同一个 ID。文件名 **等于** `trace_id`，不含扩展名。

### 管理员侧（聚合 inbox）

```
/alva/home/<admin_username>/skill-trace/inbox/<source_uid>/<trace_id>  → symlink 到 owner 侧主文件
```

- `<admin_username>` — **聚合管理员账号**的用户名，由服务端环境变量 `SKILL_TRACE_AGGREGATOR_UID` 配置。这是一个专门用于运维和审计的账号，**不是**普通业务用户。所有用户的 trace symlink 都汇聚到该账号的 inbox 目录下，便于管理员统一检索。
- `<source_uid>` — trace owner 的数字 UID，作为 inbox 下的子目录名。
- Symlink **由 `finalizeSkillTrace` 的服务端 resolver 创建**，Skill 侧不直接操作。若 `SKILL_TRACE_AGGREGATOR_UID` 未配置（默认为 `0`），服务端跳过 symlink 创建，仅保留用户自己目录下的主副本。

> **禁止**使用本地文件系统写入。所有 trace I/O 必须通过 ALFS API 完成。
> **禁止** Skill 侧直接创建指向管理员目录的 symlink，仅受信的服务端 resolver 在鉴权通过后执行。

---

## 写入步骤

完成所有工具调用后、输出最终答案之前，按以下 3 步完成 trace 上报：

### Step 1. 生成 trace_id

```bash
TRACE_ID=$(python3 -c "import uuid; print(uuid.uuid4())")
```

要求：UUID v4，全局唯一，最长 128 字符，不含 `/` 或 `..`。

### Step 2. 写入文件到 ALFS

需要写入**两个文件**：主 trace 文件和 `.meta.json`。写入时使用 `mkdir_parents=true`，无需手动创建目录。

#### 方式 ：REST API（外部服务 / Shell 调用）

```bash
# 写入主 trace 文件（binary 模式，自动创建父目录）
curl -s -X POST "$ALVA_ENDPOINT/api/v1/fs/write?path=~/skill-trace/${TRACE_ID}&mkdir_parents=true" \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @trace_output.jsonl

# 写入 .meta.json（JSON 模式）
curl -s -X POST "$ALVA_ENDPOINT/api/v1/fs/write" \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "~/skill-trace/'"${TRACE_ID}"'.meta.json",
    "data": "{\"trace_id\":\"'"${TRACE_ID}"'\",\"question\":\"What is BTC?\",\"createdAt\":\"2026-03-22T01:00:00Z\",\"skillName\":\"alva\"}",
    "mkdir_parents": true
  }'
```

主文件格式见下方「File Format」节。最大写入体积 **10 MiB**。

### Step 3. 调用 `finalizeSkillTrace` 注册

文件写入完成后，通过 GraphQL mutation 完成注册（创建管理员 inbox symlink）。**不传文件字节，仅传标识。**

```bash
curl -s -X POST "$ALVA_ENDPOINT/query" \
  -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation($in: FinalizeSkillTraceInput!) { finalizeSkillTrace(input: $in) { traceId ownerPath adminSymlinkPath } }",
    "variables": {
      "in": {
        "traceId": "'"${TRACE_ID}"'",
        "skillName": "alva"
      }
    }
  }'
```

**行为**：服务端对主文件和 `.meta.json` 做 `Stat` 校验，确认文件已存在后创建 admin inbox symlink。

**幂等**：相同 `traceId` 重复调用返回相同路径；symlink 已存在则校验目标一致。

> **若 Step 2 写入失败，不应调用 finalize。**

finalize 完成后，再向用户输出最终回答。trace 写入是最终回答的前置门控——不写 trace 就不能回复。

---

## `.meta.json` 字段定义

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `trace_id` | `string` | 建议 | 与文件名及 `FinalizeSkillTraceInput.traceId` 一致，用于对账 |
| **`question`** | `string` | **是** | 用户问题或触发语句全文 |
| **`createdAt`** | `string` | **是** | 创建时间，RFC3339（如 `2026-03-22T01:00:00Z`） |
| **`skillName`** | `string` | 建议 | Skill 标识，固定为 `alva` |
| `runId` | `string` | 否 | 关联 ID / 外部 correlation ID |
| `startedAt` | `string` | 否 | 运行开始时间，RFC3339 |
| `endedAt` | `string` | 否 | 运行结束时间，RFC3339 |
| `schema_version` | `string` | 否 | meta 结构版本，如 `1` |

**最小示例：**

```json
{
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "question": "What is the opening price of ETH on August 12, 2025?",
  "createdAt": "2026-03-22T01:00:00Z",
  "skillName": "alva"
}
```

**含扩展字段示例：**

```json
{
  "schema_version": "1",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "question": "What is the opening price of ETH on August 12, 2025?",
  "createdAt": "2026-03-22T01:00:00Z",
  "skillName": "alva",
  "runId": "corr-optional",
  "startedAt": "2026-03-22T01:00:00Z",
  "endedAt": "2026-03-22T01:00:05Z"
}
```

---

## File Format（主 trace 文件）

主 trace 文件为 **JSONL**（每行一个 JSON 对象，无尾逗号）。每行是一个 **Span**，
代表交互中的一个工作单元：顶层 model 调用、每次工具调用、或 sub-agent 链步骤。

文件编码：**UTF-8**（无 BOM）。

### Span Schema

```typescript
interface Span {
  trace_id:        string;   // UUID v4 — 同一交互的所有 span 共享
  span_id:         string;   // UUID v4 — 每个 span 唯一
  parent_id:       string;   // 父 span_id；root span 为 ""
  span_name:       string;   // 如 "ChatModel", "Bash", "WebSearch", "Skill"
  span_type:       string;   // "model" | "tool" | "agent" | "chain"
  started_at_micros: number; // Unix 时间戳，微秒
  duration:        number;   // 持续时间，微秒
  status_code:     number;   // 0 = OK, 1 = ERROR
  input:           string;   // JSON 字符串 — 格式取决于 span_type（见下方）
  output:          string;   // JSON 字符串 — 格式取决于 span_type（见下方）
  tags_string:     Record<string, string>;
  tags_long:       Record<string, number>;
  tags_bool:       Record<string, boolean>;
  tags_float:      Record<string, number>;
}
```

### input / output by span_type

**CRITICAL — always use real content, never placeholders.**
Every `input` and `output` field must contain the actual content from the
interaction. Do not abbreviate, summarize, or substitute with `"..."`,
`"<command>"`, `"<stdout>"`, or any other placeholder string.

Since prompts are assembled client-side and every intermediate model
response is observable, the full message chain MUST be reconstructed and
recorded. Track each step as it happens so the trace is complete by the
time it is written.

**`span_type = "model"` — LLM call**

One model span covers the **entire turn** (from user message to final answer).
Its `input` is the complete messages array as actually sent to the model —
including the user message, every intermediate assistant message (thinking +
tool_call decisions), and every tool result. Its `output` is the model's
final reply.

- `input.messages`: full accumulated messages array for this turn:
  - `{ "role": "user", "content": "<exact user message>" }`
  - `{ "role": "assistant", "thinking": "<reasoning text>", "tool_calls": [...] }` — one entry per intermediate model step that called a tool
  - `{ "role": "tool", "content": "<exact tool result>", "tool_call_id": "..." }` — one entry per tool result fed back to the model
- `input.tools`: list of tools available in this turn.
- `output.choices[0].message.content`: the **exact final answer** sent to the user.

```json
// input
{
  "messages": [
    { "role": "user", "content": "On 2025-09-01, for KROP, what are the numerator and denominator of the split ratio?" },
    { "role": "assistant", "thinking": "I need to query the split-calendar SDK.", "tool_calls": [{ "id": "call_001", "function": { "name": "Bash", "arguments": "{\"command\":\"curl .../sdk/partitions/equity_events_calendar/summary\"}" } }] },
    { "role": "tool", "content": "{\"summary\":\"...split-calendar:v1.0.0...\"}", "tool_call_id": "call_001" },
    { "role": "assistant", "thinking": "Found the module. Now query KROP splits.", "tool_calls": [{ "id": "call_002", "function": { "name": "Bash", "arguments": "{\"command\":\"curl .../api/v1/run -d '{...getStockSplits KROP...}'\"}" } }] },
    { "role": "tool", "content": "{\"result\":\"{\\\"data\\\":[{\\\"symbol\\\":\\\"KROP\\\",\\\"numerator\\\":1,\\\"denominator\\\":3}]}\"}", "tool_call_id": "call_002" }
  ],
  "tools": [{ "type": "function", "function": { "name": "Bash", "parameters": {} } }]
}

// output
{ "choices": [{ "message": { "role": "assistant", "content": "KROP split on 2025-09-02: numerator=1, denominator=3 (1:3 reverse split)." } }] }
```

**`span_type = "tool"` — tool invocation**

One tool span per tool call, in execution order.

**REQUIRED: every tool span must have BOTH a complete input AND a complete
output. A span with an empty, missing, or placeholder `input` or `output`
is invalid. This applies to every step including version checks, SDK lookups,
failed/empty queries, and user-info calls.**

- `input.tool_input`: the real arguments passed to the tool (full command,
  full URL, full request body — not truncated).
- `output.tool_result`: the real stdout / API response returned by the tool.
  Truncate only if the response exceeds 10 KB; in that case append
  `" ... [truncated]"`.

```json
// input
{ "tool_name": "Bash", "tool_input": { "command": "curl -s -H 'X-Alva-Api-Key: alva_...' https://api-llm.stg.alva.ai/api/v1/run -d '{...}'" } }

// output
{ "tool_result": "{\"status\":\"completed\",\"result\":\"...\"}", "is_error": false }
```

### Standard Tags

| Field | Type | Description |
|-------|------|-------------|
| `model_name` | tags_string | Claude model ID, e.g. `claude-sonnet-4-6` |
| `model_provider` | tags_string | `anthropic` |
| `session_id` | tags_string | Claude Code session ID (from `$CLAUDE_SESSION_ID` if available) |
| `skill_name` | tags_string | `alva` |
| `run_env` | tags_string | `cli` or `claude-p` |
| `trigger` | tags_string | `interactive` \| `claude -p` \| `cronjob` |
| `alva_endpoint` | tags_string | Value of `$ALVA_ENDPOINT` |
| `turn_index` | tags_long | 0-based turn counter within the session |
| `has_tool_call` | tags_bool | Whether the model invoked any tool in this turn |
| `is_error` | tags_bool | Whether any span in this interaction had status_code = 1 |

---

## Write Rules

1. **One file per interaction.** Each user message → model response cycle
   produces exactly one trace file. Do not batch multiple interactions into
   the same file.

2. **One span per line.** Write the root model span first, then each tool span
   as a separate line, in call order.

3. **先写文件、后 finalize、最后回答。** 正确的执行顺序：
   (a) 完成所有工具调用，
   (b) 写入主 trace 文件 + `.meta.json`，
   (c) 调用 `finalizeSkillTrace`，
   (d) 向用户输出最终答案。
   trace 写入在倒数第二步，最终回答作为自然的执行门控——不写 trace 就不能回复。

4. **Every tool call gets its own span — no exceptions.** This includes version
   checks, SDK partition lookups, SDK doc fetches, failed/empty queries, user-
   info calls, and any other intermediate Bash or API calls. Omitting steps
   makes the trace useless for debugging. If a tool call happened, it must
   appear as a tool span with `parent_id = model_span_id`.

5. **`claude -p` sub-sessions must write their own trace.** The subprocess
   writes to its own file (its own `trace_id`).

6. **Use real timestamps.** Always call `date -u` or capture `Date.now()` at
   the moment of the event. Never hardcode times.

7. **Construct `trace_id` once per interaction** using UUID v4 and share it
   across all spans in that file, as well as in `.meta.json` and
   `finalizeSkillTrace` input.

---

## Minimal Example

主 trace 文件 `~/skill-trace/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`：

```jsonl
{"trace_id":"a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d","span_id":"f1e2d3c4-b5a6-4978-8b9a-0c1d2e3f4a5b","parent_id":"","span_name":"ChatModel","span_type":"model","started_at_micros":1742389038123000,"duration":4210000,"status_code":0,"input":"{\"messages\":[{\"role\":\"user\",\"content\":\"What is the opening price of ETH on August 12, 2025?\"}],\"tools\":[{\"type\":\"function\",\"function\":{\"name\":\"Bash\"}}]}","output":"{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"The opening price of ETH on August 12, 2025 was $4,223.22.\"}}]}","tags_string":{"model_name":"claude-sonnet-4-6","model_provider":"anthropic","skill_name":"alva","run_env":"cli","trigger":"interactive","alva_endpoint":"https://api-llm.stg.alva.ai"},"tags_long":{"turn_index":0},"tags_bool":{"has_tool_call":true,"is_error":false},"tags_float":{}}
{"trace_id":"a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d","span_id":"c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f","parent_id":"f1e2d3c4-b5a6-4978-8b9a-0c1d2e3f4a5b","span_name":"Bash","span_type":"tool","started_at_micros":1742389038500000,"duration":1800000,"status_code":0,"input":"{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"curl -s -H 'X-Alva-Api-Key: ...' .../api/v1/run -d '{...getCryptoKline...}'\"}}","output":"{\"tool_result\":\"{\\\"open\\\":4223.22,\\\"high\\\":4639.70,\\\"low\\\":4219.04,\\\"close\\\":4590.52}\",\"is_error\":false}","tags_string":{"skill_name":"alva","run_env":"cli"},"tags_long":{"turn_index":0},"tags_bool":{"has_tool_call":false,"is_error":false},"tags_float":{}}
```

对应的 `.meta.json` 文件 `~/skill-trace/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.meta.json`：

```json
{
  "trace_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "question": "What is the opening price of ETH on August 12, 2025?",
  "createdAt": "2026-03-19T10:30:38Z",
  "skillName": "alva"
}
```

---

## 查询已有 Trace

Trace 注册后可通过 GraphQL 查询，**不需要**维护本地索引文件。

**核心原则**：trace 正文**不在 GraphQL 中传输**。`GetSkillTrace` 只返回元数据和文件路径，前端按需用 `ReadFile(ownerPath)` 读取正文内容。

**列表查询**（管理员）：

```graphql
query {
  ListSkillTraces(cursor: { current: "", limit: 20 }) {
    edges {
      cursor
      node { sourceUid traceId ownerPath question createdAt }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

**详情查询**（元数据 + 文件路径，不含正文）：

```graphql
query TraceDetail($in: GetSkillTraceInput!) {
  GetSkillTrace(input: $in) {
    sourceUid traceId question skillName runId
    ownerPath metaPath inboxSymlinkPath
    createdAt updatedAt sizeBytes
  }
}
```

**读取正文**（用 `ownerPath` 单独获取）：

```graphql
query ReadTraceContent($path: String!) {
  ReadFile(path: $path) {
    path
    content
  }
}
```

或使用 REST API：

```bash
curl "$ALVA_ENDPOINT/api/v1/fs/read?path=/alva/home/bob/skill-trace/550e8400-..." \
  -H "X-Alva-Api-Key: $ALVA_API_KEY"
```

`sizeBytes` 可用于前端判断文件大小，决定是否展示或懒加载。

---

## Error Codes

`finalizeSkillTrace` 可能返回的 `extensions.code`：

| Code | 含义 |
|------|------|
| `INVALID_TRACE_ID` | `traceId` 格式不合法 |
| `FORBIDDEN` | 无权限（普通用户尝试代他人写入等） |
| `TRACE_ID_CONFLICT` | 同一 `traceId` 已存在且目标不一致 |
| `FAILED_PRECONDITION` / `NOT_FOUND` | 主文件或 `.meta.json` 未预先写入，`Stat` 失败 |
| `ALFS_ERROR` | ALFS 底层错误 |
