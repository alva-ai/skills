# Altra Trading Engine

Altra is an **event-driven backtesting engine** for quantitative trading
strategies. Strategies are triggered by data events (e.g. when a new OHLCV bar
closes) and execute with stateful context including portfolio, features, and
custom state.

A trading strategy IS a feed: all output data (targets, portfolio, orders,
equity, metrics) lives under a single feed's ALFS path.

**Key principle: All decisions are made at bar CLOSE, not bar OPEN.**

---

## Architecture

Altra consists of four processing stages:

1. **DataGraph** -- Registers OHLCV data, raw external data, and computed
   features (indicators)
2. **SignalEngine** -- Runs your strategy function on each trigger event,
   producing targets (buy/sell signals)
3. **SimEngine** -- Simulates order execution, portfolio management, and position
   tracking
4. **PerfEngine** -- Computes performance metrics (returns, Sharpe, drawdown,
   etc.)

All output is persisted under the feed's ALFS path via the Feed SDK context.

---

## Getting Started: Complete Example

A strategy is organized into modular files:

```
constants.js       # Shared constants (symbol, interval, tick)
raw_data.js        # Raw data sources (optional)
features.js        # Feature definitions (indicators)
strategy.js        # Strategy function (trading logic)
main.js            # Entry point (assembles everything)
```

### constants.js

```javascript
const { FeedAltraModule } = require("@alva/feed");
const { TIME } = FeedAltraModule;

const SYMBOL = "BINANCE_SPOT_BTC_USDT";
const STRATEGY_INTERVAL = "1d";
const TICK = TIME.DAY;

module.exports = { SYMBOL, STRATEGY_INTERVAL, TICK, TIME };
```

### features.js

```javascript
const {
  macd,
} = require("@alva/technical-indicators/moving-average-convergence-divergence-macd:v1.0.0");
const { FeedAltraModule, num } = require("@alva/feed");
const { SYMBOL, STRATEGY_INTERVAL, TICK } = require("./constants.js");

function inRange(t, fromExclusive, toInclusive) {
  return t > fromExclusive && t <= toInclusive;
}

function createMACDFeature() {
  const slowPeriod = 26;

  return {
    name: "macd",
    description: "MACD(12,26,9) on daily closes",
    inputConfig: {
      ohlcvs: [
        {
          id: { pair: SYMBOL, interval: STRATEGY_INTERVAL },
          lookback: { count: slowPeriod - 1 },
        },
      ],
    },
    fields: [num("macd_line", "MACD line"), num("signal_line", "Signal line")],
    fn: (data, { fromExclusive, toInclusive }) => {
      const bars = data.ohlcvs[SYMBOL]?.[STRATEGY_INTERVAL] || [];
      if (bars.length < slowPeriod) return [];

      const closes = bars.map((b) => b.close);
      const m = macd(closes, { fast: 12, slow: 26, signal: 9 });

      const out = [];
      for (let i = 0; i < bars.length; i++) {
        const t = bars[i].endTime ?? bars[i].date + TICK;
        if (!inRange(t, fromExclusive, toInclusive)) continue;
        out.push({
          date: t,
          macd_line: m.macdLine[i],
          signal_line: m.signalLine[i],
        });
      }
      return out;
    },
  };
}

module.exports = { createMACDFeature, inRange };
```

### strategy.js

```javascript
const { SYMBOL, STRATEGY_INTERVAL } = require("./constants.js");

const initialState = { lastSignal: null };

function strategyFn(ctx) {
  const { tick, data, portfolio, state } = ctx;

  const bars = data.ohlcvs[SYMBOL]?.[STRATEGY_INTERVAL] || [];
  if (!bars) throw new Error("OHLCV not found for " + SYMBOL);

  const macdData = data.features["macd"];
  if (!macdData) throw new Error('Feature "macd" not found');

  if (bars.length === 0 || macdData.length < 2) {
    return { target: null, state, logs: "warmup" };
  }

  const currMACD = macdData[macdData.length - 1];
  const prevMACD = macdData[macdData.length - 2];

  const pos = portfolio.positions.find((p) => p.symbol === SYMBOL);
  const hasPosition = pos && pos.qty > 0;

  const bullishCross =
    prevMACD.macd_line <= prevMACD.signal_line &&
    currMACD.macd_line > currMACD.signal_line;
  const bearishCross =
    prevMACD.macd_line >= prevMACD.signal_line &&
    currMACD.macd_line < currMACD.signal_line;

  if (bullishCross && !hasPosition) {
    return {
      target: {
        date: tick,
        instruction: {
          type: "allocate",
          weights: [{ symbol: SYMBOL, weight: 1.0 }],
        },
        meta: { reason: "MACD bullish crossover" },
      },
      state: { ...state, lastSignal: "buy" },
    };
  }

  if (bearishCross && hasPosition) {
    return {
      target: {
        date: tick,
        instruction: {
          type: "allocate",
          weights: [{ symbol: SYMBOL, weight: 0.0 }],
        },
        meta: { reason: "MACD bearish crossover" },
      },
      state: { ...state, lastSignal: "sell" },
    };
  }

  return { target: null, state };
}

module.exports = { strategyFn, initialState };
```

### main.js

```javascript
const { createOHLCVProvider } = require("@arrays/data/ohlcv-provider:v1.0.0");
const { FeedAltraModule } = require("@alva/feed");
const { FeedAltra, e } = FeedAltraModule;

const { SYMBOL, STRATEGY_INTERVAL } = require("./constants.js");
const { createMACDFeature } = require("./features.js");
const { strategyFn, initialState } = require("./strategy.js");

const START_DATE = Date.parse("2025-01-01T00:00:00.000Z");
const END_DATE = Date.now();

const ohlcvProvider = createOHLCVProvider();

const altra = new FeedAltra(
  {
    path: "~/feeds/macd-strategy/v1",
    startDate: START_DATE,
    portfolioOptions: { initialCash: 1_000_000, currency: "USDT" },
    simOptions: { simTick: "1min", feeRate: 0.001 },
    perfOptions: { timezone: "UTC", marketType: "crypto" },
  },
  ohlcvProvider,
);

const dataGraph = altra.getDataGraph();
dataGraph.registerOhlcv(SYMBOL, STRATEGY_INTERVAL);
dataGraph.registerFeature(createMACDFeature());

altra.setStrategy(strategyFn, {
  trigger: { type: "events", expr: e.ohlcv(SYMBOL, STRATEGY_INTERVAL) },
  inputConfig: {
    ohlcvs: [{ id: { pair: SYMBOL, interval: STRATEGY_INTERVAL } }],
    features: [{ id: "macd", lookback: { count: 1 } }],
  },
  initialState,
});

(async () => {
  const result = await altra.run(END_DATE);
})();
```

---

## Imports

Altra is accessed through the `FeedAltraModule` export from `@alva/feed`:

```javascript
const { FeedAltraModule } = require("@alva/feed");
const {
  FeedAltra,
  e,
  Amount,
  TIME,
  num,
  str,
  bool,
  obj,
  arr,
  fld,
  makeDoc,
} = FeedAltraModule;
```

| Export                                    | Description                                      |
| ----------------------------------------- | ------------------------------------------------ |
| `FeedAltra`                               | Main backtesting engine class                    |
| `e`                                       | Event trigger expression builder                 |
| `Amount`                                  | Order amount constructors                        |
| `TIME`                                    | Time constants (SECOND, MINUTE, HOUR, DAY, WEEK) |
| `allocate`                                | Helper to create allocate target                 |
| `order` / `orders`                        | Helper to create order targets                   |
| `num`, `str`, `bool`, `obj`, `arr`, `fld` | Field type helpers (same as Feed SDK)            |
| `makeDoc`                                 | Type document helper                             |

---

## OHLCV Provider

All OHLCV data must come through `createOHLCVProvider()`. Never fabricate price
data.

```javascript
const { createOHLCVProvider } = require("@arrays/data/ohlcv-provider:v1.0.0");
const ohlcvProvider = createOHLCVProvider();

const altra = new FeedAltra(config, ohlcvProvider);
```

**Symbol format**: Use the exact format from the system (e.g.
`"BINANCE_SPOT_BTC_USDT"`, `"XNAS_SPOT_AAPL_USD"`).

---

## Altra Configuration

```javascript
const altra = new FeedAltra(
  {
    path: "~/feeds/my-strategy/v1",
    startDate: Date.parse("2025-01-01T00:00:00Z"),
    portfolioOptions: {
      initialCash: 1_000_000,
      currency: "USDT",
    },
    simOptions: {
      simTick: "1min",
      feeRate: 0.001, // 0.1% per trade
      slippage: 0.0005, // 0.05% slippage
    },
    perfOptions: {
      timezone: "UTC",
      marketType: "crypto", // "crypto", "us_stock", or "mix"
    },
  },
  ohlcvProvider,
);
```

| Field                          | Description                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `path`                         | ALFS feed path (e.g. `'~/feeds/my-strategy/v1'`). All output data stored here.   |
| `startDate`                    | Backtest start timestamp (ms UTC). Use the exact date, never adjust for warmup. |
| `portfolioOptions.initialCash` | Starting cash (default: 1,000,000)                                              |
| `portfolioOptions.currency`    | Quote currency (default: "USDT")                                                |
| `simOptions.simTick`           | Simulation resolution. Must be `"1min"`.                                        |
| `simOptions.feeRate`           | Fee per trade as fraction (e.g. 0.001 = 0.1%)                                   |
| `simOptions.slippage`          | Slippage as fraction                                                            |
| `perfOptions.timezone`         | `"UTC"` for crypto/mix, `"America/New_York"` for us_stock                       |
| `perfOptions.marketType`       | `"crypto"`, `"us_stock"`, or `"mix"` (multi-asset)                              |

### TIME Constants

```javascript
const { TIME } = FeedAltraModule;

TIME.SECOND; // 1,000 ms
TIME.MINUTE; // 60,000 ms
TIME.HOUR; // 3,600,000 ms
TIME.DAY; // 86,400,000 ms
TIME.WEEK; // 604,800,000 ms
```

### Multi-Asset Strategies

When trading both crypto and stocks, use a single FeedAltra instance with
`marketType: "mix"`:

```javascript
const altra = new FeedAltra(
  {
    path: "~/feeds/multi-asset/v1",
    perfOptions: { timezone: "UTC", marketType: "mix" },
    // ...
  },
  ohlcvProvider,
);

dg.registerOhlcv("BINANCE_SPOT_BTC_USDT", "1d");
dg.registerOhlcv("XNAS_SPOT_AAPL_USD", "1d");
await altra.run(endDate);
```

---

## DataGraph

The DataGraph manages all data sources: OHLCV price data, raw external data, and
computed features.

```javascript
const dataGraph = altra.getDataGraph();
```

### Register OHLCV

```javascript
dataGraph.registerOhlcv("BINANCE_SPOT_BTC_USDT", "1d");
dataGraph.registerOhlcv("BINANCE_SPOT_ETH_USDT", "1h");
```

Register each symbol/interval pair your features and strategy need.

### Register Features

A **feature** is a computed indicator or derived data point that transforms raw
data into signals. Features are the middle layer between raw data and trading
decisions.

```javascript
dataGraph.registerFeature({
  name: "rsi",
  description: "14-period RSI",
  inputConfig: {
    ohlcvs: [{ id: { pair: SYMBOL, interval: "1d" }, lookback: { count: 13 } }],
  },
  fields: [num("value", "RSI value")],
  fn: (data, { fromExclusive, toInclusive }) => {
    const bars = data.ohlcvs[SYMBOL]?.["1d"] || [];
    if (bars.length < 14) return [];

    const closes = bars.map((b) => b.close);
    const rsiValues = indicators.rsi(closes, 14);

    const out = [];
    for (let i = 0; i < bars.length; i++) {
      const t = bars[i].endTime ?? bars[i].date + TICK;
      if (t <= fromExclusive || t > toInclusive) continue;
      out.push({ date: t, value: rsiValues[i] });
    }
    return out;
  },
});
```

**Feature function requirements**:

1. **Lookback**: Use `{ count: period - 1 }` for count-based (RSI 14 needs
   `{ count: 13 }`) or `{ duration: N * TICK }` for duration-based
2. **Time filtering**: Return ONLY records in `(fromExclusive, toInclusive]`
3. **Data ordering**: Chronological (oldest first)
4. **Access pattern**: Use bracket notation --
   `data.ohlcvs["PAIR"]?.["interval"]`, `data.features["name"]`,
   `data.raws["name"]`
5. **PIT compliance**: Feature at time T must use only data from before or at T.
   Use `bar.endTime` (not `bar.date`) as the output timestamp

**Feature depending on another feature**:

```javascript
dataGraph.registerFeature({
  name: "price_ma_ratio",
  inputConfig: {
    ohlcvs: [{ id: { pair: SYMBOL, interval: "1d" }, lookback: 0 }],
    features: [{ id: "sma_20" }],
  },
  fields: [num("ratio")],
  fn: (data) => {
    const bars = data.ohlcvs[SYMBOL]?.["1d"] || [];
    const sma = data.features["sma_20"] || [];
    return sma.map((s, i) => ({
      date: s.date,
      ratio: bars[i].close / s.value,
    }));
  },
});
```

**Multi-pair features**: Create separate features per symbol:

```javascript
const symbols = ["BINANCE_SPOT_BTC_USDT", "BINANCE_SPOT_ETH_USDT"];
for (const symbol of symbols) {
  const ticker = symbol.split("_")[2];
  dataGraph.registerFeature({
    name: `rsi_${ticker}`,
    inputConfig: {
      ohlcvs: [
        { id: { pair: symbol, interval: "1d" }, lookback: { count: 13 } },
      ],
    },
    fields: [num("rsi")],
    fn: (data) => {
      /* compute RSI for this symbol */
    },
  });
}
```

**Event-based features** (earnings, disclosures): Must output for EVERY bar, not
just event days. Otherwise strategy with lookback sees stale data.

```javascript
const out = [];
for (const bar of bars) {
  const t = bar.endTime ?? bar.date + TICK;
  if (!inRange(t, fromExclusive, toInclusive)) continue;
  out.push({
    date: t,
    is_event: eventSet.has(t),
    value: eventMap.get(t) ?? null,
  });
}
```

### Register Raw Data

Raw data sources provide external data beyond OHLCV (funding rates, open
interest, on-chain metrics, sentiment).

```javascript
const { getOpenInterest } = require("@arrays/crypto/open-interest:v1.0.0");

dataGraph.registerRawData({
  name: "btc_open_interest",
  description: "BTC perpetual futures open interest",
  fields: [num("sumOpenInterest"), num("sumOpenInterestValue")],
  fn: (fromExclusive, toInclusive) => {
    const result = getOpenInterest({
      symbol: "BINANCE_PERP_BTC_USDT",
      start_time: fromExclusive,
      end_time: toInclusive,
      interval: "1d",
    });

    if (!result.success) {
      throw new Error("getOpenInterest failed: " + JSON.stringify(result));
    }

    return {
      data: result.response.data.map((d) => ({
        date: d.observedAt, // MUST use observedAt for PIT safety
        sumOpenInterest: d.sumOpenInterest,
        sumOpenInterestValue: d.sumOpenInterestValue,
      })),
    };
  },
});
```

**Raw data PIT rule**: Always use `observedAt` as the `date` field. This is the
only PIT-safe timestamp -- it represents when the data became available, not
when the event occurred.

---

## Strategy

### setStrategy(fn, config)

```javascript
altra.setStrategy(strategyFn, {
  trigger: { type: "events", expr: e.ohlcv(SYMBOL, "1d") },
  inputConfig: {
    ohlcvs: [{ id: { pair: SYMBOL, interval: "1d" } }],
    features: [{ id: "rsi" }, { id: "macd", lookback: { count: 1 } }],
    raws: [{ id: "btc_open_interest", lookback: { count: 5 } }],
  },
  initialState: { lastSignal: null },
});
```

### Event Triggers

Triggers fire at bar CLOSE (when the bar is complete).

```javascript
const { e } = FeedAltraModule;

e.ohlcv("BINANCE_SPOT_BTC_USDT", "1d"); // Daily bar close
e.raw("sentiment_score"); // Raw data update
e.feature("rsi"); // Feature computed

e.all(e.ohlcv("AAPL", "1d"), e.ohlcv("BTCUSDT", "1d")); // AND
e.any(e.ohlcv("BTCUSDT", "1h"), e.raw("funding")); // OR
```

### Strategy Config

```javascript
{
  trigger: {
    type: "events",
    expr: EventExpr,   // e.ohlcv(), e.raw(), e.all(), e.any()
    delay: number,     // optional ms delay after event
  },
  inputConfig: {
    ohlcvs: [{ id: { pair, interval }, lookback?: LookbackOptions }],
    features: [{ id: string, lookback?: LookbackOptions }],
    raws: [{ id: string, lookback?: LookbackOptions }],
  },
  initialState: TState,
}
```

**LookbackOptions**: `{ count: number }` or `{ duration: number }` (in ms).

### Strategy Function

```javascript
function strategyFn(ctx) {
  const { tick, data, portfolio, state } = ctx;

  // Access data with bracket notation
  const bars = data.ohlcvs["BINANCE_SPOT_BTC_USDT"]?.["1d"] || [];
  const rsiData = data.features["rsi"] || [];
  const oiData = data.raws["btc_open_interest"] || [];

  // Portfolio snapshot
  const cash = portfolio.cash;
  const positions = portfolio.positions; // [{symbol, qty}, ...]

  // Return: target (or null) + updated state
  return {
    target: null, // or a Target object
    state: newState, // must always return updated state
    logs: "optional debug string",
  };
}
```

**Defensive programming**:

- Throw errors for unexpected conditions (missing data sources, invalid formats)
- Return `{ target: null, state }` for expected no-signal conditions (warmup, no
  trigger)

```javascript
const bars = data.ohlcvs[SYMBOL]?.["1d"];
if (!bars)
  throw new Error("OHLCV not found -- check registerOhlcv and inputConfig");
if (bars.length === 0) return { target: null, state }; // warmup
```

### Understanding Lookback

**Feature lookback** and **strategy lookback** are independent:

| Type              | Where Set                | Controls                                                    |
| ----------------- | ------------------------ | ----------------------------------------------------------- |
| Feature lookback  | Feature's `inputConfig`  | How many bars the feature function receives for computation |
| Strategy lookback | Strategy's `inputConfig` | How many feature outputs the strategy function sees         |

**Quick reference**:

- RSI(14): Feature lookback `{ count: 13 }`
- SMA(20): Feature lookback `{ count: 19 }`
- MACD(12,26,9): Feature lookback `{ count: 25 }`
- Crossover detection: Strategy lookback `{ count: 1 }` (see 2 values: current +
  previous)
- Current value only: Omit lookback (default 0 = see 1 value)

**Never adjust `startDate` for warmup**: Use `lookback` in feature/strategy
`inputConfig` instead.

---

## Target / Signal Structure

Targets tell the SimEngine what to do. One signal per tick maximum.

### Weight-Based Allocation

Set target portfolio weights. SimEngine calculates and executes the needed
trades.

```javascript
{
  date: tick,
  instruction: {
    type: "allocate",
    weights: [
      { symbol: "BINANCE_SPOT_BTC_USDT", weight: 0.6 },
      { symbol: "BINANCE_SPOT_ETH_USDT", weight: 0.4 },
    ],
  },
  meta: { reason: "Rebalance: BTC 60%, ETH 40%" },
}
```

**Weight values**:

| Weight | Meaning                     |
| ------ | --------------------------- |
| `0`    | Sell entire position (exit) |
| `0.5`  | 50% of equity in this asset |
| `1.0`  | 100% long (fully invested)  |
| `-1.0` | 100% short                  |
| `2.0`  | 200% long (2x leverage)     |

- Missing symbols are left unchanged (not sold)
- If weights sum to < 1.0, remainder stays as cash
- Long positions with same weight are idempotent (no trade)
- Short positions compound (NOT idempotent)

### Order-Based Execution

Execute specific buy/sell orders with precise amounts.

```javascript
{
  date: tick,
  instruction: {
    type: "orders",
    orders: [
      { symbol: "BINANCE_SPOT_BTC_USDT", side: "buy", amount: Amount.quote(100) },
    ],
  },
  meta: { reason: "DCA: buying $100 of BTC" },
}
```

### Amount Types

```javascript
const { Amount } = FeedAltraModule;

Amount.base(0.5); // 0.5 units of base asset (e.g. 0.5 BTC)
Amount.quote(100); // $100 worth
Amount.ofCash(0.5); // 50% of available cash (buy/short only)
Amount.ofPosition(0.5); // 50% of current position (sell only)
```

### Composite Targets

Combine orders and weights in one target. Orders execute first, then weights
apply to the updated portfolio.

```javascript
{
  date: tick,
  instruction: {
    type: "allocate",
    weights: [{ symbol: SYMBOL, weight: 0.8 }],
    orders: [{ symbol: SYMBOL, side: "buy", amount: Amount.quote(100) }],
  },
  meta: { reason: "Rebalance to 80% + DCA $100" },
}
```

---

## Running the Backtest

`run()` is async and returns a `Promise<RunResult>`:

```javascript
(async () => {
  const result = await altra.run(END_DATE);
})();
```

The `RunResult` contains:

- `numTicks` -- Number of strategy activations
- `targets` -- All generated targets (buy/sell signals)
- `orders` -- All executed orders with fill details
- `perf` -- Performance metrics (total return, Sharpe ratio, max drawdown, etc.)

All output data is also persisted under the feed's ALFS path (quote in CLI, e.g. `'~/feeds/my-strategy/v1/data/'`):

```
~/feeds/my-strategy/v1/data/
├── signal/targets          -- Target records
├── sim/portfolio           -- Portfolio snapshots
├── sim/orders              -- Order/fill records
├── perf/equity             -- Equity curve
└── perf/metrics            -- Performance report
```

---

## Point-In-Time (PIT) Compliance

PIT means: a feature at time T must use ONLY data available at or before T.

**OHLCV bars** have two timestamps:

- `bar.date` = bar START (open time)
- `bar.endTime` = bar CLOSE (when the bar is complete)

An indicator computed from `bar.close` is NOT available at `bar.date`. It
becomes available at `bar.endTime`.

```javascript
// WRONG -- look-ahead bias
return bars.map((bar, i) => ({ date: bar.date, value: indicator[i] }));

// CORRECT -- PIT compliant
return bars.map((bar, i) => ({
  date: bar.endTime ?? bar.date + TICK,
  value: indicator[i],
}));
```

**Raw data**: Use `observedAt` (when data became available), not `eventTime` or
calculated timestamps.

---

## Common Patterns

### State Counters

Track strategy state for multi-bar logic:

```javascript
const initialState = { signal: 0, entry_time: null, entry_price: null };

function strategyFn(ctx) {
  const { tick, data, state } = ctx;
  let next = { ...state };
  let target = null;

  const inPos = state.signal !== 0;

  if (!inPos && enterCondition) {
    next.signal = 1;
    next.entry_time = tick;
    next.entry_price = currentClose;
    target = {
      date: tick,
      instruction: {
        type: "allocate",
        weights: [{ symbol: SYMBOL, weight: 1.0 }],
      },
    };
  }

  if (inPos) {
    const timeExit =
      state.entry_time != null && tick - state.entry_time >= 60 * TIME.MINUTE;
    if (timeExit) {
      next = { signal: 0, entry_time: null, entry_price: null };
      target = {
        date: tick,
        instruction: {
          type: "allocate",
          weights: [{ symbol: SYMBOL, weight: 0 }],
        },
      };
    }
  }

  return { target, state: next };
}
```

### Fixed-Duration Exits

Store `entry_time` and check `tick - entry_time >= duration`:

```javascript
if (state.entry_time != null && tick - state.entry_time >= 7 * TIME.DAY) {
  // Exit after 7 days
}
```

### Initial State

Only track strategy decision logic. Altra manages portfolio, trades, and metrics
automatically.

```javascript
// CORRECT
const initialState = { lastSignal: null, entry_time: null };

// WRONG -- Altra manages these
const initialState = { capital: 1_000_000, trades: [], totalPnL: 0 };
```

---

## Data Access Patterns

All data in strategy context uses bracket notation (plain objects):

```javascript
// OHLCV
const bars = data.ohlcvs["BINANCE_SPOT_BTC_USDT"]?.["1d"] || [];
const latestBar = bars[bars.length - 1];

// Features
const rsiData = data.features["rsi"] || [];
const latest = rsiData[rsiData.length - 1];

// Raw data
const fundingData = data.raws["funding_rate"] || [];
const latestFunding = fundingData[fundingData.length - 1];

// Portfolio
const cash = portfolio.cash;
const btcPos = portfolio.positions.find((p) => p.symbol === SYMBOL);
const btcQty = btcPos ? btcPos.qty : 0;
```

**Data availability**: With event-driven triggers, the strategy only runs when
data arrives. Holidays/weekends are naturally skipped (no bar = no trigger).

---

## Testing Strategies

Use `@test/suite` for unit testing strategy components.

### Testing Features

```javascript
const { describe, it, expect, runTests } = require("@test/suite:v1.0.0");
const { SYMBOL, INTERVAL, TICK } = require("./constants.js");
const { discountFeatureFn } = require("./features.js");

function createMockBars(count, basePrice, startTime) {
  return Array.from({ length: count }, (_, i) => ({
    date: startTime + i * TICK,
    endTime: startTime + (i + 1) * TICK,
    open: basePrice,
    high: basePrice + 500,
    low: basePrice - 500,
    close: basePrice - i * 1000,
    volume: 1000,
  }));
}

describe("Feature: discount_30d", () => {
  it("returns empty when insufficient bars", () => {
    const mockData = {
      ohlcvs: {
        [SYMBOL]: { [INTERVAL]: createMockBars(29, 100000, 1733011200000) },
      },
    };
    const result = discountFeatureFn(mockData, {
      fromExclusive: 0,
      toInclusive: Infinity,
    });
    expect(result.length).toBe(0);
  });
});

runTests({ verbose: true });
```

### Testing Strategy Logic

```javascript
const { describe, it, expect, runTests } = require("@test/suite:v1.0.0");
const { SYMBOL, INTERVAL, TICK } = require("./constants.js");
const { strategyFn, initialState } = require("./strategy.js");

function createMockCtx(overrides) {
  return {
    tick: 1733097600000,
    data: {
      ohlcvs: {
        [SYMBOL]: {
          [INTERVAL]: [
            { date: 1733011200000, endTime: 1733097600000, close: 90000 },
          ],
        },
      },
      features: {
        macd: [
          { date: 1733011200000, macd_line: 3, signal_line: 4 },
          { date: 1733097600000, macd_line: 5, signal_line: 4 },
        ],
      },
      raws: {},
    },
    portfolio: { positions: [], cash: 1000000 },
    state: { ...initialState },
    ...overrides,
  };
}

describe("Strategy Logic", () => {
  it("enters on bullish MACD crossover", () => {
    const ctx = createMockCtx();
    const result = strategyFn(ctx);
    expect(result.target).not.toBe(null);
    expect(result.target.instruction.weights[0].weight).toBe(1.0);
  });
});

runTests({ verbose: true });
```

### Testing Raw Data

Use factory functions with injectable fetchers:

```javascript
function createFundingRateRawData(options) {
  const { fetcher = getFundingRate } = options;
  return {
    name: "funding_rate",
    fn: (fromExclusive, toInclusive) => {
      const res = fetcher({
        /* params */
      });
      // ...
    },
  };
}

// In test:
const mockFetcher = () => ({ success: true, response: { data: mockData } });
const rawDataConfig = createFundingRateRawData({ fetcher: mockFetcher });
```

### Test Execution

```javascript
runTests({
  verbose: true,
  timeout: 60000, // ms, default 30000
});
```

---

## Debug Guide

### Common Errors

| Error                      | Cause                                | Fix                                                       |
| -------------------------- | ------------------------------------ | --------------------------------------------------------- |
| OHLCV empty in strategy    | Not in `inputConfig.ohlcvs`          | Add to strategy's `inputConfig.ohlcvs`                    |
| OHLCV empty in feature fn  | Insufficient lookback                | Increase feature's `inputConfig.ohlcvs[].lookback`        |
| Feature not found          | Not registered or not in inputConfig | Add `registerFeature()` and add to `inputConfig.features` |
| Feature empty array        | Strategy can't see outputs           | Increase strategy's `inputConfig.features[].lookback`     |
| Duplicate dates in feature | Same timestamp pushed twice          | Ensure one output per unique date                         |
| State not updating         | Missing state return                 | Always return `{ target, state: newState }`               |

### PIT Compliance Checklist

- Feature output uses `bar.endTime` (NOT `bar.date`)
- Indicator computed from `closes[i]` is available at bar CLOSE, not bar START
- Strategy triggers fire when bar CLOSES
- Raw data uses `observedAt` as date field
