# @alva/adk — Agent Development Kit

A SDK for building LLM-powered agents with tool calling to enable agentic features.

## Quick Start

```javascript
const adk = require("@alva/adk");

const result = await adk.agent({
  system: "You are a helpful assistant.",
  prompt: "What is the price of AAPL?",
  tools: [{
    name: "getPrice",
    description: "Get current stock price",
    parameters: {
      type: "object",
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
    },
    fn: async (args) => {
      const resp = await require("net/http").fetch(`https://api.example.com/price/${args.symbol}`);
      return resp.json();
    },
  }],
  maxTurns: 5,
});

log(result.content);    // Final text response
log(result.turns);      // Number of agent loop iterations
log(result.toolCalls);  // History of all tool calls made
```

## API

### `adk.agent(config): Promise<AgentResult>`

Single-function entry point. Runs a ReAct loop (reason → act → observe) until the LLM responds without tool calls or `maxTurns` is reached.

### AgentConfig

| Field      | Type     | Required | Default | Description                          |
| ---------- | -------- | -------- | ------- | ------------------------------------ |
| `prompt`   | string   | yes      |         | User prompt/query                    |
| `system`   | string   | no       |         | System prompt                        |
| `tools`    | Tool[]   | yes      |         | Tools the agent can use              |
| `maxTurns` | number   | no       | 10      | Max agent loop iterations            |

### Tool

| Field         | Type                                              | Description                        |
| ------------- | ------------------------------------------------- | ---------------------------------- |
| `name`        | string                                            | Tool identifier                    |
| `description` | string                                            | What the tool does (shown to LLM)  |
| `parameters`  | object                                            | JSON Schema for tool parameters    |
| `fn`          | `(args: Record<string, unknown>) => Promise<any>` | Tool implementation                |

### AgentResult

| Field       | Type             | Description                       |
| ----------- | ---------------- | --------------------------------- |
| `content`   | string           | Final text response from LLM      |
| `turns`     | number           | Number of agent loop iterations    |
| `toolCalls` | ToolCallRecord[] | History of all tool calls executed |

### ToolCallRecord

| Field       | Type   | Description                |
| ----------- | ------ | -------------------------- |
| `name`      | string | Tool that was called       |
| `arguments` | object | Arguments passed to tool   |
| `result`    | any    | Return value from tool     |

## Agent Loop Behavior

1. Build initial messages (optional system + user prompt)
2. Convert tools to OpenAI function calling schema (strips `fn`)
3. Loop up to `maxTurns`:
   - Call LLM with messages + tools
   - If no `tool_calls` in response → return final text
   - Execute each tool call via `fn(args)`, append results
   - Continue loop
4. If `maxTurns` exhausted → return last assistant content

**Error handling:**

- Unknown tool name → throws
- Tool execution failure → throws (not swallowed)
- LLM API errors → throws with status code and body

## Tool Design Principles

Tools are how the agent interacts with the world. A well-designed toolset makes
the agent more capable and reliable.

**Three categories of tools:**

| Category | Purpose | Examples |
| -------- | ------- | ------- |
| **Query** | Fetch upstream data the agent needs to reason over | SDK calls, HTTP APIs, ALFS file reads, feed time series reads |
| **Memory** | Read/write persistent state across agent runs | ALFS files, `ctx.kv`, feed time series as historical reference |
| **Action** | Produce side effects or intermediate outputs | Write mid-turn results to a feed, trigger notifications |

**Guidelines:**

- One tool = one job. The agent composes them; you don't need a mega-tool.
- Tool descriptions are the agent's documentation — be specific about what the
  tool returns and when to use it.
- Return data the agent can reason over. Avoid returning raw HTML or huge blobs;
  pre-extract the useful fields in `fn`.
- Any Alva SDK, ALFS path, or HTTP endpoint can be wrapped as a tool.

---

## Patterns & Examples

### Historical Reference (Feed as Memory)

Read the agent's own previous output via feed time series paths (`@last/N`, `@range/7d`).

```javascript
const adk = require("@alva/adk");
const env = require("env");
const http = require("net/http");

const result = await adk.agent({
  system: `Stock analyst. Compare current data to previous analysis. Return JSON:
{"summary":"...","changes":["..."],"sentiment":"up|down|neutral"}`,
  prompt: "Analyze AAPL quarterly performance.",
  tools: [{
    name: "getIncomeStatements",
    description: "Fetch quarterly income statements for a stock",
    parameters: {
      type: "object",
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
    },
    fn: async (args) => {
      const { getCompanyIncomeStatements } = require("@arrays/data/stock/company/income:v1.0.0");
      return getCompanyIncomeStatements({
        symbol: args.symbol, period_type: "quarter",
        start_time: Date.parse("2024-01-01"), end_time: Date.now(), limit: 12,
      }).response.metrics;
    },
  }, {
    name: "getPreviousAnalysis",
    description: "Read last analysis this agent produced for a topic",
    parameters: {
      type: "object",
      properties: { topic: { type: "string" } },
      required: ["topic"],
    },
    fn: async (args) => {
      const path = `/alva/home/${env.username}/feeds/stock-research/v1/data/research/${args.topic}/@last/1`;
      const resp = await http.fetch(`${env.endpoint}/api/v1/fs/read?path=${encodeURIComponent(path)}`,
        { headers: { "X-Alva-Api-Key": env.apiKey } });
      return resp.status === 404 ? null : resp.json();
    },
  }],
  maxTurns: 5,
});
```

### Multi-Source Synthesis

Multiple domain tools — agent decides fetch order based on prompt.

```javascript
const tools = [{
  name: "getOHLCV",
  description: "Get OHLCV candlestick data for a symbol",
  parameters: {
    type: "object",
    properties: {
      symbol: { type: "string" }, interval: { type: "string" }, days: { type: "number" },
    },
    required: ["symbol"],
  },
  fn: async (args) => {
    const { getCryptoKline } = require("@arrays/crypto/ohlcv:v1.0.0");
    const now = Math.floor(Date.now() / 1000);
    return getCryptoKline({
      symbol: args.symbol, interval: args.interval || "1d",
      start_time: now - (args.days || 30) * 86400, end_time: now,
    }).response.data;
  },
}, {
  name: "getMacroIndicator",
  description: "Get macro indicator (CPI, GDP, fed funds rate, etc.)",
  parameters: { type: "object", properties: { indicator: { type: "string" } }, required: ["indicator"] },
  fn: async () => {
    const { getFedFundsRate } = require("@arrays/data/macro/fed-funds-rate:v1.0.0");
    return getFedFundsRate({ limit: 12 }).response;
  },
}, {
  name: "getNews",
  description: "Search recent news articles",
  parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  fn: async (args) => {
    const { searchNews } = require("@arrays/data/feed/news:v1.0.0");
    return searchNews({ query: args.query, limit: 10 }).response.articles;
  },
}];

await adk.agent({
  system: "Macro-financial analyst. Gather multiple sources before concluding.",
  prompt: "How is the current rate environment affecting crypto markets?",
  tools, maxTurns: 8,
});
```

### Mid-Turn Feed Output (Progressive Results)

Write results to a feed *during* the agent loop. Partial results persist even if `maxTurns` is hit.

```javascript
const { Feed, feedPath, makeDoc, str, num } = require("@alva/feed");
const adk = require("@alva/adk");

const feed = new Feed({ path: feedPath("sector-scan") });
feed.def("scan", {
  scores: makeDoc("Sector Scores", "Per-sector analysis", [str("sector"), num("score"), str("rationale")]),
});

await feed.run(async (ctx) => {
  await adk.agent({
    system: "Analyze each sector. After each, call saveSectorResult.",
    prompt: "Score growth outlook 1-10: Technology, Healthcare, Energy, Financials.",
    tools: [{
      name: "getSectorData",
      description: "Get recent performance data for a market sector",
      parameters: { type: "object", properties: { sector: { type: "string" } }, required: ["sector"] },
      fn: async (args) => {
        const { getStockOhlcv } = require("@arrays/data/stock/ohlcv:v1.0.0");
        const etfs = { Technology: "XLK", Healthcare: "XLV", Energy: "XLE", Financials: "XLF" };
        return getStockOhlcv({ symbol: etfs[args.sector] || "SPY", interval: "1d", limit: 30 }).response;
      },
    }, {
      name: "saveSectorResult",
      description: "Store analysis result for one sector",
      parameters: {
        type: "object",
        properties: { sector: { type: "string" }, score: { type: "number" }, rationale: { type: "string" } },
        required: ["sector", "score", "rationale"],
      },
      fn: async (args) => {
        await ctx.self.ts("scan", "scores").append([{
          date: Date.now(), sector: args.sector, score: args.score, rationale: args.rationale,
        }]);
        return { saved: args.sector };
      },
    }],
    maxTurns: 12,
  });
});
```

### Generic Feed Reader Tool

One tool to read from **any** deployed feed — reusable across agents.

```javascript
{
  name: "readFeedData",
  description: "Read recent output from any Alva feed",
  parameters: {
    type: "object",
    properties: {
      feedName: { type: "string" }, group: { type: "string" },
      series: { type: "string" }, count: { type: "number" },
    },
    required: ["feedName", "group", "series"],
  },
  fn: async (args) => {
    const env = require("env");
    const path = `/alva/home/${env.username}/feeds/${args.feedName}/v1/data/${args.group}/${args.series}/@last/${args.count || 10}`;
    const resp = await require("net/http").fetch(
      `${env.endpoint}/api/v1/fs/read?path=${encodeURIComponent(path)}`,
      { headers: { "X-Alva-Api-Key": env.apiKey } },
    );
    return resp.json();
  },
}
```

### Structured Output

Enforce JSON output via system prompt when result must be parsed by downstream code.

```javascript
const result = await adk.agent({
  system: `Return ONLY valid JSON: {"insights":[{"sentiment":"up|down|neutral","title":"...","text":"..."}]}`,
  prompt: "...",
  tools: [/* ... */],
});
const parsed = JSON.parse(result.content);
```
