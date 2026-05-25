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

## Rule 0 And Preflight

**Always read [preflight.md](references/preflight.md) before first Alva use in a
session.** Its one rule: every `alva` command you have not used in this session
must be preceded by `alva <command> --help`; CLI help is authoritative for
flags, response shapes, and examples.

Preflight also owns `version_check.sh`, CLI installation/upgrade,
`alva whoami`, `subscription_tier`, external delivery fields, `ARRAYS_JWT`, and
the required `~/memory/MEMORY.md` load. For memory details, read
[memory.md](references/memory.md).

## Communication

For all user-facing wording, read [language.md](references/language.md) and use
its product vocabulary exactly: automation, playbook, alert/notification,
Agent, and script. Treat feed, cronjob, ALFS paths, API payloads, raw ids, and
function names as internal unless the user is inspecting logs or APIs.

Before writing playbook copy, release descriptions, README prose, creator's
notes, ADK prompts, TLDRs, digests, rationale paragraphs, or methodology text,
read [narrative-voice.md](references/narrative-voice.md). Its must-not-miss
rule: user-facing prose may not use the banned AI-tell shapes or unsupported
claims; ADK narrative prompts should copy its voice block.

For post-release pinned author commentary, read
[creators-note.md](references/creators-note.md) before posting or pinning.

## Request Routing

Before planning a non-trivial task, read
[request-routing.md](references/request-routing.md). It owns Dashboard /
Playbook, Backtest / Strategy, Data Query, Remix, and Debug / Edit routing, plus
the one-blocking-question planning rule and completion gate.

If the user includes `/use-skill:<username>/<name>`, immediately read
[request-routing.md](references/request-routing.md#skillhub-directive-gate).
Must not miss: fetch the Skillhub blueprint fresh with `alva skillhub get` and
`alva skillhub file` before planning, do not bulk-download, and pass
`--skill-id <username>/<name>` on playbook draft when a Skillhub skill informed
the build.

Before saying Alva lacks a capability or recommending BYOD, run
`alva data-skills list | grep -i <topic>` as described in
[request-routing.md](references/request-routing.md#capability-verification) and
[data-skills.md](references/data-skills.md).

## Content Legitimacy

Before surfacing any financial value to a user, read
[content-legitimacy.md](references/content-legitimacy.md). Must not miss: the
agent builds the pipeline, not to be the data source. Quantitative values must
come from Alva SDK/Data Skills, a published Alva feed, or
validated/user-provided BYOD wired into the feed pipeline.

Do not use WebSearch, LLM/ADK output, agent memory, synthetic/random data, or
user-pasted examples as factual chart/table/query data. If HTML shows numbers,
charts, tables, or metric cards, it must fetch deployed feed outputs at runtime
and `alva release playbook --feeds` must declare those feeds.

For fundamentals charts/tables, quarterly/annual labels, YoY/QoQ, or company
comparisons, read [fundamentals-periods.md](references/fundamentals-periods.md).
Its must-not-miss rule: derive fiscal/calendar period labels from record fields
and align comparisons by the record's own convention.

## Data Skills

Use [data-skills.md](references/data-skills.md) for structured Arrays financial
data: market history, fundamentals, estimates, ownership, macro, on-chain,
news, prediction markets, and per-handle Twitter/X history or rolling updates.
Must not miss: every endpoint call requires the current-session
`list -> summary -> endpoint` pipeline; never guess ids, files, params, or
response shapes, and use `Authorization: Bearer <ARRAYS_JWT>`, not
`X-API-Key`.

For topic/keyword content discovery across social, news, Reddit, YouTube,
podcasts, general web, non-US finance, or off-catalog assets, read
[search.md](references/search.md). Must not miss: search can enrich narrative
or discover BYOD sources, but deterministic US equity/crypto/fundamental data
should use structured Data Skills first and still obey
[content-legitimacy.md](references/content-legitimacy.md).

## Runtime And Modules

Before writing `alva run` code or any scheduled script, read
[jagent-runtime.md](references/jagent-runtime.md). Must not miss: code runs in
a V8 isolate on Alva Cloud, not on the host; there is no `process`, no Node.js
builtins, no global `fetch`, no timer globals, and no top-level await. Use
`require("net/http")`, absolute ALFS paths through `require("alfs")`, and
`(async () => { ... })();`.

Runtime module map:

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

## Secret Manager

When a playbook or runtime script needs a third-party credential, read
[secret-manager.md](references/secret-manager.md). Must not miss: do not ask
users to paste secrets into chat when the web upload flow works, never hardcode
secrets in source/ALFS/assets, and load runtime values with
`require("secret-manager").loadPlaintext("NAME")`.

## Feed Lifecycle

Before creating, editing, deploying, releasing, or debugging a feed, read
[feed-lifecycle.md](references/feed-lifecycle.md) and
[feed-sdk.md](references/feed-sdk.md). Must not miss: feed outputs use
`feed.def()` plus `ctx.self.ts().append()`, not `alfs.writeFile()`, and a manual
`alva run` is only a test step; live playbooks require grant, deploy, release,
`alva deploy create`, and public read verification.

<HARD-GATE id="before-feed-release">
Before `alva release feed`, open
[feed-lifecycle.md](references/feed-lifecycle.md#hard-gate-before-feed-release)
and satisfy the full gate: fresh successful run after latest source write,
expected output shape, public grant on the feed root, unauthenticated public
read, and non-empty `@last` data when HTML depends on the feed.
</HARD-GATE>

For cronjob creation, update, trigger, run logs, deletion, and feed/playbook DB
lifecycle boundaries, read [deployment.md](references/deployment.md). Must not
miss: deleting ALFS files does not delete feed/playbook database rows.

## Altra Trading

For backtests, strategy feeds, portfolio simulation, rebalancing, signal
targets, equity curves, drawdown, Sharpe, or live paper trading, read
[altra-trading.md](references/altra-trading.md) before coding. Must not miss:
always use FeedAltra for strategy/backtest/signal work; hand-rolled loops over
price arrays bypass bar alignment, point-in-time safety, and portfolio
simulation.

For trading accounts, symbols, order execution, or signal JSON, read
[api/trading.md](references/api/trading.md). Must not miss: the real
`alva trading execute --signal` schema is `allocate`/`predict`, not a
`{symbol, side, qty}` order shape, and dates are epoch seconds.

After a successful backtest, deliver a usable result: a playbook, dashboard, or
concise analysis with visual evidence, not raw console output.

## ADK

Use [adk.md](references/adk.md) when embedding a fixed LLM reasoning step inside
a deterministic, reschedulable pipeline that specifically needs custom
ADK/tool-loop behavior. For ordinary scheduled agent digests, prefer the
AlvaAsk notification pattern in
[feed-sdk.md](references/feed-sdk.md#pattern-e-alvaask--feed-notification-notifymessage).
Must not miss: do not use ADK for one-off interactive research, and do not use
it to produce numbers, events, or reports that should come from real data; see
[content-legitimacy.md](references/content-legitimacy.md).

For ADK-generated user-facing prose, first read
[narrative-voice.md](references/narrative-voice.md) and copy its voice block
into the ADK system prompt.

## ONNX Models

When the user supplies or plans to upload an exported `.onnx` model artifact,
read [onnx.md](references/onnx.md). Must not miss: use `@alva/onnx` with model
artifacts stored on ALFS, build tensors from legitimate feed/data inputs, write
predictions through the Feed SDK, and release a playbook only from granted,
deployed feed outputs.

For model-backed trading decisions, route through
[altra-trading.md](references/altra-trading.md) and FeedAltra.

## Playbook HTML And Design

Before writing or rewriting playbook HTML, read
[playbook-release.md](references/playbook-release.md#hard-gate-before-build-html).
Must not miss: HTML work has a hard gate requiring design references to be read
in the current session, and quantitative data must be loaded from public feed
paths at runtime.

<HARD-GATE id="before-build-html">
Before HTML edits, open
[playbook-release.md](references/playbook-release.md#hard-gate-before-build-html)
and the applicable design references. At minimum read
[design-system.md](references/design-system.md); read
[design-widgets.md](references/design-widgets.md) for widgets/charts/tables,
[design-components.md](references/design-components.md) for UI components, and
[design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md)
for strategy/backtest playbooks.
</HARD-GATE>

Design capability map:

| Task | Read |
| --- | --- |
| Global tokens, typography, theme, page container | [design-system.md](references/design-system.md) |
| Charts, metric cards, tables, feed cards, free text, group titles | [design-widgets.md](references/design-widgets.md) |
| Dropdown, Markdown, button, tag, switch, modal, select, input, tab, tooltip | [design-components.md](references/design-components.md) |
| Trading strategy/backtest UI with Overview/Analytics/Strategy/Feed tabs | [design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md) |
| Token CSS import | [design-tokens.css](references/design-tokens.css) |

## Playbook Draft And Release

Before creating a draft or publishing, read
[playbook-release.md](references/playbook-release.md) and
[api/release.md](references/api/release.md). Must not miss: every released
playbook needs `~/playbooks/<name>/README.md`, `alva release playbook` requires
absolute `--readme-url /alva/home/<username>/playbooks/<name>/README.md`, and
source/cadence claims must match actual feed scripts and cronjobs. For asset
playbooks, `--trading-symbols` and `--tags` must satisfy the overlap rule in
[api/release.md](references/api/release.md#trading-symbols-and-tags).

<HARD-GATE id="before-playbook-draft">
Before `alva release playbook-draft`, open
[playbook-release.md](references/playbook-release.md#hard-gate-before-playbook-draft)
and verify HTML, README, user namespace, feed gates, metadata, tags/trading
symbols, and `--skill-id` when Skillhub informed the build.
</HARD-GATE>

<HARD-GATE id="before-playbook-release">
Before `alva release playbook`, open
[playbook-release.md](references/playbook-release.md#hard-gate-before-playbook-release)
and verify feed release gates, deployment coverage, active cronjobs, runtime
HTML fetches, freshness, README accuracy, namespace, absolute `--readme-url`,
and push-only feed release coverage.
</HARD-GATE>

Use the canonical share URL
`https://alva.ai/u/<username>/playbooks/<playbook_name>` for users. Use
`published_url` for screenshot verification. For screenshots and PNG validation,
read [playbook-release.md](references/playbook-release.md#screenshot-verification).

## Push Notifications

After a playbook is released or kept as draft, read
[push-notifications.md](references/push-notifications.md) before offering or
claiming alerts. Must not miss: push setup requires the right sidecar
(`signal/targets` or `notify/message`), current feed release, `--push-notify`
on the cronjob, explicit personal/group subscription (`subscribe-feed`,
`subscribe-playbook`, or group subscribe command), and a real-run `@last/1`
verification.

For push output schemas, read [feed-sdk.md](references/feed-sdk.md) Patterns D
and E. Quiet monitor runs should emit `<|SKIP_NOTIFICATION|>`.

## Remix

For `<remix>` tags, user requests to customize an existing public playbook, or
requests to browse examples for reuse, read
[remix-workflow.md](references/remix-workflow.md). Must not miss: source
playbook files are read through ALFS, `alva remix` is only for lineage
registration, and every remix must pass a content legitimacy audit before
deployment.

If the user asks to find examples and provides no URL, run `alva playbooks
trending` after `alva playbooks --help`; use returned `ref` values for agent
work and `url_path` for source URLs.

## Annotation Edits

For `<annotation>` tags that target rendered playbook elements, read
[annotation-edits.md](references/annotation-edits.md). Must not miss: edit the
generator behind the element, never freeze rendered live feed values into static
HTML text.

After changing a generator, rerun the relevant feed, HTML, draft, or release
gate from [feed-lifecycle.md](references/feed-lifecycle.md) and
[playbook-release.md](references/playbook-release.md).

## CLI Reference And API Gotchas

Run `alva <command> --help` first, then open the gotcha reference when the task
touches one of these surfaces:

| Surface | Read |
| --- | --- |
| ALFS, feed synth suffixes, `@last`, `@range`, grants, reset commands | [api/filesystem.md](references/api/filesystem.md) |
| Feed release descriptions, README, `--readme-url`, tags, trading symbols, `--skill-id` | [api/release.md](references/api/release.md) |
| Trading symbols, accounts, risk, `execute --signal` | [api/trading.md](references/api/trading.md) |
| Programmatic status/error-code handling | [api/error-responses.md](references/api/error-responses.md) |

## Memory

Memory is persistent and user-visible at `~/memory/`. Read
[memory.md](references/memory.md) before writing or relying on it. Must not
miss: memory is a claim, not truth; verify any feed, cronjob, preference, or
parameter before acting on it in a new session.

## Operational Pitfalls And Limits

When debugging stale data, ALFS path failures, runtime errors, chart rendering,
resource limits, or lifecycle cleanup, read
[operational-pitfalls.md](references/operational-pitfalls.md). Must not miss:
quote `~` paths in shell commands, public reads use absolute ALFS paths,
`@last` is chronological, and resource limits include 2 GB V8 heap, 10 MB write
payloads, 128 MB HTTP responses, and 1 minute minimum cron interval.

## Platform Capability Map

Use these cards as the quick platform map. Each card says when a capability
applies, the one rule to keep in working memory, and the reference to open
before acting.

### Session Start

Applies when an Alva task starts in a fresh conversation or after context loss.
Must not miss: run the help-first preflight before platform actions, then load
memory if present.
Open [preflight.md](references/preflight.md) and
[memory.md](references/memory.md).

### Skillhub Blueprint

Applies when `/use-skill:<username>/<name>` appears, or when you choose to use a
catalog methodology.
Must not miss: fetch the blueprint fresh; a remembered template is stale.
Open [request-routing.md](references/request-routing.md) and
[api/release.md](references/api/release.md#skill-id).

### Data Query

Applies when the user asks for a direct price, ratio, market figure, screen, or
dataset answer.
Must not miss: every figure needs a fresh Data Skills/BYOD fetch or a clear
"could not fetch" response; do not answer financial figures from memory with an
estimate caveat.
Open [data-skills.md](references/data-skills.md) and
[content-legitimacy.md](references/content-legitimacy.md).

### Structured Data Discovery

Applies before Arrays endpoint calls, including calls inside `alva run`.
Must not miss: complete `alva data-skills list`, then `summary`, then
`endpoint` for the exact endpoint in this session.
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
Must not miss: no process, no Node builtins, no global fetch, no top-level
await; use jagent modules.
Open [jagent-runtime.md](references/jagent-runtime.md).

### Feed Build

Applies whenever data needs persistence, freshness, public reads, charts, or
playbook backing.
Must not miss: use Feed SDK time series, then pass the full feed lifecycle
before release.
Open [feed-sdk.md](references/feed-sdk.md) and
[feed-lifecycle.md](references/feed-lifecycle.md).

### Feed Release

Applies before `alva release feed`.
Must not miss: `before-feed-release` is a hard gate; do not release stale,
untested, ungranted, or unreadable output.
Open [feed-lifecycle.md](references/feed-lifecycle.md#hard-gate-before-feed-release).

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

### Design System

Applies to every playbook page, widget, component, chart, table, and strategy
dashboard.
Must not miss: read `design-system.md` first, then only the companion spec the
surface needs.
Open [design-system.md](references/design-system.md),
[design-widgets.md](references/design-widgets.md),
[design-components.md](references/design-components.md), or
[design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md).

### Playbook Draft

Applies before `alva release playbook-draft`.
Must not miss: `before-playbook-draft` is a hard gate; metadata, feeds, README,
HTML, `trading-symbols`, tags, and Skillhub id must match the approved build.
Open [playbook-release.md](references/playbook-release.md#hard-gate-before-playbook-draft)
and [api/release.md](references/api/release.md).

### Playbook Release

Applies before `alva release playbook`.
Must not miss: `before-playbook-release` is a hard gate; fresh feed coverage,
README, deployment, runtime fetches, namespace, and push-only feeds must be
verified.
Open [playbook-release.md](references/playbook-release.md#hard-gate-before-playbook-release).

### Screenshot Verification

Applies after release or when visual correctness matters.
Must not miss: capture the `published_url`, verify the file is really a PNG,
and do not describe screenshots you did not take.
Open [playbook-release.md](references/playbook-release.md#screenshot-verification).

### Push Alerts

Applies after a draft/release when a feed produces time-sensitive signals,
reports, monitors, or alerts.
Must not miss: publisher setup and subscriber setup are separate; do not claim
success until a real run writes the sidecar.
Open [push-notifications.md](references/push-notifications.md).

### Backtest / Strategy

Applies to event studies, factor tests, allocation rules, target weights,
portfolio analysis, paper trading, and actionable signals.
Must not miss: Always use Altra for backtesting and strategy simulation; avoid
look-ahead bias and deliver a visual playbook or usable visual analysis. Hosted
or published strategy outputs must still pass feed lifecycle and playbook gates.
Open [altra-trading.md](references/altra-trading.md) and
[design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md);
open [feed-lifecycle.md](references/feed-lifecycle.md) and
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
numbers or events; use AlvaAsk for ordinary scheduled agent digests unless
custom ADK tool-loop behavior is required.
Open [adk.md](references/adk.md),
[narrative-voice.md](references/narrative-voice.md), and
[content-legitimacy.md](references/content-legitimacy.md).

### ONNX Inference

Applies when the user supplies or deploys a `.onnx` model, tensor inputs, or
scheduled inference playbook.
Must not miss: model output is not a trading instruction unless FeedAltra turns
it into a tested strategy.
Open [onnx.md](references/onnx.md).

### Secret Use

Applies to exchange keys, LLM keys, search tokens, webhooks, and third-party
API credentials.
Must not miss: send users to <https://alva.ai/apikey> when feasible and load
with Secret Manager inside runtime code.
Open [secret-manager.md](references/secret-manager.md).

### Remix

Applies to `<remix>` tags, existing playbook customization, or browsing public
examples.
Must not miss: use `alva playbooks trending` for discovery when no source URL
is given, and use `alva remix` only for lineage.
Open [remix-workflow.md](references/remix-workflow.md).

### Annotation Edit

Applies to `<annotation>` tags with a CSS selector and instruction.
Must not miss: selector points to rendered output, but you edit the generator
behind it.
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
debugging symptoms from memory.
Open [operational-pitfalls.md](references/operational-pitfalls.md).

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
