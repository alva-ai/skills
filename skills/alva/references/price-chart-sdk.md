# Automation Price Chart SDK

Use `@alva/price-chart-sdk` only when a deployed Automation/Feed producer is
explicitly designed to publish a standard time-based price chart on each run.
Do not add charts to Automations by default.

The SDK is deterministic infrastructure, not an Agent. It does not fetch market
data, write Feed rows, run screenshot review loops, or decide whether a chart is
needed. The Automation resolves legitimate price data first, calls the SDK, and
decides how to store or deliver the returned URLs. Do not call
`@alva/automation-chart` directly or hand-write chart HTML for this route.

## Business Input

Pass one already-resolved immutable snapshot:

```typescript
{
  schemaVersion: PRICE_CHART_SCHEMA_VERSION,
  title: string,
  ticker: string,
  dataAsOfMs: number,
  series:
    | { type: "area" | "line"; data: { time: number | string, value: number }[] }
    | { type: "candlestick"; data: { time: number | string, open: number, high: number, low: number, close: number }[] },
  levels?: { label: string, price: number, color?: string }[],
  viewToggle?: { enabled: boolean, initialView?: "area" | "candlestick" }
}
```

- `dataAsOfMs` is epoch milliseconds.
- Intraday `time` is Unix seconds; daily `time` is `YYYY-MM-DD`. Use one
  representation per series and never include a point after `dataAsOfMs`.
- `viewToggle` requires candlestick OHLC input. The Area view derives close
  values; `initialView` is the preview image view.
- Financial values must come from Data Skills, a Feed, or validated BYOD data.
  The generated HTML template is fixed; the Agent must not write financial
  values or chart HTML from memory.

## Publication Input

`publishPriceChart()` also needs platform-owned publication context:

| Field            | Source / rule                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `endpoint`       | Current environment's chart publication endpoint. Use explicit runtime/platform configuration; do not guess an environment.                                                     |
| `http`           | A `postJson(url, body, headers)` adapter over `require("net/http")`.                                                                                                            |
| `headers`        | Platform authentication such as `X-Alva-Api-Key`; load it from runtime configuration/Secret Manager, never inline or log it.                                                    |
| `origin`         | `{ kind: "automation", ownerUserId, channelId, feedId?, cronjobRunId?, outputRowId? }`. Owner and channel are required and must come from the authenticated Automation context. |
| `idempotencyKey` | Stable per logical chart output. A retry of the same output reuses the same key; multiple charts use distinct keys.                                                             |

Minimal jagent adapter shape:

```javascript
const {
  PRICE_CHART_SCHEMA_VERSION,
  publishPriceChart,
} = require("@alva/price-chart-sdk");
const env = require("env");
const netHttp = require("net/http");
const secrets = require("secret-manager");

function jsonClient(http) {
  return {
    async postJson(url, body, headers) {
      const response = await http.fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Chart publication failed: HTTP ${response.status}`);
      }
      return JSON.parse(text);
    },
  };
}

(async () => {
  const args = env.args || {};
  const ticker = resolvedTicker;
  const dataAsOfMs = resolvedDataAsOfMs;
  const channelId = String(args.channelId || "");
  const endpoint = String(args.chartEndpoint || "");
  const apiKey = await secrets.loadPlaintext(
    args.chartApiKeySecretName || "ALVA_API_KEY",
  );
  if (!channelId || !endpoint || !apiKey) {
    throw new Error("Missing chart publication context");
  }

  const outputRowId = [
    "price-chart",
    args.feedId || channelId,
    args.chartSlot || ticker,
    String(dataAsOfMs),
  ].join(":");

  return publishPriceChart({
    endpoint,
    http: jsonClient(netHttp),
    headers: { "X-Alva-Api-Key": apiKey },
    idempotencyKey: outputRowId,
    origin: {
      kind: "automation",
      ownerUserId: String(env.userId),
      channelId,
      ...(args.feedId ? { feedId: String(args.feedId) } : {}),
      ...(args.cronjobRunId ? { cronjobRunId: String(args.cronjobRunId) } : {}),
      outputRowId,
    },
    spec: {
      schemaVersion: PRICE_CHART_SCHEMA_VERSION,
      title: ticker,
      ticker,
      dataAsOfMs,
      series: { type: "candlestick", data: resolvedOhlc },
      viewToggle: { enabled: true, initialView: "area" },
    },
  });
})();
```

`resolvedTicker`, `resolvedDataAsOfMs`, and `resolvedOhlc` stand for data
already fetched and validated by the Automation; they are not literals to copy.

## Result Contract

```typescript
{
  artifactId: string,
  previewUrl?: string,
  publishedUrl: string
}
```

- `previewUrl` is a static image without the Area/Candles toggle. It is optional
  because HTML publication may succeed when screenshot capture fails.
- `publishedUrl` already includes `interactive=1`; pass it directly to an iframe
  or Native WebView. Do not rewrite it in the client.
- The interactive artifact fills its iframe/WebView and shows the toggle when
  enabled. The SDK does not implement Feed cards, click handlers, or modals.
- Do not fabricate either URL or fall back to embedding generated HTML in a Feed
  output when publication fails.
