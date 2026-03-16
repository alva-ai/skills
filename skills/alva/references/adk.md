# @alva/adk — Agent Development Kit

A SDK for building LLM-powered agents with tool calling to enable agentic features.

## Quick Start

```javascript
const adk = require("@alva/adk");

const result = await adk.agent({
  system: "You are a helpful assistant.",
  prompt: "What is the price of AAPL?",
  tools: [
    {
      name: "getPrice",
      description: "Get current stock price",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Ticker symbol" },
        },
        required: ["symbol"],
      },
      fn: async (args) => {
        const http = require("net/http");
        const resp = await http.fetch(`https://api.example.com/price/${args.symbol}`);
        return resp.json();
      },
    },
  ],
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

## Patterns & Use Cases

### Pattern 1: Research with Historical Reference

Give the agent access to both live data and its own previous analysis. The agent
can compare current state to past findings and highlight what changed.

```javascript
const adk = require("@alva/adk");
const alfs = require("alfs");
const env = require("env");
const http = require("net/http");

const result = await adk.agent({
  system: `You are a stock research analyst. You have access to current data and
your own previous analysis. Compare current findings to the last analysis and
highlight what changed. Return JSON:
{"summary":"...","changes":["..."],"sentiment":"up|down|neutral"}`,
  prompt: "Analyze AAPL quarterly performance.",
  tools: [
    {
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
    },
    {
      name: "getPreviousAnalysis",
      description: "Read the last analysis this agent produced for a given topic",
      parameters: {
        type: "object",
        properties: { topic: { type: "string", description: "e.g. 'aapl-earnings'" } },
        required: ["topic"],
      },
      fn: async (args) => {
        // Read the last record from the feed's time series
        const path = `/alva/home/${env.username}/feeds/stock-research/v1/data/research/${args.topic}/@last/1`;
        const resp = await http.fetch(`${env.endpoint}/api/v1/fs/read?path=${encodeURIComponent(path)}`,
          { headers: { "X-Alva-Api-Key": env.apiKey } });
        if (resp.status === 404) return null;
        return resp.json();
      },
    },
  ],
  maxTurns: 5,
});
```

The key idea: **feed time series are readable tools**. Any feed output path
(`@last/N`, `@range/7d`) can be fetched inside a tool, giving the agent memory
of its own prior runs.

### Pattern 2: Multi-Source Data Synthesis

Give the agent tools for different data domains. It decides what to fetch based
on the prompt — you don't need to orchestrate the sequence.

```javascript
const tools = [
  {
    name: "getOHLCV",
    description: "Get price candlestick data (open, high, low, close, volume) for a symbol",
    parameters: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "e.g. AAPL, BINANCE_SPOT_BTC_USDT" },
        interval: { type: "string", description: "e.g. 1d, 1h" },
        days: { type: "number", description: "How many days of history" },
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
  },
  {
    name: "getMacroIndicator",
    description: "Get a macroeconomic indicator (CPI, GDP, fed funds rate, etc.)",
    parameters: {
      type: "object",
      properties: { indicator: { type: "string" } },
      required: ["indicator"],
    },
    fn: async (args) => {
      // Use the appropriate macro SDK based on the indicator
      const { getFedFundsRate } = require("@arrays/data/macro/fed-funds-rate:v1.0.0");
      return getFedFundsRate({ limit: 12 }).response;
    },
  },
  {
    name: "getNews",
    description: "Search recent news articles about a topic",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    fn: async (args) => {
      const { searchNews } = require("@arrays/data/feed/news:v1.0.0");
      return searchNews({ query: args.query, limit: 10 }).response.articles;
    },
  },
];

const result = await adk.agent({
  system: "You are a macro-financial analyst. Gather data from multiple sources before forming conclusions.",
  prompt: "How is the current rate environment affecting crypto markets?",
  tools,
  maxTurns: 8,
});
```

### Pattern 3: Mid-Turn Feed Output (Progressive Results)

Write intermediate results to a feed *during* the agent loop — not just at the
end. This is useful when each tool call produces data worth persisting, or when
you want partial results even if the agent hits `maxTurns`.

```javascript
const { Feed, feedPath, makeDoc, str, num } = require("@alva/feed");
const adk = require("@alva/adk");

const feed = new Feed({ path: feedPath("sector-scan") });

feed.def("scan", {
  scores: makeDoc("Sector Scores", "Per-sector analysis", [
    str("sector"), num("score"), str("rationale"),
  ]),
});

(async () => {
  await feed.run(async (ctx) => {
    const result = await adk.agent({
      system: "Analyze each sector one at a time. After analyzing each sector, call saveSectorResult to store it.",
      prompt: "Score these sectors on 1-10 growth outlook: Technology, Healthcare, Energy, Financials.",
      tools: [
        {
          name: "getSectorData",
          description: "Get recent performance data for a market sector",
          parameters: {
            type: "object",
            properties: { sector: { type: "string" } },
            required: ["sector"],
          },
          fn: async (args) => {
            // fetch sector ETF data, fundamentals, etc.
            const { getStockOhlcv } = require("@arrays/data/stock/ohlcv:v1.0.0");
            const etfs = { Technology: "XLK", Healthcare: "XLV", Energy: "XLE", Financials: "XLF" };
            return getStockOhlcv({ symbol: etfs[args.sector] || "SPY", interval: "1d", limit: 30 }).response;
          },
        },
        {
          name: "saveSectorResult",
          description: "Store the analysis result for one sector (call after each sector is analyzed)",
          parameters: {
            type: "object",
            properties: {
              sector: { type: "string" },
              score: { type: "number", description: "1-10 growth outlook score" },
              rationale: { type: "string" },
            },
            required: ["sector", "score", "rationale"],
          },
          fn: async (args) => {
            // Write mid-turn: each sector result is persisted immediately
            await ctx.self.ts("scan", "scores").append([{
              date: Date.now(), sector: args.sector,
              score: args.score, rationale: args.rationale,
            }]);
            return { saved: args.sector };
          },
        },
      ],
      maxTurns: 12,
    });
  });
})();
```

The agent iterates through sectors, calling `getSectorData` then
`saveSectorResult` for each. Results are persisted progressively — even if the
run times out, completed sectors are already saved.

### Pattern 4: Cross-Referencing Playbook / Feed Data

Any published feed or playbook data on ALFS is a valid data source for an agent
tool. Use this to build agents that reference existing pipelines.

```javascript
{
  name: "readFeedData",
  description: "Read recent output from any Alva feed by path. Use this to reference existing data pipelines.",
  parameters: {
    type: "object",
    properties: {
      feedName: { type: "string", description: "Feed name, e.g. 'btc-ema'" },
      group: { type: "string", description: "Data group, e.g. 'metrics'" },
      series: { type: "string", description: "Series name, e.g. 'prices'" },
      count: { type: "number", description: "Number of recent records (default 10)" },
    },
    required: ["feedName", "group", "series"],
  },
  fn: async (args) => {
    const http = require("net/http");
    const env = require("env");
    const n = args.count || 10;
    const path = `/alva/home/${env.username}/feeds/${args.feedName}/v1/data/${args.group}/${args.series}/@last/${n}`;
    const resp = await http.fetch(
      `${env.endpoint}/api/v1/fs/read?path=${encodeURIComponent(path)}`,
      { headers: { "X-Alva-Api-Key": env.apiKey } },
    );
    return resp.json();
  },
}
```

This single tool gives the agent access to **all your deployed feeds**. An
agent can read BTC EMA from one feed, earnings insights from another, and
macro indicators from a third — then synthesize across them.

---

## Structured Output

Use structured output (JSON) when the result must be parsed by downstream code
(feed `append()`, playbook rendering, another agent). For free-form research
notes or summaries, plain text is fine.

**How to enforce:** Specify the exact schema in the system prompt.

```javascript
const result = await adk.agent({
  system: `Return ONLY valid JSON matching this schema — no markdown, no prose:
{"insights":[{"sentiment":"up|down|neutral","title":"short label","text":"1-2 sentences"}]}`,
  prompt: "...",
  tools: [/* ... */],
});
const parsed = JSON.parse(result.content);
```

---

## Example: Simple Tool

```javascript
const adk = require("@alva/adk");

const result = await adk.agent({
  system: "You are a helpful assistant. Use the multiply tool for math.",
  prompt: "What is 17 times 31?",
  tools: [
    {
      name: "calculator",
      description: "Multiply two numbers",
      parameters: {
        type: "object",
        properties: {
          a: { type: "number", description: "First number" },
          b: { type: "number", description: "Second number" },
        },
        required: ["a", "b"],
      },
      fn: async ({ a, b }) => ({ result: a * b }),
    },
  ],
  maxTurns: 5,
});
```
