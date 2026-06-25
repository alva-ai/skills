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
  version: v1.14.0
---

# Alva

Alva is an agentic finance platform. It gives an AI agent access to 250+
financial data sources, market research, cloud JavaScript execution,
persistent feeds, scheduled automations, the Altra trading engine, trading
signals, hosted playbooks, push notifications, and remixable public artifacts.

This file is the platform encyclopedia and operating guide. Read it to
understand what Alva can do, how the concepts fit together, which path a user
request belongs to, and which focused reference owns the detailed procedure.
It is intentionally not the full playbook-building manual. Long command
sequences, API gotchas, release checklists, design rules, examples, and
debugging recipes live in `references/`.

## Mental Model

Alva turns finance work into durable, inspectable pipelines. The agent should
not be the data source; the agent builds the pipeline that fetches data, checks
shape, computes outputs, persists them, and renders or explains the result.

The main objects are:

| Concept | Meaning | Read when |
| --- | --- | --- |
| Data Skills | 250+ structured Arrays endpoints for equities, options, crypto, macro, on-chain, semiconductor spot prices, news, prediction markets, and indexed Twitter/X. | You need factual financial data. |
| Runtime script | JavaScript executed inside Alva's V8/jagent runtime through `alva run` or cronjobs. | You need computation, HTTP, ALFS, secrets, alpi, ONNX, or Feed SDK. |
| Feed | A persistent data pipeline that writes time-series or grouped outputs to ALFS and can back playbooks or alerts. | Data needs freshness, history, public reads, charts, release, or push. |
| Playbook | A hosted investing app at `https://alva.ai/u/<username>/playbooks/<name>`. | The user wants a shareable dashboard, screener, thesis, what-if, or strategy surface. |
| Skillhub blueprint | A catalog methodology addressed by `/use-skill:<username>/<name>`. | The user explicitly asks for one or a task matches an official template family. |
| Altra | The Feed SDK trading engine for event-driven backtesting and signal feeds. | Any strategy, simulation, signal target, portfolio, order, equity curve, or rebalancing logic. |
| alpi | A fixed LLM reasoning/tool loop inside a deterministic scheduled pipeline. | A feed needs classification, synthesis, TLDR, why-it-matters, or result-only tool use over real upstream data. |
| BYOD | User-supplied or validated external data source wired into runtime code. | Alva coverage is insufficient after verification. |

Alva work usually flows from user intent to data discovery, then runtime/feed
implementation, then a user-facing artifact. A direct answer may stop after a
fresh data fetch. A playbook usually continues through feed release, HTML,
README, lint, screenshot, release, and optional push setup.

The stack is layered:

1. **Discovery layer**: Data Skills, runtime SDK docs, Skillhub blueprints, and
   public playbook discovery tell the agent what exists now.
2. **Computation layer**: jagent runtime scripts, `net/http`, secrets, alpi,
   ONNX, and Altra transform source data into repeatable outputs.
3. **Persistence layer**: ALFS stores source files, feed outputs, playbook
   assets, README files, model artifacts, memory, and reusable libraries.
4. **Publication layer**: feed release, playbook draft/release, lint,
   screenshots, visibility, creator notes, and canonical share URLs turn a
   pipeline into something a user can inspect.
5. **Action layer**: push subscriptions, signal feeds, trading execution, and
   alerts connect the artifact to ongoing decisions.

Those layers matter because most Alva bugs are layer violations: using search
as data, using runtime code as a one-off local script, skipping feed release
before a playbook reads data, treating a blueprint as an optional suggestion,
or presenting a deployed HTML URL as the share URL.

Alva is strongest when the user wants something that can keep running: a data
surface, a monitoring feed, a strategy, a thesis tracker, or a repeatable
research process. It is also useful for single-shot questions, but the agent
should not overbuild. A user asking "what is BTC doing now?" needs a fresh
fetch and a concise answer. A user asking "track BTC dominance and alert me on
breakouts" needs a feed, cadence, push sidecar, and verification.

Think in artifacts:

- **Answer**: a direct response grounded in fresh data. No feed or release
  required unless the user asks for persistence.
- **Script**: an Alva Cloud computation that may be run manually or scheduled.
- **Feed**: the persistent output of a script, with schema, history, grants,
  and release metadata.
- **Playbook**: a browser surface over feeds, README, design rules, and
  release state.
- **Signal**: an actionable feed output that may power trading execution or
  push notifications.
- **Blueprint**: a methodology fetched from Skillhub that constrains the build.

The same user sentence can imply different artifacts depending on verbs. "Ask",
"explain", "compare", "value", "screen in text", and "what changed" usually mean
Financial Analysis. "Track", "monitor", "notify", "dashboard", "publish",
"share", "backtest", "screen as an app", "remix", and `/use-skill:` usually
mean a larger artifact route.

## Capability Help

When the user asks who Alva is, what Alva can do, how to use Alva, or asks for
starter prompts, answer from the capability map rather than implementation
internals. Use user-facing groups such as Ask market questions, Set alerts,
Build/remix Playbooks, Discover/manage Playbooks, and Connect accounts.

Offer 3 concrete starter prompts when helpful. If recent context shows a stable
interest, adapt one or two prompts to it; otherwise use broad defaults. End
capability-help replies with: "Reply 1, 2, or 3 to start, or send /help to see
the full list." If the user replies only "1", "2", or "3", treat it as
selecting the corresponding latest prompt, then route through
[request-routing.md](references/request-routing.md).

## First Principles

These rules are the high-signal foundation. If you only remember one section,
make it this one.

1. **Help-first CLI.** Before using any `alva` command you have not used in
   this session, run `alva <command> --help`. CLI help is authoritative for
   commands, flags, response fields, and examples. Read
   [preflight.md](references/preflight.md) at session start.
2. **Fresh identity and memory.** Run `alva whoami`, capture `username`,
   `subscription_tier`, delivery channel fields, and Arrays JWT status. Load
   `~/memory/MEMORY.md` if not already read. Memory is a *claim*, not truth.
3. **Pipeline, not oracle.** Financial values must come from Data Skills,
   published Alva feeds, or validated BYOD sources. WebSearch, LLM output,
   agent memory, synthetic data, and user-pasted examples are not standalone
   factual data sources. Read
   [content-legitimacy.md](references/content-legitimacy.md).
4. **No stale surface assumptions.** Fetch Data Skills endpoint docs, Skillhub
   blueprints, CLI help, and runtime docs in the current session. Do not act
   from remembered field names.
5. **User scope is sacred.** Write, deploy, draft, release, and visibility
   operations target only the requesting user's namespace from `alva whoami`
   unless the user explicitly asks for cross-user work such as remix lineage.
6. **Altra for trading.** Any backtest, portfolio simulation, target signal,
   equity curve, order logic, position tracking, or rebalancing uses Altra.
   Hand-rolled loops invite bad timestamps and look-ahead bias.
7. **Playbooks are live by default.** If a playbook displays numbers, charts,
   tables, or metric cards, HTML reads feed outputs at runtime through
   `AlvaToolkit.AlvaClient` and release declares the backing feeds. Static
   snapshots are only for explicit requests.
8. **One blocking question.** For nontrivial builds, ask at most one blocking
   question or present one short plan. A concrete `/use-skill:` directive plus
   topic means plan once, then build.
9. **References own depth.** Top-level sections tell you what the capability is,
   what rule is easy to miss, and which file to open. Long examples, commands,
   and checklists live in the linked reference.

Two consequences are worth making explicit. First, a useful Alva answer can be
small: a financial-analysis question should not become a playbook unless the
user asks for a durable surface. Second, a useful Alva build can be large: once
the user does ask for a playbook, the job is not done at "HTML exists"; it is
done when data provenance, release metadata, README, lint, screenshot, and
share URL all match the user's goal.

## Session Start

Before doing Alva work, open [preflight.md](references/preflight.md). It owns:

- `scripts/version_check.sh`
- `alva --help` and help-first command use
- CLI install / upgrade
- `alva whoami`, subscription tier, username, delivery fields
- `ARRAYS_JWT` status and `alva arrays token ensure`
- `~/memory/MEMORY.md` loading
- user-scope enforcement

Use [user-facing-prose.md](references/user-facing-prose.md) for product
vocabulary and voice before writing Financial Analysis answers, playbook copy,
README prose, visible HTML text, alpi prompts, digests, or release
descriptions. User-facing words include **automation**, **playbook**,
**alert/notification**, **Agent**, and **script**. Treat **feed** as internal
unless the user is looking at logs, raw data, API fields, release references,
or an Automation detail that exposes it.

Use [creators-note.md](references/creators-note.md) when composing a pinned
post-release author note.

## Request Routing

Open [request-routing.md](references/request-routing.md) whenever the task is
not an obvious single-fetch answer. It owns route selection, Skillhub, Guided
Planning, capability verification, and completion gates.

Open [operational-pitfalls.md](references/operational-pitfalls.md) step by
step whenever the route enters runtime, feed, ALFS, playbook HTML, deploy,
release, chart, or cron work. Read only the relevant section before each step,
but treat that section as mandatory, not optional debugging material.

| User asks for | Route | Must not miss |
| --- | --- | --- |
| price, valuation, holdings, "why did it move", compare peers, explain a thesis, rank in text | Financial Analysis / Ask Question | Fetch fresh data/search evidence; comparison baselines need provenance too. Every answer must pass the ask evidence gate below. |
| dashboard, screener app, thesis tracker, hosted report, shareable surface | Playbook Creation | Build live feeds first, then read [playbook-creation.md](references/playbook-creation.md). |
| `/use-skill:<username>/<name>` or template-like research method | Skillhub Blueprint | Fetch blueprint fresh; if it becomes a playbook, route through [playbook-creation.md](references/playbook-creation.md) and set `--skill-id`. |
| backtest, strategy, signal, rebalance, portfolio simulation | Strategy / Trading Analysis | Use Altra; package as answer, feed, or playbook only as the user goal requires. |
| recurring digest, threshold tracker, alert, stream watch | Automation / Push | Build a push-capable feed and verify subscription plus sidecar output. |
| `<remix ...>` or "remix this playbook" | Remix | Read source files; preserve lineage and source UDFs. |
| `<annotation ...>` or "change this element" | Edit / Debug | Edit the generator behind the element, not rendered feed values. |
| "does Alva have X?" | Capability Verification | Run `alva data-skills list | grep -i <topic>` before saying no. |

## Capability Boundaries

Alva has broad coverage, but the boundaries are part of the product contract.
Naming them early prevents wasted build time.

**Structured data vs search.** Data Skills are for deterministic datasets and
repeatable fields. Search is for source-backed context, non-US finance, global
X/Grok search, and off-catalog assets. Search results may inform a feed or a
source-cited answer, but they do not become raw chart data by being pasted into
HTML.

**Runtime vs local agent.** Runtime code runs on Alva Cloud, not on the agent's
machine. It cannot use local filesystem paths, shell commands, Node builtins,
or environment variables. If a task must be durable, scheduled, public, or
feed-backed, verify it in Alva runtime rather than only locally.

**Feed vs playbook.** A feed is the data contract; a playbook is the UI and
distribution surface. A beautiful playbook with stale or unreleased feeds is
not complete. A good feed with no user-facing surface may be enough for an
internal automation or direct data product.

**alpi vs data.** alpi can turn real upstream data into narrative and
categories, but it cannot invent financial facts. Its output belongs in clearly
labeled AI analysis or narrative fields, not factual columns posing as sourced
data.

**UDF vs ordinary interaction.** UDFs are for user-registered functions other
viewers can invoke. Tabs, filters, chart controls, and feed-backed refresh do
not require UDFs.

**Trading execution vs analysis.** Backtests and signals use Altra. Actual
orders require the trading surface, a dry run first, explicit user confirmation
before non-dry-run execution, and [api/trading.md](references/api/trading.md).

## Capability Map

The map is organized as one shared layer plus two decision trees. **Shared Data
And Execution** is the common substrate: Data Skills, search, BYOD, `alva run`,
jagent runtime, and provenance rules. **Financial Analysis / Ask Question**
uses that layer for sourced chat answers. **Durable Artifacts / Playbook** uses
that layer, then persists or publishes work through feeds, automations,
signals, playbooks, or release flows. Choose the smallest tree that satisfies
the verb.

### Shared Data And Execution Layer

This layer is shared by direct answers and durable artifacts. Do not treat data
access or `alva run` as playbook-only. A direct answer may still need Alva Cloud
execution for live fetches, joins, transformations, shape checks, indicators, or
peer comparisons; the difference is that the result stays in chat instead of
becoming a feed, cronjob, signal, or playbook.

#### Data Access: Data Sources

Data Skills are the primary source for structured financial facts: prices,
klines, fundamentals, estimates, insider and senator trades, ownership, options
chains and Greeks, macro, on-chain metrics, exchange flows, prediction markets,
news, and indexed Twitter/X. The mandatory discovery path is `list` ->
`summary` -> `endpoint`.
Use `Authorization: Bearer <ARRAYS_JWT>`, not `X-API-Key`. For curated thematic
or sector baskets, verify ticker fit with live company-detail data such as
`getStockCompanyDetail`; do not trust memory.

Source routing:

- Structured US-equity, options, crypto, on-chain, macro, semiconductor spot
  price, prediction-market, and fundamentals data: Data Skills.
- Twitter/X handle history, URL lookup, or full-text over tracked investing
  accounts: Data Skills.
- Global X search beyond Arrays' index, news/web search, non-US finance, or
  off-catalog asset classes: [search.md](references/search.md) /
  `unified_search`.
- Direct latest/realtime price for covered US equities and crypto: intraday
  klines, not daily-level bars or closes.
- Non-US equities (dotted-suffix tickers like `0700.HK`, `000660.KS`): try Data
  Skills non-US daily kline first; fall back to `searchPerplexityFinance` for
  uncovered tickers or intraday/live prices.

#### Data Access: Content Search And BYOD

Content search enriches a real data pipeline; it does not replace one. Use it
for market narratives, source discovery, global X/Grok queries, news, Reddit,
YouTube, podcasts, web search, non-US finance, and off-catalog assets.

Open [search.md](references/search.md) for source-specific usage and gotchas,
and [content-legitimacy.md](references/content-legitimacy.md) before presenting
any sourced financial value.

BYOD is appropriate when the user supplies a source or Alva coverage cannot
answer the task after capability verification. Wire the source into runtime
code or feed logic; do not paste discovered values into HTML or direct answers.
Use [secret-manager.md](references/secret-manager.md) if credentials are
needed.

BYOD still has to behave like an Alva source: validate it, state freshness and
blind spots, and route durable outputs through feeds.

#### Execution: Jagent Runtime And `alva run`

Alva runtime scripts execute JavaScript in a sandboxed V8 isolate through
`alva run` or cronjobs. They cannot access local files, shell, Node builtins,
`process`, global `fetch`, top-level `await`, or timer globals.

Open [jagent-runtime.md](references/jagent-runtime.md) before writing runtime
code. Common modules:

| Need | Module / reference |
| --- | --- |
| ALFS files and shared modules | `require("alfs")`; `~/library`; [api/filesystem.md](references/api/filesystem.md) |
| user id, username, args | `require("env")` |
| third-party secrets | `require("secret-manager")`; [secret-manager.md](references/secret-manager.md) |
| HTTP | `require("net/http")` |
| statistics / indicators | `@alva/algorithm` or runtime `alva sdk` modules |
| persistent feed output | `@alva/feed`; [feed-sdk.md](references/feed-sdk.md) |
| trading engine | `FeedAltra`; [altra-trading.md](references/altra-trading.md) |
| scheduled LLM reasoning | `@alva/pi`; [alpi.md](references/alpi.md) |
| ONNX model inference | `@alva/onnx`; [onnx.md](references/onnx.md) |
| runtime tests | `@test/suite` |

Runtime code should be boring and inspectable: small shape checks before full
feeds, explicit precondition errors, no silent fallback records, and no local
simulation when the blueprint requires Alva Cloud behavior. If a script throws
`ReferenceError: <X> is not defined`, rewrite for the jagent runtime instead of
retrying the same code. Before each write/run/debug step, read the matching
section in [operational-pitfalls.md](references/operational-pitfalls.md).

#### Provenance: Financial Values

Read [content-legitimacy.md](references/content-legitimacy.md) before surfacing
financial values in either tree. Comparison baselines are financial facts. A
historical average, peer multiple, macro yardstick, or benchmark return that
supports a judgment must be fetched or clearly labeled as unsourced. Do not put
sourced current data next to memory-derived baselines.

### Financial Analysis / Ask Question Tree

Financial analysis is the default for user questions about markets, assets,
portfolios, valuation, catalysts, rankings, comparisons, and "why" narratives.
It may be a single fresh data fetch, an `alva run` computation over live data,
a sourced explanation, a peer comparison, a thesis check, or a concise table.
It is not merely "Data Query": data access and execution are steps inside an
analysis answer.

Common subroutes are latest fact, contextual explanation, comparison/valuation,
ranking or screen-in-text, and thesis check. They all end as an answer unless
the user asks to track, alert, share, publish, or turn the result into an app.

Use the shared data and execution layer first. If the user asks a direct
question, answer directly with provenance; if they ask to track, alert, share,
or publish, route to the durable artifact / playbook tree instead.

Financial-analysis answer gate: before answering any Financial Analysis / Ask
Question, read [user-facing-prose.md](references/user-facing-prose.md), then
satisfy the ask evidence gate. Simple latest-fact asks stop there after one
sourced hop; complex judgment asks must also use the Complex Ask Router in
[request-routing.md](references/request-routing.md), apply every matching
quality gate, and cap confidence when required evidence, KPI coverage, or
computation is missing. Do not answer until you can name the decomposition,
data/source path for each hop, fetched vs missing coverage, and which judgments
are sourced facts, computed values, or inference.

### Durable Artifacts / Playbook Tree

Enter this tree when the user asks Alva to keep something running, reusable,
shareable, inspectable, or actionable. The tree is broader than playbooks: a
script, feed, alert, signal, model output, or trading analysis may be the right
artifact without a hosted UI. Enter the playbook branch only for hosted apps,
share URLs, remixes, annotation edits, release/version updates, or playbook
subscription setup.

#### Data Product Layer: Feed Lifecycle And Automation

Feeds persist data under ALFS and are the normal backing store for live
analysis products, playbooks, dashboards, signals, alerts, and reusable
outputs. A feed is not automatically a playbook; it can also back an alert,
digest, signal, reusable dataset, or future answer.

Read [feed-lifecycle.md](references/feed-lifecycle.md) and
[feed-sdk.md](references/feed-sdk.md) when creating or changing a feed. The
short lifecycle is: write schema and logic to ALFS, `alva run`, grant
public read if needed, deploy, then `alva release feed`.

Before feed release, satisfy `before-feed-release`: fresh run, expected shape,
needed grants, public read verification, and non-empty data for HTML
dependencies. Feed scripts fail fast on missing data; the detailed release and
grant contract lives in the feed references. Read the matching
[operational-pitfalls.md](references/operational-pitfalls.md) section before
each feed, ALFS, deploy, and release step.

#### Publication Layer: Playbook Creation Tree

Playbooks are hosted investing apps: dashboards, screeners, thesis trackers,
backtest surfaces, what-if studies, event studies, or custom interactive tools.
Enter this branch only when the user wants a hosted/shareable surface, remix,
annotation edit, release/version update, or playbook subscription setup.

Read [playbook-creation.md](references/playbook-creation.md) before creating
or changing the hosted surface. It owns the build order, Browser-safe feed
reads, README, draft/release gates, screenshot verification, tier/visibility
flow, and push-after-release handoff. Read [api/release.md](references/api/release.md)
for README, tags, trading-symbol, and `--skill-id` details; read
[remix-workflow.md](references/remix-workflow.md) or
[annotation-edits.md](references/annotation-edits.md) for those subroutes.

The top-level boundary is feed-first and live-read: build feeds before HTML,
and visible numbers must be read from feed outputs in the viewer's browser.
Before HTML work, satisfy `before-build-html`; before draft/release satisfy
`before-playbook-draft` and `before-playbook-release` in the reference. Keep
procedure, release, screenshot, and tier details in the owning references.

Subroutes are new build, Skillhub-guided build, remix, annotation/edit,
release/version update, and push after release. Do not let every financial
question inherit playbook gates.

#### Strategy Layer: Altra

Altra is the trading and backtesting engine. Always use Altra for backtesting.
Use it for any strategy, simulation, portfolio logic, signal feed, equity
curve, target record, position tracking, order stream, drawdown, Sharpe, or
rebalancing.

Open [altra-trading.md](references/altra-trading.md) before implementation. It
owns provider setup, feature registration, event triggers, strategy state,
target/signal structure, PIT compliance, testing, debug patterns, and supported
OHLCV intervals.

Stock intraday window guardrail: do not directly request multi-year US stock
intraday backtests as one full window. Narrow the window, use daily/weekly
bars, or choose a provider path that explicitly chunks requests.

#### Reasoning Layer: alpi

alpi embeds a fixed LLM reasoning/tool loop inside a deterministic scheduled
pipeline. Use `@alva/pi` `Agent.ask()` for result-only classification,
summarization, TLDRs, why-it-matters, and tool-loop reasoning over real
upstream data.

Do **not** use it for one-off research the user asks interactively, and do
not use it to produce numbers or events that should come from real data. Read
[alpi.md](references/alpi.md) for API, tool calling, memory patterns,
user-editable agent instructions (release with `--agent-type alpi`, then append
the owner's `AGENTS.md` (read `${feed.path}/AGENTS.md` yourself)), and
jagent-specific constraints.

#### Model Layer: ONNX

Use ONNX when the user supplies or plans to upload an exported `.onnx` model
artifact. Read [onnx.md](references/onnx.md). Predictions must be computed from
real data, written through feed outputs, and rendered from released/granted
paths. Public playbooks should expose feed outputs, not raw model artifacts.

#### Interface Layer: Design System

The design system is a release gate, not decoration. Read
[design.md](references/design.md) first for tokens, typography, theme, layout,
and the canonical stylesheet. Then read:

- [design-widgets.md](references/design-widgets.md) for charts, widget
  layouts, and tables (the authoritative Table Card spec lives here, not in
  design-components.md).
- [design-components.md](references/design-components.md) for buttons, tabs,
  tags, dropdowns, and component details.
- [design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md)
  for strategy/backtest playbooks.

Runtime artifacts:

- [design-contract.yaml](references/design-contract.yaml) is consumed by
  `alva lint playbook` and `alva release playbook`.
- [css/design-system.css](references/css/design-system.css) is the bundled
  stylesheet; use it, but read `.md` docs for rules.
- [design-tokens.css](references/design-tokens.css) backs the bundle.

Pages using ECharts must satisfy the contract rule requiring
`requestAnimationFrame` around init/resize in hidden or resizable containers.

#### Interface Layer: UDF Runtime

User-Defined Functions let a playbook owner register shareable functions that
viewers can invoke from the playbook UI. This is strict opt-in: only use it
when the user asks for a registerable function or a button that calls their
analysis function.

Open [api/udf-runtime.md](references/api/udf-runtime.md). It owns PBSV browser
authentication, `alva functions` creator registration and allowance tools,
`window.alva.udf`, allowance consent, `UdfButton`, caller identity,
`allow_charges=false` defaults, and release checks.

#### Action Layer: Push Notifications

Push is a feed/playbook subscription flow. A feed may emit `signal/targets` or
`notify/message`; both dispatch `feed_alert_ready`. `--push-notify` only marks
the publisher capable of alerts. It does not subscribe users or bypass
preferences.

Open [push-notifications.md](references/push-notifications.md) for sidecar
creation, release, subscription, and verification. Quiet runs use
`<|SKIP_NOTIFICATION|>`.

After releasing or keeping a playbook as draft, scan whether any backing feed
is push-worthy. Recommend specific feeds, not generic "notifications". A push
setup is not complete until the feed sidecar exists, the feed is released after
that sidecar was added, the publisher has `--push-notify`, the user or group is
subscribed, and a real run writes a fresh sidecar record.

#### Playbook Subroute: Remix

A remix request usually arrives as `<remix ...>`. Extract source owner/name from
the tag URL, read the source feed scripts, HTML, README, and playbook metadata,
then build a new playbook under the requesting user's namespace. If the source
has registered UDFs, preserve them unless the user explicitly asks otherwise.

Open [remix-workflow.md](references/remix-workflow.md). `alva remix` records
parent-child lineage only; use `alva fs read` to read playbook files. If the
user asks to browse examples, use `alva playbooks trending` after help.

#### Playbook Subroute: Annotation Edits

Annotation edits target rendered playbook elements through `<annotation>`
tags. Locate the generator behind the element, usually a render function or CSS
rule, and edit that. Never freeze rendered feed values into static text.

Open [annotation-edits.md](references/annotation-edits.md). HTML edits re-enter
`before-build-html`.

#### Support Layer: Memory

Alva memory is file-based and user-visible under `~/memory/`. Read
[memory.md](references/memory.md) before writing it. Store durable preferences,
identity facts, investment style, and useful context; never store secrets,
raw API keys, or unverified claims as truth.

#### Support Layer: Secret Manager

Use [secret-manager.md](references/secret-manager.md) whenever runtime code
needs API keys, exchange credentials, webhook secrets, or other third-party
credentials. Prefer the web upload page at <https://alva.ai/apikey>. Do not ask
the user to paste sensitive third-party secrets into chat when web upload is
feasible. Runtime access and CRUD details live in the reference; never log
returned values.

#### Support Layer: Platform Feedback

When an Alva-owned API/runtime/data/docs/auth/product issue blocks or materially
degrades the task, read [api/feedback.md](references/api/feedback.md), run
`alva feedback --help`, ask for user confirmation, and scrub secrets before
submitting. If the task fails because Alva behaved unexpectedly, offer the
feedback flow before closing.

## Content Legitimacy Quick Rules

Open [content-legitimacy.md](references/content-legitimacy.md) before surfacing
financial values. The quick checks:

- Charts, tables, metric cards, and query answers need real Data Skills,
  feed, or validated BYOD provenance.
- HTML values are fetched from feed outputs at runtime. Never hardcode data as
  inline JavaScript literals for financial values.
- If `alva release playbook --feeds '[]'` is used, the HTML must render zero
  quantitative values.
- WebSearch can discover docs or BYOD endpoints; it cannot become the data.
- LLM/alpi output can synthesize real upstream data; it cannot invent facts,
  figures, events, or sourced-looking reports.
- More than 20% failed symbol lookups is a data-quality blocker, not a prompt
  to fabricate or mark rows `live: false`.
- Feed Scope Isolation: build new feeds unless the user explicitly asks for
  reuse.
- For fundamentals periods, YoY/QoQ, or cross-company comparisons, open
  [fundamentals-periods.md](references/fundamentals-periods.md).
- Descriptions, README, methodology, and copy can only list data sources and
  cadences actually wired and deployed.

## Common Workflows

These sketches are the encyclopedia-level shape of the work. Open the named
reference before doing the task.

### Ask Question / Financial Analysis

For "what is the latest price / P/E / funding rate / holdings / CPI print",
"why did it move", "is it cheap vs peers", or "rank these in text", start with
financial analysis. Run preflight if needed, verify the relevant Data Skills or
search route, use `alva run` when live computation or joins are needed, fetch
or qualify any comparison baseline, read
[user-facing-prose.md](references/user-facing-prose.md), apply the answer gate
in the Financial Analysis tree, classify complex asks with
[request-routing.md](references/request-routing.md), and answer with inline
provenance. If a structured source returns stale or missing latest data, use
[data-skills.md](references/data-skills.md#structured-feed-lag) before refusing
when a known official release may be ahead of the feed; otherwise report the
failure instead of substituting a web snippet or model memory. If the user then
asks to track, alert, share, or publish, upgrade the route to a feed, signal,
alert, or playbook.

### Hosted Playbook Workflow

Enter this tree when the user wants a hosted app, share URL, dashboard,
screener app, report surface, remix, annotation edit, release/version update,
or playbook subscription setup. First choose the artifact shape: direct answer,
feed, signal, model output, or hosted playbook. For hosted/shareable surfaces,
turn the request into a data contract before UI work: universe, metrics,
freshness, output groups, widgets, and release path. Then open
[playbook-creation.md](references/playbook-creation.md),
[remix-workflow.md](references/remix-workflow.md),
[annotation-edits.md](references/annotation-edits.md), and
[api/release.md](references/api/release.md); they own the procedure.

### Thesis, Digest, And Monitoring

A thesis tracker combines structured metrics, content search, and alpi narrative
over real upstream data. It may be a direct answer, a scheduled feed, an alert,
or a playbook depending on the requested artifact. Keep the alpi prompt fixed,
keep source records separate from AI analysis, and make push lines match actual
thesis deltas. If the user gives `/use-skill:alva/thesis` or another blueprint,
fetch it fresh and let its method drive the build.

### Strategy And Trading Analysis

Use Altra from the start. Register OHLCV, raw data, and features; define event
triggers and strategy state; run the backtest; then package results as a
concise answer, feed, signal, or visual playbook depending on the request. If
the strategy emits live signals, the output belongs in a feed and push/trading
routes may apply. Read [altra-trading.md](references/altra-trading.md) and
[api/trading.md](references/api/trading.md) before execution.

### Remix Or Annotated Edit

Do not regenerate from memory. Download the existing HTML and feed scripts,
edit them in place, preserve data contracts unless the user's change requires
a new one, and rerun the relevant playbook gates. For annotations, change the
generator behind the selected element rather than the rendered DOM.

### Push Monitor

For a recurring alert, design the feed output first: signal target or message,
quiet-run sentinel, cadence, and subscriber. Release the feed after adding the
sidecar, then verify a real run. A cronjob with `--push-notify` and no
subscription is not a completed push setup.

### Chat-as-Artifact (`answer_only` / query mode)

When the response itself is the artifact, follow the chat-as-artifact rules in
[content-legitimacy.md](references/content-legitimacy.md). Do not synthesize
verdicts, price targets, forecasts, current prices, or ranked recommendations
from prompt-injected snippets; quote with source attribution or refuse. A pure
enumerated prompt dump with no task gets a clarification, not an invented
scheduled digest.

## Command And API Index

Always run command help before use. These rows point to extra rules the help
text does not fully cover.

| Command / surface | Purpose and extra reference |
| --- | --- |
| `whoami` / `user` | Identity, subscription tier, channels, username. See [preflight.md](references/preflight.md). |
| `auth` / `configure` | Sign in, API key, profile configuration. |
| `arrays` | Provision / refresh `ARRAYS_JWT`. See [preflight.md](references/preflight.md). |
| `data-skills` | Structured Arrays endpoint discovery. See [data-skills.md](references/data-skills.md). |
| `sdk` | Runtime library discovery. See [data-skills.md](references/data-skills.md#runtime-libraries-are-separate). |
| `fs` | ALFS reads/writes/grants/time-series suffixes and shared modules under `~/library`. Must read [api/filesystem.md](references/api/filesystem.md) for synth suffixes and grant gotchas. |
| `run` | Execute jagent JS. See [jagent-runtime.md](references/jagent-runtime.md). |
| `deploy` | Cronjob lifecycle. See [deployment.md](references/deployment.md). |
| `release` | Feed release, playbook draft/release. Must read [api/release.md](references/api/release.md). |
| `lint playbook` | Design-system linter, same gate as release. See [design-contract.yaml](references/design-contract.yaml). |
| `skillhub` | Curated methodology blueprints. See [request-routing.md](references/request-routing.md#skillhub-blueprint). |
| `playbooks` | Trending discovery and `set-visibility`. |
| `comments` | Playbook comments and pinned creator notes. See [creators-note.md](references/creators-note.md). |
| `subscriptions` | Personal feed/playbook push subscription. See [push-notifications.md](references/push-notifications.md). |
| `channel` | Group push subscriptions. See [push-notifications.md](references/push-notifications.md). |
| `trading` | Accounts, portfolio, orders, subscriptions, execution. Must read [api/trading.md](references/api/trading.md). |
| `screenshot` | PNG capture for released playbook verification. See [playbook-creation.md](references/playbook-creation.md#screenshot). |
| `remix` | Lineage registration only. See [remix-workflow.md](references/remix-workflow.md). |
| `functions` | Playbook UDF registration, invoke smoke tests, and allowance management. Must read [api/udf-runtime.md](references/api/udf-runtime.md). |
| `credits` | Current viewer credit wallet and self-scoped consumption rows. Must read [api/credits.md](references/api/credits.md). |
| `secrets` | Secret CRUD for agent-managed setup. See [secret-manager.md](references/secret-manager.md). |
| `feedback` | Submit user-confirmed Alva platform feedback. Must read [api/feedback.md](references/api/feedback.md). |

Non-CLI references:

- [api/error-responses.md](references/api/error-responses.md) for programmatic
  HTTP error handling.
- [api/udf-runtime.md](references/api/udf-runtime.md) for PBSV browser runtime
  behavior behind `window.alva.udf`.

## Reference Library

Use this index to open only the file needed for the current task.

| File | Owns |
| --- | --- |
| [preflight.md](references/preflight.md) | Session start, Rule 0, CLI, auth, profile, Arrays JWT, memory load, user scope. |
| [request-routing.md](references/request-routing.md) | Route choice, Skillhub, Guided Planning, capability verification, completion gate. |
| [content-legitimacy.md](references/content-legitimacy.md) | Data provenance, prohibited sources, chat-as-artifact, feed isolation, conventions. |
| [data-skills.md](references/data-skills.md) | Data Skills discovery, endpoint calls, Arrays auth, search/data routing. |
| [feed-lifecycle.md](references/feed-lifecycle.md) | Feed build/release lifecycle, modeling summary, push sidecars, `before-feed-release`. |
| [playbook-creation.md](references/playbook-creation.md) | HTML build, browser-safe reads, README, draft, release, screenshot, tier flow. |
| [push-notifications.md](references/push-notifications.md) | Push-worthy feeds, sidecars, subscriptions, delivery verification. |
| [operational-pitfalls.md](references/operational-pitfalls.md) | Runtime, ALFS, chart, watermark, and resource pitfalls. |
| [jagent-runtime.md](references/jagent-runtime.md) | V8 runtime, modules, async model, constraints, built-ins. |
| [feed-sdk.md](references/feed-sdk.md) | Feed SDK API, schemas, time series, grouped records, upstreams, examples. |
| [altra-trading.md](references/altra-trading.md) | Altra strategy engine, features, signals, tests, PIT compliance. |
| [alpi.md](references/alpi.md) | Scheduled LLM reasoning/tool-loop API and examples. |
| [onnx.md](references/onnx.md) | ONNX artifact, inference, FeedAltra integration, release checks. |
| [deployment.md](references/deployment.md) | Cronjob create/list/pause/resume/trigger/runs/run-logs. |
| [search.md](references/search.md) | `unified_search`, finance search, Twitter/X, Reddit, YouTube, web gotchas. |
| [secret-manager.md](references/secret-manager.md) | Secret upload, naming, CRUD, runtime access, guardrails. |
| [memory.md](references/memory.md) | Memory storage layout, write policy, user profile template. |
| [user-facing-prose.md](references/user-facing-prose.md) | Product vocabulary, voice rules, and alpi prose prompt block. |
| [design.md](references/design.md) | Design entrypoint, canonical CSS link, tokens, layout. |
| [design-widgets.md](references/design-widgets.md) | Widget and chart layouts. |
| [design-components.md](references/design-components.md) | Component specs. |
| [design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md) | Strategy/backtest playbook UI. |
| [annotation-edits.md](references/annotation-edits.md) | `<annotation>` edit procedure. |
| [remix-workflow.md](references/remix-workflow.md) | Remix extraction, source reads, lineage. |
| [creators-note.md](references/creators-note.md) | Pinned author comment after release. |
| [fundamentals-periods.md](references/fundamentals-periods.md) | Fiscal/calendar period alignment. |
| [api/filesystem.md](references/api/filesystem.md) | ALFS synth suffixes and feed grant gotcha. |
| [api/release.md](references/api/release.md) | Release extras: README, tags, trading symbols, skill id, descriptions. |
| [api/trading.md](references/api/trading.md) | Trading signal schema, symbol naming, dry-run rules. |
| [api/udf-runtime.md](references/api/udf-runtime.md) | Playbook UDF CLI setup, allowance management, and browser invocation. |
| [api/credits.md](references/api/credits.md) | User-scoped credit wallet and consumption history queries. |
| [api/feedback.md](references/api/feedback.md) | User-confirmed Alva platform feedback for Alva-owned blockers. |
| [api/error-responses.md](references/api/error-responses.md) | HTTP status to error-code table. |

Runtime artifacts:

| Artifact | Use |
| --- | --- |
| [css/design-system.css](references/css/design-system.css) | Bundled CSS loaded by playbook HTML; rules live in design `.md` files. |
| [design-contract.yaml](references/design-contract.yaml) | Linter/release contract. |
| [design-tokens.css](references/design-tokens.css) | Token source used by the CSS bundle. |

## User-Facing Communication

Lead with the result, not the machinery. Say what the user got, what was
verified, and what remains. Avoid raw ALFS paths, API payloads, job ids,
internal function names, or scaffold details unless the user is debugging or
asks for them.

When giving direct answers with financial figures, attribute each number to a
fresh Data Skills/BYOD/feed/search source, or clearly say the fetch failed.
Do not present estimates from memory as live facts.

For multi-step builds, give short milestone updates. For final answers, include
the canonical share URL for released playbooks and use `published_url` only for
verification evidence such as screenshots.

## Final Sanity Checklist

Before finishing an Alva task, ask:

- Did I read [preflight.md](references/preflight.md) and current command help?
- Did every financial value come from Data Skills, feed output, or validated
  BYOD/search source?
- Did Financial Analysis / Ask Question read
  [user-facing-prose.md](references/user-facing-prose.md), then pass the answer
  gate, and the Complex Ask Router only for complex judgment asks, before I
  answered?
- Did I avoid WebSearch/LLM/memory/user-pasted data as factual values?
- Did I run Data Skills `list` -> `summary` -> `endpoint` before coding calls?
- Did feed release pass `before-feed-release`?
- Did playbook work read [playbook-creation.md](references/playbook-creation.md)
  and pass the relevant hard gates?
- Did design work read [design.md](references/design.md) and lint where needed?
- Did Skillhub work fetch the blueprint fresh and set `--skill-id` if used?
- Did backtesting or signal work use Altra?
- Did push work verify both publisher sidecar and subscriber target?
- If Alva-owned behavior blocked the task, did I offer the confirmed feedback
  flow after reading [api/feedback.md](references/api/feedback.md)?
- Did the final response describe the delivered result without leaking
  unnecessary internals?
