# alpi - `@alva/pi` Agent Runtime

Use alpi when an Alva runtime script needs a fixed LLM reasoning or tool loop
inside a deterministic pipeline. The runtime module is `@alva/pi`; use
`Agent.ask()` when the script only needs the settled result.

> **If an alpi call produces user-facing prose** (TLDR, digest,
> why-it-matters, delta body, push line, etc.), include the voice block from
> [user-facing-prose.md](user-facing-prose.md#voice-block) verbatim in
> `systemPrompt`.

## Quick Start

```javascript
// @ts-nocheck
/** alva run --local-file ./run-result.js */
(async () => {
	const { Agent, Type, getModel } = require("@alva/pi");
	const args = require("env").args || {};

	const model = getModel("openai", args.model || "gpt-5.5");
	const prompt =
		args.prompt ||
		"Use add for 100+23, then subtract 7 from that sum. Reply with only the final number.";

	const agent = new Agent({
		initialState: {
			systemPrompt: "Use add and subtract tools. Reply with only the final number.",
			model,
			tools: [
				{
					name: "add",
					description: "Add two numbers.",
					parameters: Type.Object({ a: Type.Number(), b: Type.Number() }),
					execute: async (_id, { a, b }) => ({
						content: [{ type: "text", text: String(Number(a) + Number(b)) }],
					}),
				},
				{
					name: "subtract",
					description: "Subtract b from a.",
					parameters: Type.Object({ a: Type.Number(), b: Type.Number() }),
					execute: async (_id, { a, b }) => ({
						content: [{ type: "text", text: String(Number(a) - Number(b)) }],
					}),
				},
			],
			thinkingLevel: "off",
		},
		getApiKey: () => "jagent-managed",
	});

	const { message } = await agent.ask(prompt);
	const text = message.content
		.filter((block) => block.type === "text")
		.map((block) => block.text)
		.join("");

	return { text };
})();
```

## API Shape

### `new Agent(options)`

Create an agent with a fixed initial state. In Alva's online jagent runtime,
pass `getApiKey: () => "jagent-managed"` so provider credentials stay owned by
jagent.

### `agent.ask(prompt): Promise<AgentAnswer>`

Runs the normal alpi loop and resolves when the assistant has settled after any
tool calls. Use this for result-only scripts; do not subscribe to streaming
events unless the script truly needs progress updates.

### Agent Options

| Field | Required | Description |
| --- | --- | --- |
| `initialState.systemPrompt` | no | Fixed instructions for the reasoning step. |
| `initialState.model` | yes | `getModel(provider, modelId)` result, usually OpenAI. |
| `initialState.tools` | yes | Tool definitions available to the agent. |
| `initialState.thinkingLevel` | no | Use `"off"` for deterministic result-only jobs unless reasoning is needed. |
| `getApiKey` | yes online | Return `"jagent-managed"` in Alva runtime. |

### Tool

| Field | Description |
| --- | --- |
| `name` | Tool identifier exposed to the model. |
| `description` | Specific guidance for when to call the tool. |
| `parameters` | alpi schema, usually `Type.Object({ ... })`. |
| `execute` | `async (toolCallId, params) => ToolResult`. |

Tool results should return text blocks the model can reason over:

```javascript
return {
	content: [{ type: "text", text: JSON.stringify(result) }],
	details: result,
};
```

## Result Extraction

`Agent.ask()` returns `{ message, messages }`. Extract final text from
`message.content`:

```javascript
const { message, messages } = await agent.ask(prompt);
const text = message.content
	.filter((block) => block.type === "text")
	.map((block) => block.text)
	.join("");
```

`messages` contains the user message, assistant tool calls, tool results, and
final assistant message. Keep it for diagnostics when a smoke run fails.

## Tool Design Principles

Tools are how the agent interacts with real upstream data. Design them as small
deterministic adapters around Data Skills, ALFS, HTTP, Feed SDK reads, or
Feed SDK writes.

| Category | Purpose | Examples |
| --- | --- | --- |
| Query | Fetch upstream data the agent needs to reason over | Data Skills, HTTP APIs, ALFS reads, feed time series reads |
| Memory | Read/write persistent state across runs | ALFS files, feed time series as historical reference |
| Action | Produce side effects or intermediate outputs | Write mid-turn results to a feed, trigger notification records |

Guidelines:

- One tool = one job. Let the agent compose tools.
- Tool descriptions are model-facing documentation; be specific.
- Return compact structured data, not raw HTML or huge blobs.
- Do not use tools to fabricate facts. Missing coverage is a blocker or a
  scoped-down answer.

## Patterns & Examples

### Historical Reference (Feed as Memory)

Read the agent's previous output via feed time-series paths
(`@last/N`, `@range/{start}..{end}`).

```javascript
const { Agent, Type, getModel } = require("@alva/pi");
const env = require("env");
const alfs = require("alfs");

const agent = new Agent({
	initialState: {
		systemPrompt: `Stock analyst. Compare current data to previous analysis.

Reply MUST begin with \`{\` and end with \`}\`. No prose, no markdown, no code fences.
Output is parsed by JSON.parse with no preprocessing.

Schema: {"summary":"...","changes":["..."],"sentiment":"up|down|neutral"}`,
		model: getModel("openai", "gpt-5.5"),
		tools: [
			{
				name: "getIncomeStatements",
				description: "Fetch quarterly income statements for a stock.",
				parameters: Type.Object({ symbol: Type.String() }),
				execute: async (_id, { symbol }) => {
					const { getCompanyIncomeStatements } = require("@arrays/data/stock/company/income:v1.0.0");
					const data = getCompanyIncomeStatements({
						symbol,
						period_type: "quarter",
						start_time: Date.parse("2024-01-01"),
						end_time: Date.now(),
						limit: 12,
					}).response.metrics;
					return { content: [{ type: "text", text: JSON.stringify(data) }] };
				},
			},
			{
				name: "getPreviousAnalysis",
				description: "Read the last analysis this agent produced for a topic.",
				parameters: Type.Object({ topic: Type.String() }),
				execute: async (_id, { topic }) => {
					const path = `/alva/home/${env.username}/feeds/stock-research/v1/data/research/${topic}/@last/1`;
					let data = null;
					try {
						data = JSON.parse(await alfs.readFile(path));
					} catch (err) {
						if (!/not found|404/i.test(String(err?.message || err))) throw err;
					}
					return { content: [{ type: "text", text: JSON.stringify(data) }] };
				},
			},
		],
		thinkingLevel: "off",
	},
	getApiKey: () => "jagent-managed",
});

const { message } = await agent.ask("Analyze AAPL quarterly performance.");
```

### Multi-Source Synthesis

Expose multiple domain tools and let the agent decide fetch order from the
fixed prompt.

```javascript
const { Agent, Type, getModel } = require("@alva/pi");

const tools = [
	{
		name: "getOHLCV",
		description: "Get OHLCV candlestick data for a symbol.",
		parameters: Type.Object({
			symbol: Type.String(),
			interval: Type.Optional(Type.String()),
			days: Type.Optional(Type.Number()),
		}),
		execute: async (_id, { symbol, interval, days }) => {
			const { getCryptoKline } = require("@arrays/crypto/ohlcv:v1.0.0");
			const now = Math.floor(Date.now() / 1000);
			const data = getCryptoKline({
				symbol,
				interval: interval || "1d",
				start_time: now - (days || 30) * 86400,
				end_time: now,
			}).response.data;
			return { content: [{ type: "text", text: JSON.stringify(data) }] };
		},
	},
	{
		name: "getNews",
		description: "Search recent news articles.",
		parameters: Type.Object({ query: Type.String() }),
		execute: async (_id, { query }) => {
			const { searchNews } = require("@arrays/data/feed/news:v1.0.0");
			const articles = searchNews({ query, limit: 10 }).response.articles;
			return { content: [{ type: "text", text: JSON.stringify(articles) }] };
		},
	},
];

const agent = new Agent({
	initialState: {
		systemPrompt: "Macro-financial analyst. Gather multiple sources before concluding.",
		model: getModel("openai", "gpt-5.5"),
		tools,
		thinkingLevel: "off",
	},
	getApiKey: () => "jagent-managed",
});

await agent.ask("How is the current rate environment affecting crypto markets?");
```

### Mid-Turn Feed Output

Use a tool to persist intermediate results while alpi runs. Partial results can
survive even if a later turn fails.

```javascript
const { Agent, Type, getModel } = require("@alva/pi");
const { Feed, feedPath, makeDoc, str, num } = require("@alva/feed");

const feed = new Feed({ path: feedPath("sector-scan") });
feed.def("scan", {
	scores: makeDoc("Sector Scores", "Per-sector analysis", [str("sector"), num("score"), str("rationale")]),
});

await feed.run(async (ctx) => {
	const agent = new Agent({
		initialState: {
			systemPrompt: "Analyze each sector. After each, call saveSectorResult.",
			model: getModel("openai", "gpt-5.5"),
			tools: [
				{
					name: "saveSectorResult",
					description: "Store analysis result for one sector.",
					parameters: Type.Object({
						sector: Type.String(),
						score: Type.Number(),
						rationale: Type.String(),
					}),
					execute: async (_id, args) => {
						await ctx.self.ts("scan", "scores").append([{ date: Date.now(), ...args }]);
						return { content: [{ type: "text", text: `saved ${args.sector}` }] };
					},
				},
			],
			thinkingLevel: "off",
		},
		getApiKey: () => "jagent-managed",
	});

	await agent.ask("Score growth outlook 1-10: Technology, Healthcare, Energy, Financials.");
});
```

### Structured Output

Enforce JSON output via `systemPrompt` when downstream code parses the result.
Use positive framing ("MUST begin with `{`") and still parse defensively.

```javascript
function parseJson(s) {
	if (!s) return null;
	const cleaned = s.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
	try {
		return JSON.parse(cleaned);
	} catch {
		const m = cleaned.match(/\{[\s\S]*\}/);
		if (!m) return null;
		try {
			return JSON.parse(m[0]);
		} catch {
			return null;
		}
	}
}

const { message } = await agent.ask(prompt);
const parsed = parseJson(
	message.content
		.filter((block) => block.type === "text")
		.map((block) => block.text)
		.join(""),
);
```

### Timestamp Source for Extracted Records

When alpi extracts records destined for a timeseries column or user-visible card
(news, events, articles, filings, posts), the **content's own date** is part of
the contract - not the crawl time.

- Schema must include `published_at_iso` (ISO 8601 from the source's
  `published_at`/`pubDate`, or an explicit date extracted from the title/summary)
  and `date_confidence` (`source_published_at | extracted_from_summary | unknown`).
- Feed code: `date = Date.parse(it.published_at_iso) || null`. **Never**
  `date: Date.now()` or `now + i` (the 1ms-spread anti-pattern). Put crawl time
  in a separate `crawled_at` field if useful.
- HTML: when `date_confidence === "unknown"` or `date == null`, render
  `Date unknown` - not the crawl date silently labeled as the content's date.

A card showing `$300B - 2026-05-11` for an event that happened a year earlier is
a content-legitimacy violation, not just a UX bug.
