# Feed SDK Guide

> API examples use HTTP notation (`METHOD /path`). See SKILL.md Setup for curl
> templates.

The Feed SDK (`@alva/feed`) lets you build persistent data pipelines that store
time series data on the Alva filesystem. Feed outputs are readable via standard
filesystem paths, making them accessible to other scripts, dashboards, and
public consumers.

---

## Overview

A **feed** is a script that:

1. Fetches or computes data (market prices, indicators, on-chain metrics, etc.)
2. Defines an output schema (groups and named outputs with typed fields)
3. Appends timestamped records to time series storage

Feed data is stored at a synth mount under the feed's path and is queryable via
filesystem virtual paths (`@last`, `@range`, etc.).

---

## Quick Start

```javascript
const { Feed, feedPath, makeDoc, num } = require("@alva/feed");
const { getCryptoKline } = require("@arrays/crypto/ohlcv:v1.0.0");
const { indicators } = require("@alva/algorithm");

const feed = new Feed({ path: feedPath("btc-ema") });

feed.def("metrics", {
  prices: makeDoc("BTC Prices", "Close price with EMA10", [
    num("close"),
    num("ema10"),
  ]),
});

(async () => {
  const now = Math.floor(Date.now() / 1000);
  const bars = getCryptoKline({
    symbol: "BTCUSDT",
    start_time: now - 30 * 86400,
    end_time: now,
    interval: "1h",
  })
    .response.data.slice()
    .reverse();

  const closes = bars.map((b) => b.close);
  const ema10 = indicators.ema(closes, { period: 10 });

  const records = bars.map((b, i) => ({
    date: b.date,
    close: b.close,
    ema10: ema10[i] || null,
  }));

  await feed.run(async (ctx) => {
    await ctx.self.ts("metrics", "prices").append(records);
  });
})();
```

After running, data is readable at:
`~/feeds/btc-ema/v1/data/metrics/prices/@last/100`

---

## Data Modeling

All feed output should go through the Feed SDK. Do not use `alfs.writeFile()`
for feed data.

### Pattern A: Snapshot (latest-wins)

For data representing current state (company details, price target consensus).
Store one record per run using start-of-day as the date, so re-runs overwrite
the same point.

```javascript
feed.def("info", {
  company: makeDoc("Company Detail", "Company snapshot", [
    str("name"),
    str("sector"),
    num("marketCap"),
  ]),
});

await feed.run(async (ctx) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const data = fetchCompanyDetail();
  await ctx.self.ts("info", "company").append([
    {
      date: today.getTime(),
      name: data.name,
      sector: data.sector,
      marketCap: data.marketCap,
    },
  ]);
});
```

Read `@last/1` for the current snapshot.

### Pattern B: Event Log

For timestamped events (insider trades, news, earnings). Each event has a
natural date. Same-date records are auto-grouped.

```javascript
feed.def("activity", {
  insiderTrades: makeDoc("Insider Trades", "SEC Form 4 filings", [
    str("name"),
    str("type"),
    num("shares"),
    num("price"),
  ]),
});

await feed.run(async (ctx) => {
  const trades = fetchInsiderTrades();
  const records = trades.map((t) => ({
    date: new Date(t.transactionDate).getTime(),
    name: t.reportingName,
    type: t.transactionType,
    shares: t.securitiesTransacted,
    price: t.price,
  }));
  await ctx.self.ts("activity", "insiderTrades").append(records);
});
```

### Pattern C: Tabular (versioned batch)

For data where the whole set refreshes each run (top holders, quarterly
estimates). Use the same run timestamp for all records; same-date grouping
stores them as a batch.

```javascript
feed.def("research", {
  institutions: makeDoc("Institutional Holdings", "Top holders", [
    num("rank"),
    str("name"),
    num("marketValue"),
  ]),
});

await feed.run(async (ctx) => {
  const now = Date.now();
  const holdings = fetchHoldings();
  const records = holdings.map((h, i) => ({
    date: now,
    rank: i + 1,
    name: h.name,
    marketValue: h.value,
  }));
  await ctx.self.ts("research", "institutions").append(records);
});
```

Read `@last/N` (where N >= batch size) to get the most recent batch.

### Pattern D: Signal / Push Notification

For feeds that produce actionable signals worth pushing to playbook followers.
Write signal records to the **`signal`** group with a **`targets`** output --
the resulting path `~/feeds/{name}/v{major}/data/signal/targets` is the
convention the platform reads when notifying followers via Telegram (or other
push channels).

The target format follows the same structure used by Altra trading strategies:

```javascript
const { Feed, feedPath, makeDoc, str, num, obj, arr, fld } = require("@alva/feed");

const feed = new Feed({ path: feedPath("my-signal") });

feed.def("signal", {
  targets: makeDoc("Signal Targets", "Actionable signals for followers", [
    obj("instruction", [
      str("type"),       // "allocate" | "orders"
      arr("weights", [   // for type: "allocate"
        str("symbol"),
        num("weight"),
      ]),
      arr("orders", [    // for type: "orders"
        str("symbol"),
        str("side"),     // "buy" | "sell"
        fld("amount", "object"),
      ]),
    ]),
    obj("meta", [
      str("reason"),     // human-readable explanation
    ]),
  ]),
});

await feed.run(async (ctx) => {
  const now = Date.now();

  await ctx.self.ts("signal", "targets").append([
    {
      date: now,
      instruction: {
        type: "allocate",
        weights: [
          { symbol: "BINANCE_SPOT_BTC_USDT", weight: 0.6 },
          { symbol: "BINANCE_SPOT_ETH_USDT", weight: 0.4 },
        ],
      },
      meta: { reason: "EMA crossover: shift to 60/40 BTC/ETH" },
    },
  ]);
});
```

When this feed runs as a cronjob, the platform reads
`/data/signal/targets/@last/1` and pushes the signal content (truncated to
500 chars) to all playbook followers who have enabled Telegram notifications.

**Key points:**

- The group **must** be named `signal` and the output **must** be named
  `targets` -- this is the path the notification system looks for.
- Use `meta.reason` to provide a human-readable message -- this is what
  followers see in their push notification.
- One record per run is typical; the platform reads `@last/1`.
- Altra strategies write to this path automatically. Use this pattern only for
  non-Altra feeds that want to produce push-worthy signals.

### Deduplication

`append()` deduplicates by `date` -- re-appending a record with an existing
timestamp replaces the old value (`ON CONFLICT DO UPDATE`). This makes re-runs
safe for snapshot and time series data.

For event data with multiple records per timestamp, `append()` transparently
groups them: records sharing the same `date` are stored as
`{date, _grouped: true, items: [...]}` and auto-flattened on read. No timestamp
offset workarounds needed.

---

## Feed Class API

### Constructor

```javascript
const feed = new Feed(config, store?);
```

**FeedConfig**:

| Field       | Type   | Required | Description                                                |
| ----------- | ------ | -------- | ---------------------------------------------------------- |
| path        | string | yes      | Feed base path (use `feedPath()` helper)                   |
| name        | string | no       | Human-readable feed name                                   |
| description | string | no       | Feed description                                           |
| upstreams   | object | no       | Map of `{ localName: pathString }` for reading other feeds |

### def(groupName, outputs)

Define output schemas. Call before `run()`.

```javascript
feed.def("metrics", {
  prices: makeDoc("BTC Prices", "Close + EMA", [num("close"), num("ema10")]),
  volume: makeDoc("Volume", "Trading volume", [num("vol")]),
});
```

- `groupName`: logical group name. **Do not use `"data"`** as a group name --
  the synth mount is already called `data/`, so you'd get `data/data/...`.
- `outputs`: object mapping output names to schema docs created with
  `makeDoc()`.

### run(callback)

Execute the feed logic. The callback receives a `FeedContext`.

```javascript
await feed.run(async (ctx) => {
  // ctx.self -- write to own outputs
  // ctx.upstream -- read from upstream feeds (if configured)
  await ctx.self.ts("metrics", "prices").append(records);
});
```

### setChart(chartConfig)

Persist a dashboard/chart configuration.

```javascript
feed.setChart({ type: "line", title: "BTC EMA" });
```

### path

The resolved base path (no `/data` suffix).

```javascript
feed.path; // "/alva/home/alice/feeds/btc-ema/v1"
```

---

## feedPath(name, version?)

Helper that constructs the feed path from the current user's ID.

```javascript
const { feedPath } = require("@alva/feed");

feedPath("btc-ema"); // "/alva/home/<username>/feeds/btc-ema/v1"
feedPath("btc-ema", "v2"); // "/alva/home/<username>/feeds/btc-ema/v2"
```

Uses `require("env").username` internally to resolve the user's home directory.

---

## Schema Helpers

### makeDoc(name, description, fields, ref?)

Creates a time series type document (schema definition).

```javascript
const { makeDoc, num, str, bool, obj, arr, fld } = require("@alva/feed");

const schema = makeDoc("Price Data", "OHLCV with indicators", [
  num("close", "Closing price"),
  num("ema10", "10-period EMA"),
  str("signal", "Trade signal"),
]);
```

### Field Helpers

| Helper                          | Type    | Example                                   |
| ------------------------------- | ------- | ----------------------------------------- |
| `num(name, description?)`       | number  | `num("close", "Closing price")`           |
| `str(name, description?)`       | string  | `str("symbol", "Ticker symbol")`          |
| `bool(name, description?)`      | boolean | `bool("isActive", "Whether active")`      |
| `obj(name, fields)`             | object  | `obj("meta", [str("key"), num("val")])`   |
| `arr(name, fields)`             | array   | `arr("prices", [num("value")])`           |
| `fld(name, type, description?)` | generic | `fld("custom", "number", "Custom field")` |

---

## FeedContext

The callback passed to `feed.run()` receives a `FeedContext`:

```javascript
await feed.run(async (ctx) => {
  ctx.self; // SelfFeed -- read/write to own outputs
  ctx.upstream; // UpstreamFeeds -- read from upstream feeds (if configured)
  ctx.kv; // persistent key-value state
});
```

### ctx.kv

Persistent key-value store that survives between feed executions. Useful for
watermarks, cursors, or incremental processing state. Values are raw strings.

| Method | Signature                                  | Description                           |
| ------ | ------------------------------------------ | ------------------------------------- |
| put    | `put(key, value) → Promise<void>`          | Store a string value                  |
| load   | `load(key) → Promise<string \| undefined>` | Read a value (`undefined` if missing) |

```javascript
await feed.run(async (ctx) => {
  const lastProcessed = await ctx.kv.load("lastProcessed");
  const since = lastProcessed ? Number(lastProcessed) : 0;

  const newData = fetchDataSince(since);
  if (newData.length > 0) {
    await ctx.self.ts("metrics", "prices").append(newData);
    await ctx.kv.put("lastProcessed", String(newData[newData.length - 1].date));
  }
});
```

### Incremental Updates with ctx.kv

The standard pattern for feeds that run repeatedly (manually or via cronjob):

```javascript
await feed.run(async (ctx) => {
  const raw = await ctx.kv.load("lastDate");
  const lastDateMs = raw ? Number(raw) : 0;

  const now = Math.floor(Date.now() / 1000);
  const start =
    lastDateMs > 0 ? Math.floor(lastDateMs / 1000) : now - 365 * 86400;

  const result = fetchData({ start_time: start, end_time: now });
  const newRecords =
    lastDateMs > 0 ? records.filter((r) => r.date > lastDateMs) : records;

  if (newRecords.length > 0) {
    await ctx.self.ts("group", "output").append(newRecords);
    await ctx.kv.put(
      "lastDate",
      String(newRecords[newRecords.length - 1].date),
    );
  }
});
```

First run: `ctx.kv.load('lastDate')` returns `undefined` -- backfill full
history. Subsequent runs: start from watermark, fetch only new data.

**Indicators with lookback**: When computing indicators (EMA, RSI), the
incremental fetch must include extra historical bars for warm-up:

```javascript
const LOOKBACK = 50;
const start =
  lastDateMs > 0
    ? Math.floor(lastDateMs / 1000) - LOOKBACK * 86400
    : now - 365 * 86400;
// Fetch all bars, compute indicators on full range, but only append new bars
const newBars = lastDateMs > 0 ? bars.filter((b) => b.date > lastDateMs) : bars;
```

See [deployment.md](deployment.md) for deploying incremental feeds as cronjobs.

### ctx.self (SelfFeed)

Access your own time series outputs for reading and writing.

```javascript
const ts = ctx.self.ts("groupName", "outputName");
// ts is a WritableTimeSeries
```

### ctx.upstream (UpstreamFeeds)

Read data from upstream feeds (configured in the `upstreams` option).

```javascript
const feed = new Feed({
  path: feedPath("my-feed"),
  upstreams: { btcPrices: "@alice/feeds/btc-prices/v1" },
});

await feed.run(async (ctx) => {
  const upstream = ctx.upstream.btcPrices.ts("metrics", "prices");
  const last100 = await upstream.last(100);
});
```

---

## TimeSeries API

### TimeSeries (read-only, from upstreams)

| Method   | Signature                       | Description                                                   |
| -------- | ------------------------------- | ------------------------------------------------------------- |
| last     | `last(n?, before?) → records[]` | Last N records (chronological), optionally before a timestamp |
| first    | `first(n?, after?) → records[]` | First N records, optionally after a timestamp                 |
| range    | `range(from, to?) → records[]`  | Records in time range                                         |
| lastDate | `lastDate() → number \| null`   | Timestamp of the most recent record                           |
| count    | `count(from?, to?) → number`    | Number of records (optionally in range)                       |

### WritableTimeSeries (extends TimeSeries, from ctx.self)

| Method | Signature           | Description                                           |
| ------ | ------------------- | ----------------------------------------------------- |
| append | `append(records[])` | Append records; auto-sorts and deduplicates by `date` |

All TimeSeries read methods and `append` are async.

**Record format**: Each record must have a `date` field (Unix milliseconds) plus
the fields defined in your schema:

```javascript
await ctx.self.ts("metrics", "prices").append([
  { date: 1709337600000, close: 73309.72, ema10: 72447.65 },
  { date: 1709341200000, close: 73500.0, ema10: 72600.0 },
]);
```

Records are automatically sorted by `date` ascending. Records sharing the same
`date` are transparently grouped and stored as `{date, items: [{...}, {...}]}`;
on read, they are auto-flattened back into individual flat records.

---

## Reading Feed Data

Feed outputs are accessible via the filesystem after the feed runs.

### From the REST API

```
GET /api/v1/fs/read?path=~/feeds/btc-ema/v1/data/metrics/prices/@last/100

GET /api/v1/fs/read?path=/alva/home/alice/feeds/btc-ema/v1/data/metrics/prices/@last/100  (public, no auth)
```

### From JavaScript (inside jagent)

```javascript
const alfs = require("alfs");
const env = require("env");
const home = "/alva/home/" + env.username;

const data = alfs.readFile(
  home + "/feeds/btc-ema/v1/data/metrics/prices/@last/100",
);
const points = JSON.parse(data);
```

### From a Web Page

```javascript
const resp = await fetch(
  "$ALVA_ENDPOINT/api/v1/fs/read?path=/alva/home/alice/feeds/btc-ema/v1/data/metrics/prices/@last/720",
);
const points = await resp.json();
// points = [{date: 1772658000000, close: 73309.72, ema10: 72447.65}, ...]
```

---

## Grouped Records (Multi-Record Per Date)

`append()` transparently groups same-date records. If you pass records with the
same `date`, they are automatically stored as `{date, items: [{...}, {...}]}`.
On read, the SDK auto-flattens these back into individual flat records.

**Cross-run accumulation pattern**: A common use case is an hourly cronjob that
aggregates highlights by day. Each run appends one record per day; multiple runs
produce multiple records for the same date. They are grouped in storage and
flattened when read:

```javascript
// Hourly cronjob: append one highlight per run
await ctx.self
  .ts("metrics", "highlights")
  .append([{ date: startOfDay(today), highlight: "Price spike at 14:00 UTC" }]);
// Next run adds another record for the same date; both are grouped and auto-flattened on read.
```

**REST API vs SDK**: The REST API returns raw values—for grouped rows,
`{date, items: [...]}`. The SDK auto-flattens grouped records into individual
flat records when using `last()`, `first()`, `range()`, etc.

**Limit behavior**: The `limit` parameter in `last()`, `first()`, etc. applies
to unique timestamps (DB rows), not individual records after auto-flatten. A
grouped row may expand to multiple records, so `last(5)` can return more than 5
records if some timestamps have multiple items.

---

## Feed Path Anatomy

```
~/feeds/btc-ema/v1 / data      / metrics / prices / @last/100
|--- feedPath ---| |mount pt| | group | |output| | query |
```

- **feedPath**: `~/feeds/<name>/v1` -- your feed's base directory
- **data/**: synth mount point (auto-created by Feed SDK)
- **group**: logical grouping from `feed.def("metrics", ...)`
- **output**: named output from the group definition
- **query**: virtual path suffix (`@last/N`, `@range/...`, `@count`, etc.)

### Filesystem Layout

```
~/feeds/btc-ema/v1/
  src/
    index.js          # Your feed script (regular file)
  data/               # Synth mount (auto-created)
    metrics/
      prices/         # Time series output
        @last/100     # Virtual: last 100 points
        @range/7d     # Virtual: last 7 days
        @count        # Virtual: point count
```

---

## Making Feeds Public

Grant public read access so anyone can read the data without an API key:

```
POST /api/v1/fs/grant
{"path":"~/feeds/btc-ema/v1","subject":"special:user:*","permission":"read"}
```

Public reads must use absolute paths:
`/alva/home/<username>/feeds/btc-ema/v1/data/...`

---

## Complete Example: BTC Price Feed

### Step 1: Create the directory and write the script

```
POST /api/v1/fs/mkdir
{"path":"~/feeds/btc-ema/v1/src"}
```

Write the script (raw body upload):

```bash
curl -s -H "X-Alva-Api-Key: $ALVA_API_KEY" \
  -H "Content-Type: application/octet-stream" \
  "$ALVA_ENDPOINT/api/v1/fs/write?path=~/feeds/btc-ema/v1/src/index.js" \
  --data-binary @- <<'JS'
const { Feed, feedPath, makeDoc, num } = require("@alva/feed");
const { getCryptoKline } = require("@arrays/crypto/ohlcv:v1.0.0");
const { indicators } = require("@alva/algorithm");

const now = Math.floor(Date.now() / 1000);
const bars = getCryptoKline({
  symbol: "BTCUSDT",
  start_time: now - 30 * 86400,
  end_time: now,
  interval: "1h",
}).response.data.slice().reverse();

const closes = bars.map((b) => b.close);
const ema10 = indicators.ema(closes, { period: 10 });

const records = bars.map((b, i) => ({
  date: b.date,
  close: b.close,
  ema10: ema10[i] || null,
}));

const feed = new Feed({ path: feedPath("btc-ema") });
feed.def("metrics", {
  prices: makeDoc("BTC Prices", "Close + EMA10", [num("close"), num("ema10")]),
});

(async () => {
  await feed.run(async (ctx) => {
    await ctx.self.ts("metrics", "prices").append(records);
  });
})();
JS
```

### Step 2: Run the feed

```
POST /api/v1/run
{"entry_path":"~/feeds/btc-ema/v1/src/index.js"}
```

### Step 3: Make it public

```
POST /api/v1/fs/grant
{"path":"~/feeds/btc-ema/v1","subject":"special:user:*","permission":"read"}
```

### Step 4: Read from any client

```
GET /api/v1/fs/read?path=/alva/home/alice/feeds/btc-ema/v1/data/metrics/prices/@last/100  (public, no auth)
```

### Step 5: Deploy as a cronjob (required for live playbooks)

```
POST /api/v1/deploy/cronjob
{"path":"~/feeds/btc-ema/v1/src/index.js","cron_expression":"0 */4 * * *","name":"BTC EMA Update"}
```

---

## Pitfalls

- **Don't name your group `"data"`**. The synth mount is at `<feedPath>/data/`,
  so `feed.def("data", ...)` produces `data/data/...`. Use descriptive names
  like `"metrics"`, `"signals"`, `"market"`.
- **Records must be in ascending date order**. `append()` auto-sorts, but
  providing pre-sorted data is more efficient.
- **Same-date records are grouped**. If you `append()` records sharing the same
  `date`, they are transparently stored as a grouped record. On read, they are
  auto-flattened back into individual records.
- **Limit applies to timestamps, not records**. `last(5)` fetches 5 unique
  timestamps. Grouped timestamps expand to multiple records after auto-flatten,
  so the result may exceed the limit.
- **Re-appending overwrites**. Appending a record with an existing timestamp
  replaces the old value (`ON CONFLICT DO UPDATE`). Use this for cross-run
  accumulation: read existing + merge + re-append.
- **`feedPath()` requires `env.username`**. It reads from `require("env").username`
  internally, which is available in the jagent runtime.
- **Top-level `await` is not supported**. Wrap feed logic in
  `(async () => { ... })();`.
- **`@last` returns chronological (oldest-first) order**, consistent with
  `first()` and `range()`. No manual sorting needed.

---

## Resetting Feed Data

During development, clear stale data via the REST API. **This is for development
only -- do not use in production.**

```
# Clear a specific time series output (e.g. market/ohlcv)
DELETE /api/v1/fs/remove?path=~/feeds/my-feed/v1/data/market/ohlcv&recursive=true

# Clear an entire group (all outputs under "market")
DELETE /api/v1/fs/remove?path=~/feeds/my-feed/v1/data/market&recursive=true

# Full reset: clear ALL data + KV state (removes the data mount, re-created on next run)
DELETE /api/v1/fs/remove?path=~/feeds/my-feed/v1/data&recursive=true
```

Clearing time series also removes the associated typedoc (schema metadata). KV
state (watermarks) is cleared when you clear the entire feed data directory.
