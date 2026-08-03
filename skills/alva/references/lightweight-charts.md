# TradingView Lightweight Charts For One-Off Artifacts

Use **TradingView Lightweight Charts** for a one-off chat artifact whose main
view is OHLC, candlestick, price-volume, or technical analysis. Use **Lightweight
Charts** thereafter. Keep ECharts for other chart types and for Playbooks unless
the user explicitly asks otherwise.

## Load The Standalone v5 Build

One-off artifacts are plain HTML without a bundler. Use the pinned standalone
build; it exposes `window.LightweightCharts`:

```html
<script src="https://cdn.jsdelivr.net/npm/lightweight-charts@5.2.0/dist/lightweight-charts.standalone.production.js"></script>
```

Do not use a floating version. The snippets below target v5 only:

```js
const chart = LightweightCharts.createChart(container, {
  autoSize: true,
});

const candles = chart.addSeries(LightweightCharts.CandlestickSeries, {}, 0);
const movingAverage = chart.addSeries(LightweightCharts.LineSeries, {}, 0);
const volume = chart.addSeries(
  LightweightCharts.HistogramSeries,
  { priceFormat: { type: "volume" } },
  1,
);
```

Never copy v4 APIs such as `chart.addCandlestickSeries()`,
`chart.addLineSeries()`, or `series.setMarkers()`. If markers are needed, use
`LightweightCharts.createSeriesMarkers(series, markers)`.

## Data Contract

- Inline the already-resolved one-off data in the HTML.
- Sort every series strictly ascending by `time` and remove duplicate times.
- Unix timestamps are seconds, not milliseconds. Convert with
  `Math.floor(milliseconds / 1000)` when needed.
- Use one time representation per series: Unix seconds or `YYYY-MM-DD`, never a
  mixture.
- For a static artifact, call `setData()` once for each series, then
  `chart.timeScale().fitContent()`. Realtime `update()` loops are out of scope.
- Put volume in pane `1` and give that pane an explicit, compact height when it
  exists: `chart.panes()[1].setHeight(100)` (adjust to the artifact height).

## Technical Overlays

Use normal series for indicators such as EMA/SMA. Use `createPriceLine()` for
support, resistance, stop, target, and other horizontal levels; its axis label
produces the TradingView-style price badge.

```js
candles.createPriceLine({
  price: 128,
  color: "#2bb3a3",
  lineWidth: 1,
  lineStyle: LightweightCharts.LineStyle.Solid,
  axisLabelVisible: true,
  title: "Buy above",
});
```

For shaded price zones, use a canvas overlay or a pane/series primitive when
necessary. Convert values with public APIs such as `series.priceToCoordinate()`
and `chart.timeScale().timeToCoordinate()`; never infer price or time from DOM
or canvas geometry. Redraw overlays after resize and visible-range changes.

## Layout And Completion

- Give the chart container an explicit responsive height. `autoSize: true`
  handles width/height changes when `ResizeObserver` is available; otherwise
  observe the container and call `chart.resize(width, height)`.
- A one-off financial chart may use a solid light or dark plot background to
  match the native financial-chart surface. This exception does not change the
  dotted Chart Card background required for Playbooks and other ECharts charts.
- Keep Alva's compact card framing, typography, source/as-of note, and required
  `.alva-watermark`. Keep the library's default TradingView logo visible.
- Lightweight Charts has no ECharts `finished` event. After every `setData()`
  call has completed and `fitContent()` has run, call
  `reportAlvaChartHeight()`. Call it again from the resize observer.

## Review Before Publish

Before finalizing the artifact, verify that:

1. Candles, indicators, levels, zones, and volume use the intended scales and
   panes, with no clipped axis badges.
2. Data is visible after `fitContent()` and remains visible after a resize.
3. Both the Alva watermark and the library's default TradingView logo remain
   visible.
4. The existing one-review publish flow reports no relevant runtime error and
   the preview image is visually complete.
