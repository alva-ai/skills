# @alva/adk — Agent Development Kit

A lightweight SDK for building LLM-powered agents with tool calling.

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

## Example: Multiply Tool

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

## Example: Multi-Tool Financial Agent

```javascript
const adk = require("@alva/adk");
const feed = require("@alva/feed");

const result = await adk.agent({
  system: "You are a stock analyst. Use tools to get data before answering.",
  prompt: "Compare AAPL and MSFT performance this month",
  tools: [
    {
      name: "getOHLCV",
      description: "Get OHLCV candlestick data for a stock symbol",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Ticker symbol" },
          period: { type: "string", description: "Time period, e.g. '1M', '3M'" },
        },
        required: ["symbol"],
      },
      fn: async (args) => {
        return await feed.query("equity/ohlcv", { symbol: args.symbol, period: args.period || "1M" });
      },
    },
    {
      name: "calculateReturn",
      description: "Calculate percentage return from start and end prices",
      parameters: {
        type: "object",
        properties: {
          startPrice: { type: "number" },
          endPrice: { type: "number" },
        },
        required: ["startPrice", "endPrice"],
      },
      fn: async (args) => {
        const ret = ((args.endPrice - args.startPrice) / args.startPrice) * 100;
        return { returnPct: ret.toFixed(2) + "%" };
      },
    },
  ],
  maxTurns: 10,
});
```
