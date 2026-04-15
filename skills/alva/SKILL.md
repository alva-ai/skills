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
  version: v1.4.0
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

### 2. Alva CLI Setup

The `alva` CLI (`@alva-ai/toolkit`) is the required way to interact with the
Alva platform. It manages authentication, provides self-documenting help for
every command, and eliminates the need for manual curl/header management.

Check whether the CLI is already installed by running `alva --help`.

- **If not installed**, install it:

  ```bash
  npm install -g @alva-ai/toolkit
  ```

- **If already installed**, upgrade to the latest version to ensure access to
  the newest commands and fixes:

  ```bash
  npm install -g @alva-ai/toolkit@latest
  ```

Then check authentication (see step 2a below).

**Discover commands:**

```bash
alva --help              # list all commands
alva <command> --help    # detailed usage, flags, and examples for any command
```

Use `alva <command> --help` to discover usage — the help text includes all
flags, parameter types, and practical examples.

Third-party vendor secrets belong in Alva Secret Manager
(`require("secret-manager")`), not in the CLI config.

### 2a. Authentication Check

Run `alva whoami`. If it fails (no API key), run `alva auth login` to open
browser-based login, then re-run `alva whoami` to confirm.

On success, offer starting points:

- "Ask me something like 'Who's been buying NVDA insider shares this month?'"
- "Or build a live dashboard, backtest a strategy, or set up a data pipeline."

### 3. User Profile

```bash
alva whoami
```

```json
{"id":1, "subscription_tier":"free", "telegram_username":"alice_tg", "username":"alice"}
```

Session variables:

- **`username`** — for public URLs and ALFS paths.
- **`subscription_tier`** — `"pro"` or `"free"` (default). Determines release
  flow (Step 7): pro can keep playbooks private.
- **`telegram_username`** — if set, recommend push-enabled feeds; if null,
  guide user to connect Telegram first.

### 4. Load Memory

If you have **not** read the user's memory in this conversation, read it now.

```bash
alva fs read --path '~/memory/MEMORY.md'
```

If the file exists, read each file listed in the index (at minimum `user.md`).
If `'~/memory/'` does not exist or is empty, skip — it will be seeded on next
sign-in.

Use the loaded memory to tailor your responses to the user's profile,
preferences, and investment style. See the [Memory](#memory) section below for
reading and writing rules.

---

## Communication

No ALFS paths, API payloads, cronjob IDs, raw function names, internal jargon,
or implementation details in user-facing responses. Say what it DOES, not how it
works. These details are operating instructions for you, not content for the
user.

Lead with the result, not the process. The first thing the user reads should be
what they got ("Your dashboard is live at …"), not what you did ("I deployed
3 feeds and wrote the HTML"). During multi-step builds, give a short status
update at each milestone so the user knows work is progressing.

## Request Routing

| Request Type | Core Objectives |
| --- | --- |
| **Dashboard / Playbook** | Identify the needed data sources, validate the data flow, and produce a usable dashboard or playbook when the user wants a shareable artifact |
| **Backtest / Strategy** | Use Altra, run the backtest correctly, and always produce a visual playbook (equity curve, trade log, metrics) alongside the text summary. Optionally deploy as live paper trading. |
| **Data Query** | Fetch the requested data accurately and return it directly unless the user asks for a richer artifact |
| **Remix** | Reuse the source artifact, apply the requested changes, and return an updated result that matches the requested customization |

### Guided Planning

For all routes except **Data Query**, present a plan and get user approval
before building. Even seemingly clear requests ("build a BTC dashboard") have
real choices — which data, timeframe, widgets — that are cheaper to resolve
upfront than to rebuild.

1. **Understand intent** — Ask clarifying questions **one at a time**, prefer
   multiple-choice. Focus on what's missing: asset, scope, output type, or
   purpose. Skip this step if the request already specifies all of these.
2. **Propose approaches** — Offer 2-3 concrete options with trade-offs. Lead
   with your recommendation.
3. **Confirm the plan** — List the specific feeds and widgets (5-8 lines, no
   implementation details). Build only after approval.

If the user says "just do it" at any point, skip planning for the rest of the
session.

### Completion Gate

For **Dashboard/Playbook** and **Backtest/Strategy** requests, the default goal
is to leave the user with a result they can actually use. In many cases that
means a released playbook and a `published_url`, but do not force that path if
the user only asked for code, analysis, debugging help, or an intermediate
artifact.

Before finishing, verify that the delivered result matches the user's actual
goal. When a shareable playbook was part of the task, verify:

- [ ] A playbook was released and a `published_url` was returned

Must Do After Completion Gate:

- [ ] Summarize the whole process and what is delivered to the user.

---

## Content Legitimacy Rules

These rules are **non-negotiable**. Violations produce misleading content that
displays fabricated data as if it were real. They apply to **every response
that surfaces financial values to the user** — playbook builds, dashboards,
query-mode answers, remixes, edits, and follow-ups — regardless of whether the
session ends with a released playbook.

**Core principle**: the agent's role is to **build the pipeline**, not to **be
the data source**. Any quantitative value the user sees must trace back to an
Alva SDK module, a published Alva feed, or a BYOD HTTP source that is either
user-provided or explicitly validated and wired into the feed pipeline. Agent
knowledge, LLM output, WebSearch snippets, random/synthetic generators, and
user-pasted snapshots are **not** legitimate data sources — regardless of
whether they appear as HTML literals, feed-script literals, backfilled
history, or agent-authored opinion columns. When the SDK has no coverage for
the requested domain, report the gap and stop; do not manufacture
plausible-looking data.

### Data Sourcing

1. **All quantitative data displayed in charts, tables, or metric cards MUST
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

3. **Verification claims and quoted tool outputs must reflect actual tool
   calls.** Do not describe a screenshot you did not take ("the dashboard
   looks good"). When citing a tool-returned value such as `published_url`,
   `feed_id`, or an ALFS path, copy it verbatim from the response. The
   user-facing share link is the canonical
   `https://alva.ai/u/<username>/playbooks/<playbook_name>` URL; `published_url`
   is the deployed HTML URL used for verification steps such as screenshots.
   Do not present one as if it were the other. If you need a value, re-read
   the tool response first.

### Prohibited Data Sources for Charts, Tables, and Query Answers

1. **WebSearch / WebFetch results must NOT be embedded as data.** Web search is
   only legitimate for: reading documentation, finding API endpoints for BYOD,
   understanding user requirements. It may help you discover a legitimate BYOD
   source, but discovered values themselves must never be quoted as the answer
   or injected as static data literals in feed scripts or playbook HTML. This
   rule applies even when Alva API auth fails — in that case, report the
   failure and stop; do NOT substitute a web-sourced value.

2. **LLM / ADK output must NOT be presented as factual sourced data.** ADK is
   for reasoning, classification, summarization, and synthesis of real data — not
   for generating numbers, statistics, events, or reports that claim to be from
   real sources. If ADK produces quantitative output, it must be clearly labeled
   as "AI-generated analysis".

3. **Agent training knowledge must NOT fill data gaps.** If an SDK does not have
   the requested data type, report the gap as a blocker. Do not invent data from
   your own knowledge to fill the hole.

Qualitative analysis (ratings, theses, outlook text) is not data and must not
appear as feed output columns or "data" fields in HTML tables. If the user
asks for a rating, either compute it from SDK fundamentals with the formula
shown, or place it in a clearly labelled "AI analysis" section separated from
data-driven metrics.

### SDK Coverage Gaps

1. **When an SDK partition lacks the requested data type**, reduce scope:
   - **Omit the missing data section** from the playbook and note the gap
     (e.g. "ECB, BOJ, BOE rates — data source not yet available").
   - If the user has provided a specific data source URL, use BYOD
     (`require("net/http")`) to fetch from it.
   - Do NOT hardcode point-in-time values in HTML — they become stale
     immediately and violate content legitimacy rules.
   - Do NOT fabricate events or fill gaps from agent knowledge.

2. **When >20% of requested symbols fail SDK lookup, report a data-quality
   blocker.** Do not silently substitute with estimated or fabricated values
   marked `live: false`.

### Release Gate: `--feeds` Is a Declaration, Not a Shortcut

`alva release playbook --feeds '[]'` is **only** valid when the released HTML
renders zero quantitative values at runtime (landing pages, UI-only demos).
If the HTML shows any numbers, charts, tables, or metric cards, the release
MUST reference deployed feeds in `--feeds` and the HTML MUST `fetch()` them
at runtime. `alva run` is a test run of a feed, not a substitute for
deploying one — if you used `alva run` to source data, deploy that same
logic as a feed and reference it.

### Thematic Ticker Curation

When building sector or thematic dashboards with curated ticker lists:

1. Do NOT rely on agent knowledge for ticker-to-sector mapping.
2. After assembling the list, cross-check each ticker's sector using an SDK
   call (e.g. `getStockCompanyDetail`) to verify it belongs to the intended
   segment.
3. Remove mismatches before building the feed. A single wrong ticker (e.g. a
   cybersecurity company in a battery segment) can distort the entire analysis.

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

In shell and documentation, wrap ALFS path arguments in single quotes (e.g.
`'~/feeds/...'`, `'/alva/home/...'`) so they are not confused with paths on your
local machine. See [Filesystem](references/api/filesystem.md).

### 2. JS Runtime

Run JavaScript on Alva Cloud in a sandboxed V8 isolate. Code executed via
`alva run` runs entirely on Alva's servers -- it cannot access
the host machine's filesystem, environment variables, or processes. The runtime
has access to ALFS, all 250+ SDKs, HTTP networking, LLM access, and the Feed
SDK.

### 3. SDKHub

250+ built-in financial data SDKs. To find the right SDK for a task, use the
two-step retrieval flow:

1. **Pick a partition** from the index below.
2. **Call `alva sdk partition-summary --partition <name>`** to see module
   summaries, then load the full doc for the chosen module.

**SDK doc lookup is mandatory.** Always look up SDK documentation before writing
any feed script. Do not guess function signatures, parameter names, or response
shapes from memory. The doc lookup ensures you use the correct module, call the
right function, and handle the actual response format.

**Enforcement**: Before any `require("@arrays/...")` or `alva run` call, you
MUST have completed a doc lookup for that specific module in this session.
The required sequence is:

1. `alva sdk partition-summary --partition <name>` → find exact module path
2. `alva sdk doc --name <module>` → get function names, params, response shape
3. Write code using ONLY the names and shapes from step 2

If an `alva run` call fails with "module not found" or "not a function",
do NOT guess a different name. Return to step 1.

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
username match the authenticated user (from `alva whoami`). If you have
access to multiple API keys (e.g. from prior sessions), identify the requesting
user and scope all operations to that user only. Do NOT write to or release
playbooks under other users' namespaces unless the request explicitly asks for
cross-user operations (e.g. remix with lineage).

**Signal feeds require Altra**: Any feed that produces `signal/targets` or
`signal/alerts` output MUST use `FeedAltra`. Manual signal construction
(building target records without Altra) bypasses bar alignment, portfolio
simulation, and look-ahead bias prevention. Use `FeedAltra` even for simple
signal logic — it ensures correct timestamps and prevents forward-looking bugs.
This applies to ALL feed types that produce signal output — including
monitoring feeds, alert feeds, and notification feeds, not just backtest
strategies. If the feed pushes signals to Telegram or triggers alerts, it
MUST use `FeedAltra`.

**Push notifications for followers:** Feeds can produce actionable,
subscription-worthy signals that get pushed to playbook followers via Telegram.
To make a feed push-capable:

1. Add a `signal/targets` output to the feed script (see
   [feed-sdk.md](references/feed-sdk.md) Pattern D) and write signal records
   using the Altra target format (`{date, instruction, meta}`), where
   `meta.reason` is the human-readable message followers will see.
2. Set `--push-notify` in the `alva deploy create` command, or
   update the existing cronjob with `alva deploy update --id ID --push-notify`.

The platform reads `/data/signal/targets/@last/1` after each successful
execution and pushes the signal content to all eligible followers.

**AlvaAsk + owner notifications:** Feeds can use `@alva/alvaask` to call
Alva's agent and push the result to the feed owner — useful for scheduled
reports, heartbeat monitoring, and proactive alerts. Write to
`notify/message` (see [feed-sdk.md](references/feed-sdk.md) Pattern E):

```javascript
const result = ask("Brief crypto market update with key levels.");
await ctx.self.ts("notify", "message").append([{
  date: Date.now(),
  title: "Daily Briefing",
  text: result.text,
}]);
```

The platform reads `/data/notify/message/@last/1` and pushes `title` + `text`
to the owner on all connected channels (Telegram, Discord, Web). No playbook
or followers required.

See **Step 9** below for the full post-release subscription flow.

### 6. Build the Playbook Web App

After your data pipelines are deployed and producing data, build the playbook's
web interface. Create HTML5 pages with Alva Design System that read from Alva's
data gateway and visualize the results. Follow the Alva Design System for
styling, layout, and component guidelines. Unless the user explicitly asks for a
static snapshot, default to a live playbook.
**Data fetching requirement**: Apply the
[Content Legitimacy Rules](#content-legitimacy-rules) when building the UI.
All quantitative data in charts, tables, or metric cards must come from feed
outputs read at runtime (no inline literals for data).

### 7. Release

#### Common steps (all users)

1. **Write HTML to ALFS**: `alva fs write --path '~/playbooks/{name}/index.html' --file ./index.html --mkdir-parents`
2. **Create playbook draft**: `alva release playbook-draft` — creates DB
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
3. **Screenshot**: Take a screenshot to verify the released playbook renders
   correctly from the deployed published URL (for example,
   `https://<username>.playbook.alva.ai/<playbook_name>/v1.0.0/index.html`):

   ```bash
   alva screenshot --url <published_url> --out /tmp/screenshot.png
   ```

   The CLI handles authentication automatically. See
   [screenshot.md](references/api/screenshot.md) for full parameter details.

#### Pro users (`subscription_tier = "pro"`)

1. **Show draft link**: Output the playbook URL —
   `https://alva.ai/u/<username>/playbooks/<playbook_name>`. The draft is
   accessible only to the creator.
2. **Ask**: "Your playbook is ready. Would you like to publish it publicly, or
   keep it private for now?"
   - **Publish** → call `alva release playbook` → output the public URL.
   - **Keep private** → done. Remind the user that only they can access the
     draft URL.

#### Free users (`subscription_tier = "free"`)

1. **Publish directly**: Call `alva release playbook` — free playbooks
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

Use the playbook `name` and the username from `alva whoami` to construct the
canonical share URL. Use `published_url` from the release response for
verification steps such as screenshots; do not present it as the share link.

#### Pre-Release Validation

Before calling `alva release playbook`, verify all of the following:

1. **Deployment coverage**: Every feed the released playbook reads at runtime
   must have had a successful `alva deploy create` AND its `feed_id` must
   appear in `--feeds`. `alva run` is a test step, not a deployment — a
   run-tested but undeployed feed has no data at its public `@last` path and
   the HTML will fail to read it.
2. **Cronjobs are active**: All feeds referenced by the playbook have
   successfully deployed cronjobs. If `deploy/cronjob` returned `RATE_LIMITED`,
   see [Cronjob Rate Limit Recovery](#cronjob-rate-limit-recovery) below.
3. **HTML fetches from feeds**: The playbook HTML reads quantitative data from
  feed output paths at runtime (not from inline literals), consistent with the
  [Content Legitimacy Rules](#content-legitimacy-rules).
4. **Data is fresh**: Read the latest data point from each referenced feed
   (via `@last/1`) and check its timestamp. If the latest timestamp is older
   than 2x the cron interval, warn the user that the playbook will display
   stale data.
5. **Description is accurate**: Update frequency claims match actual cronjob
   status. Data source claims match actual SDK/BYOD calls in the feed script.
6. **Target user is correct**: The playbook is being released under the
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
| `references/api/*.md` | Split REST API reference docs (user info, filesystem, run, deploy, release, SDK, screenshots, trading, and errors) |
| [jagent-runtime.md](references/jagent-runtime.md) | Writing jagent scripts: module system, built-in modules, async model, constraints |
| [feed-sdk.md](references/feed-sdk.md) | Feed SDK guide: creating data feeds, time series, upstreams, state management |
| [altra-trading.md](references/altra-trading.md) | Altra backtesting engine: strategies, features, signals, testing, debugging |
| [deployment.md](references/deployment.md) | Deploying scripts as cronjobs for scheduled execution |
| [design-system.md](references/design-system.md) | Alva Design System entry point: tokens, typography, layout; links to widget, component, and playbook specs |
| [remix-workflow.md](references/remix-workflow.md) | Remix: create a new playbook from an existing template |
| [adk.md](references/adk.md) | Agent Development Kit: `adk.agent()` API, tool calling, ReAct loop, examples |
| [search.md](references/search.md) | Content search SDKs: per-source usage, enrichment patterns, and gotchas for Twitter/X, news, Reddit, YouTube, podcasts, and web |
| [secret-manager.md](references/secret-manager.md) | Secret upload, CRUD API, and runtime usage via `require("secret-manager")` |

---

## CLI Reference

**Important**: Always read the reference docs before making CLI calls. Use
`alva <command> --help` for quick flag/usage reminders.

Reference docs:

- [User Info](references/api/user-info.md) — `alva whoami`
- [Secrets](references/api/secrets.md) — `alva secrets`
- [Filesystem](references/api/filesystem.md) — `alva fs`
- [Run](references/api/run.md) — `alva run`
- [Deploy Cronjob](references/api/deploy-cronjob.md) — `alva deploy`
- [Release](references/api/release.md) — `alva release`
- [Remix](references/api/remix.md) — `alva remix`
- [SDK](references/api/sdk.md) — `alva sdk`
- [Playbook Comments](references/api/playbook-comment.md) — `alva comments`
- [Screenshot](references/api/screenshot.md) — `alva screenshot`
- [Trading](references/api/trading.md) — `alva trading`
- [Error Responses](references/api/error-responses.md)

---

## Runtime Modules Quick Reference

Scripts executed via `alva run` run in a sandboxed V8 isolate on Alva's
servers -- they cannot access the host machine's filesystem, environment
variables, or shell. Host-agent permissions still apply. See
[jagent-runtime.md](references/jagent-runtime.md) for full details.

| Module          | require()                    | Description                                                             |
| --------------- | ---------------------------- | ----------------------------------------------------------------------- |
| alfs            | `require("alfs")`            | Filesystem (uses absolute paths `'/alva/home/<username>/...'`)            |
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
`alva sdk doc --name "..."`).

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

Feed output is readable at (ALFS — quote in CLI):
`'~/feeds/btc-ema/v1/data/metrics/prices/@last/100'`

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
2. **Upload** — write script to `'~/feeds/<name>/v1/src/index.js'`
3. **Test** — `alva run --entry-path '~/feeds/<name>/v1/src/index.js'` to verify output.
   For SDK modules you haven't used before in this session, first run a
   shape-check snippet to verify response structure:

   ```js
   const r = await mod.someFunction({ symbol: "AAPL" });
   console.log(JSON.stringify(r).slice(0, 500));
   ```

   Verify the actual response nesting (e.g. `{success, response: {rates:[]}}`
   vs flat array) matches your feed script's parsing logic before proceeding.
   `alva run` is a test step — it does NOT write to the production `@last`
   path. Never skip `alva deploy` below on the assumption that the run
   "already produced the data".
4. **Grant** -- make feed data publicly readable:

   ```bash
   alva fs grant --path '~/feeds/<name>' --subject "special:user:*" --permission read
   ```

   Grant on the feed root path (not on `data/`). Subject format:
   `special:user:*` (public), `special:user:+` (authenticated only), `user:<id>`
   (specific user).
5. **Deploy** -- `alva deploy create` for scheduled execution
6. **Release** -- `alva release feed` to register the feed in the
   database (requires the `cronjob_id` from the deploy step)

### Pre-Release Verification

Before calling `alva release feed` or `alva release playbook`,
verify these prerequisites:

1. **Grant check** — confirm `special:user:*` read permission exists on the
   feed path. If missing, run the grant step now.
2. **Data check** — fetch the feed data path without authentication and
   confirm HTTP 200 (not 403).
3. **HTML check** (playbook only) — confirm the playbook HTML file exists in
   ALFS at the expected path.

If the build was interrupted and resumed, re-run this checklist from the top.
Do not assume prior steps completed successfully.

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
2. **Assess scope impact** — determine whether the gated module is the *sole*
   data source for the playbook, or one of several.
   - **Partial dependency** (other free-tier modules can still power most of
     the playbook): proceed with a reduced-scope build. Omit the gated
     section and note it in the playbook (e.g. "Congressional trading data
     requires Pro — section omitted"). Deliver what you can.
   - **Full dependency** (the entire playbook hinges on this module): tell
     the user specifically: *"This data requires a Pro subscription. You can
     upgrade, or provide a custom data source URL and I'll wire it up via
     BYOD."* Do NOT leave an open-ended question; give exactly these two
     actionable options.
3. **Never stop with zero output.** If you can build *any* useful subset of
   the requested playbook with free-tier modules, do so.
4. Never silently substitute with LLM-fabricated data.

### Coverage Limitations

When the user requests data outside Alva's supported asset classes (e.g. forex
pairs, which are not in SDKHub), state the limitation upfront rather than
discovering it through failed searches. Suggest BYOD alternatives if a public
API exists.

---

## Debugging Feeds

### Resetting Feed Data (development only)

During development, use the CLI to clear stale or incorrect data. **Do not use
this in production.**

```bash
# Clear a specific time series output
alva fs remove --path '~/feeds/my-feed/v1/data/market/ohlcv' --recursive

# Clear an entire group (all outputs under "market")
alva fs remove --path '~/feeds/my-feed/v1/data/market' --recursive

# Full reset: clear ALL data + KV state (removes the data mount, re-created on next run)
alva fs remove --path '~/feeds/my-feed/v1/data' --recursive
```

### Inline Debug Snippets

Test SDK shapes before building a full feed:

```bash
alva run --code 'const { getCryptoKline } = require("@arrays/crypto/ohlcv:v1.0.0"); JSON.stringify(Object.keys(getCryptoKline({ symbol: "BTCUSDT", start_time: 0, end_time: 0, interval: "1h" })));'
```

---

## Memory

You have a persistent, file-based memory system on ALFS at `'~/memory/'`. This
directory is created automatically when the user's account is provisioned. Use
it to accumulate knowledge about the user across conversations — their identity,
preferences, investment style, and any context that would be useful in future
sessions.

Memory files are **user-visible and editable**. The user can read, modify, or
delete any memory file through the Alva dashboard or ALFS API. Write memories
as if the user will read them.

### Storage layout

**ALFS paths** — use single quotes in the shell (example: `'~/memory/MEMORY.md'`).

```
~/memory/
├── MEMORY.md     # Concise index — read at the start of every conversation
└── user.md       # User profile, preferences, expertise, investment style
```

`MEMORY.md` is the entrypoint. Read it at the start of every conversation to
discover what's stored. Keep it concise — under 200 lines. Each entry is one
line linking to a topic file:

```markdown
- [user.md](user.md) — User identity, investment style, knowledge level
- [market-views.md](market-views.md) — Current macro thesis, conviction trades
```

Topic files (like `user.md`) hold the actual content. They are read on demand
when relevant to the user's request.

### user.md — Who is this user

Persistent facts about the user. Update when you learn something new.

```markdown
# User Profile

> Auto-maintained by Alva Agent. You can edit directly.

## Identity

- Name:
- Role: <!-- e.g. Independent Trader, PM at Fund, Research Analyst, Student -->
- Timezone:
- Language:

## Investment Style

- Markets: <!-- e.g. US Equities, Crypto, Macro, Commodities -->
- Strategy: <!-- e.g. Momentum, Mean Reversion, Fundamental, Event-driven -->
- Holding period: <!-- Intraday / Swing / Position / Long-term -->
- Risk tolerance: <!-- Conservative / Moderate / Aggressive -->
- Watching:

## Knowledge

- Level: <!-- Beginner / Intermediate / Advanced / Professional -->
- Strong: <!-- e.g. Technical analysis, On-chain, Macro -->
- Learning:
- External tools: <!-- e.g. TradingView, Bloomberg, Dune -->

## Preferences

- Communication style: <!-- e.g. terse / detailed / visual -->
- Notification channel:
```

**When to update:** User shares personal info, corrects a preference, reveals
expertise level, states investment convictions, or you learn something that
changes how you should work with them.

### Additional topic files

Create new files in `'~/memory/'` for knowledge that doesn't fit in `user.md` —
market convictions, strategy assumptions, portfolio rules. Add a pointer to
`MEMORY.md` for each new file.

### What NOT to save

- Ephemeral conversation details (current debugging session, temp state)
- Things derivable from code or ALFS files
- Raw data or large outputs (store on ALFS as feed data, not in memory)
- Anything already in the Alva skill docs
- Market data that changes every minute (save your *interpretation*, not the
  data)

### Writing rules

1. **Read `'~/memory/MEMORY.md'` first** — check if a relevant file already exists
2. **Update existing file** if the topic matches. Don't create duplicates
3. **Create new file** only if no existing file covers the topic
4. **Update `MEMORY.md`** — add a one-line entry for each new file
5. Keep `MEMORY.md` as a concise index — one line per file, under 120 characters
6. **Every write → confirm in chat:** 📌 Memory updated: {one-sentence summary}

### Reading rules

- **Every conversation start**: Read `'~/memory/MEMORY.md'` via ALFS. Then read
  `user.md` and any topic files relevant to the user's request.
- **User references prior work**: "that strategy from last time" / "the rules
  we discussed" → read the relevant memory file.
- **User explicitly asks**: "do you remember" / "check my profile" → you
  **must** read.
- **User says to ignore memory**: Proceed as if `'~/memory/'` is empty.

### Memory is a claim, not truth

Memory records what was true **when the memory was written**. Before acting on
a memory:

- Memory names a **feed or playbook** → verify it exists on ALFS before
  referencing it.
- Memory names a **cronjob or parameter** → verify current state before
  recommending changes.
- Memory records a **market view** → treat as the user's last-known position,
  not current fact.
- Memory records **user preferences** → apply directly (these are stable).

If a memory conflicts with what the user just told you, **trust what the user
says now** — and update the memory.

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
  are available via `alva secrets`.

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

```bash
alva deploy create --name btc-ema-update --path '~/feeds/btc-ema/v1/src/index.js' --cron "0 */4 * * *"
```

Cronjobs execute the script via the same jagent runtime as `alva run`. Max 20
cronjobs per user. Min interval: 1 minute.

**Name format**: All resource names (cronjobs, feeds, playbooks) must be 1–63
lowercase alphanumeric characters or hyphens, and cannot start or end with a
hyphen (DNS label format). Example: `btc-ema-update`, not `BTC EMA Update`.

After deploying a cronjob, register the feed, create a playbook draft, then
release the playbook for public hosting. The playbook HTML must already be
written to ALFS at `'~/playbooks/{name}/index.html'` via `fs/write` before
releasing.

**Important**: Feed names and playbook names must be unique within your user
space. Before creating a new feed or playbook, use
`alva fs readdir --path '~/feeds'` or
`alva fs readdir --path '~/playbooks'` to check for existing names and avoid
conflicts.

```bash
# 1. Release feed (register in DB, link to cronjob)
alva release feed --name btc-ema --version 1.0.0 --cronjob-id 42
# → {"feed_id":100,"name":"btc-ema","feed_major":1}

# 2. Create playbook draft (creates DB record + ALFS draft files automatically)
#    Include trading_symbols when the playbook involves specific assets.
alva release playbook-draft --name btc-dashboard --display-name "BTC Trend Dashboard" --description "BTC market dashboard" --feeds '[{"feed_id":100}]' --trading-symbols '["BTC"]'
# → {"playbook_id":99,"playbook_version_id":200}

# 3. Release playbook (reads HTML from ALFS, uploads to CDN, writes release files automatically)
alva release playbook --name btc-dashboard --version v1.0.0 --feeds '[{"feed_id":100}]' --changelog "Initial release"
# → {"playbook_id":99,"version":"v1.0.0","published_url":"https://alice.playbook.alva.ai/btc-dashboard/v1.0.0/index.html"}

# After release, output the canonical share link to the user:
# https://alva.ai/u/<username>/playbooks/<playbook_name>
# e.g. https://alva.ai/u/alice/playbooks/btc-dashboard
```

---

## Alva Design System

**Always read [design-system.md](references/design-system.md) first** — it covers tokens,
typography, theme, and page-level layout. Then read only the spec you need:

1. **Generating a widget or chart** →
   [design-widgets.md](references/design-widgets.md)
2. **Using a component** (Button, Tag, Dropdown, Tab, etc.) →
   [design-components.md](references/design-components.md)
3. **Building a trading strategy playbook** →
   [design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md)
4. **Only need global rules** → stay in design-system.md

---

## Filesystem Layout Convention

| Path (ALFS — quote in CLI)              | Purpose                                     |
| --------------------------------------- | ------------------------------------------- |
| `'~/tasks/<name>/src/'`                 | Task source code                            |
| `'~/feeds/<name>/v1/src/'`              | Feed script source code                     |
| `'~/feeds/<name>/v1/data/'`             | Feed synth mount (auto-created by Feed SDK) |
| `'~/playbooks/<name>/'`                 | Playbook web app assets                     |
| `'~/data/'`                             | General data storage                        |
| `'~/library/'`                          | Shared code modules                         |

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
  `'~/feeds/my-feed/v1'`, and the Feed SDK mounts storage at `<feedPath>/data/`.
  Don't name your group `"data"` or you'll get `data/data/...`.
- **Public reads require absolute paths.** Unauthenticated reads must use
  `'/alva/home/<username>/...'` (not `'~/...'`). Discover your username via
  `alva whoami`.
- **Top-level `await` is not supported.** Wrap async code in
  `(async () => { ... })();`.
- **`require("alfs")` uses absolute paths.** Inside the V8 runtime,
  `alfs.readFile()` needs full paths like `'/alva/home/alice/...'`. Get your
  username from `require("env").username`.
- **No Node.js builtins.** `require("fs")`, `require("path")`, `require("http")`
  do not exist. Use `require("alfs")` for files, `require("net/http")` for HTTP.
- **Altra `run()` is async.** `FeedAltra.run()` returns a `Promise<RunResult>`.
  Always `await` it: `const result = await altra.run(endDate);`
- **Altra lookback: feature vs strategy.** Feature lookback controls how many
  bars the feature computation sees. Strategy lookback controls how many feature
  outputs the strategy function sees. They are independent.
- **Quote `~` paths to prevent shell expansion.** The shell expands bare `~` to
  your local home (e.g. `/Users/alice/`), not the ALFS home
  (`'/alva/home/alice/'`). Always quote paths: `--path '~/feeds/...'`.
- **Home directory not provisioned?** If you get `PERMISSION_DENIED` on all
  ALFS operations (including `'~/'`), your home directory was not created during
  sign-up. Call `alva fs mkdir --path '~/'` to provision it. This is idempotent
  and safe to call anytime.
- **Cronjob path must point to an existing script.** The deploy API validates
  the entry_path exists via filesystem stat before creating the cronjob.
- **Always create a draft before releasing.** `alva release playbook`
  requires the playbook to already exist (created via
  `alva release playbook-draft`).
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
  be at least 400px tall and visually dominant over metric cards. Do not compress
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
