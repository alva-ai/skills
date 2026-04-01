---
name: alva
description: >-
  Use this skill when the user asks for financial data ("price of BTC",
  "P/E ratio of NVDA"), market analysis, stock or crypto research, quant
  strategies, backtesting ("backtest a momentum strategy"), tracking assets
  or portfolios, or help turning investing ideas into live playbooks,
  dashboards, and analytics on Alva.
  Powered by 250+ financial data sources across crypto, equities, macro,
  on-chain, and social data, along with cloud-side analytics and backtesting.
  Also use when the user asks about Alva platform capabilities.
metadata:
  author: alva
  version: v1.3.0
---

# Alva

## What is Alva

Alva is an agentic finance platform. It provides unified access to 250+
financial data sources spanning crypto, equities, ETFs, macroeconomic
indicators, on-chain analytics, and social sentiment -- including spot and
futures OHLCV, funding rates, company fundamentals, price targets, insider and
senator trades, earnings estimates, CPI, GDP, Treasury rates, exchange flows,
DeFi metrics, news feeds, social media and more!

## What Alva Skills Enables

The Alva skill connects any AI agent or IDE to the full Alva platform. With it
you can:

- **Access financial data** -- query any of Alva's 250+ data SDKs
  programmatically, or bring your own data via HTTP API or direct upload.
- **Run cloud-side analytics** -- write JavaScript that executes on Alva Cloud
  in a secure runtime. No local compute, no dependencies, no infrastructure to
  manage.
- **Build agentic playbooks** -- create data pipelines, trading strategies, and
  scheduled automations that run continuously on Alva Cloud.
- **Deploy trading strategies** -- backtest with the Altra trading engine and
  run continuous live paper trading.
- **Release and share** -- turn your work into a hosted playbook web app at
  `https://alva.ai/u/<username>/playbooks/<playbook_name>`, and share it with
  the world.
- **Remix existing playbooks** -- take any published playbook as a template,
  read its feed scripts and HTML source, customize parameters/logic/UI, and
  deploy as your own new playbook.

In short: turn your ideas into a forever-running finance agent that gets things
done for you.

## Pre-flight

**Run these checks on first use each session** before doing anything else.

### 1. Version Check

```bash
bash "<this skill's directory>/scripts/version_check.sh"
```

- No output → up to date, proceed.
- Output present → display to user, apply the update, then proceed.

### 2. API Key

| Variable        | Required | Description                                              |
| --------------- | -------- | -------------------------------------------------------- |
| `ALVA_API_KEY`  | **yes**  | Your API key ([alva.ai](https://alva.ai))                |
| `ALVA_ENDPOINT` | no       | API base URL. Defaults to `https://api-llm.prd.alva.ai`  |

Read `.env` in this skill's directory. If `api_key` is present, set
`ALVA_API_KEY` from it. If missing or empty, **ask the user whether they already
have a key**:

- **Has a key** — ask them to paste it, write it to `.env`, and verify:

  ```bash
  export ALVA_API_KEY="<key>"
  curl -s -H "X-Alva-Api-Key: $ALVA_API_KEY" "${ALVA_ENDPOINT:-https://api-llm.prd.alva.ai}/api/v1/me"
  ```

  On success, suggest persisting in their shell profile. Then offer starting
  points:
  - "Ask me something like 'Who's been buying NVDA insider shares this month?'"
  - "Or build a live dashboard, backtest a strategy, or set up a data pipeline."

- **No key** — sign up at [alva.ai](https://alva.ai), create a key under
  Settings → API Keys, paste it back, then verify as above.

`.env` format:

```dotenv
api_key=alva_...
```

`ALVA_API_KEY` authenticates to Alva itself. Third-party vendor secrets belong
in Alva Secret Manager (`require("secret-manager")`).

### 3. User Profile

Call `GET /api/v1/me` and store the response:

```
GET /api/v1/me
→ {"id":1, "subscription_tier":"free", "telegram_username":"alice_tg", "username":"alice"}
```

Session variables:

- **`username`** — for public URLs and ALFS paths.
- **`subscription_tier`** — `"pro"` or `"free"` (default). Determines release
  flow (Step 7): pro can keep playbooks private.
- **`telegram_username`** — if set, recommend push-enabled feeds; if null,
  guide user to connect Telegram first.

### Making API Requests

All API examples use HTTP notation (`METHOD /path`). Every request requires
`X-Alva-Api-Key` unless marked **(public, no auth)**.

```bash
# Authenticated
curl -s -H "X-Alva-Api-Key: $ALVA_API_KEY" "$ALVA_ENDPOINT{path}"

# Authenticated + JSON body
curl -s -H "X-Alva-Api-Key: $ALVA_API_KEY" -H "Content-Type: application/json" \
  "$ALVA_ENDPOINT{path}" -d '{body}'

# Public read (no API key)
curl -s "$ALVA_ENDPOINT{path}"
```

---

## Request Routing

Classify every user request and make sure the response covers the core
objectives for that path. Treat the routes below as guidance rather than a rigid checklist, but still cover the necessary steps for the selected path.

| Request Type | Core Objectives |
| --- | --- |
| **Dashboard / Playbook** | Identify the needed data sources, validate the data flow, and produce a usable dashboard or playbook when the user wants a shareable artifact |
| **Backtest / Strategy** | Use Altra, run the backtest correctly, and package the results in the form that best covers the user's goal (analysis, metrics, visualization, or a shareable playbook) |
| **Data Query** | Fetch the requested data accurately and return it directly unless the user asks for a richer artifact |
| **Remix** | Reuse the source artifact, apply the requested changes, and return an updated result that matches the requested customization |

### Completion Gate

For **Dashboard/Playbook** and **Backtest/Strategy** requests, the default goal
is to leave the user with a result they can actually use. In many cases that
means a released playbook and a `published_url`, but do not force that path if
the user only asked for code, analysis, debugging help, or an intermediate
artifact.

Before finishing, verify that the delivered result matches the user's actual
goal. When a shareable playbook was part of the task, verify:

- [ ] A playbook was released and a `published_url` was returned

---

## Content Legitimacy Rules

These rules are **non-negotiable**. Violations produce misleading playbooks that
display fabricated data as if it were real. Every rule below applies to all
playbook builds.

### Data Sourcing

1. **All quantitative data displayed in charts, tables, or KPI cards MUST
   originate from Alva feeds** (SDK modules or BYOD via `require("net/http")`).
   Never hardcode data as inline JavaScript literals in playbook HTML.

2. **Playbook HTML MUST fetch data at runtime** from feed output paths:

   ```javascript
   const resp = await fetch(
     "$ALVA_ENDPOINT/api/v1/fs/read?path=/alva/home/<user>/feeds/<name>/v1/data/<group>/<output>/@last/<n>",
   );
   const data = await resp.json();
   renderChart(data);
   ```

   Static content (labels, colors, layout config) is fine. Quantitative data is
   not — it must flow through the feed pipeline.

### Prohibited Data Sources for Charts and Tables

1. **WebSearch / WebFetch results must NOT be embedded as data.** Web search is
   only legitimate for: reading documentation, finding API endpoints for BYOD,
   understanding user requirements. Never inject web search results as static
   data literals in feed scripts or playbook HTML.

2. **LLM / ADK output must NOT be presented as factual sourced data.** ADK is
   for reasoning, classification, summarization, and synthesis of real data — not
   for generating numbers, statistics, events, or reports that claim to be from
   real sources. If ADK produces quantitative output, it must be clearly labeled
   as "AI-generated analysis".

3. **Agent training knowledge must NOT fill data gaps.** If an SDK does not have
   the requested data type, report the gap as a blocker. Do not invent data from
   your own knowledge to fill the hole.

### SDK Coverage Gaps

1. **When an SDK partition lacks the requested data type, report it as a
   blocker.** For example, if `equity_events_calendar` only has dividends/splits
   but the user wants FDA events, report this gap. Suggest BYOD alternatives
   (`require("net/http")` to a live API) if one exists. Do NOT fabricate events.

2. **When >20% of requested symbols fail SDK lookup, report a data-quality
   blocker.** Do not silently substitute with estimated or fabricated values
   marked `live: false`.

### Description and Provenance Accuracy

1. **Playbook descriptions and methodology sections must only list data sources
   that were actually called successfully.** Do not claim "Brave Search",
   "ClinicalTrials.gov", or any other source unless the feed script actually
   fetches from it at runtime.

2. **Update frequency claims must match actual deployment.** If cronjob
   deployment failed, do not claim "updated every N hours" in the playbook
   description. Either fix the cronjob or remove the claim.

---

## Capabilities & Common Workflows

### 1. ALFS (Alva FileSystem)

The foundation of the platform. ALFS is a cloud filesystem with per-user
isolation. Every user has a private home directory; all paths are private by
default and only accessible by the owning user. Public read access can be
explicitly granted on specific paths via `grant`. Scripts, data feeds, playbook
assets, and shared libraries all live on ALFS.

Key operations: read, write, mkdir, stat, readdir, remove, rename, copy,
symlink, chmod, grant, revoke.

### 2. JS Runtime

Run JavaScript on Alva Cloud in a sandboxed V8 isolate. Code executed inside
Alva's `/api/v1/run` runtime runs entirely on Alva's servers -- it cannot access
the host machine's filesystem, environment variables, or processes. The runtime
has access to ALFS, all 250+ SDKs, HTTP networking, LLM access, and the Feed
SDK.

### 3. SDKHub

250+ built-in financial data SDKs. To find the right SDK for a task, use the
two-step retrieval flow:

1. **Pick a partition** from the index below.
2. **Call `GET /api/v1/sdk/partitions/:partition/summary`** to see module
   summaries, then load the full doc for the chosen module.

**SDK doc lookup is mandatory.** Always look up SDK documentation before writing
any feed script. Do not guess function signatures, parameter names, or response
shapes from memory. The doc lookup ensures you use the correct module, call the
right function, and handle the actual response format.

#### SDK Partition Index

| Partition                                 | Description                                                                                                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spot_market_price_and_volume`            | Spot OHLCV for crypto and equities. Price bars, volume, historical candles.                                                                                             |
| `crypto_futures_data`                     | Perpetual futures: OHLCV, funding rates, open interest, long/short ratio.                                                                                               |
| `crypto_technical_metrics`                | Crypto technical & on-chain indicators: MA, EMA, RSI, MACD, Bollinger, MVRV, SOPR, NUPL, whale ratio, market cap, FDV, etc. (20 modules)                                |
| `crypto_exchange_flow`                    | Exchange inflow/outflow data for crypto assets.                                                                                                                         |
| `crypto_fundamentals`                     | Crypto market fundamentals: circulating supply, max supply, market dominance.                                                                                           |
| `crypto_screener`                         | Screen crypto assets by technical metrics over custom time ranges.                                                                                                      |
| `company_crypto_holdings`                 | Public companies' crypto token holdings (e.g. MicroStrategy BTC).                                                                                                       |
| `equity_fundamentals`                     | Stock fundamentals: income statements, balance sheets, cash flow, margins, PE, PB, ROE, ROA, EPS, market cap, dividend yield, enterprise value, etc. (31 modules)       |
| `equity_estimates_and_targets`            | Analyst price targets, consensus estimates, earnings guidance.                                                                                                          |
| `equity_events_calendar`                  | Dividend calendar, stock split calendar.                                                                                                                                |
| `equity_ownership_and_flow`               | Institutional holdings, insider trades, senator trading activity.                                                                                                       |
| `stock_screener`                          | Screen stocks by sector, industry, country, exchange, IPO date, earnings date, financial & technical metrics. (9 modules)                                               |
| `stock_technical_metrics`                 | Stock technical indicators: beta, volatility, Bollinger, EMA, MA, MACD, RSI-14, VWAP, avg daily dollar volume.                                                          |
| `etf_fundamentals`                        | ETF holdings breakdown.                                                                                                                                                 |
| `macro_and_economics_data`                | CPI, GDP, unemployment, federal funds rate, Treasury rates, PPI, consumer sentiment, VIX, TIPS, nonfarm payroll, retail sales, recession probability, etc. (20 modules) |
| `technical_indicator_calculation_helpers` | 50+ pure calculation helpers: RSI, MACD, Bollinger Bands, ATR, VWAP, Ichimoku, Parabolic SAR, KDJ, OBV, etc. Input your own price arrays.                               |
| `feed_widgets`                            | Social & news subscription feeds: news, Twitter/X, YouTube, Reddit, podcasts. For subscribing to specific accounts/channels.                                            |

For unstructured content — news articles, social discussions, videos, podcasts
— see [Content Search](#content-search) below.

You can also bring your own data by uploading files to ALFS or fetching from
external HTTP APIs within the runtime.

#### Content Search

Search across Twitter/X, news, Reddit, YouTube, podcasts, and general web.
Use whenever the playbook needs content beyond structured data SDKs — from
targeted queries ("what are people saying about NVDA earnings") to broad
discovery ("trending crypto discussions this week"), including social
discussions, market narratives, news coverage, sentiment, analyst commentary,
and community reactions.

Content search modules are called directly in code (not via the partition
API). See [search.md](references/search.md) for per-source SDK usage,
enrichment patterns, and gotchas.

### 4. Altra (Alva Trading Engine)

A feed-based event-driven backtesting engine for quantitative trading
strategies. A trading strategy IS a feed: all output data (targets, portfolio,
orders, equity, metrics) lives under a single feed's ALFS path. Altra supports
historical backtesting and continuous live paper trading, with custom
indicators, portfolio simulation, and performance analytics.

### 5. Deploy on Alva Cloud

Once your data analytics scripts and feeds are ready, deploy them as scheduled
cronjobs on Alva Cloud. They run continuously on your chosen schedule (e.g.
every hour, every day). All data is private by default; grant public access to
specific paths so anyone -- or any playbook page -- can read the data.

**User scope enforcement**: All write, deploy, and release operations MUST
target only the requesting user's namespace. Before any `fs/write`,
`draft/playbook`, or `release/playbook` call, verify the target path and
username match the authenticated user (from `GET /api/v1/me`). If you have
access to multiple API keys (e.g. from prior sessions), identify the requesting
user and scope all operations to that user only. Do NOT write to or release
playbooks under other users' namespaces unless the request explicitly asks for
cross-user operations (e.g. remix with lineage).

**Signal feeds require Altra**: Any feed that produces `signal/targets` or
`signal/alerts` output MUST use `FeedAltra`. Manual signal construction
(building target records without Altra) bypasses bar alignment, portfolio
simulation, and look-ahead bias prevention. Use `FeedAltra` even for simple
signal logic — it ensures correct timestamps and prevents forward-looking bugs.

**Push notifications for followers:** Feeds can produce actionable,
subscription-worthy signals that get pushed to playbook followers via Telegram.
To make a feed push-capable:

1. Add a `signal/targets` output to the feed script (see
   [feed-sdk.md](references/feed-sdk.md) Pattern D) and write signal records
   using the Altra target format (`{date, instruction, meta}`), where
   `meta.reason` is the human-readable message followers will see.
2. Set `"push_notify": true` in the `POST /api/v1/deploy/cronjob` request, or
   update the existing cronjob to set `"push_notify": true`.

The platform reads `/data/signal/targets/@last/1` after each successful
execution and pushes the signal content to all eligible followers.

See **Step 9** below for the full post-release subscription flow.

### 6. Build the Playbook Web App

After your data pipelines are deployed and producing data, build the playbook's
web interface. Create HTML5 pages with Alva Design System that read from Alva's
data gateway and visualize the results. Follow the Alva Design System for
styling, layout, and component guidelines. Unless the user explicitly asks for a
static snapshot, default to a live playbook.
**Data fetching requirement**: Apply the
[Content Legitimacy Rules](#content-legitimacy-rules) when building the UI.
All quantitative data in charts, tables, or KPI cards must come from feed
outputs read at runtime (no inline literals for data).

### 7. Release

#### Common steps (all users)

1. **Write HTML to ALFS**: `POST /api/v1/fs/write` the playbook HTML to
   `~/playbooks/{name}/index.html`.
2. **Create playbook draft**: `POST /api/v1/draft/playbook` — creates DB
   records, writes draft files and `playbook.json` to ALFS automatically.
   This request must include both the URL-safe `name` and the human-readable
   `display_name`. Use `[subject/theme] [analysis angle/strategy logic]`, put
   the subject/theme first, and keep it within 40 characters. Avoid personal
   markers such as `My`, `Test`, or `V2`, and generic-only titles such as
   `Stock Dashboard` or `Trading Bot`.
   **Trading symbols**: If the playbook involves specific trading assets,
   include `"trading_symbols"` in the request — an array of base asset
   tickers (e.g. `["BTC", "ETH"]`, `["NVDA", "AAPL"]`). The backend
   resolves each symbol to a full trading pair object and stores the result
   in the playbook metadata. Max 50 symbols per request. Unknown symbols
   are silently skipped.
3. **Screenshot**: Take a screenshot to verify the playbook renders correctly:

   ```
   GET /api/v1/screenshot?url=$ALVA_ENDPOINT/u/<username>/playbooks/<playbook_name>
   ```

   Pass `X-Alva-Api-Key` header so the screenshot service can access
   authenticated content. See
   [screenshot.md](references/api/screenshot.md) for full parameter details.

#### Pro users (`subscription_tier = "pro"`)

1. **Show draft link**: Output the playbook URL —
   `https://alva.ai/u/<username>/playbooks/<playbook_name>`. The draft is
   accessible only to the creator.
2. **Ask**: "Your playbook is ready. Would you like to publish it publicly, or
   keep it private for now?"
   - **Publish** → call `POST /api/v1/release/playbook` → output the public
     URL.
   - **Keep private** → done. Remind the user that only they can access the
     draft URL.

#### Free users (`subscription_tier = "free"`)

1. **Publish directly**: Call `POST /api/v1/release/playbook` — free playbooks
   are always public. Output the public URL:
   `https://alva.ai/u/<username>/playbooks/<playbook_name>`
2. **Upsell only on friction**: Do **not** proactively suggest upgrading.
   But when the user's experience is degraded because of free-tier
   limitations — wanting private playbooks, hitting the cronjob cap,
   resource limits, or any other pro-gated feature — acknowledge the
   limitation and offer the upgrade path:
   "This feature is available on the Pro plan. You can upgrade at
   <https://alva.ai/pricing> to [specific benefit, e.g. keep playbooks
   private / deploy more cronjobs / ...]."

Use the playbook `name` and the username from `GET /api/v1/me` to construct
URLs.

#### Pre-Release Validation

Before calling `POST /api/v1/release/playbook`, verify all of the following:

1. **Cronjobs are active**: All feeds referenced by the playbook have
   successfully deployed cronjobs. If `deploy/cronjob` returned `RATE_LIMITED`,
   see [Cronjob Rate Limit Recovery](#cronjob-rate-limit-recovery) below.
2. **HTML fetches from feeds**: The playbook HTML reads quantitative data from
  feed output paths at runtime (not from inline literals), consistent with the
  [Content Legitimacy Rules](#content-legitimacy-rules).
3. **Data is fresh**: Read the latest data point from each referenced feed
   (via `@last/1`) and check its timestamp. If the latest timestamp is older
   than 2x the cron interval, warn the user that the playbook will display
   stale data.
4. **Description is accurate**: Update frequency claims match actual cronjob
   status. Data source claims match actual SDK/BYOD calls in the feed script.
5. **Target user is correct**: The playbook is being released under the
   requesting user's namespace (see user scope enforcement above).

### 8. Remix (Create from Existing Playbook)

Users can remix any published playbook to create a customized version. The Remix
prompt uses the format `@{owner}/{name}` to identify the source playbook — e.g.
`Playbook(@alice/btc-momentum)`. The agent reads the source playbook's feed
scripts (strategy logic) and HTML (dashboard UI), customizes them per the user's
request, and deploys a new playbook under their own namespace. If the user does
not specify what to change, the agent should ask before proceeding.

See [remix-workflow.md](references/remix-workflow.md) for the full step-by-step
guide.

### 9. Post-release push notification flow

After a playbook is **released or kept as draft** (Step 7 complete), proactively
evaluate whether any deployed feeds produce push-worthy content. Do not wait for
the user to ask.

#### Identify push-worthy feeds

Scan the feeds backing this playbook and classify each:

- **Push-worthy** (recommend): price signals, crossover/breakout alerts,
  trading instructions, anomaly detection, periodic research summaries —
  anything actionable and time-sensitive.
- **Not push-worthy** (skip): static fundamentals, historical snapshots,
  low-frequency reference data.

If no feed qualifies, skip this flow entirely.

#### Check Telegram binding

Read `telegram_username` from the session (Pre-flight Step 3):

- **Connected** (non-null) → proceed to recommend.
- **Not connected** (null) → tell the user:
  "To receive push notifications, connect your Telegram at
  <https://alva.ai/settings>. After connecting, I can set up push alerts for
  [specific feed description]."
  Then skip the rest of this flow. The user can return to this later.

#### Recommend specific feeds

Present a concrete recommendation, not a generic "want push?":

> "This playbook's **BTC EMA crossover signal** feed produces actionable
> alerts when the trend flips. Want to enable Telegram push notifications
> for it?"

- **User says yes** → add `signal/targets` output to the feed (see
  [feed-sdk.md](references/feed-sdk.md) Pattern D), set `push_notify: true`
  on the cronjob, and confirm.
- **User says no** → accept and move on. Do not ask again.
- **User requests push for a different feed** → honor their choice and
  configure accordingly.

If the feed already has `signal/targets` and `push_notify: true`, skip — it's
already configured.

---

**Detailed sub-documents** (read these for in-depth reference):

| Document | Contents |
| --- | --- |
| `references/api/*.md` | Split REST API reference docs (user info, filesystem, run, deploy, release, SDK, screenshots, and errors) |
| [jagent-runtime.md](references/jagent-runtime.md) | Writing jagent scripts: module system, built-in modules, async model, constraints |
| [feed-sdk.md](references/feed-sdk.md) | Feed SDK guide: creating data feeds, time series, upstreams, state management |
| [altra-trading.md](references/altra-trading.md) | Altra backtesting engine: strategies, features, signals, testing, debugging |
| [deployment.md](references/deployment.md) | Deploying scripts as cronjobs for scheduled execution |
| [design-system.md](references/design-system.md) | Alva Design System entry point: tokens, typography, layout; links to widget, component, and playbook specs |
| [remix-workflow.md](references/remix-workflow.md) | Remix: create a new playbook from an existing template |
| [adk.md](references/adk.md) | Agent Development Kit: `adk.agent()` API, tool calling, ReAct loop, examples |
| [search.md](references/search.md) | Content search SDKs: per-source usage, enrichment patterns, and gotchas for Twitter/X, news, Reddit, YouTube, podcasts, and web |
| [secret-manager.md](references/secret-manager.md) | Secret upload, CRUD API, and runtime usage via `require("secret-manager")` |
| [skill-trace-finalize.md](references/skill-trace-finalize.md) | Skill trace upload (`POST .../skill-trace/finalize`), aligned with `skill_trace_full_reference.md`; planning — final step must be finalize |

---

## API Reference

**Important**: Always read the API reference docs before making API requests.

**Base URL**: `$ALVA_ENDPOINT` (defaults to `https://api-llm.prd.alva.ai`).

Examples use HTTP notation (`METHOD /path`). Auth (`X-Alva-Api-Key` header) is
required on every request unless marked **(public, no auth)**. See `Setup`
above for curl templates.

Reference docs:

- [User Info](references/api/user-info.md)
- [Secrets](references/api/secrets.md)
- [Filesystem](references/api/filesystem.md)
- [Run](references/api/run.md)
- [Deploy Cronjob](references/api/deploy-cronjob.md)
- [Release](references/api/release.md)
- [Remix](references/api/remix.md)
- [SDK](references/api/sdk.md)
- [Playbook Comments](references/api/playbook-comment.md)
- [Screenshot](references/api/screenshot.md)
- [Error Responses](references/api/error-responses.md)

Additional endpoints that remain documented inline or in dedicated docs:

- trading pair search: `GET /api/v1/trading-pairs/search?q={q}`
- skill trace finalize: `POST /api/v1/skill-trace/finalize`

---

## Runtime Modules Quick Reference

Scripts executed via `/api/v1/run` run in a sandboxed V8 isolate on Alva's
servers -- they cannot access the host machine's filesystem, environment
variables, or shell. Host-agent permissions still apply. See
[jagent-runtime.md](references/jagent-runtime.md) for full details.

| Module          | require()                    | Description                                                             |
| --------------- | ---------------------------- | ----------------------------------------------------------------------- |
| alfs            | `require("alfs")`            | Filesystem (uses absolute paths `/alva/home/<username>/...`)            |
| env             | `require("env")`             | `userId`, `username`, `args` from request                               |
| secret-manager  | `require("secret-manager")`  | Read user-scoped third-party secrets stored in Alva Secret Manager      |
| net/http        | `require("net/http")`        | `fetch(url, init)` for async HTTP requests                              |
| @alva/algorithm | `require("@alva/algorithm")` | Statistics                                                              |
| @alva/feed      | `require("@alva/feed")`      | Feed SDK for persistent data pipelines + FeedAltra trading engine       |
| @alva/adk       | `require("@alva/adk")`       | Agent SDK for LLM requests — `agent()` for LLM agents with tool calling |
| @test/suite     | `require("@test/suite")`     | Jest-style test framework (`describe`, `it`, `expect`, `runTests`)      |

**SDKHub**: 250+ data modules available via
`require("@arrays/crypto/ohlcv:v1.0.0")` etc. Version suffix is optional
(defaults to `v1.0.0`). To discover function signatures and response shapes, use
the SDK doc API (`GET /api/v1/sdk/doc?name=...`).

**Secret Manager**: use `const secret = require("secret-manager");` then
`secret.loadPlaintext("OPENAI_API_KEY")`. This returns a string when present or
`null` when the current user has not uploaded that secret.

**Key constraints**: No top-level `await` (wrap script in
`(async () => { ... })();`). No Node.js builtins (`fs`, `path`, `http`). Module
exports are frozen.

---

## Feed SDK Quick Reference

See [feed-sdk.md](references/feed-sdk.md) for full details.

Feeds are persistent data pipelines that store time series data, readable via
filesystem paths.

```javascript
const { Feed, feedPath, makeDoc, num } = require("@alva/feed");
const { getCryptoKline } = require("@arrays/crypto/ohlcv:v1.0.0");
const { indicators } = require("@alva/algorithm");

const feed = new Feed({ path: feedPath("btc-ema") });

feed.def("metrics", {
  prices: makeDoc("BTC Prices", "Close + EMA10", [num("close"), num("ema10")]),
});

(async () => {
  await feed.run(async (ctx) => {
    const raw = await ctx.kv.load("lastDate");
    const lastDateMs = raw ? Number(raw) : 0;

    const now = Math.floor(Date.now() / 1000);
    const start =
      lastDateMs > 0 ? Math.floor(lastDateMs / 1000) : now - 30 * 86400;

    const bars = getCryptoKline({
      symbol: "BTCUSDT",
      start_time: start,
      end_time: now,
      interval: "1h",
    })
      .response.data.slice()
      .reverse();
    const closes = bars.map((b) => b.close);
    const ema10 = indicators.ema(closes, { period: 10 });

    const records = bars
      .map((b, i) => ({
        date: b.date,
        close: b.close,
        ema10: ema10[i] || null,
      }))
      .filter((r) => r.date > lastDateMs);

    if (records.length > 0) {
      await ctx.self.ts("metrics", "prices").append(records);
      await ctx.kv.put("lastDate", String(records[records.length - 1].date));
    }
  });
})();
```

Feed output is readable at: `~/feeds/btc-ema/v1/data/metrics/prices/@last/100`

---

## Data Modeling Patterns

All data produced by a feed should use `feed.def()` + `ctx.self.ts().append()`.
Do not use `alfs.writeFile()` for feed output data.

**Pattern A -- Snapshot (latest-wins)**: For data that represents current state
(company detail, ratings, price target consensus). Use start-of-day as the date
so re-runs overwrite.

```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);
await ctx.self
  .ts("info", "company")
  .append([
    { date: today.getTime(), name: company.name, sector: company.sector },
  ]);
```

Read `@last/1` for current snapshot, `@last/30` for 30-day history.

**Pattern B -- Event log**: For timestamped events (insider trades, news,
senator trades). Each event uses its natural date. Same-date records are
auto-grouped.

```javascript
const records = trades.map((t) => ({
  date: new Date(t.transactionDate).getTime(),
  name: t.name,
  type: t.type,
  shares: t.shares,
}));
await ctx.self.ts("activity", "insiderTrades").append(records);
```

**Pattern C -- Tabular (versioned batch)**: For data where the whole set
refreshes each run (top holders, EPS estimates). Stamp all records with the same
run timestamp; same-date grouping stores them as a batch.

```javascript
const now = Date.now();
const records = holdings.map((h, i) => ({
  date: now,
  rank: i + 1,
  name: h.name,
  marketValue: h.value,
}));
await ctx.self.ts("research", "institutions").append(records);
```

| Data Type               | Pattern                | Date Strategy   | Read Query  |
| ----------------------- | ---------------------- | --------------- | ----------- |
| OHLCV, indicators       | Time series (standard) | Bar timestamp   | `@last/252` |
| Company detail, ratings | Snapshot (A)           | Start of day    | `@last/1`   |
| Insider trades, news    | Event log (B)          | Event timestamp | `@last/50`  |
| Holdings, estimates     | Tabular (C)            | Run timestamp   | `@last/N`   |

See [feed-sdk.md](references/feed-sdk.md) for detailed data modeling examples
and deduplication behavior.

---

## Deploying Feeds

Every feed follows a 6-step lifecycle including every newly created feed or re-created feed:

1. **Write** -- define schema + incremental logic with `ctx.kv`
2. **Upload** -- write script to `~/feeds/<name>/v1/src/index.js`
3. **Test** -- `POST /api/v1/run` with `entry_path` to verify output
4. **Grant** -- make feed data publicly readable:

   ```
   POST /api/v1/fs/grant
   {"path":"~/feeds/<name>","subject":"special:user:*","permission":"read"}
   ```

   Grant on the feed root path (not on `data/`). Subject format:
   `special:user:*` (public), `special:user:+` (authenticated only), `user:<id>`
   (specific user).
5. **Deploy** -- `POST /api/v1/deploy/cronjob` for scheduled execution
6. **Release** -- `POST /api/v1/release/feed` to register the feed in the
   database (requires the `cronjob_id` from the deploy step)

| Data Type                     | Recommended Schedule     | Rationale                           |
| ----------------------------- | ------------------------ | ----------------------------------- |
| Stock OHLCV + technicals      | `0 */4 * * *` (every 4h) | Markets update during trading hours |
| Company detail, price targets | `0 8 * * *` (daily 8am)  | Changes infrequently                |
| Insider/senator trades        | `0 8 * * *` (daily 8am)  | SEC filings are daily               |
| Earnings estimates            | `0 8 * * *` (daily 8am)  | Updated periodically                |

See [deployment.md](references/deployment.md) for the full deployment guide and
API reference.

---

## Error Transparency

When SDK modules fail or are unavailable, you MUST be transparent with the user.
Do not silently fall back to inferior data sources.

### Pro / Subscription-Gated SDKs

When an SDK module returns a Pro-only or subscription error:

1. **Inform the user** which module is unavailable and why (subscription tier).
2. **Explain what capability is lost** (e.g. "senator trading data requires
   Pro — this playbook won't include congressional trading activity").
3. If falling back to an alternative source, **clearly state** what the fallback
   is and its limitations (e.g. "Using web search as fallback — data may be
   incomplete or unverified").
4. Never silently substitute with LLM-fabricated data.

### Coverage Limitations

When the user requests data outside Alva's supported asset classes (e.g. forex
pairs, which are not in SDKHub), state the limitation upfront rather than
discovering it through failed searches. Suggest BYOD alternatives if a public
API exists.

---

## Debugging Feeds

### Resetting Feed Data (development only)

During development, use the REST API to clear stale or incorrect data. **Do not
use this in production.**

```
# Clear a specific time series output
DELETE /api/v1/fs/remove?path=~/feeds/my-feed/v1/data/market/ohlcv&recursive=true

# Clear an entire group (all outputs under "market")
DELETE /api/v1/fs/remove?path=~/feeds/my-feed/v1/data/market&recursive=true

# Full reset: clear ALL data + KV state (removes the data mount, re-created on next run)
DELETE /api/v1/fs/remove?path=~/feeds/my-feed/v1/data&recursive=true
```

### Inline Debug Snippets

Test SDK shapes before building a full feed:

```
POST /api/v1/run
{"code":"const { getCryptoKline } = require(\"@arrays/crypto/ohlcv:v1.0.0\"); JSON.stringify(Object.keys(getCryptoKline({ symbol: \"BTCUSDT\", start_time: 0, end_time: 0, interval: \"1h\" })));"}
```

---

## Skill trace upload

For any turn that uses this skill and should be persisted for future reference, include a brief note in the plan that the trace will be uploaded according to [skill-trace-finalize.md](references/skill-trace-finalize.md).

This is mainly so the turn can be referenced and audited later when needed, including lightweight one-off lookups that may still be worth preserving.

Before the final user-visible answer, call `POST /api/v1/skill-trace/finalize` once to upload the trace. You must read reference [skill-trace-finalize.md](references/skill-trace-finalize.md) before calling the API.

---

## Secret Manager

Use Alva Secret Manager whenever a playbook or runtime script needs a
third-party credential such as an LLM API key, search token, exchange key, or
webhook secret.

- **Preferred upload path**: ask the user to add or edit the secret in the web
  UI at <https://alva.ai/apikey>. Assume this page is available.
- **Do not ask the user to paste sensitive third-party secrets into chat** when
  the web upload flow is feasible.
- **Do not hardcode secrets** in source code, ALFS files, `.env`, shell
  snippets, or released playbook assets.
- **Runtime access**: load secrets inside Alva Cloud code with
  `require("secret-manager").loadPlaintext("NAME")`.
- `loadPlaintext(name)` returns the plaintext string when present, or `null`
  when the secret is missing for the current user.
- If a required secret is missing, stop and tell the user exactly which secret
  name to upload at <https://alva.ai/apikey>.
- For agent-managed setup, inspection, or cleanup, authenticated CRUD endpoints
  are available under `/api/v1/secrets`.

Read [secret-manager.md](references/secret-manager.md) whenever the task
involves uploading, naming, rotating, listing, or using third-party secrets.

---

## Altra Trading Engine Quick Reference

**Always use Altra for backtesting.** Altra handles bar.endTime timestamps,
data alignment, and portfolio simulation automatically. Do not manually loop
over SDK data (e.g. `getCryptoKline`) to evaluate trading conditions — this
leads to incorrect timestamps and look-ahead bias. Use Altra even for simple
strategies; it supports any interval (`"1min"` to `"1w"`) and any combination
of OHLCV + external data via `registerRawData`.

**After a successful backtest, you should package the results in a form the user
can use.** That may be a playbook, a dashboard, or a concise analytical summary,
depending on the request. A backtest that only prints raw console output is
usually incomplete — see
[Request Routing](#request-routing) above.

See [altra-trading.md](references/altra-trading.md) for full details.

```javascript
const { createOHLCVProvider } = require("@arrays/data/ohlcv-provider:v1.0.0");
const { FeedAltraModule } = require("@alva/feed");
const { FeedAltra, e, Amount } = FeedAltraModule;

const altra = new FeedAltra(
  {
    path: "~/feeds/my-strategy/v1",
    startDate: Date.parse("2025-01-01T00:00:00Z"),
    portfolioOptions: { initialCash: 1_000_000 },
    simOptions: { simTick: "1min", feeRate: 0.001 },
    perfOptions: { timezone: "UTC", marketType: "crypto" },
  },
  createOHLCVProvider(),
);

const dg = altra.getDataGraph();
dg.registerOhlcv("BINANCE_SPOT_BTC_USDT", "1d"); // any interval: "1min" to "1w"
dg.registerFeature({ name: "rsi" /* ... */ });

altra.setStrategy(strategyFn, {
  trigger: { type: "events", expr: e.ohlcv("BINANCE_SPOT_BTC_USDT", "1d") },
  inputConfig: {
    ohlcvs: [{ id: { pair: "BINANCE_SPOT_BTC_USDT", interval: "1d" } }],
    features: [{ id: "rsi" }],
  },
  initialState: {},
});

(async () => {
  await altra.run(Date.now());
})();
```

---

## ADK (Agent Development Kit) Quick Reference

See [adk.md](references/adk.md) for the full API, tool-calling patterns, memory
patterns, and implementation examples.

ADK is a universal agent development kit that runs inside the Jagent V8 runtime.
Use it to build LLM-powered agents that can reason over tasks, call tools,
gather context from multiple sources, and return structured outputs.

It is best suited for workflows where the "thinking" step cannot be expressed as
pure deterministic code, such as research synthesis, document analysis,
classification, and summarization over real upstream data.

### When to Use ADK

Use ADK when you need an agent to:

- Fetch real data through tools, APIs, SDKs, or files
- Reason over multiple inputs before producing an answer
- Synthesize findings into structured notes, summaries, or classifications
- Power periodic research or analysis workflows that run on a schedule
- Add an LLM-driven transformation step inside a larger data pipeline

### When NOT to Use ADK

ADK must **never** be used to fabricate data that should come from real sources.
Specifically:

- Do NOT use ADK to generate hiring statistics, financial events, analyst
  reports, or any quantitative data that claims to originate from a real data
  pipeline.
- Do NOT present ADK-generated content as if it were sourced from SDKs, APIs,
  or databases.
- If a data source is unavailable, report the limitation as a blocker — do not
  use ADK as a fallback data generator.

ADK output that involves reasoning over real data (sentiment classification,
trend summarization) is fine, but must be labeled as AI-generated analysis.

---

## Deployment Quick Reference

See [deployment.md](references/deployment.md) for full details.

Deploy feed scripts or tasks as cronjobs for scheduled execution:

```
POST /api/v1/deploy/cronjob
{"path":"~/feeds/btc-ema/v1/src/index.js","cron_expression":"0 */4 * * *","name":"btc-ema-update"}
```

Cronjobs execute the script via the same jagent runtime as `/api/v1/run`. Max 20
cronjobs per user. Min interval: 1 minute.

**Name format**: All resource names (cronjobs, feeds, playbooks) must be 1–63
lowercase alphanumeric characters or hyphens, and cannot start or end with a
hyphen (DNS label format). Example: `btc-ema-update`, not `BTC EMA Update`.

After deploying a cronjob, register the feed, create a playbook draft, then
release the playbook for public hosting. The playbook HTML must already be
written to ALFS at `~/playbooks/{name}/index.html` via `fs/write` before
releasing.

**Important**: Feed names and playbook names must be unique within your user
space. Before creating a new feed or playbook, use
`GET /api/v1/fs/readdir?path=~/feeds` or
`GET /api/v1/fs/readdir?path=~/playbooks` to check for existing names and avoid
conflicts.

```
# 1. Release feed (register in DB, link to cronjob)
POST /api/v1/release/feed
{"name":"btc-ema","version":"1.0.0","cronjob_id":42}
→ {"feed_id":100,"name":"btc-ema","feed_major":1}

# 2. Create playbook draft (creates DB record + ALFS draft files automatically)
#    Include trading_symbols when the playbook involves specific assets.
POST /api/v1/draft/playbook
{"name":"btc-dashboard","display_name":"BTC Trend Dashboard","description":"BTC market dashboard","feeds":[{"feed_id":100}],"trading_symbols":["BTC"]}
→ {"playbook_id":99,"playbook_version_id":200}

# 3. Release playbook (reads HTML from ALFS, uploads to CDN, writes release files automatically)
POST /api/v1/release/playbook
{"name":"btc-dashboard","version":"v1.0.0","feeds":[{"feed_id":100}]}
→ {"playbook_id":99,"version":"v1.0.0","published_url":"https://alice.playbook.alva.ai/btc-dashboard/v1.0.0/index.html"}

# After release, output the alva.ai playbook link to the user:
# https://alva.ai/u/<username>/playbooks/<playbook_name>
# e.g. https://alva.ai/u/alice/playbooks/btc-dashboard
```

---

## Alva Design System

All Alva playbook pages, dashboards, and widgets must follow the Alva Design
System. Start with [design-system.md](references/design-system.md): it is the
single global entry point for tokens, typography, page-level layout rules, and
the reading path to the more detailed design references.

Read only what you need:

- **Global rules only** → [design-system.md](references/design-system.md)
- **Widget and chart implementation** →
  [design-widgets.md](references/design-widgets.md)
- **Component behavior and templates** →
  [design-components.md](references/design-components.md)
- **Trading strategy playbooks** →
  [design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md)

---

## Filesystem Layout Convention

| Path                      | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `~/tasks/<name>/src/`     | Task source code                            |
| `~/feeds/<name>/v1/src/`  | Feed script source code                     |
| `~/feeds/<name>/v1/data/` | Feed synth mount (auto-created by Feed SDK) |
| `~/playbooks/<name>/`     | Playbook web app assets                     |
| `~/data/`                 | General data storage                        |
| `~/library/`              | Shared code modules                         |

**Prefer using the Feed SDK for all data organization**, including point-in-time
snapshots. Store snapshots as single-record time series rather than raw JSON
files via `alfs.writeFile()`. This keeps all data queryable through a single
consistent read pattern (`@last`, `@range`, etc.).

---

## Common Pitfalls

- **`@last` returns chronological (oldest-first) order**, consistent with
  `@first` and `@range`. No manual sorting needed.
- **Time series reads return flat JSON records.** Paths with `@last`, `@range`,
  etc. return JSON arrays of flat records like
  `[{"date":...,"close":...,"ema10":...}]`. Regular paths return file content
  with `Content-Type: application/octet-stream`.
- **`last(N)` limits unique timestamps, not records.** When multiple records
  share a timestamp (grouped via `append()`), auto-flatten may return more than
  N individual records.
- **The `data/` in feed paths is the synth mount.** `feedPath("my-feed")` gives
  `~/feeds/my-feed/v1`, and the Feed SDK mounts storage at `<feedPath>/data/`.
  Don't name your group `"data"` or you'll get `data/data/...`.
- **Public reads require absolute paths.** Unauthenticated reads must use
  `/alva/home/<username>/...` (not `~/...`). Discover your username via
  `GET /api/v1/me`.
- **Top-level `await` is not supported.** Wrap async code in
  `(async () => { ... })();`.
- **`require("alfs")` uses absolute paths.** Inside the V8 runtime,
  `alfs.readFile()` needs full paths like `/alva/home/alice/...`. Get your
  username from `require("env").username`.
- **No Node.js builtins.** `require("fs")`, `require("path")`, `require("http")`
  do not exist. Use `require("alfs")` for files, `require("net/http")` for HTTP.
- **Altra `run()` is async.** `FeedAltra.run()` returns a `Promise<RunResult>`.
  Always `await` it: `const result = await altra.run(endDate);`
- **Altra lookback: feature vs strategy.** Feature lookback controls how many
  bars the feature computation sees. Strategy lookback controls how many feature
  outputs the strategy function sees. They are independent.
- **Home directory not provisioned?** If you get `PERMISSION_DENIED` on all
  ALFS operations (including `~/`), your home directory was not created during
  sign-up. Call `POST /api/v1/fs/ensure-home` (no body needed, uses your auth
  token) to provision it. This is idempotent and safe to call anytime.
- **Cronjob path must point to an existing script.** The deploy API validates
  the entry_path exists via filesystem stat before creating the cronjob.
- **Always create a draft before releasing.** `POST /api/v1/release/playbook`
  requires the playbook to already exist (created via
  `POST /api/v1/draft/playbook`).
- **Create new playbooks from scratch unless you are doing a version update.**
  Only version updates may refer to an existing playbook. For all other new
  playbooks, do not read existing ones.
- **ECharts: use `type: 'time'` for date axes.** Do not pass raw epoch
  millisecond values as category labels — users will see numbers like
  `1773840600000` instead of dates. Use `type: 'time'` axis, which handles
  formatting automatically, or format dates before passing to a category axis.
- **ECharts graph: validate node/edge data.** For `type: 'graph'` series with
  `layout: 'none'`, verify every edge `source`/`target` matches an existing
  node `name`, no duplicate node names exist, and node names don't contain
  special characters that break ECharts internals. Add a try/catch wrapper
  around chart initialization with a fallback message if rendering fails.
- **ECharts sizing: allocate sufficient height.** Heatmaps need
  `height = max(300px, numRows * 40px)`. Primary charts on overview tabs should
  be at least 400px tall and visually dominant over KPI cards. Do not compress
  charts to fit everything above the fold.
- **Separate `lastDate` watermarks per data source.** When a feed combines
  multiple data sources with different update frequencies (e.g. ETF OHLCV +
  VIX + CPI), use a separate `ctx.kv` key for each source's watermark (e.g.
  `lastDate_etf`, `lastDate_vix`, `lastDate_cpi`). A shared watermark causes
  slower-updating sources to be permanently filtered out after the first run.

---

## Resource Limits

| Resource              | Limit                 |
| --------------------- | --------------------- |
| V8 heap per execution | 2 GB                  |
| Write payload         | 10 MB max per request |
| HTTP response body    | 128 MB max            |
| Max cronjobs per user | 20                    |
| Min cron interval     | 1 minute              |
