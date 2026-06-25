# Feed SDK Guide

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

### Pattern D: Signal / Playbook Push Notification

For feeds that produce actionable signals worth pushing to users or groups
that explicitly subscribed to the feed, or to a playbook that references the
feed. Write signal records to the **`signal`** group with a **`targets`**
output -- the resulting path
`~/feeds/{name}/v{major}/data/signal/targets` is one source the platform reads
when dispatching the canonical `feed_alert_ready` notification event.

The target format follows the same structure used by Altra trading strategies:

```javascript
const { Feed, feedPath, makeDoc, str, num, obj, arr, fld } = require("@alva/feed");

const feed = new Feed({ path: feedPath("my-signal") });

feed.def("signal", {
  targets: makeDoc("Signal Targets", "Actionable signals for playbook notifications", [
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
      str("reason"),     // Markdown push-notification body
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

When this feed runs as a cronjob with `--push-notify`, the platform reads
`/data/signal/targets` and dispatches the signal content as `feed_alert_ready`
to eligible feed/playbook notification subscriptions. Telegram delivery chunks
long messages at the platform's per-message limit; the feed SDK does not
require a 500-character summary.

**Key points:**

- The group **must** be named `signal` and the output **must** be named
  `targets` -- this is the path the notification system looks for.
- `--push-notify` and `alva release feed --cronjob-id ...` only make the feed
  publisher capable of emitting alerts. They do **not** subscribe any user or
  group.
- Real delivery requires an explicit subscription: personal
  `alva subscriptions subscribe-feed` / `subscribe-playbook`, group
  `/alva subscribe feed <id>` / `/alva subscribe playbook <id>`, or — from
  inside a playbook iframe — a parent-confirmed `window.alva.subscribe.propose()`
  (see `references/api/udf-runtime.md` § Feed Subscribe Proposal). A playbook
  must never call a subscribe API directly.
- Use `meta.reason` to provide the push-notification body -- this is what
  recipients see when the signal is delivered.
- `meta.reason` is **Markdown**. Write it as the push body itself, using
  Markdown for emphasis, lists, and links; the platform renders Markdown on
  the delivery side (Telegram, in-app surfaces). Keep it short and
  push-friendly -- headings and heavy formatting don't translate well to a
  notification.
- Keep `meta.reason` close to the user-facing feed output when the feed is
  notification-native. Use a push-safe projection only when a channel has a
  real hard limit or cannot render the feed's richer format.
- One record per run is typical; the platform reads `@last/1`.
- Altra strategies write to this path automatically. Use this pattern only for
  non-Altra feeds that want to produce push-worthy signals.

### Pattern E: AlvaAsk + Feed Notification (notify/message)

**Preferred pattern for scheduled tasks.** Use `@alva/alvaask` instead of a
custom alpi loop for cronjob feeds when you need Alva's full agent behavior —
it's simpler (no sandbox/session management) and the `ask()` call handles tool
use, web search, and ALFS access automatically.

For feeds that use `@alva/alvaask` to call Alva's agent and publish the result
as a feed completion notification. Common use cases: scheduled market reports,
periodic research summaries, heartbeat monitoring, and proactive alerts.

Write the agent's response to the **`notify`** group with a **`message`**
output. When the cronjob completes with `--push-notify`, the platform reads
this path and dispatches `feed_alert_ready` to users or groups that explicitly
subscribed to the feed, or to a playbook that references the feed.

```javascript
const { ask } = require("@alva/alvaask");
const { Feed, feedPath, makeDoc, str } = require("@alva/feed");

const feed = new Feed({ path: feedPath("daily-briefing") });
feed.def("notify", {
  message: makeDoc("Notification", "Agent-generated push content", [
    str("title"),
    str("body"),
  ]),
});

(async () => {
  const result = ask(`Give a brief crypto market update with key levels.
If there is no material update worth notifying about, output only
<|SKIP_NOTIFICATION|>.`);

  await feed.run(async (ctx) => {
    await ctx.self.ts("notify", "message").append([
      {
        date: Date.now(),
        title: "Daily Crypto Briefing",
        body: result.text,
      },
    ]);
  });
})();
```

Deploy requires **two steps** — cronjob + feed registration:

```bash
# 1. Create the cronjob with push notification enabled
alva deploy create --name daily-briefing \
  --path '~/feeds/daily-briefing/v1/src/index.js' \
  --cron "0 8 * * *" --push-notify

# 2. Register the feed (REQUIRED for push content to work)
# Without this, notifications arrive without title/text content.
alva release feed --name daily-briefing --version 1.0.0 \
  --cronjob-id <ID_FROM_STEP_1> \
  --description "Generates a morning briefing each day at 08:00 summarizing overnight crypto market moves and pushes it as a notification"
```

**Key points:**

- The group **must** be named `notify` and the output **must** be named
  `message` — this is the path the notification system looks for.
- `title` is optional — if provided, the notification renders as
  `**title**\n\nbody`.
- `body` is the notification body (required for content push). The
  legacy field name `text` is still accepted for backwards compatibility,
  but `body` is the canonical name and matches FCM / APNS / Web Push
  / HTTP / email convention — prefer `body` in new feeds. If both
  `body` and `text` are set on the same record, `body` wins.
- If `body`/`text` contains `<|SKIP_NOTIFICATION|>`, fanout state advances but
  no user-visible notification is sent. Teach AlvaAsk to output this sentinel
  when there is no material update.
- **`alva release feed` is required** — without it, the push is still
  dispatched but arrives with an empty body (no `title`/`body`).
- `--push-notify` only enables publisher-side fanout. It does **not** create
  personal or group subscriptions.
- Real delivery requires an explicit subscription: personal
  `alva subscriptions subscribe-feed --username <owner> --name <feed>`
  or `subscribe-playbook`, or group `/alva subscribe feed <feed_id>` /
  `/alva subscribe playbook <playbook_id>`. For inventory and
  unsubscribe (including ghost rows of deleted targets), see
  [push-notifications.md](push-notifications.md) § Inventory And
  Unsubscribe.
- Combine with Pattern D if you want both feed completion notifications and
  signal-style notifications.

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

### Error Handling

Feed scripts should let unexpected failures throw. Do not wrap data fetches,
upstream feed reads, LLM parsing, or feed writes in catch blocks that log and
continue with empty arrays, nulls, or fallback records. The sandbox captures
thrown errors and exposes the failed run, which makes broken data sources and
bad response shapes visible during development and operations.

Use ordinary conditionals only for expected business states, such as "no new
records since the last watermark." For required inputs, validate the response
shape and throw a clear error:

```javascript
const result = getDataSource({ symbol: "BTCUSDT" });
if (!result.success || !Array.isArray(result.response?.data)) {
  throw new Error("getDataSource returned an invalid response");
}
```

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

### User instructions (AGENTS.md)

Read the feed owner's **user instructions** from the feed's `AGENTS.md` —
`${feed.path}/AGENTS.md`, e.g. `~/feeds/market-pulse/v1/AGENTS.md`. It is
editable only on feeds released with an `agent_type` (`--agent-type alpi`).
Read it yourself via `alfs`; a missing file is not an error — treat it as empty.

**Append the user instructions to your base prompt; never let them replace it.**
Keep your real instructions in `BASE_PROMPT`:

```javascript
const alfs = require("alfs");
let userInstructions = "";
try {
  const c = await alfs.readFile(`${feed.path}/AGENTS.md`);
  userInstructions = String(c ?? "").trim(); // readFile may return a non-string (e.g. Buffer)
} catch (_) {
  // missing/unreadable AGENTS.md → no user instructions
}
const systemPrompt = userInstructions
  ? `${BASE_PROMPT}\n\n## User instructions\n${userInstructions}`
  : BASE_PROMPT;
```

The owner edits `AGENTS.md` (plain-text instructions); the next run picks it up,
no redeploy. Read it yourself and append — a missing/empty file then *extends*
nothing rather than *replacing* your base instructions.

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

### From the CLI

```bash
alva fs read --path '~/feeds/btc-ema/v1/data/metrics/prices/@last/100'

alva fs read --path '/alva/home/alice/feeds/btc-ema/v1/data/metrics/prices/@last/100'
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

```html
<script src="https://unpkg.com/@alva-ai/toolkit/dist/browser.global.js"></script>
<script>
function createAlvaClientConfig() {
  const params = new URLSearchParams(window.location.search);
  const pbsvToken = window.alva?.udf?.getViewerToken?.();
  const apiOrigin = params.get("api_origin");
  return {
    ...(pbsvToken ? { pbsvToken } : {}),
    ...(apiOrigin ? { baseUrl: apiOrigin.replace(/\/$/, "") } : {}),
  };
}

function createAlvaClient() {
  return new AlvaToolkit.AlvaClient(createAlvaClientConfig());
}

const points = await createAlvaClient().fs.read({
  path: "/alva/home/alice/feeds/btc-ema/v1/data/metrics/prices/@last/720",
});
// points = [{date: 1772658000000, close: 73309.72, ema10: 72447.65}, ...]
</script>
```

Use `createAlvaClient().fs.read(...)` (the SDK), not a raw `fetch`: it carries
the viewer's PBSV token, so the page reads its feed data whether the playbook is
public or private. An unauthenticated `fetch` to `/api/v1/fs/read` is a
public-only fallback that breaks when the playbook is set private. See
SKILL.md §6.

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

**CLI / REST vs SDK**: The CLI (and REST API) returns raw values—for grouped
rows, `{date, items: [...]}`. The SDK auto-flattens grouped records into
individual flat records when using `last()`, `first()`, `range()`, etc.

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
        @last/100                       # Virtual: last 100 points
        @range/{start}..{end}           # Virtual: between two timestamps
        @count                          # Virtual: point count
```

---

## Making Feeds Public

Grant public read access so anyone can read the data:

```bash
alva fs grant --path '~/feeds/btc-ema/v1' --subject "special:user:*" --permission read
```

Public reads must use absolute paths:
`/alva/home/<username>/feeds/btc-ema/v1/data/...`

---

## Complete Example: BTC Price Feed

### Step 1: Create the directory and write the script

```bash
# Prefer ALFS-native write/edit tools when available; --file is shell-only fallback.
alva fs write --path '~/feeds/btc-ema/v1/src/index.js' --file ./index.js --mkdir-parents
```

Where `index.js` contains:

```javascript
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
```

### Step 2: Run the feed

```bash
alva run --entry-path '~/feeds/btc-ema/v1/src/index.js'
```

### Step 3: Make it public

```bash
alva fs grant --path '~/feeds/btc-ema/v1' --subject "special:user:*" --permission read
```

### Step 4: Read from any client

```bash
alva fs read --path '/alva/home/alice/feeds/btc-ema/v1/data/metrics/prices/@last/100'
```

### Step 5: Deploy as a cronjob (required for live playbooks)

```bash
alva deploy create --name btc-ema-update --path '~/feeds/btc-ema/v1/src/index.js' --cron "0 */4 * * *"
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

During development, clear stale data via the CLI. **This is for development
only -- do not use in production.**

```bash
# Clear a specific time series output (e.g. market/ohlcv)
alva fs remove --path '~/feeds/my-feed/v1/data/market/ohlcv' --recursive

# Clear an entire group (all outputs under "market")
alva fs remove --path '~/feeds/my-feed/v1/data/market' --recursive

# Full reset: clear ALL data + KV state (removes the data mount, re-created on next run)
alva fs remove --path '~/feeds/my-feed/v1/data' --recursive
```

Clearing time series also removes the associated typedoc (schema metadata). KV
state (watermarks) is cleared when you clear the entire feed data directory.
