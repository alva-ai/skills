# @alva/adk — Agent Development Kit

Use ADK when a scheduled, deterministic Alva pipeline needs a custom LLM
tool-loop: classification, synthesis over already-fetched records, structured
JSON extraction, feed summarizer output, or multi-step reasoning where the tool
set is fixed.

For ordinary scheduled agent digests and proactive notifications, prefer the
AlvaAsk pattern in [feed-sdk.md](feed-sdk.md#pattern-e-alvaask--feed-notification-notifymessage).
ADK is the lower-level option when AlvaAsk is not enough.

Do not use ADK for one-off interactive research, exploratory analysis, or a
direct user question. Do not use ADK to invent numbers, events, reports, or
market facts. Those must come from Data Skills, SDK/feed outputs, search/BYOD
sources wired into the feed, or user-provided data that passed
[content-legitimacy.md](content-legitimacy.md).

If ADK produces user-facing prose (TLDR, digest, why-it-matters, delta body,
push line), copy the voice block from [narrative-voice.md](narrative-voice.md)
verbatim into `system`.

## Runtime Rules

ADK code runs inside the jagent V8 runtime. Before writing code, read
[jagent-runtime.md](jagent-runtime.md); it owns the runtime constraints, module
imports, async wrapper pattern, and absent globals.

ADK-specific deltas:

- Use `console.log` for debugging ADK results; do not use a nonexistent `log`.
- Write scheduled ADK outputs through the Feed SDK and run the normal feed
  lifecycle before release.
- Do not pass raw secrets, logs, or pasted values into user-visible output.
- If an ADK tool needs structured financial data, discover the endpoint through
  [data-skills.md](data-skills.md) and call it from the runtime over HTTP.

## Quick Start

This example lets ADK reason over an existing feed output. The number comes from
the feed read tool, not from the model.

```javascript
const adk = require("@alva/adk");
const alfs = require("alfs");
const env = require("env");

(async () => {
  const result = await adk.agent({
    system: `Return JSON only.
Reply MUST begin with \`{\` and end with \`}\`.
Schema: {"summary":"...","risk":"low|medium|high"}`,
    prompt: "Summarize the latest AAPL snapshot.",
    tools: [{
      name: "readLatestSnapshot",
      description: "Read the latest feed-backed AAPL metrics snapshot.",
      parameters: { type: "object", properties: {} },
      fn: async () => {
        const path = `/alva/home/${env.username}/feeds/aapl-snapshot/v1/data/metrics/snapshot/@last/1`;
        const raw = await alfs.readFile(path);
        return JSON.parse(raw);
      },
    }],
    maxTurns: 5,
  });

  console.log(result.content);
})();
```

## API

### `adk.agent(config): Promise<AgentResult>`

Runs a ReAct loop until the model responds without tool calls or `maxTurns` is
reached.

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `prompt` | string | yes | | User prompt/query |
| `system` | string | no | | System prompt |
| `tools` | Tool[] | yes | | Tools the agent may call |
| `maxTurns` | number | no | 10 | Max agent loop iterations |

Tool fields:

| Field | Type | Description |
| --- | --- | --- |
| `name` | string | Tool identifier |
| `description` | string | What the tool does, shown to the model |
| `parameters` | object | JSON Schema for tool arguments |
| `fn` | `(args) => Promise<any>` | Tool implementation |

Result fields:

| Field | Type | Description |
| --- | --- | --- |
| `content` | string | Final text response from the model |
| `turns` | number | Number of loop iterations |
| `toolCalls` | ToolCallRecord[] | History of executed tool calls |

Unknown tools, tool failures, and LLM API failures throw; do not swallow them
and continue with empty output.

## Tool Design Principles

Tools are the only legitimate way ADK touches facts. A good tool set makes the
agent reliable.

| Category | Purpose | Examples |
| --- | --- | --- |
| Query | Fetch upstream data the agent needs | feed time series reads, Data Skills HTTP calls, ALFS file reads |
| Memory | Read/write persistent state across runs | feed time series, ALFS files, `ctx.kv` |
| Action | Produce side effects or intermediate outputs | append feed records, save partial results |

Guidelines:

- One tool = one job.
- Tool descriptions must name the source and returned fields.
- Return compact structured data, not raw HTML or huge blobs.
- Validate shapes and throw when required fields are absent.
- Treat ADK output as interpretation of tool results, not as a data source.

## Feed-Backed Scheduled Digest

Use this when ADK is the right lower-level tool-loop and the result needs to
become a feed output. The feed can then be deployed, released, and optionally
push-enabled with [push-notifications.md](push-notifications.md).

```javascript
const { Feed, feedPath, makeDoc, str } = require("@alva/feed");
const adk = require("@alva/adk");
const alfs = require("alfs");
const env = require("env");

const feed = new Feed({ path: feedPath("adk-market-digest") });
feed.def("notify", {
  message: makeDoc("Notification", "ADK-generated digest", [
    str("title"),
    str("body"),
  ]),
});

(async () => {
  await feed.run(async (ctx) => {
    const result = await adk.agent({
      system: `Use the supplied feed rows only. Do not invent numbers.
Return concise markdown suitable for a notification.`,
      prompt: "Write the latest market digest.",
      tools: [{
        name: "readMarketRows",
        description: "Read latest market rows from the released feed output.",
        parameters: { type: "object", properties: {} },
        fn: async () => {
          const path = `/alva/home/${env.username}/feeds/market-source/v1/data/metrics/summary/@last/5`;
          const raw = await alfs.readFile(path);
          return JSON.parse(raw);
        },
      }],
      maxTurns: 5,
    });

    await ctx.self.ts("notify", "message").append([{
      date: Date.now(),
      title: "Market Digest",
      body: result.content,
    }]);
  });
})();
```

After writing the script, run [feed-lifecycle.md](feed-lifecycle.md). If this
digest backs a playbook, also run [playbook-release.md](playbook-release.md).

## Data Skills Tool Wrapper

Use this only after running the Data Skills discovery pipeline in the same
session. Replace `ARRAYS_PATH` and params with the exact values from
`alva data-skills endpoint <skill> <file>`.

```javascript
const http = require("net/http");
const secret = require("secret-manager");

const ARRAYS_BASE = "https://data-tools.prd.space.id";
const ARRAYS_PATH = "/<discovered-endpoint-path>";

async function callArrays(params) {
  const jwt = secret.loadPlaintext("ARRAYS_JWT");
  if (!jwt) {
    throw new Error("Missing ARRAYS_JWT. Run `alva arrays token ensure` and retry.");
  }
  const resp = await http.fetch(ARRAYS_BASE + ARRAYS_PATH, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + jwt,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!resp.ok) {
    throw new Error(`Arrays HTTP ${resp.status}: ${await resp.text()}`);
  }
  return resp.json();
}
```

Wrap `callArrays` as an ADK tool only when the model needs to choose among
arguments or combine tool results. For simple deterministic fetches, keep the
fetch outside ADK and pass the result into the prompt or feed code.

## Mid-Turn Feed Output

ADK tools can persist partial results during the agent loop. Use this for
longer scans where partial outputs are useful if `maxTurns` is reached.

```javascript
const { Feed, feedPath, makeDoc, str, num } = require("@alva/feed");
const adk = require("@alva/adk");

const feed = new Feed({ path: feedPath("sector-scan") });
feed.def("scan", {
  scores: makeDoc("Sector Scores", "Per-sector analysis", [
    str("sector"),
    num("score"),
    str("rationale"),
  ]),
});

(async () => {
  await feed.run(async (ctx) => {
    await adk.agent({
      system: "Score each sector using only tool-provided data. Call saveSectorResult for each sector.",
      prompt: "Score growth outlook 1-10: Technology, Healthcare, Energy, Financials.",
      tools: [{
        name: "saveSectorResult",
        description: "Store the score and rationale for one sector.",
        parameters: {
          type: "object",
          properties: {
            sector: { type: "string" },
            score: { type: "number" },
            rationale: { type: "string" },
          },
          required: ["sector", "score", "rationale"],
        },
        fn: async (args) => {
          await ctx.self.ts("scan", "scores").append([{
            date: Date.now(),
            sector: args.sector,
            score: args.score,
            rationale: args.rationale,
          }]);
          return { saved: args.sector };
        },
      }],
      maxTurns: 12,
    });
  });
})();
```

Do not let the model create scores from vibes. Add query tools or precomputed
feed reads when the score depends on real market data.

## Structured Output

When downstream code parses the ADK result, enforce JSON in the system prompt
and still parse defensively.

```javascript
function parseJson(s) {
  if (!s) return null;
  const cleaned = s.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch (e2) {
      return null;
    }
  }
}
```

Pair this with a prompt that says: `Reply MUST begin with "{" and end with "}"`.
If parsing fails, throw and let the feed run fail; do not silently write partial
or made-up records.

## Timestamp Source For Extracted Records

When ADK extracts records destined for a timeseries column or user-visible card
(news, events, articles, filings, posts), the content's own date is part of the
contract, not the crawl time.

- Schema must include `published_at_iso` and `date_confidence`
  (`source_published_at | extracted_from_summary | unknown`).
- Feed code should use `date = Date.parse(item.published_at_iso) || null`.
- Never use `date: Date.now()` or `now + i` for extracted events.
- Put crawl time in a separate `crawled_at` field if useful.
- HTML should render `Date unknown` when `date_confidence === "unknown"` or
  `date == null`.

A card showing a fresh crawl date for an old event is a content-legitimacy
violation, not just a UX bug.
