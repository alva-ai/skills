# Altra Trading Engine

Altra is Alva's backtest and live-strategy engine. Use `@alva/altra2` for every new
backtest, portfolio simulation, signal, rebalance or order-logic strategy. One strategy
definition runs both as a backtest and as a live strategy that persists its decisions, orders
and equity to a Feed. Do not hand-roll trading loops: they easily introduce look-ahead bias.

altra2 covers US, Hong Kong, Shanghai/Shenzhen and Korea equities and crypto spot and
perpetuals on Binance and Hyperliquid.

> **v1 is deprecated.** `FeedAltra` (`require("@alva/feed").FeedAltraModule`, or `@alva/altra`)
> is legacy. Do not use it for new strategies. Read
> [altra-v1-legacy.md](altra-v1-legacy.md) only to read, maintain or debug an existing v1
> script or Feed. Existing v1 Automations keep running and need no migration; migrate one only
> when the user asks, using [Coming from v1](#coming-from-v1).

Altra simulates; it never places real orders. For live account queries and orders, also read
[api/trading.md](api/trading.md) or [api/broker.md](api/broker.md).

## Fix the Research Contract First

Before writing code, define:

- The research question, evaluation metrics, exact signal definition, asset universe and its
  membership rules, canonical instruments, venues, currencies, sessions and time zones.
- Fixed start and end dates, train/validation/out-of-sample splits, rebalance events, and
  bar intervals.
- Benchmark and return definition, initial capital, long-only or signed exposure, leverage,
  per-asset limits.
- Fees, slippage, trading rules (`market` or `ideal`), and policies for missing data and halts.
- Source, coverage and availability time of every non-bar input. Obtain data according to
  [data-skills.md](data-skills.md).

Do not change the sample, benchmark or cost assumptions after seeing interim results. If
searching parameters, define the search space and selection rule in advance and keep every
trial; do not report only the best one. Give each trial its own Feed path.

## Resolve Trading Pairs Before Backtesting

altra2 accepts only Alva's canonical trading pairs (`VENUE_CONTRACT_BASE_QUOTE`): the
exact `tradingPair` the CLI returns. Never construct one from a ticker, a company name or an
exchange alias.

Use the `alva trading-pairs` CLI to resolve trading pairs before writing a
strategy. Run `alva trading-pairs --help` for its search and resolve commands.

```bash
alva trading-pairs search --symbol NVDA --market US --instrument-type spot --json
alva trading-pairs resolve --symbol 0700 --market HK --instrument-type spot --quote HKD --json
alva trading-pairs resolve --symbol BTC --market BINANCE --instrument-type perp --json
```

| Market            | Example code                                                  | Symbol to search             | Session (local)              |
| ----------------- | ------------------------------------------------------------- | ---------------------------- | ---------------------------- |
| US equities, ETFs | `US_SPOT_NVDA_USD`                                            | `NVDA`                       | 09:30–16:00 America/New_York |
| Hong Kong         | `HK_SPOT_0700_HKD`                                            | `0700` (4 digits; not `700`) | 09:30–16:00 Asia/Hong_Kong   |
| Shanghai/Shenzhen | `SS_SPOT_600519_CNY`, `SZ_SPOT_000001_CNY`                    | `600519`, `000001`           | 09:30–15:00 Asia/Shanghai    |
| Korea             | `KS_SPOT_005930_KRW` (KOSPI), `KQ_SPOT_293490_KRW` (KOSDAQ)   | `005930`                     | 09:00–15:30 Asia/Seoul       |
| Crypto            | `BINANCE_SPOT_BTC_USDT`, `BINANCE_PERP_BTC_USDT`, `HYPERLIQUID_PERP_BTC_USDC` | `BTC` | 24/7; daily bars close 00:00 UTC |

- Search takes the venue's own symbol, not a company name. Map a name to its ticker first
  (for example with [data-skills.md](data-skills.md)), then search.
- Multiple candidates are normal: `BTC` matches a US ETF, Binance spot and perp, Hyperliquid
  and more. Filter by `--market`, `--instrument-type` and `--quote`; `resolve` requires exactly
  one. Zero or several matches after filtering is a blocking ambiguity, not permission to take
  the first.
- Copy the returned `tradingPair` unchanged into `universe`, commands and inputs. Existing
  holdings keep their stored pair.
- A pair on another venue (`NZ_...`) or an option is a real trading pair that altra2 does not
  trade: the run returns `instrument_unsupported`.
- If a run returns `instrument_not_canonical`, its message contains guesses built from the
  text. They are hints, not lookups; search again and use what the CLI returns.

The lookup proves naming and catalog membership, not OHLCV availability. Before the full-range
backtest, run Altra with the selected symbol over a bounded smoke window that covers the
maximum feature lookback. Require at least one real OHLCV bar and no provider error (the run
is `complete` and `gaps` is empty) before expanding to the requested range.

## How a Run Works

The engine walks one timeline of instants (bar opens and closes, schedule ticks, external
events, valuation times). At each instant it confirms resting orders, runs `decide` if a
trigger fired, admits the returned commands, matches orders at bars that open now, and records
equity at the valuation time.

- **Decide at a close, fill at the next open.** An order decided at `t` fills at its
  instrument's first bar opening at or after `t`. A US daily decision fills at the next
  session's 09:30 open. Legs on different venues fill at their own opens.
- **No look-ahead.** `decide` sees only bars with `closeAt <= now`. An open bar is invisible,
  including its open price.
- **One `decide` call per instant**, even when several triggers fire; `ctx.triggers` lists them.
- **Reproducible when your functions are.** With deterministic `decide` and feature functions,
  the same strategy, data and options always produce the same records.

## A Complete Backtest

Run it as cloud JavaScript with `alva run --local-file <path>`
([jagent-runtime.md](jagent-runtime.md)). Bars come from Alva's data relay; nothing needs to be
wired up.

```javascript
const { defineStrategy, allocate, run } = require("@alva/altra2");
const { indicators } = require("@alva/algorithm");

const SPY = "US_SPOT_SPY_USD"; // from alva trading-pairs
const TLT = "US_SPOT_TLT_USD";

const strategy = defineStrategy({
  name: "spy-tlt-trend",
  revision: "1",
  universe: [SPY, TLT],
  features: {
    sma200: { from: "close", lookback: 199, fn: (c) => indicators.sma(c, { period: 200 }) },
  },
  trigger: { kind: "schedule", every: "month-start", at: { timeZone: "America/New_York", hour: 17 } },
  decide: (ctx) => {
    const close = ctx.bars(SPY).last()?.close;
    const sma = ctx.features(SPY).sma200.last();
    if (close === undefined || sma === undefined)
      return { kind: "decided", commands: [], reason: "warm-up" };
    const risk = close > sma;
    return {
      kind: "decided",
      commands: [allocate(risk ? { [SPY]: 0.6, [TLT]: 0.4 } : { [TLT]: 1 })],
      reason: `SPY ${close.toFixed(2)} vs SMA200 ${sma.toFixed(2)}`,
    };
  },
});

(async () => {
  const r = await run({
    strategy,
    range: { from: "2018-01-01", to: "2025-12-31" }, // (from, to]
    sim: { initialCash: 100_000, feeBps: 2, slippageBps: 5 },
  });
  if (r.status !== "complete") return r; // invalid / not_ready / failed: read issues, reason, error
  const fills = r.records.orderEvents.filter((e) => e.kind.startsWith("filled"));
  return {
    metrics: r.metrics,
    decisions: r.records.decisions.length,
    fills: fills.length,
    rejected: r.records.decisions.flatMap((d) => d.outcomes).filter((o) => o.status === "rejected"),
    gaps: r.gaps.slice(0, 20),
    lastDecisions: r.records.decisions.slice(-5),
  };
})();
```

- **Return a summary, not `records`.** Records and features of a long run are large.
- **History before `from`** for features and inputs is fetched automatically. Never move
  `startDate`/`from` earlier for warm-up.
- **Execution limits.** One call has a time and memory limit. For large universes over long
  histories, build a stored run over several calls with increasing `until`.

## Defining a Strategy

`defineStrategy(spec)` returns the spec unchanged.

| Field       | Required     | Meaning |
| ----------- | ------------ | ------- |
| `name`      | yes          | A label. |
| `revision`  | with a store | Version of the logic. Bump it whenever code, captured parameters or the meaning of `state` change. |
| `universe`  | yes          | Every instrument the strategy may trade or read: canonical codes, a static list. For index membership or ranking, list the candidates and filter in `decide`. |
| `execution` | no           | Matching interval per instrument, e.g. `{ US_SPOT_NVDA_USD: "1h" }`. Default `"1d"`. Intervals: `1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d`. |
| `inputs`    | no           | Observation-only bars: `[{ instrument, interval, lookback }]`; `lookback` closed bars must exist at the first activation. |
| `features`  | no           | Declarative per-instrument series. See [Features](#features). |
| `trigger`   | yes          | When `decide` runs. See [Triggers](#triggers). |
| `state`     | no           | `{ initial }`, a JSON value. `decide` may return a new `state`; omitting it keeps the old one. |
| `decide`    | yes          | `(ctx) => outcome`, or `async (ctx) => outcome`. |

`decide` returns `{ kind: "decided", commands: [...], state?, reason? }` or
`{ kind: "not_ready", reason }`.

- `reason` is recorded with the decision; write why, it is the first thing to read when
  debugging.
- Nothing to do is `commands: []`. `not_ready` aborts the whole run with nothing committed; use
  it only when the run must not proceed.

Spec problems return `{ status: "invalid", issues: [{ code, message, path? }] }`, all at once,
before anything runs: for example `instrument_not_canonical`, `instrument_unsupported`,
`trigger_feature`, `feature_cycle`, `feature_bad_lookback`, `schedule_time_zone`,
`bad_sim_option`, `revision_required`, `bad_range`.

## The Decide Context

| Member                    | Meaning |
| ------------------------- | ------- |
| `ctx.now`                 | The current instant (epoch ms). Use it instead of `Date.now()`. |
| `ctx.triggers`            | Why this activation happened: `[{ kind, instrument?, feature?, source? }]`. |
| `ctx.state`               | The strategy state (frozen). |
| `ctx.account`             | `{ cash, equity, positions, openOrders }`. A position has `instrument`, `qty` (negative when short), `avgPrice`, `sellableQty` (T+1 on A-shares), `realizedPnl`, `mark`, `value`. An open order has `id`, `tag?`, `instrument`, `side`, `type`, `qty`, `price?`. |
| `ctx.bars(id, interval?)` | Closed bars: `last()`, `row(i)`, `closes(n)`, `length`, and columns `openAt`, `closeAt`, `open`, `high`, `low`, `close`, `volume`. Only the declared window is visible: an input's `lookback` or what the instrument's features need. |
| `ctx.features(id).name`   | Point-in-time feature: `last()`, `back(k)`, `values(n)`. A missing row is `undefined` (`NaN` in `values`). |
| `ctx.orderEvents`         | Order events confirmed since the previous activation. |
| `ctx.events`              | External events that became visible since the previous activation. |

Every call takes the canonical code exactly as in `universe`.

## Commands and Orders

```javascript
const { allocate, market, limit, stop, cancel, qty, notional, gtc, gtd, ioc } = require("@alva/altra2");

allocate({ US_SPOT_SPY_USD: 0.6, US_SPOT_TLT_USD: 0.4 }); // target weights of equity
market("US_SPOT_NVDA_USD", "buy", qty(10)); // 10 shares at the next open
market("US_SPOT_NVDA_USD", "sell", notional(5000), { tag: "trim" });
limit("BINANCE_SPOT_BTC_USDT", "buy", qty(0.1), 60000, gtc(), { tag: "L60000" });
stop("US_SPOT_NVDA_USD", "sell", qty(10), 800, gtd(Date.parse("2026-03-31")));
cancel("L60000"); // by tag
```

- `decide` may return any number of commands.
- **`allocate`**: held instruments not listed target 0; `allocate({})` liquidates. A new
  `allocate` replaces the unfinished legs of the previous one. Negative weights are shorts
  (rejected `short_forbidden` where the venue forbids them). The sum of absolute weights may
  not exceed `sim.maxGrossLeverage` (default 1).
- Under `market` rules, sells fill before buys at the open and buys are scaled down together if
  cash cannot cover them. **`canceled · unfunded` after a fill is a normal partial fill.**
- **`market`** fills at the next open with slippage. **`limit`** rests until filled (at the open
  if the bar gaps through, otherwise at the limit price), canceled or expired. **`stop`**
  triggers at `stopPrice` and fills like a market order.
- Time in force: `gtc()` (default), `gtd(until)`, `ioc()` (next open only). `tag` must be unique
  among live orders.
- Quantities follow venue lots under `market` rules, including notional orders.

Every command gets an outcome in the decision record:
`{ index, kind, status: "accepted" | "partial" | "rejected", orderIds, issues }`. Codes include
`unknown_instrument`, `short_forbidden`, `below_lot`, `bad_amount`, `bad_price`, `bad_tif`,
`bad_side`, `bad_weight`, `duplicate_tag`, `leverage`, `no_price`.

Order events carry `kind`: `placed`, `filled_at_open`, `filled_intrabar` (with `qty`, `price`,
`fee`), `pending_funds`, `blocked` (`price_band`, `sellability`, `insufficient_funds`, ...; the
order stays live), `canceled` (`replaced`, `ioc`, `unfunded`, `nothing_to_sell`, `below_lot`,
...), `expired`.

## Triggers

| Trigger | Fires |
| ------- | ----- |
| `{ kind: "bar", instrument, interval? }` | At every close of that instrument's bars. |
| `{ kind: "schedule", every, at: { timeZone, hour, minute? } }` | At a wall-clock time. `every`: `day`, `weekday`, `week-start`, `month-start`, `month-end`. |
| `{ kind: "cross", feature, instrument?, level?, direction? }` | When a feature crosses `level` (default 0) at a close; `direction` `up`, `down` or `both`. |
| `{ kind: "event", source }` | When an external event of that source becomes available. |
| `{ kind: "any", of: [...] }` | When any listed trigger fires. |

A schedule fires even when no market is open: choose a time after the closes you need, for
example 17:00 New York for US daily bars.

## Features

Features are declared, computed once over each instrument's series, and read point-in-time:
a row becomes visible when its source bar closes.

```javascript
features: {
  sma20: { from: "close", lookback: 19, fn: (c) => indicators.sma(c, { period: 20 }) },
  sma50: { from: "close", lookback: 49, fn: (c) => indicators.sma(c, { period: 50 }) },
  spread: { deps: ["sma20", "sma50"], history: 2, fn: (d) => d.sma20.map((x, i) => x - d.sma50[i]) },
  rsi14: { from: "close", lookback: 14, mode: "recursive", warmup: 100, fn: (c) => indicators.rsi(c, { period: 14 }) },
},
```

- `fn` receives a `Float64Array` of the `from` field (`open`, `high`, `low`, `close`, `volume`),
  or `{ name: Float64Array }` with `deps`, and returns an array of the same length.
- **`fn` may be `async`** (model inference, a service call); the engine awaits it. Prefer one
  pass over the whole array to one call per row when the service allows it.
- **`lookback`** is the index of the first valid output: SMA(p) → `p − 1`, ROC(p) → `p`,
  RSI(p) → `p`. `@alva/algorithm` fills warm-up rows with partial values, so the lookback must
  be right. Lookbacks add up along `deps`.
- **`history`** (default 1) is how many rows `decide` may read: `back(k)` needs `k + 1`,
  `values(n)` needs `n`.
- **Recursive indicators** (EMA, RSI, MACD) declare `mode: "recursive"` and a `warmup` of several
  times the period.
- **Causality is your obligation**: no centered windows, no normalization over the whole array,
  no reading the array's end. Check with `await testing.assertCausal(fn, values)`.
- A non-finite output marks a row missing. A throw or rejected promise fails the run.

## External Events

Non-bar data (earnings, fundamentals, sentiment scores, another Automation's signals) enters as
events. Load it in the script, convert each record, and pass `events` to `run`:

```javascript
events: [
  { source: "earnings", id: "NVDA-2024Q4", revision: 1,
    availableAt: Date.parse("2024-02-21T21:20:00Z"), payload: { surprisePct: 12 } },
],
// trigger: { kind: "event", source: "earnings" }; in decide: ctx.events
```

- `availableAt` is when the information could be known: the engine schedules by it. Use the
  provider's publication/observation time, never the event time or a crawl/backfill time.
- `(source, id)` identifies an event; a higher `revision` supersedes earlier ones. `payload` is
  JSON (`null` when empty).
- Events at or before the run start are not delivered (`records.lateEvents`).

## LLMs and Models

Every function you write may be async: `decide` and feature `fn` can call an LLM through
[alpi.md](alpi.md), an ONNX model through [onnx.md](onnx.md), or another service.

- **Nothing is recorded.** Every replay (a backtest, or a stored run's rebuild) calls them again:
  it costs again and a model may answer differently.
- **Backtests call the model for every activation**, and a model asked about past dates may
  already know what happened next.
- **A failed call fails the run** and nothing is committed; catch inside the function to fall
  back instead.
- **Recommended:** keep `decide` deterministic. Run the LLM analysis as its own Automation that
  writes answers to a Feed, then pass those rows in as events. A fixed ONNX model inside an async
  feature is deterministic and fine.

## Trading Rules and Options

`sim.rules`:

- **`"market"`** (default): integer shares, A-share lots of 100 (STAR at least 200) and T+1,
  daily price bands (A-share ±10%, STAR/ChiNext ±20%, Korea ±30%), no shorting where the venue
  forbids it, strict cash.
- **`"ideal"`**: no lots, bands, short limits or cash limit; fractional quantities. Use it to
  study a signal without frictions, or a margin strategy such as a perp grid.

Other options: `initialCash` (default 100,000), `feeBps` (default 0), `slippageBps` (default 0),
`maxGrossLeverage` (default 1), `valuation: { timeZone, hour, minute? }` (default 20:00 New
York).

## Reading a Backtest Result

| `status`    | Meaning |
| ----------- | ------- |
| `complete`  | `records`, `metrics`, `features`, `gaps`. |
| `invalid`   | The spec or options are wrong; `issues` lists every problem. Nothing ran. |
| `not_ready` | `decide` returned `not_ready`, or an input lacked its `lookback` bars (`reason`). |
| `failed`    | `error` says why (a fetch failed, a feature threw). Run again or fix. |

- `records.decisions`: `{ at, triggers, commands, outcomes, reason }`; `records.orderEvents`;
  `records.samples` (equity at each valuation); `records.approximations`.
- `metrics`: `totalReturn`, `cagr`, `volatility`, `sharpe`, `sortino`, `maxDrawdown`, `calmar`,
  each `{ value }` or `{ unavailable }`. Risk-free rate 0; observed days only.
- **`instrument_no_data`** (`invalid`): an instrument has no bar in the range at an interval the
  strategy uses: the code does not exist, it did not trade then (no delisted history), or that
  interval's history is shorter (intraday). Fix the code, move the range or change the interval.
- **`gaps`** lists windows the provider could not deliver. Check it before trusting a result.
- To understand one fill, rerun a short range with `trace: true` and read the steps at that
  time.

## A Live Strategy as an Automation

A live strategy is a Feed whose producer calls `run` with a store. Each call continues from
the last committed point and appends decisions, order events, equity and features. Put the
source at `~/feeds/<name>/v1/src/index.js` and use the same Feed path for the store:

```javascript
const { feedPath } = require("@alva/feed");
const { defineStrategy, allocate, run, feedStore } = require("@alva/altra2");

const strategy = defineStrategy({ name: "spy-tlt-trend", revision: "1" /* ... */ });

(async () => {
  const r = await run({
    strategy,
    start: "2026-01-02", // the persisted history begins after this
    store: feedStore(feedPath("spy-tlt-trend", "v1")),
  });
  // complete, rebuilt and up_to_date are healthy; anything else must fail the run so the
  // platform shows it and the next scheduled run retries from the same point.
  if (!["complete", "rebuilt", "up_to_date"].includes(r.status))
    throw new Error(`altra2 ${r.status}: ${JSON.stringify(r).slice(0, 800)}`);
  return { status: r.status, frontierAt: r.frontierAt, written: r.written };
})();
```

| `status`     | Meaning | What to do |
| ------------ | ------- | ---------- |
| `complete`   | Advanced to `frontierAt`. | — |
| `rebuilt`    | Replayed from `start` (`revision` or a setting changed, a re-adjusted price, an invalid checkpoint). | Expected after a `revision` bump. |
| `up_to_date` | Nothing new has closed (with `coverage`: a market is still open). | Run later. |
| `failed` / `not_ready` / `busy` | Nothing committed. | Retry later or fix the cause. |
| `invalid`    | As for backtests, plus `revision_required`. | Fix the spec. |

- **Verify before creating.** Run the source once with `alva run --entry-path`. The first call
  replays from `start` to now; if it is too long for one call, pick a later `start` or build the
  history with several calls passing increasing `until` before creating the Automation.
- Then create the Automation per [feed-lifecycle.md](feed-lifecycle.md) and
  [deployment.md](deployment.md). **Cron times are UTC**: for US daily bars `30 21 * * 1-5` is
  after the close in winter and summer; for crypto daily bars, a few minutes after 00:00 UTC.
- **One Automation per Feed path.** Never point a second Automation, a manual run or a trial at
  a live strategy's path; give every experiment its own path.
- **Change the strategy** by editing the source and bumping `revision`; the next run rebuilds
  from `start`. Never delete the Feed's `data/` to force a replay.
- **Events:** pass the whole event history from `start` on every call, not only new events: a
  rebuild replays with only what that call passed.
- **Alerts.** A decision with at least one well-formed command appends a v1-compatible row to
  `signal/targets`, a legacy alert output: `--push-notify` works, and do not wrap it in
  `alertOutput()`. Structurally invalid commands (`bad_amount`, `unknown_instrument`, ...) are
  left out of the row; operational rejections (funds, lots) still appear. Native `decisions`
  and their `outcomes` are authoritative for every rejection. A rebuild never re-announces rows
  at or before the previous frontier.

### Reading a Live Feed

Resolve the generation from the manifest on every read and drop rows after `frontierAt`:

```text
~/feeds/<name>/v1/data/@kv/altra2.manifest                → generation, frontierAt
~/feeds/<name>/v1/data/altra2-<generation>/decisions/@last/20
~/feeds/<name>/v1/data/altra2-<generation>/equity/@range/<from>..<frontierAt>
~/feeds/<name>/v1/data/altra2-<generation>/order_events/@last/50
~/feeds/<name>/v1/data/altra2-<generation>-features/<feature>.y2026/@last/20
~/feeds/<name>/v1/data/signal/targets/@last/5
```

`triggers`, `commands` and `outcomes` in `decisions`, and `positions` in `equity`, are
JSON-encoded strings: parse them. Stored runs do not persist `metrics`; compute them from
`equity`. Playbooks: see [design-playbook-trading-strategy.md](design-playbook-trading-strategy.md).

## Testing

`testing` runs a strategy without network access:

```javascript
const { testing, run } = require("@alva/altra2"); // `strategy` as defined above

(async () => {
  // Daily bars on the venue's real sessions: closes, or { o, h, l, c, v } rows.
  const spy = testing.daily("US_SPOT_SPY_USD", "2024-01-02", [470, 472, 471, 475]);
  const r = await run({
    strategy,
    range: { from: "2024-01-01", to: "2024-02-01" },
    data: testing.dataset([spy]),
  });
  // A 3-bar mean: the first valid row is index 2, so its lookback is 2.
  const fn = (c) => c.map((_, i) => (i < 2 ? NaN : (c[i] + c[i - 1] + c[i - 2]) / 3));
  const values = [470, 472, 471, 475, 478, 476];
  const lookback = 2;
  await testing.assertCausal(fn, values); // rejects if fn looks ahead
  const ok = await testing.checkLookback(fn, values, lookback); // smoke check only
  // testing.memoryStore() runs a stored run in memory: run({ strategy, start, until, now, store, data }).
  return { status: r.status, ok };
})();
```

With in-memory data, include enough history before `from` for features and inputs.

## Result Validity

Report with every result:

- Coverage and `gaps`, survivorship (no delisted history), corporate actions (prices are
  split-adjusted without dividends), and which conclusions they affect.
- Out-of-sample or walk-forward results, and the number of parameter trials and how the winner
  was chosen.
- Benchmark, return, volatility, maximum drawdown, trade count, turnover, fees and slippage.
  Benchmark prices are not in the outputs; fetch them separately.
- The fixed end date, rules mode and any rejected commands, `blocked` or `unfunded` events.

A high Sharpe ratio alone does not validate a strategy. Results are simulations under the
stated data and execution assumptions.

## Limitations

- No FX conversion: a portfolio mixing USD, HKD, KRW and CNY has equity and weights in mixed
  units. Keep one quote currency per strategy when the totals matter.
- Crypto bars come from the relay's default exchange, whatever venue the code names.
- No history for delisted tickers; A-share history starts in 2017. HK board lots are
  approximated as 1 share.
- Recursive features in stored runs are approximate (recomputed from `warmup`).
- Calls inside async functions are not recorded; replays make them again.

## Coming from v1

| v1 (`FeedAltra`, legacy) | altra2 |
| ------------------------ | ------ |
| `new FeedAltra(config, provider)` + `altra.run(end)` | `run({ strategy, range })`, or `run({ strategy, start, store })` live |
| `createArraysOhlcvProvider`, `registerOhlcv` | `universe`, `execution`, `inputs`; bars are fetched for you |
| `registerFeature({ inputConfig, fn })` | `features: { name: { from, lookback, history?, fn } }` |
| `registerRawData` with `observedAt` | `events` with `availableAt` |
| `trigger: { type: "events", expr: e.ohlcv(...) }` | `trigger: { kind: "bar", instrument }`, `schedule`, `cross`, `event`, `any` |
| `return { target, state }`, `target: null` | `return { kind: "decided", commands, state? }`, `commands: []` |
| one `allocate` or `orders` target per tick | any number of `allocate`, `market`, `limit`, `stop`, `cancel` |
| `Amount.quote(x)` / `Amount.base(n)` | `notional(x)` / `qty(n)` |
| `ctx.portfolio`, `ctx.data`, `ctx.tick` | `ctx.account`, `ctx.bars()` / `ctx.features()`, `ctx.now` |
| `setAgentStrategy` | an async `decide`, or model answers passed in as events |
| `signal/targets`, `sim/*`, `perf/*` | `signal/targets` (same shape) plus generation-scoped `decisions`, `order_events`, `equity` |

Trading pairs are the same canonical codes in both versions.
