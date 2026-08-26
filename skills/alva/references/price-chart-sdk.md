# Automation Price Chart SDK

Use `@alva/price-chart-sdk` when an Automation explicitly needs to publish a
standard time-based price chart on each successful run. The SDK does not fetch
market data. The Automation fetches and validates the price snapshot, then
queues the chart for trusted backend publication.

```javascript
const {
  PRICE_CHART_SCHEMA_VERSION,
  enqueuePriceChartPublication,
} = require("@alva/price-chart-sdk");

enqueuePriceChartPublication({
  source: "market/brief",
  spec: {
    schemaVersion: PRICE_CHART_SCHEMA_VERSION,
    title: "NVDA hourly price",
    ticker: "NVDA",
    dataAsOfMs,
    series: { type: "candlestick", data: resolvedOhlc },
    viewToggle: { enabled: true, initialView: "area" },
  },
});
```

`source` must be the same canonical `group/output` declared with
`alertOutput()` for the corresponding Feed record. Do not create a separate
chart identifier.

## Price Snapshot

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
- Intraday `time` is Unix seconds; daily `time` is `YYYY-MM-DD`. Use one time
  representation per series and do not include points after `dataAsOfMs`.
- `viewToggle` requires OHLC data. Its Area view is derived from close prices.
- Use enough legitimate market-data points for the requested interval; do not
  invent or interpolate financial values.

The call returns `{ source }` during script execution. After a successful run,
the backend publishes the HTML and captures the preview, producing:

```typescript
{
  source: string,
  previewUrl: string,
  publishedUrl: string
}
```

FeedItem assembly joins this result to the corresponding Feed record by
`source`. The Automation does not provide publication credentials or call the
chart publishing and screenshot services directly.
