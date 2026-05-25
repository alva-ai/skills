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
  version: v1.10.0
---

# Alva

Alva is an agentic finance platform for market data, research, backtesting,
cloud analytics, scheduled automations, trading signals, dashboards, and hosted
playbooks. The platform exposes 250+ financial data sources across equities,
crypto, macro, on-chain, news, social, prediction markets, and custom BYOD
sources, plus a cloud JavaScript runtime and the Altra trading engine.

This file is the Alva platform capability map and operating entrypoint. It gives
the full panorama of what Alva can do, when each capability applies, the one
rule you must not miss before acting, and exactly which reference to open for
the detailed procedure. Deep examples, API details, gotchas, templates, and
long checklists live in `references/`.

## Platform Capability Map

Use this as the single operating entrypoint for Alva work. Each capability says
when it applies, the one rule to keep in working memory, and the exact
reference to open before acting. The references own procedures, examples, API
details, command shapes, and long checklists.

### Session Start

Applies at the start of any Alva task or after context loss.

Must not miss: Rule 0 is help-first. Always read
[preflight.md](references/preflight.md) before first Alva use in a session.
Every `alva` command you have not used in this session must be preceded by
`alva <command> --help`; CLI help is authoritative.

Preflight also owns `version_check.sh`, CLI install/upgrade, `alva whoami`,
`subscription_tier`, external delivery fields, `ARRAYS_JWT`, and the required
`~/memory/MEMORY.md` load. For memory rules, open
[memory.md](references/memory.md): memory is a claim, not truth. Verify any
feed, cronjob, preference, or parameter before acting on it in a new session.

Before producing user-facing wording, open [language.md](references/language.md)
for product vocabulary and [narrative-voice.md](references/narrative-voice.md)
for playbook copy, README prose, ADK prompts, digests, methodology text, and
release descriptions. User-facing prose may not use the banned AI-tell shapes
or unsupported claims. For post-release pinned commentary, open
[creators-note.md](references/creators-note.md).

### Skillhub Blueprint

Applies when `/use-skill:<username>/<name>` appears; before non-trivial
what-if, event-study, quant research, factor, ML signal, or strategy work that
matches an official Alva template; or when a catalog methodology informs the
build.

Must not miss: fetch the blueprint fresh with `alva skillhub list/get/file`;
blueprints beat remembered templates and stale companion source files. Pass
`--skill-id <username>/<name>` during playbook draft when any Skillhub skill
informed the build.

Concrete command anchors live in [request-routing.md](references/request-routing.md):
`alva skillhub get <username>/<name>`, then
`alva skillhub file <username>/<name> <blueprint>`. Pull extra files only on
demand; do not bulk-download.

Open [request-routing.md](references/request-routing.md) and
[api/release.md](references/api/release.md#skill-id). Use
[request-routing.md](references/request-routing.md#official-template-route) for
the official `alva/backtest` and `alva/quant-research-lab` routes.

### Dashboard / Playbook

Applies when the user wants a market dashboard, feed-backed HTML, shareable
playbook, or a hosted analysis surface.

Must not miss: choose data sources, feed outputs, HTML runtime reads, design
surface, README, and release path before building. Dashboard / playbook work is
never just static HTML when it displays quantitative values.

Open [request-routing.md](references/request-routing.md),
[content-legitimacy.md](references/content-legitimacy.md),
[feed-lifecycle.md](references/feed-lifecycle.md), and
[playbook-release.md](references/playbook-release.md).

### Data Query

Applies when the user asks for a direct price, ratio, market figure, screen, or
dataset answer.

Must not miss: every figure needs a fresh Data Skills/BYOD fetch or a clear
"could not fetch" response; do not answer financial figures from memory with an
estimate caveat.

Open [data-skills.md](references/data-skills.md) and
[content-legitimacy.md](references/content-legitimacy.md). Before saying Alva
lacks a capability or recommending BYOD, run
`alva data-skills list | grep -i <topic>` as described in
[request-routing.md](references/request-routing.md#capability-verification).

### Content Legitimacy

Applies before surfacing any financial value, chart/table/metric-card data,
README source claim, methodology claim, or feed-backed UI.

Must not miss: the agent builds the pipeline, not to be the data source. Do not
use WebSearch, LLM/ADK output, agent memory, synthetic/random data, or
user-pasted examples as factual chart/table/query data. If HTML shows numbers,
charts, tables, or metric cards, those values must come from deployed feed
outputs at runtime and the release must declare the backing feeds.

Open [content-legitimacy.md](references/content-legitimacy.md). For quarterly,
annual, YoY/QoQ, or cross-company fundamentals, also open
[fundamentals-periods.md](references/fundamentals-periods.md).

### Structured Data Discovery

Applies to structured Arrays financial data: market history, fundamentals,
estimates, ownership, macro, on-chain, news, prediction markets, per-handle
Twitter/X history, rolling updates, and calls inside `alva run`.

Must not miss: complete `alva data-skills list`, then `summary`, then
`endpoint` for the exact endpoint in this session. Never guess ids, files,
params, or response shapes; use `Authorization: Bearer <ARRAYS_JWT>`, not
`X-API-Key`.

Open [data-skills.md](references/data-skills.md).

### Content Search

Applies to topic/keyword search, social/news/community context, non-US finance
search, or off-catalog market narratives.

Must not miss: prefer the structured Alva data path for deterministic
US-equity, crypto, and fundamental data; search enriches but does not replace
real data.

Open [search.md](references/search.md) and
[content-legitimacy.md](references/content-legitimacy.md).

### BYOD

Applies when the user supplies an API/file/source or Alva coverage is
insufficient after verification.

Must not miss: validate the source and wire it into the feed pipeline; do not
paste discovered values into HTML.

Open [content-legitimacy.md](references/content-legitimacy.md),
[jagent-runtime.md](references/jagent-runtime.md), and
[secret-manager.md](references/secret-manager.md) if credentials are needed.

### Runtime Script

Applies to `alva run`, cronjob scripts, helper modules, ALFS reads/writes, or
HTTP fetches inside Alva Cloud.

Must not miss: Alva Cloud runtime is not the local host. Open
[jagent-runtime.md](references/jagent-runtime.md) before writing code; it owns
the runtime constraints and jagent module rules.

Common trigger terms: `process`, `net/http`, and top-level await indicate you
need the runtime reference before coding or debugging.

Open [jagent-runtime.md](references/jagent-runtime.md).

Runtime capability routing:

| Capability | Read before acting |
| --- | --- |
| ALFS file access, synth suffixes, public grants | [api/filesystem.md](references/api/filesystem.md) |
| Feed SDK, time series, grouped records, push sidecars | [feed-sdk.md](references/feed-sdk.md) |
| Altra backtesting / strategy engine | [altra-trading.md](references/altra-trading.md) |
| ADK fixed LLM reasoning inside scheduled pipelines | [adk.md](references/adk.md) |
| ONNX inference from uploaded model artifacts | [onnx.md](references/onnx.md) |
| Secret access in runtime scripts | [secret-manager.md](references/secret-manager.md) |
| Runtime search libraries | [search.md](references/search.md) |
| Common path/runtime/resource pitfalls | [operational-pitfalls.md](references/operational-pitfalls.md) |

### Feed Build

Applies whenever data needs persistence, freshness, public reads, charts, or
playbook backing.

Must not miss: feed outputs use the Feed SDK and its time series, then pass the
full feed lifecycle before release; a manual `alva run` is a test step, not a
live playbook backend.

Open [feed-sdk.md](references/feed-sdk.md) and
[feed-lifecycle.md](references/feed-lifecycle.md).

### Feed Release

Applies before `alva release feed`.

Must not miss: `before-feed-release` is a hard gate; do not run
`alva release feed` on stale, untested, ungranted, or unreadable output.
Live playbooks also require deployment with `alva deploy create` and public
read verification.

Open [feed-lifecycle.md](references/feed-lifecycle.md#hard-gate-before-feed-release).

<HARD-GATE id="before-feed-release">
Before `alva release feed`, open
[feed-lifecycle.md](references/feed-lifecycle.md#hard-gate-before-feed-release)
and satisfy the full gate: fresh successful run after latest source write,
expected output shape, public grant on the feed root, unauthenticated public
read, and non-empty `@last` data when HTML depends on the feed.
</HARD-GATE>

### Deployment

Applies to scheduled automations, cron syntax, manual triggers, run logs,
pause/resume, deletion, or feed/playbook row cleanup.

Must not miss: deploy is its own lifecycle row; ALFS removal does not delete the
cronjob, feed, or playbook DB record.

Open [deployment.md](references/deployment.md).

### Playbook HTML

Applies before creating or modifying `index.html`.

Must not miss: `before-build-html` is a hard gate and runtime quantitative data
must come from public feed reads, with no inline literals.

Open [playbook-release.md](references/playbook-release.md#hard-gate-before-build-html)
and the applicable design references.

<HARD-GATE id="before-build-html">
Before HTML edits, open
[playbook-release.md](references/playbook-release.md#hard-gate-before-build-html)
and the applicable design references. At minimum read
[design-system.md](references/design-system.md); read
[design-widgets.md](references/design-widgets.md) for widgets/charts/tables,
[design-components.md](references/design-components.md) for UI components, and
[design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md)
only for strategy dashboards or Skillhub blueprints that use the
Overview/Analytics/Strategy/Feed tab structure.
</HARD-GATE>

### Design System

Applies to every playbook page, widget, component, chart, table, and strategy
dashboard.

Must not miss: read `design-system.md` first, then only the companion spec the
surface needs.

Open [design-system.md](references/design-system.md),
[design-widgets.md](references/design-widgets.md),
[design-components.md](references/design-components.md), or
[design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md).

Design capability routing:

| Task | Read |
| --- | --- |
| Global tokens, typography, theme, page container | [design-system.md](references/design-system.md) |
| Charts, metric cards, tables, feed cards, free text, group titles | [design-widgets.md](references/design-widgets.md) |
| Dropdown, Markdown, button, tag, switch, modal, select, input, tab, tooltip | [design-components.md](references/design-components.md) |
| Trading strategy UI with Overview/Analytics/Strategy/Feed tabs | [design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md) |
| Token CSS import | [design-tokens.css](references/design-tokens.css) |

### Playbook Draft

Applies before `alva release playbook-draft`.

Must not miss: `before-playbook-draft` is a hard gate; metadata, feeds, README,
HTML, `trading-symbols`, tags, and Skillhub id must match the approved build.
Every draft/release path must include the attached `README.md` contract.

Open [playbook-release.md](references/playbook-release.md#hard-gate-before-playbook-draft)
and [api/release.md](references/api/release.md).

<HARD-GATE id="before-playbook-draft">
Before `alva release playbook-draft`, open
[playbook-release.md](references/playbook-release.md#hard-gate-before-playbook-draft)
and verify HTML, README, user namespace, feed gates, metadata, tags/trading
symbols, and `--skill-id` when Skillhub informed the build.
</HARD-GATE>

### Playbook Release

Applies before `alva release playbook`.

Must not miss: `before-playbook-release` is a hard gate; fresh feed coverage,
README, deployment, runtime fetches, namespace, and push-only feeds must be
verified.

Open [playbook-release.md](references/playbook-release.md#hard-gate-before-playbook-release).

<HARD-GATE id="before-playbook-release">
Before `alva release playbook`, open
[playbook-release.md](references/playbook-release.md#hard-gate-before-playbook-release)
and verify feed release gates, deployment coverage, active cronjobs, runtime
HTML fetches, freshness, README accuracy, namespace, absolute `--readme-url`,
and push-only feed release coverage.
</HARD-GATE>

### Screenshot Verification

Applies after release or when visual correctness matters.

Must not miss: capture the `published_url`, verify the file is really a PNG,
and do not describe screenshots you did not take. Use the canonical share URL
`https://alva.ai/u/<username>/playbooks/<playbook_name>` for users; reserve
`published_url` for screenshot verification.

Open [playbook-release.md](references/playbook-release.md#screenshot-verification).

### Push Alerts

Applies after a draft/release when a feed produces time-sensitive signals,
reports, monitors, or alerts.

Must not miss: publisher setup and subscriber setup are separate; do not claim
success until a real run writes the sidecar. Push output uses `signal/targets`
or `notify/message`; cronjobs need `--push-notify`, a current feed release, and
an explicit subscription (`subscribe-feed`, `subscribe-playbook`, or group
subscribe command). Verify with a real-run `@last/1`; quiet monitor runs should
emit `<|SKIP_NOTIFICATION|>`.

Open [push-notifications.md](references/push-notifications.md).

### What-if / Event Study

Applies to "what if I bought/sold X when Y happens", after/before-trigger
playbooks, drawdown/recovery studies, or event-conditioned forward returns.

Must not miss: check `alva/backtest`, use Altra for event computation, and
follow the blueprint's single-scroll narrative layout rather than the generic
strategy dashboard spec.

Open [request-routing.md](references/request-routing.md#official-template-route),
[altra-trading.md](references/altra-trading.md), and
[design-widgets.md](references/design-widgets.md).

### Backtest / Strategy

Applies to event studies, strategy simulation, allocation rules, target
weights, paper trading, and visual strategy results.

Must not miss: always use Altra/FeedAltra for backtesting and strategy
simulation. Hand-rolled loops over price arrays bypass bar alignment,
point-in-time safety, and portfolio simulation; trading execution signals use
the real `allocate`/`predict` schema, not a `{symbol, side, qty}` order shape.

After a successful backtest, deliver a usable result with visual evidence:
a playbook, dashboard, or concise visual analysis, not raw console output.

Open [altra-trading.md](references/altra-trading.md),
[api/trading.md](references/api/trading.md),
[feed-lifecycle.md](references/feed-lifecycle.md), and
[playbook-release.md](references/playbook-release.md) before publishing.

### Quant Research / ML

Applies to factor tests, paper reproduction, ML signals, allocation rules,
target weights, portfolio analysis, paper trading, and actionable signals.

Must not miss: check `alva/quant-research-lab`, freeze the research contract,
run time-aware validation, and always use Altra/FeedAltra for
strategy/backtest metrics to avoid look-ahead bias; raw model output is not a
trading instruction, and published work should be a visual playbook or usable
visual analysis.

Open
[request-routing.md](references/request-routing.md#official-template-route),
[altra-trading.md](references/altra-trading.md), [onnx.md](references/onnx.md)
when models are exported, and
[design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md)
only for strategy dashboards or blueprints that request its tab structure. Open
[feed-lifecycle.md](references/feed-lifecycle.md) and
[playbook-release.md](references/playbook-release.md) before publishing.

### Trading Operations

Applies to live/paper accounts, portfolio, orders, risk rules, subscriptions,
or `alva trading execute`.

Must not miss: command help examples can be misleading for `--signal`; read the
real schema before execution.

Open [api/trading.md](references/api/trading.md).

### ADK Narrative

Applies to scheduled LLM summarization, classification, TLDRs, digests,
why-it-matters, and feed-backed narrative transforms.

Must not miss: ADK is not for one-off research and may not invent factual
numbers or events; do not use it to produce numbers that should come from real
data. Use AlvaAsk for ordinary scheduled agent digests unless custom ADK
tool-loop behavior is required. ADK belongs in a deterministic, reschedulable
pipeline.

Open [adk.md](references/adk.md),
[narrative-voice.md](references/narrative-voice.md), and
[content-legitimacy.md](references/content-legitimacy.md).

### ONNX Inference

Applies when the user supplies or deploys a `.onnx` model, tensor inputs, or
scheduled inference playbook.

Must not miss: use `@alva/onnx`, and remember model output is not a trading
instruction unless FeedAltra turns it into a tested strategy. Model artifacts
stay on ALFS and predictions flow through feed outputs before release.

Open [onnx.md](references/onnx.md).

### Secret Use

Applies to exchange keys, LLM keys, search tokens, webhooks, and third-party
API credentials.

Must not miss: send users to <https://alva.ai/apikey> when feasible and load
with Secret Manager inside runtime code. Never ask users to paste secrets into
chat when the upload flow works, and never hardcode secrets in source/ALFS.

Open [secret-manager.md](references/secret-manager.md).

### Remix

Applies to `<remix>` tags, existing playbook customization, or browsing public
examples.

Must not miss: use `alva playbooks trending` for discovery when no source URL
is given, and use `alva remix` only for lineage. Source playbook files are read
through ALFS, and every remix must pass a content legitimacy audit before
deployment. Do not use WebSearch as factual chart/table data in a remix.

Open [remix-workflow.md](references/remix-workflow.md).

### Annotation Edit

Applies to `<annotation>` tags with a CSS selector and instruction.

Must not miss: selector points to rendered output, but you edit the generator
behind it. Never freeze rendered live feed values into static HTML text; rerun
the relevant feed, HTML, draft, or release gate after changing a generator.

Open [annotation-edits.md](references/annotation-edits.md).

### Fundamentals Periods

Applies to quarterly/annual fundamentals, period labels, YoY/QoQ, and
cross-company comparison tables/charts.

Must not miss: period is fiscal, not calendar, unless the record says
otherwise; derive labels from the record.

Open [fundamentals-periods.md](references/fundamentals-periods.md).

### Common Pitfalls

Applies to stale data, bad paths, chart failures, runtime errors, and resource
limits.

Must not miss: read the Filesystem Layout and Common Pitfalls reference before
debugging symptoms from memory. Quote `~` paths in shell commands, use absolute
ALFS paths for public reads, and remember `@last` is chronological.

Open [operational-pitfalls.md](references/operational-pitfalls.md),
[api/filesystem.md](references/api/filesystem.md), and
[api/error-responses.md](references/api/error-responses.md) when status/error
handling matters. Resource Limits live in the runtime and pitfalls references.

### CLI Reference And API Gotchas

Applies whenever an operation touches ALFS, release commands, trading commands,
or programmatic error handling.

Must not miss: run `alva <command> --help` first, then open the matching gotcha
reference for details the CLI may omit or currently state incorrectly.

| Surface | Read |
| --- | --- |
| ALFS, feed synth suffixes, `@last`, `@range`, grants, reset commands | [api/filesystem.md](references/api/filesystem.md) |
| Feed release descriptions, README, `--readme-url`, tags, trading symbols, `--skill-id` | [api/release.md](references/api/release.md) |
| Trading symbols, accounts, risk, `execute --signal` | [api/trading.md](references/api/trading.md) |
| Programmatic status/error-code handling | [api/error-responses.md](references/api/error-responses.md) |

## Reference Index

| Reference | Read when |
| --- | --- |
| [preflight.md](references/preflight.md) | Starting an Alva session or choosing a CLI/API surface |
| [request-routing.md](references/request-routing.md) | Planning, `/use-skill:`, Skillhub blueprints, completion gate |
| [content-legitimacy.md](references/content-legitimacy.md) | Any financial value, feed-backed HTML, provenance, coverage gaps |
| [data-skills.md](references/data-skills.md) | Arrays structured data discovery and endpoint calls |
| [feed-lifecycle.md](references/feed-lifecycle.md) | Feed creation, testing, grant, deploy, release, reset |
| [playbook-release.md](references/playbook-release.md) | HTML gate, draft gate, release gate, screenshot, subscription-tier release flow |
| [push-notifications.md](references/push-notifications.md) | Push sidecars, subscriptions, quiet runs, verification |
| [jagent-runtime.md](references/jagent-runtime.md) | V8 runtime modules, absent globals, async model, constraints |
| [feed-sdk.md](references/feed-sdk.md) | Feed API, data models, time series, grouped records, push schemas |
| [deployment.md](references/deployment.md) | Cronjob CLI, run debugging, lifecycle DB rows, schedules |
| [altra-trading.md](references/altra-trading.md) | FeedAltra strategy/backtest engine, PIT compliance, tests |
| [adk.md](references/adk.md) | `@alva/adk` API, tool calling, scheduled LLM reasoning |
| [onnx.md](references/onnx.md) | ONNX model artifacts, tensors, runtime inference, release additions |
| [search.md](references/search.md) | `unified_search`, content search sources, enrichment gotchas |
| [secret-manager.md](references/secret-manager.md) | Secret upload, CRUD, runtime `loadPlaintext` |
| [memory.md](references/memory.md) | Memory files, templates, read/write rules |
| [fundamentals-periods.md](references/fundamentals-periods.md) | Fiscal/calendar periods, YoY/QoQ, cross-company comparisons |
| [remix-workflow.md](references/remix-workflow.md) | Remix tags, source files, content audit, lineage |
| [annotation-edits.md](references/annotation-edits.md) | Annotation tags, locating/editing generators, re-release |
| [language.md](references/language.md) | Product vocabulary and internal-to-user translation |
| [narrative-voice.md](references/narrative-voice.md) | Voice rules and ADK narrative prompt block |
| [creators-note.md](references/creators-note.md) | Post-release creator note compose/post/pin workflow |
| [design-system.md](references/design-system.md) | Design tokens, typography, theme, playbook container |
| [design-widgets.md](references/design-widgets.md) | Widget layouts, chart/metric/table/feed/free-text specs |
| [design-components.md](references/design-components.md) | Component templates and interactions |
| [design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md) | Strategy playbook UI |
| [api/filesystem.md](references/api/filesystem.md) | ALFS CLI gotchas and synth-mount suffixes |
| [api/release.md](references/api/release.md) | Release CLI gotchas, README, tags, skill id |
| [api/trading.md](references/api/trading.md) | Trading CLI gotchas and signal JSON |
| [api/error-responses.md](references/api/error-responses.md) | HTTP error response mapping |
