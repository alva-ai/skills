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
  version: v1.8.3
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

---

## Rule 0: `alva <command> --help` is the source of truth

**Every time you're about to call an `alva` CLI command you have not used
in this session, run `alva <command> --help` first.** The help text is the
authoritative, always-up-to-date reference for every subcommand, flag,
response field, naming convention, and runnable example. Do not guess flag
names, parameter types, or response shapes from memory — the CLI surface
evolves, and stale assumptions silently break automations.

```bash
alva --help              # list all top-level commands
alva <command> --help    # full per-command surface (read this before calling)
```

The skill's `references/api/*.md` files exist **only** to record gotchas
the help text doesn't cover (synth-mount suffix corrections, playbook
README content shape, `--signal` schema, etc.). For everything else
— subcommand names, flag names, accepted values, response fields, examples
— treat `alva <cmd> --help` as canonical. If this doc and `--help`
disagree on a flag, trust `--help` and tell the user the doc needs an
update.

---

## Pre-flight

**Run these checks on first use each session** before doing anything else.

### 1. Version Check

```bash
bash "<this skill's directory>/scripts/version_check.sh"
```

- No output → up to date, proceed.
- Output present → display to user, apply the update, then proceed.

### 2. Alva CLI Setup

The `alva` CLI (`@alva-ai/toolkit`) is the **only** way this skill interacts
with the Alva platform. It manages authentication, ships self-documenting
`--help` for every command (see [Rule 0](#rule-0-alva-command---help-is-the-source-of-truth)),
and eliminates the need for manual curl/header management.

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

Third-party vendor secrets belong in Alva Secret Manager
(`require("secret-manager")`), not in the CLI config.

### 2a. Authentication Check

Run `alva whoami`. If it fails (no API key), run `alva auth login` to open
browser-based login, then re-run `alva whoami` to confirm.

### 3. User Profile

```bash
alva whoami
```

```json
{"id":1, "username":"alice", "subscription_tier":"free", "active_channel":"discord", "telegram_username":"alice_tg", "discord_username":"alice"}
```

Session variables:

- **`username`** — for public URLs and ALFS paths.
- **`subscription_tier`** — `"pro"` or `"free"` (default). Determines release
  flow (Step 7): pro can keep playbooks private.
- **`active_channel`** — `"telegram"`, `"discord"`, or null. Web notifications
  are always available; this controls external DM delivery.
- **`telegram_username`** / **`discord_username`** — connected IM displays.
  For external DM delivery, `active_channel` must point to a matching non-empty
  display field.

### 4. Arrays JWT Check

Data skills require `ARRAYS_JWT`. The `_meta.arrays_jwt` field in the
`alva whoami` output above shows its status — if it needs attention (missing,
`renewal_needed: true`, or absent), use `alva arrays token` to manage it
(`status` to inspect, `ensure` to provision or refresh).

### 5. Load Memory

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

**Vocabulary** — use the terms in [language.md](references/language.md) exactly.
Default user-facing terms: **automation** (not "cronjob" or "feed"),
**playbook**, **alert/notification**, **Agent**, and **script** when discussing
code being built. Treat **feed** as an internal or diagnostic term: use it only
when the user is looking at logs, raw data, API fields, release references, or
an Automation detail that already exposes the term. Full definitions and
"avoid" labels are in that file.

No ALFS paths, API payloads, automation IDs, raw function names, internal jargon,
or implementation details in user-facing responses. Say what it DOES, not how it
works. These details are operating instructions for you, not content for the
user.

Lead with the result, not the process. The first thing the user reads should be
what they got ("Your dashboard is live at …"), not what you did ("I deployed
3 feeds and wrote the HTML"). During multi-step builds, give a short status
update at each milestone so the user knows work is progressing.

**Data provenance in direct answers.** When a direct answer cites specific
financial figures, each number must either come from a fresh SDK/BYOD fetch
(attributed inline to its source) or be explicitly qualified as an estimate
that the user should verify with current sources.

## Request Routing

| Request Type | Core Objectives |
| --- | --- |
| **Dashboard / Playbook** | Identify the needed data sources, validate the data flow, and produce a usable dashboard or playbook when the user wants a shareable artifact |
| **Backtest / Strategy** | Use Altra, run the backtest correctly, and always produce a visual playbook (equity curve, trade log, metrics) alongside the text summary. Optionally deploy as live paper trading. |
| **Data Query** | Fetch the requested data accurately and return it directly unless the user asks for a richer artifact |
| **Remix** | Reuse the source artifact, apply the requested changes, and return an updated result that matches the requested customization |

### Choose Skill (mandatory when `/use-skill:<username>/<name>` is present)

If the user's message contains a `/use-skill:<username>/<name>` directive (e.g. `/use-skill:alva/thesis`, `/use-skill:alice/btc-momentum`), this step is **mandatory** and must run before Guided Planning and before any build work.

The directive gives the full catalog id (`<username>/<name>`). Skills are curated **methodologies** — opinionated blueprints that encode how to approach a recurring class of finance work (e.g. building a thesis, an AI-curated digest, a momentum tracker). They live in the **Skillhub** catalog on the gateway and are fetched via the `alva skillhub` CLI (use `alva skillhub --help` for the full surface). Alva ships a starter set under the `alva/` namespace, and any user can publish their own — do not assume the `alva/` namespace.

1. **Inspect**: `alva skillhub get <username>/<name>` returns the file listing with sizes. Confirm a blueprint file is present — convention is `template.md`. If absent, look for `README.md` or ask the user which file is the blueprint.
   - **On 404 / not found** (typo, deleted, or moved): run `alva skillhub list` and look for close matches **leniently** — case-insensitive, substring on both halves of the id, ignore separator differences. If exactly one obvious candidate, proceed with it and tell the user you corrected the id (e.g. "interpreting `/use-skill:Alva/AI-Digest` as `alva/ai-digest`"). If multiple plausible candidates, show them and ask. If nothing close, show the filtered list (use `--tag` if the user hinted at a topic) and ask the user to pick.
2. **Read the blueprint**: `alva skillhub file <username>/<name> template.md` (or the file from step 1). Do not proceed from memory of a prior session — fetch it fresh.
3. **Pull other files on demand**: when building, fetch additional files progressively as needed (e.g. `alva skillhub file <username>/<name> src/index.js` only if you intend to mirror the strategy logic). Do not bulk-download.
4. Treat the blueprint as authoritative for layout, sections, widgets, data contracts, and cadence. Deviate only where the user explicitly overrides it.
5. State the skill choice and any intentional deviations in your Guided Planning plan. The `/use-skill:` directive is a **strong build directive** — combined with a concrete topic, present the plan **once** and build; do not also stack clarifying multi-choice questions on top. Treat `/use-skill:` + concrete topic the same as "just do it": a single short plan, then build.

**Content arrangement.** A skill's default sections are a floor, not a ceiling. Lead with whatever carries the user's core question, proactively add sections the request demands, and cut or fold near-empty sections into neighbors rather than padding them.

**Push-driven requests** — if the user's primary outcome is a recurring push (digest, threshold tracker, stream watch, periodic alert), the `alva/ai-digest` skill is purpose-built for that shape and worth offering during Guided Planning. Push can also be added to any other playbook via Step 9 — the skill is one good option, not a requirement.

No `/use-skill:` directive → skip this step and proceed to Guided Planning normally.

### Guided Planning

For all routes except **Data Query**, present a plan **once** before building.
Even seemingly clear requests ("build a BTC dashboard") have real choices —
which data, timeframe, widgets — that are cheaper to resolve upfront than to
rebuild.

**Exactly one blocking question per session.** Pick a single path through the
steps below — do not run step 1 clarifications AND a step 3 plan confirmation
in the same session. Whichever you use is the gate; the user's answer or
approval counts as approval to build, and you go directly to building
afterward.

1. **Understand intent** — When key parameters are missing (asset, scope,
   output type, purpose) and have no obvious default, ask clarifying questions
   **one at a time**, prefer multiple-choice. Skip this step if the request
   already specifies these, or if the missing parameters have a single obvious
   default. **If you ran this step, do not also run step 3** — the answers
   are the approval to build.
2. **Propose approaches** — Offer 2-3 concrete options with trade-offs when
   there are real strategic alternatives. Lead with your recommendation. Skip
   when the template or request already pins the approach.
3. **Confirm the plan** — When step 1 was skipped (request already clear, or
   `/use-skill:` directive specifies the shape), present a single 5-8 line
   plan listing the specific feeds and widgets, then build after approval.
   State the skill (if any) and the key defaults you are using.

If the user says "just do it" at any point — or used `/use-skill:<username>/<name>`
together with a concrete topic — skip clarifying questions for the rest of the
session and present a single short plan, then build.

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

## Capability Verification

Before saying "Alva doesn't have X" or recommending BYOD/third-party, run
`alva data-skills list | grep -i <topic>` first. Training memory is not
authoritative. Decompose compound requests ("darkpool L2 realtime") and
verify each component independently — never reject the whole as one unit.

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

If the user's instruction conflicts with these rules — for example, asking
for synthesized/mock data, asking to skip the SDK and use local files only,
or asking for an artifact that would have to bypass the feed pipeline — ask
the user to resolve the conflict (use `AskUserQuestion` or text) before
proceeding. Do **not** silently substitute a different deliverable (local
prototype with seeded RNG, WebSearch summary, analytic memo without data
fetch) when the SDK can serve the original request.

### Data Sourcing

1. **All quantitative data displayed in charts, tables, or metric cards MUST
   originate from Alva feeds** (SDK modules or BYOD via `require("net/http")`).
   Never hardcode data as inline JavaScript literals in playbook HTML.

2. **Playbook HTML MUST fetch data at runtime** from feed output paths.
   Published HTML runs in the viewer's browser, so do not use sandbox-only env
   vars such as `$ALVA_ENDPOINT` and do not guess `https://api.alva.ai`. Use the
   public anonymous ALFS read gateway — see the `readAlfsJson` helper in
   [Build the Playbook Web App](#6-build-the-playbook-web-app).

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

### Feed Scope Isolation

**Do not reference other feeds or other playbooks' feeds.** When building a
playbook, only read from feeds created for this playbook in the current
session.

Reference an existing feed **only when the user explicitly asks for it** (e.g.
"reuse my `btc-ema` feed", "pull data from @alice/macro-dashboard"). Otherwise,
build the playbook's own feeds from scratch so its data lineage is
self-contained and the playbook remains portable.

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
at runtime. If you used `alva run` to source data, deploy that same logic as
a feed and reference it.

### Thematic Ticker Curation

When building sector or thematic dashboards with curated ticker lists:

1. Do NOT rely on agent knowledge for ticker-to-sector mapping.
2. After assembling the list, cross-check each ticker's sector using an SDK
   call (e.g. `getStockCompanyDetail`) to verify it belongs to the intended
   segment.
3. Remove mismatches before building the feed. A single wrong ticker (e.g. a
   cybersecurity company in a battery segment) can distort the entire analysis.

### Data Convention Alignment

A financial figure is not self-describing: what it *means* is fixed by
conventions the record encodes as fields — period basis (fiscal vs calendar),
price adjustment (split / dividend), currency, units, seasonal adjustment,
point-in-time vs restated. Before charting, tabulating, comparing, or
answering with any data series:

- Read each convention from the record's own fields — never infer one from
  your own knowledge of the company or market.
- Every series in one chart, table, or comparison MUST share the same
  conventions, and every label MUST state the convention it carries, derived
  from the record rather than authored.

The fundamentals **fiscal period** is the case with the most depth: fiscal
quarters are not always calendar quarters (NVDA's fiscal year ends in late
January). Read [fundamentals-periods.md](references/fundamentals-periods.md)
before charting or tabulating quarterly/annual fundamentals or computing
YoY/QoQ.

### Description and Provenance Accuracy

1. **Playbook descriptions and methodology sections must only list data sources
   that were actually called successfully.** Do not claim "Brave Search",
   "ClinicalTrials.gov", or any other source unless the feed script actually
   fetches from it at runtime.

2. **Update frequency claims must match actual deployment.** If cronjob
   deployment failed, do not claim "updated every N hours" in the playbook
   description. Either fix the cronjob or remove the claim.

---

## Narrative Voice Rules

All user-facing prose the agent writes — playbook `description` and
`display_name`, hand-written HTML copy (hero text, intro cards, methodology
modal body, chart footnotes, rationale paragraphs), and any ADK system
prompts that produce narrative (TLDRs, digests, why-it-matters, delta
bodies, push-line headlines) — must follow
[narrative-voice.md](references/narrative-voice.md). Read that file before
writing or generating any user-facing prose.

The rules ban a specific list of AI-tell tokens and shapes (significance
inflation, negative parallelism, rule-of-three, generic closers, em-dash
overuse) and ship as a copy-paste system-prompt block with embedded
few-shots for ADK calls. Pure structured fields (numbers, tickers, dates,
enum labels, button labels) are exempt.

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
has access to ALFS, data skills via HTTP, runtime libraries, LLM access, and
the Feed SDK.

**Absent globals — do not use:**

- `process.*` — no `process` object exists. For output use `console.log`
  (not `process.stdout.write`); for env vars use
  `secret.loadPlaintext('NAME')` (not `process.env`); to abort use
  `throw new Error(...)` (not `process.exit`).
- `setTimeout` / `setInterval` / `clearTimeout` — no timer globals.
  Use a synchronous busy-wait helper or restructure to await-driven flow;
  see `references/snippets/sleep.md` if it exists.
- `URLSearchParams` — not in scope. Build query strings manually,
  e.g. `Object.entries(p).map(([k,v]) => k+'='+encodeURIComponent(v)).join('&')`,
  or use the helper your data skill exposes.
- `fetch` (global) — must `require('net/http')` and use `http.fetch`.
- Top-level `await` — wrap in `(async () => { ... })()`.

If a script throws `ReferenceError: <X> is not defined`, the runtime
does not expose `<X>` — do not retry the same call; rewrite to one of
the patterns above.

### 3. Data Skills

Structured data endpoints served by the Arrays backend
(`$ARRAYS_ENDPOINT`, defaults to `https://data-tools.prd.space.id`),
covering financial markets, on-chain analytics, macro indicators, news, and
per-handle Twitter/X feeds (history and rolling updates). To find the right
API for a task, use the `alva data-skills` CLI (public, no auth). Follow
the pipeline in order; do not skip steps and do not guess inputs.

1. **`alva data-skills list`** — every skill id is namespaced `arrays-data-api-*`
   and is not predictable from concept words, so always start here. Pipe
   through `grep` to filter (e.g. `alva data-skills list | grep -i stock`).
2. **`alva data-skills summary <skill>`** — reveals the endpoint table.
   `<file>` slugs come from its `File` column and are not guessable.
3. **`alva data-skills endpoint <skill> <file>`** — full parameters, response
   fields, and examples. `<file>` is the `File` column value, not the `Path`.
4. **Call Arrays data endpoints** with `Authorization: Bearer <ARRAYS_JWT>`.
   In runtime code, load the token via `secret.loadPlaintext('ARRAYS_JWT')`.
   The token is verified during preflight (see [Arrays JWT Check](#4-arrays-jwt-check));
   if a call returns 401, re-run `alva arrays token ensure`. Do not use `X-API-Key` header.

#### Coverage Overview

Data skills span spot and derivatives markets across stocks, ETFs, options,
and crypto; equity fundamentals, estimates, events, and ownership flows;
on-chain metrics and exchange flows; macro and economic indicators; news;
prediction markets; and per-handle Twitter/X feeds (history and rolling
updates). Run `alva data-skills list` for the live catalog.

**Source routing**

| Need                                                                              | Surface                                                  |
| --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Financial data (markets, fundamentals, on-chain, macro, news, prediction markets) | [`alva data-skills` CLI](#3-data-skills)                 |
| Twitter/X by handle (history + rolling)                                           | [`alva data-skills` CLI](#3-data-skills)                 |
| Handle subscriptions for news, YouTube, Reddit, podcasts                          | [`feed_widgets`](#runtime-libraries)                     |
| Topic/keyword search (Twitter, news, web, etc.)                                   | [`unified_search`](#content-search)                      |

**Data skill doc lookup is mandatory.** Always fetch the endpoint detail before
writing code that calls it. Do not guess paths, parameter names, or response
shapes from memory. The doc lookup ensures you use the correct endpoint and
handle the actual response format.

**Enforcement**: Before any Arrays data HTTP call or `alva run` that hits one,
you MUST have completed the full `list` → `summary` → `endpoint` pipeline for
that endpoint in this session. `<skill>` must come from `list` output and
`<file>` must come from the `summary` endpoints table — never from memory or
a guess. If the call fails with an unexpected shape, re-fetch the endpoint
detail rather than guessing.

**Failure and fallback guardrail**: If an Arrays endpoint returns 403, 404, or
an unexpected empty/irrelevant result, do not immediately tell the user to
upgrade or use BYOD. First re-check `alva data-skills summary <skill>` for the
same skill and look for a semantically equivalent endpoint; if `<skill>` itself
was guessed, re-run `list` to recover the correct id. Report BYOD as a final
fallback only after same-domain Alva endpoints cannot answer the question.

#### Runtime Libraries

Built-in modules that run inside the jagent V8 runtime via `require()`. These
are **not** data APIs — they are pure computation and utility libraries
available in every script execution.

| Module group                              | Description                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `feed_widgets`                            | Per-handle/channel rolling subscriptions for news, YouTube, Reddit, and podcasts. For Twitter/X handle feeds, use [Data Skills](#3-data-skills). For topic/keyword search, use [Content Search](#content-search). |
| `unified_search`                          | Web, social, non-US finance search, and URL scraping tools (X/Grok, Perplexity Finance, Google, Brave, serper, decodo) |
| `technical_indicator_calculation_helpers` | 50+ pure calculation helpers (RSI, MACD, Bollinger, etc.)                 |

To discover available modules and their documentation:

- `alva sdk partitions` — list all runtime module groups
- `alva sdk partition-summary --partition <name>` — one-line summaries per group
- `alva sdk doc --name <module>` — full doc for a specific runtime module

Pick a module group → `partition-summary` to see modules → `sdk doc` for full
documentation.

For unstructured content — news articles, social discussions, videos, podcasts
— see [Content Search](#content-search) below.

You can also bring your own data by uploading files to ALFS or fetching from
external HTTP APIs within the runtime.

#### Content Search

Search across Twitter/X, non-US finance data, news, Reddit, YouTube, podcasts, and general web.
Use whenever the playbook needs content beyond structured data SDKs — from
targeted queries ("what are people saying about NVDA earnings") to broad
discovery ("trending crypto discussions this week"), including social
discussions, finance search as the primary source for non-US equities and
the fallback for off-catalog asset classes (forex, traditional
index/commodity futures), market narratives, news coverage, sentiment,
analyst commentary, and community reactions. For US equities, crypto, and
deterministic time-series/fundamental data, prefer the structured Alva data
SDKs first.

Content search modules live in the `unified_search` runtime-library
partition. Discover them via the same partition API as the other runtime
libraries (`GET /api/v1/sdk/partitions/unified_search/summary` → module
listing; `GET /api/v1/sdk/doc?name=...` → full per-module documentation).
See [search.md](references/search.md) for per-source SDK usage,
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

**Strategy / backtest / signal feeds require Altra**: Any feed that produces
`signal/targets` or `signal/alerts`, or that performs backtesting, portfolio
simulation, equity-curve / drawdown / Sharpe computation, position tracking, or
rebalancing, MUST use `FeedAltra` — even for simple signal logic. Hand-rolled
`for` loops over price arrays, custom P&L accumulators, and direct
target-record building bypass bar alignment, portfolio simulation, and
look-ahead-bias prevention. See the
[Altra Trading Engine Quick Reference](#altra-trading-engine-quick-reference)
for the rationale.

**Push notification streams:** Subscriptions target feed/playbook resources,
not output paths. The output path only chooses the feed-alert source:

| Output stream | Feed-alert source | Use for | Delivery eligibility |
| --- | --- | --- | --- |
| `signal/targets` | `signal/targets` | Playbook signals, trading targets, actionable alerts | Users or groups explicitly subscribed to the feed or to a playbook that references the feed |
| `notify/message` | `notify/message` | Feed results, AlvaAsk reports, heartbeat checks, proactive alerts | Users or groups explicitly subscribed to the feed or to a playbook that references the feed |

Rules:

- Both streams dispatch the canonical `feed_alert_ready` event. Do not use the
  legacy names `playbook_data_ready` or `feed_run_complete` in new docs or
  agent instructions.
- A push-capable feed needs `--push-notify` and a feed release bound to the
  cronjob:

```bash
alva deploy create --name <feed> --path '~/feeds/<feed>/v1/src/index.js' \
  --cron "<expr>" --push-notify
alva release feed --name <feed> --version 1.0.0 \
  --cronjob-id <ID_FROM_DEPLOY> --description "<one-sentence purpose>"
```

- `--push-notify` only marks the feed publisher as capable of emitting alerts.
  It does **not** subscribe any user or group, and it does not bypass
  notification preferences.
- Real delivery always requires an explicit subscription:
  `alva push-subscriptions subscribe-feed --username <owner> --name <feed>`,
  `alva push-subscriptions subscribe-playbook --username <owner> --name <playbook>`,
  or a group `/alva subscribe feed <id>` / `/alva subscribe playbook <id>`.

Keep schema examples in [feed-sdk.md](references/feed-sdk.md) Patterns D/E.
See **Step 9** below for the post-release subscription flow.

### 6. Build the Playbook Web App

<HARD-GATE id="before-build-html">
Before writing or rewriting playbook HTML, read the applicable design guidance
for this session.

Required evidence:
- [design-system.md](references/design-system.md) has been read first.
- The relevant companion reference has been read when applicable:
  [design-widgets.md](references/design-widgets.md) for widget layouts,
  [design-components.md](references/design-components.md) for component
  details, and
  [design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md)
  for strategy/backtest playbooks.
- If a `/use-skill:` blueprint or template is active, its layout and data
  contract have been read before HTML work starts.

If this evidence is missing, stop and read the required design/reference file
before creating or editing HTML. Do not rely on memory of prior sessions.
</HARD-GATE>

After your data pipelines are deployed and producing data, build the playbook's
web interface. Create HTML5 pages with Alva Design System that read from Alva's
data gateway and visualize the results. Follow the Alva Design System for
styling, layout, and component guidelines. Unless the user explicitly asks for a
static snapshot, default to a live playbook.
**Data fetching requirement**: Apply the
[Content Legitimacy Rules](#content-legitimacy-rules) when building the UI.
All quantitative data in charts, tables, or metric cards must come from feed
outputs read at runtime (no inline literals for data).

Use this browser-safe helper for published playbook HTML:

```javascript
const PUBLIC_ALFS_READ_URL = "https://api-llm.prd.alva.ai/api/v1/fs/read?path=";

async function readAlfsJson(path) {
  const resp = await fetch(PUBLIC_ALFS_READ_URL + encodeURIComponent(path));
  if (!resp.ok) {
    throw new Error(`Failed to load ${path}: HTTP ${resp.status}`);
  }
  return resp.json();
}
```

`$ALVA_ENDPOINT` is available to sandbox scripts and CLI verification only. Do
not emit it into browser HTML; published HTML must call the public read gateway
above so anonymous viewers can load feed output without authentication.

### 7. Release

#### Common steps (all users)

1. **Write HTML to ALFS**: `alva fs write --path '~/playbooks/{name}/index.html' --file ./index.html --mkdir-parents`
2. **Write README to ALFS** *(mandatory)*:
   `alva fs write --path '~/playbooks/{name}/README.md' --file ./README.md --mkdir-parents`.
   Every released playbook must ship a README at this exact path. See
   [Playbook README in release.md](references/api/release.md#playbook-readme)
   for the canonical content shape (Overview, Data sources & freshness,
   Blind spots, plus shape-specific sections for screener / thesis /
   what-if). The README is the single source of truth for the playbook's
   "How does this work?" surface — releasing without one leaves the
   playbook unexplained.
3. **Create playbook draft**: `alva release playbook-draft` — creates DB
   records, writes draft files and `playbook.json` to ALFS automatically.

   <HARD-GATE id="before-playbook-draft">
   Before running `alva release playbook-draft`, verify:
   - The HTML has been written to `~/playbooks/{name}/index.html`.
   - The README has been written to `~/playbooks/{name}/README.md`.
   - The target `name` and owner namespace match `alva whoami`.
   - Every feed included in `--feeds` has already passed
     `before-feed-release`.
   - The draft metadata (`display_name`, description, tags, trading symbols,
     and feed list) matches the user's approved plan.
   - `--tags` repeats every entity passed to `--trading-symbols` (same
     tickers, lowercased), plus any topical themes for discovery.

   If any item is missing, do not create the draft. Fix the missing artifact or
   ask the user for the missing metadata first.
   </HARD-GATE>

   Run this before every `alva release playbook` to keep the draft
   updated — including version bumps and re-releases.
   This request must include both the URL-safe `name` and the human-readable
   `display_name`. Use `[subject/theme] [analysis angle/strategy logic]`, put
   the subject/theme first, and keep it within 40 characters. Avoid personal
   markers such as `My`, `Test`, or `V2`, and generic-only titles such as
   `Stock Dashboard` or `Trading Bot`.
   **Trading symbols and tags**: if the playbook covers specific assets,
   pass `--trading-symbols` and make `--tags` repeat the same entities
   lowercased, alongside any topical themes. See
   [Trading symbols and tags in release.md](references/api/release.md#trading-symbols-and-tags)
   for resolution behavior, `/explore` discovery semantics, and why the
   overlap is required.
4. **Screenshot**: Take a screenshot to verify the released playbook renders
   correctly from the deployed published URL (for example,
   `https://<username>.playbook.alva.ai/<playbook_name>/v1.0.0/index.html`).
   Always pass `--compress` (with `--compress-quality` / `--compress-max-width`
   to shrink further) — PNG output is otherwise easily large enough to exceed
   the 5 MB session upload cap:

   ```bash
   alva screenshot --url <published_url> --out /tmp/screenshot.png \
     --compress --compress-quality 70 --compress-max-width 1280
   ```

   The CLI handles authentication automatically. Run `alva screenshot --help`
   for `--selector` and `--xpath`. Before reading the output, validate it is
   actually a PNG — a failed capture may save a JSON error blob under the
   `.png` name, and reading that into the session corrupts conversation
   history:

   ```bash
   head -c4 /tmp/screenshot.png | grep -q PNG || echo "SCREENSHOT_FAILED"
   ```

`alva release playbook` **requires** `--readme-url`, and it must be the
absolute ALFS path `/alva/home/<username>/playbooks/<name>/README.md`
(the relative `<name>/README.md` shorthand is **no longer accepted**).
Resolve `<username>` once via `alva whoami`. The flow is: first write
the README to ALFS, then pass the absolute path as `--readme-url`:

```bash
alva fs write --path '~/playbooks/{name}/README.md' --file ./README.md --mkdir-parents
alva release playbook ... --readme-url '/alva/home/<username>/playbooks/{name}/README.md'
```

Omitting the flag fails CLI argument parsing; passing any value other
than the absolute README path fails server validation with
`InvalidArgument`. See
[release.md](references/api/release.md#playbook-readme) for full
validation rules and the canonical content shape.

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

**One-playbook cap.** Free accounts may hold **at most one published
playbook**. The cap is enforced server-side at release time — a second
`alva release playbook` call will fail until the existing playbook is
deleted by the user.

1. **Publish directly**: Call `alva release playbook` — free playbooks
   are always public. Output the public URL:
   `https://alva.ai/u/<username>/playbooks/<playbook_name>`
2. **If the user already has a published playbook and wants to publish
   a new one**, stop before calling `alva release playbook`. Tell the
   user the existing playbook must be deleted first, and ask which path
   they want:
   - **Delete the old playbook** — list their existing playbooks and
     confirm which one to remove, then call the CLI directly:
     ```bash
     alva playbook list                        # show what they have
     alva playbook delete --name <old-name>    # soft-delete (frees the quota immediately)
     ```
     Do **not** suggest `alva fs remove --path ~/playbooks/<name>` —
     that only clears ALFS files; the DB row stays and the quota stays
     consumed. Do not attempt to "rename around" the cap, reuse the
     old playbook's name without an explicit deletion, or assume any
     in-app replace flow will migrate `display_name`, feeds, or
     cronjobs cleanly — it currently does not, and the old public URL
     can end up showing the new playbook's HTML with stale metadata.
   - **Keep both** — only possible on Pro. Offer the upgrade path at
     <https://alva.ai/pricing>.

   After the deletion call returns, re-run the full release pipeline
   (draft → README → release) for the new playbook from scratch under
   a fresh `name`.
3. **Upsell only on friction**: Do **not** proactively suggest upgrading.
   But when the user's experience is degraded because of free-tier
   limitations — wanting private playbooks, hitting the one-playbook cap,
   resource limits, or any other pro-gated feature — acknowledge the
   limitation and offer the upgrade path:
   "This feature is available on the Pro plan. You can upgrade at
   <https://alva.ai/pricing> to [specific benefit, e.g. keep playbooks
   private / publish multiple playbooks / ...]."

Use the playbook `name` and the username from `alva whoami` to construct the
canonical share URL. Use `published_url` from the release response for
verification steps such as screenshots; do not present it as the share link.

#### Playbook Release Checklist

<HARD-GATE id="before-playbook-release">
Before running `alva release playbook`, verify every item below. A successful
draft is necessary but not sufficient: release requires fresh feed coverage,
README coverage, and HTML/data consistency.

Required evidence:
1. **Backing feed release gates passed**: Every backing feed has passed
   `before-feed-release`.
2. **Deployment coverage**: Every feed the released playbook reads at runtime
   had a successful `alva deploy create`, and its `feed_id` appears in
   `--feeds`. A run-tested but undeployed feed has no data at its public
   `@last` path and the HTML will fail to read it.
3. **Cronjobs are active**: All feeds referenced by the playbook have
   successfully deployed cronjobs.
4. **HTML fetches from feeds**: The playbook HTML reads quantitative data from
   feed output paths at runtime, not from inline literals, consistent with the
   [Content Legitimacy Rules](#content-legitimacy-rules).
5. **Data is fresh**: Read the latest data point from each referenced feed via
   `@last/1` and check its timestamp. If the latest timestamp is older than 2x
   the cron interval, warn the user that the playbook will display stale data.
6. **Description is accurate**: Update frequency claims match actual cronjob
   status. Data source claims match actual SDK/BYOD calls in the feed script.
7. **Target user is correct**: The playbook is being released under the
   requesting user's namespace (see user scope enforcement above).
8. **README is present and accurate**: `~/playbooks/{name}/README.md` exists
   on ALFS and covers the required sections (see
   [Playbook README in release.md](references/api/release.md#playbook-readme)).
   Its source / cadence claims match the actual feed scripts and deployed
   cronjobs. Pass it via `--readme-url` as an absolute ALFS path (see the
   `--readme-url` rule in Step 7 above).
9. **Push feeds are released**: Every cronjob this playbook deploys with
   `push_notify: true` has a current `alva release feed --cronjob-id <that
   cronjob>` — run after the cronjob's latest source write and passing
   `before-feed-release`; otherwise the push dispatches an empty body. Items
   1–3 only check feeds the HTML reads; a push-only feed is not caught there.

If any item fails, do not release. Fix the issue, re-run
`alva release playbook-draft` if metadata or backing files changed, then
re-enter this gate.
</HARD-GATE>

### 8. Remix (Create from Existing Playbook)

Users can remix any published playbook to create a customized version. The Remix
prompt arrives as a `<remix>` tag — e.g.
`<remix url="/u/alice/playbooks/btc-momentum" type="playbook" ...>...</remix>`
— from which the agent extracts the source `owner` and `name` via the
`url` attribute. The agent then reads the source playbook's feed scripts
(strategy logic) and HTML (dashboard UI), customizes them per the user's
request, and deploys a new playbook under their own namespace. The tag's
inner text is a fixed instruction, not the user's customization request —
if the user typed nothing meaningful outside the tag, ask what to
customize before proceeding.

See [remix-workflow.md](references/remix-workflow.md) for the full step-by-step
guide. `alva remix` commands are exclusively for lineage registration — to
read any playbook's files, use `alva fs read`.

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

#### Check delivery channel

Web notifications are always available, so do not block push setup on Telegram
or Discord. For external DM delivery, read `active_channel`,
`telegram_username`, and `discord_username` from the session:

- **Active IM channel** (`active_channel` is `"telegram"` with
  `telegram_username`, or `"discord"` with `discord_username`) → proceed to
  recommend the push.
- **No active IM channel** → recommend the push, and tell the user:
  "Web notifications will work immediately. To also receive this in Telegram or
  Discord, connect and activate a channel at <https://alva.ai/settings>."

#### Recommend specific feeds

Present a concrete recommendation, not a generic "want push?":

> "This playbook's **BTC EMA crossover signal** feed produces actionable
> alerts when the trend flips. Want to enable push notifications for it?"

- **User says yes** → configure end-to-end (see "Configure and verify" below).
  Do not stop after toggling the flag.
- **User says no** → accept and move on. Do not ask again.
- **User requests push for a different feed** → honor their choice.

If the feed already has the right push sidecar for the intended event
(`signal/targets` for signal-style alerts, `notify/message` for feed
completion / AlvaAsk reports), `push_notify: true`, and a current
`alva release feed`, the publisher side is already configured. Still verify or
create the user's/group's explicit subscription before claiming notifications
are set up.

#### Configure and verify

A push is "set up" only after every step below succeeds. Stopping early is
the most common cause of "configured but nothing arrives" — do not skip
verification.

1. **Add the intended push sidecar** to the feed script:
   `signal/targets` for playbook signals (Pattern D), or `notify/message` for
   feed completion / AlvaAsk reports (Pattern E).
2. **Release the feed.** A push script is a feed: its push body is served from
   the *released* feed, not the cronjob's raw run output. Run the changed
   script through the [feed lifecycle](#deploying-feeds), `before-feed-release`
   included.
3. **Enable the flag on the cronjob:** `alva deploy update --id <ID> --push-notify`.
4. **Subscribe the delivery target:** for personal push use
   `alva push-subscriptions subscribe-feed --username <owner> --name <feed>`
   or `alva push-subscriptions subscribe-playbook --username <owner> --name <playbook>`;
   for group push, run `/alva subscribe feed <id>` or
   `/alva subscribe playbook <id>` in that group.
5. **Verify the release and a real run:** confirm `alva release feed
   --cronjob-id <this cronjob>` ran after Step 1 added the sidecar. Then trigger
   a run (or wait for the next cron fire) and read `@last/1` of the configured
   sidecar: confirm the record is fresh and the message body is non-empty.
6. **Confirm to the user** with the specifics: which feed/playbook is
   subscribed, what the next push will say, and when it will fire.

If Step 5 finds the feed unreleased, or the run returns no record or an empty
body, **do not claim push is set up** — diagnose (missing release, missing
output write, wrong path, run failure) and fix before reporting success.

### 10. Annotation-driven edits

A request to tweak one element of a playbook in session context arrives as one
or more `<annotation>` tags, each naming a target element by CSS `selector` and
an `instruction` for it. Locate the **generator** behind the element — the CSS
rule or render function that produces it — and edit that. Never freeze the
element's rendered output into static text: that hardcodes live feed values and
breaks on the next data update.

See [annotation-edits.md](references/annotation-edits.md) for the tag format and
the full locate-and-edit procedure.

---

**Detailed sub-documents** (read these for in-depth reference):

| Document | Contents |
| --- | --- |
| `references/api/*.md` | Per-command gotchas the CLI help does not cover — see the [CLI Reference](#cli-reference) below |
| [jagent-runtime.md](references/jagent-runtime.md) | Writing jagent scripts: module system, built-in modules, async model, constraints |
| [feed-sdk.md](references/feed-sdk.md) | Feed SDK guide: creating data feeds, time series, upstreams, state management |
| [fundamentals-periods.md](references/fundamentals-periods.md) | Fiscal vs calendar periods for fundamentals: derive period labels from the record, align companies by `calendarEndDate`, compute YoY across matched periods |
| [altra-trading.md](references/altra-trading.md) | Altra backtesting engine: strategies, features, signals, testing, debugging |
| [deployment.md](references/deployment.md) | Deploying scripts as cronjobs for scheduled execution |
| [design-system.md](references/design-system.md) | Alva Design System entry point: tokens, typography, layout; links to widget, component, and playbook specs |
| [remix-workflow.md](references/remix-workflow.md) | Remix: create a new playbook from an existing template |
| [annotation-edits.md](references/annotation-edits.md) | Annotation-driven edits: parse `<annotation>` tags, locate the generator behind an element, edit generation logic not rendered output |
| [creators-note.md](references/creators-note.md) | Post-release creator's note: composing and posting the pinned author comment |
| [adk.md](references/adk.md) | Agent Development Kit: `adk.agent()` API, tool calling, ReAct loop, examples |
| [search.md](references/search.md) | Content search SDKs: per-source usage, enrichment patterns, and gotchas for Twitter/X, news, Reddit, YouTube, podcasts, and web |
| [secret-manager.md](references/secret-manager.md) | Secret upload, CRUD API, and runtime usage via `require("secret-manager")` |
| [memory.md](references/memory.md) | Per-user memory: storage layout, `user.md` template, what to save, read/write rules |
| [narrative-voice.md](references/narrative-voice.md) | Voice rules for user-facing prose: banned tokens/shapes, copy-paste ADK system-prompt block with few-shots |
| [language.md](references/language.md) | Canonical product vocabulary: automation, playbook, alert, Agent, and when feed must stay internal |

---

## CLI Reference

Per [Rule 0](#rule-0-alva-command---help-is-the-source-of-truth):
always run `alva <command> --help` before calling a command. The table is
a routing index — and, for the rows in bold, the linked sub-doc is a
**mandatory read** (the CLI help is wrong or silent on those surfaces).

| Command | Purpose / must-read sub-doc |
| --- | --- |
| `whoami` / `user` | Authenticated identity, tier, IM channels, ALFS home. |
| `fs` | ALFS filesystem (read / write / readdir / grant / revoke / time series). **Must read [filesystem.md](references/api/filesystem.md)** before any feed-data path, `@…` suffix, or `fs grant` on a feed — CLI help wrongly advertises `@now`, `@range/{duration}`, `@all`, `@at`, `@range/@bounds`. |
| `run` | Execute JS in the Alva V8 runtime. |
| `deploy` | Cronjob lifecycle (create / list / pause / resume / trigger / runs / run-logs). |
| `release` | Register feeds, draft and publish playbooks. **Must read [release.md](references/api/release.md#playbook-readme)** before any playbook release — feed `--description` rules, the README content shape (Overview / Data sources & freshness / Blind spots, plus screener / thesis / what-if), and the `--trading-symbols` / `--tags` overlap rule. |
| `secrets` | CRUD on encrypted secrets read by `require("secret-manager")`. |
| `sdk` | Runtime libraries (50+ technical indicators, search, widgets). |
| `data-skills` | Discover the 250+ Arrays financial-data endpoints. |
| `skillhub` | Pull curated methodology blueprints (`/use-skill:` flow). |
| `comments` | Create / pin / unpin playbook comments — see [creators-note.md](references/creators-note.md) for the post-release creator's-note workflow. |
| `push-subscriptions` | Personal push opt-in for playbooks and feeds. |
| `channel` | Group push subscriptions (Telegram / Discord groups). |
| `trading` | Accounts, portfolio, orders, signals, risk. **Must read [trading.md](references/api/trading.md)** before `execute`, building a signal JSON, or picking an exchange/symbol — real `--signal` schema is `allocate`/`predict` (not the `{symbol,side,qty}` shape the help example shows), `date` is epoch seconds. |
| `screenshot` | PNG capture used to verify a released playbook. |
| `remix` | Record parent-child lineage when remixing a playbook. |
| `arrays` | Provision / refresh the Arrays JWT (`ARRAYS_JWT` runtime secret). |
| `auth` / `configure` | Sign in, save API key + endpoint into a named profile. |

Non-CLI references:
[error-responses.md](references/api/error-responses.md) — HTTP status → error-code table for programmatic error handling.

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

**Runtime libraries**: Built-in computation modules available via `require()`
(e.g. `@alva/technical-indicators/rsi:v1.0.0`). Version suffix is optional
(defaults to `v1.0.0`). To discover function signatures, use
`alva sdk doc --name "..."`. Module groups: `feed_widgets`,
`technical_indicator_calculation_helpers`, `unified_search`.

**Data APIs**: Structured data (financial markets, on-chain, macro, news,
per-handle Twitter/X feeds) is fetched via HTTP from the Arrays backend —
see the [Data Skills](#3-data-skills) section. Load `ARRAYS_JWT` via
`secret.loadPlaintext('ARRAYS_JWT')` and call Arrays endpoints with
`Authorization: Bearer <ARRAYS_JWT>`.

**Secret Manager**: use `const secret = require("secret-manager");` then
`secret.loadPlaintext("OPENAI_API_KEY")`. This returns a string when present or
`null` when the current user has not uploaded that secret.

**Key constraints**: Module exports are frozen. For absent globals — no
top-level `await`, no `process`, no Node.js builtins — see
[JS Runtime](#2-js-runtime).

---

## Feed SDK Quick Reference

See [feed-sdk.md](references/feed-sdk.md) for full details.

Feeds are persistent data pipelines that store time series data, readable via
filesystem paths.

**Feed error handling is fail-fast.** Do not wrap feed data fetches, upstream
feed reads, LLM parsing, or `ctx.self.ts().append()` calls in `catch` blocks
that log and continue with empty arrays, nulls, fallback records, or partial
outputs. Let unexpected failures throw; the sandbox captures thrown errors and
exposes the failed run. Use normal conditionals only for expected business
states such as "no new records since the last watermark."

**Throw with a meaningful message; don't let `undefined.x` be the error.**
When a precondition might fail (empty fetch result, all rows filtered out,
misaligned bars across symbols), check it and `throw new Error("X empty: Y")`.
A cryptic `TypeError: Cannot read properties of undefined` is fail-fast in
name only — operators can't act on it.

```javascript
// ❌  TypeError: Cannot read properties of undefined (reading 'equity')
const finalEq = equityRecords[equityRecords.length - 1].equity;

// ✅  Names what's missing.
if (!equityRecords.length) throw new Error("equityRecords empty: no aligned bars across " + TICKERS);
const finalEq = equityRecords[equityRecords.length - 1].equity;
```

For a complete worked feed (schema, incremental `ctx.kv` watermark, time-series
append) and the output read path, see the Quick Start in
[feed-sdk.md](references/feed-sdk.md).

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

   **The run must succeed before moving on.** If `alva run` throws, returns
   an error, produces empty output when records were expected, or surfaces
   a response shape that doesn't match the script's parsing, stop and fix
   the feed script. Do not proceed to Grant / Deploy / Release on a failed
   or empty run — a broken feed that is granted and deployed will publish
   nothing (or stale data) and fail the release checklists later.
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

### Feed Release Checklist

<HARD-GATE id="before-feed-release">
Before running `alva release feed`, verify the exact feed script that will be
released has run successfully in this session.

Required evidence:
1. **Run check**: `alva run --entry-path '~/feeds/<name>/v1/src/index.js'`
   completed successfully after the latest source write.
2. **Output shape check**: The run produced the expected feed output
   groups/fields for this feed.
3. **Freshness check**: If the script changed after the run, the evidence is
   stale. Re-run before release.
4. **Grant check**: `special:user:*` read permission exists on the feed path.
   If missing, run the grant step now.
5. **Public-read check**: Fetch the feed data path without authentication and
   confirm HTTP 200, not 403.
6. **HTML backing check**: If the feed backs HTML, at least one public `@last`
   path that the HTML will read has a non-empty result after grant.

If this evidence is missing or stale, do not run `alva release feed`. Re-run
the feed, inspect the output, and only then proceed.
</HARD-GATE>

Building a playbook? Every backing feed still passes this gate first;
then, before `alva release playbook`, pass `before-playbook-release` in Step 7
— it covers HTML, README, freshness, and feed coverage.

If the build was interrupted and resumed, re-enter this gate from the top.
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

Some asset classes — e.g. forex pairs and traditional index/commodity
futures — sit outside Alva's structured Data Skills catalog. State that
upfront rather than discovering it through failed searches, then fall back to
`searchPerplexityFinance` (see [search.md](references/search.md)); suggest
BYOD only if that also falls short and a public API exists.

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

Test data skill response shapes before building a full feed:

```bash
alva run --code '(async()=>{const http=require("net/http");const secret=require("secret-manager");const jwt=secret.loadPlaintext("ARRAYS_JWT");const r=await http.fetch("https://data-tools.prd.space.id/api/v1/crypto/ohlcv?symbol=BTCUSDT&start_time=1735689600&end_time=1735776000&interval=1h&limit=5",{headers:{Authorization:"Bearer "+jwt}});console.log(JSON.stringify(JSON.parse(await r.text()).data[0]));})();'
```

---

## Memory

Alva gives every user a persistent, file-based memory system on ALFS at
`'~/memory/'`. Use it to accumulate knowledge about the user across
conversations — identity, preferences, investment style, and context useful in
future sessions.

`'~/memory/MEMORY.md'` is the index; topic files such as `user.md` hold the
content and are read on demand. Memory files are **user-visible and editable**
— write them as if the user will read them. Memory is a *claim*, not truth: it
records what was true when written, so verify any feed, cronjob, or parameter
it names before acting on it.

Read `MEMORY.md` at the start of every conversation — this is wired into
[Pre-flight](#5-load-memory). See [memory.md](references/memory.md) for the
storage layout, the `user.md` profile template, what to save and what not, and
the full read/write rules.

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
leads to incorrect timestamps and look-ahead bias. Use Altra for all
strategies regardless of complexity; external data can be added via
`registerRawData`. For OHLCV, use only intervals supported
by `createArraysOhlcvProvider()` (see `altra-trading.md`): stocks support
`"1min"`, `"2min"`, `"3min"`, `"5min"`, `"10min"`, `"15min"`, `"30min"`,
`"1h"`, `"2h"`, `"4h"`, `"1d"`, `"1w"`, `"1m"`; crypto supports those plus
`"45min"` and locally aggregated minute/hour/day multiples such as `"6h"` or
`"3d"`.

**Stock intraday window guardrail:** Do not directly request multi-year US
stock intraday (`"1min"`/`"5min"`/`"15min"`/`"30min"`/hourly) backtests as one
full window. The underlying Arrays/data-tools endpoint rejects large intraday
windows (for example >~366 days for `"1min"`). If the user asks for 2 years of
intraday stock data, explain the limit and either narrow the backtest window,
use daily/weekly bars when appropriate, or use a provider path that explicitly
chunks the request.

**After a successful backtest, you should package the results in a form the user
can use.** That may be a playbook, a dashboard, or a concise analytical summary,
depending on the request. A backtest that only prints raw console output is
usually incomplete — see
[Request Routing](#request-routing) above.

See [altra-trading.md](references/altra-trading.md) for full details.

```javascript
const { FeedAltraModule, createArraysOhlcvProvider } = require("@alva/feed");
const { FeedAltra, e, Amount } = FeedAltraModule;
const secret = require("secret-manager");

const ARRAYS_JWT = secret.loadPlaintext("ARRAYS_JWT");
const ohlcvProvider = createArraysOhlcvProvider({ jwt: ARRAYS_JWT });

const altra = new FeedAltra(
  {
    path: "~/feeds/my-strategy/v1",
    startDate: Date.parse("2025-01-01T00:00:00Z"),
    portfolioOptions: { initialCash: 1_000_000 },
    simOptions: { simTick: "1min", feeRate: 0.001 },
    perfOptions: { timezone: "UTC", marketType: "crypto" },
  },
  ohlcvProvider,
);

const dg = altra.getDataGraph();
dg.registerOhlcv("BINANCE_SPOT_BTC_USDT", "1d"); // supported interval strings include "1min", "15min", "1d"
dg.registerFeature(createRsiFeature()); // feature descriptors include description, inputConfig, fields, and fn

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

`@alva/adk` (`adk.agent()`) embeds a fixed LLM reasoning step inside a
deterministic, reschedulable pipeline — a feed cronjob's summarization stage,
a scheduled digest, a "why it matters" headline, a classification step. The
prompt and tool set are locked in; only the upstream data changes each run.

Do **not** use it for one-off research, exploratory analysis, or "help me look
into X" the user asks interactively — answer directly with your own tools;
wrapping it in `adk.agent()` adds a sandbox without buying anything. And do
not use it to produce numbers, events, or reports that should come from a real
data source (see Content Legitimacy Rule #2 above).

See [adk.md](references/adk.md) for the API, tool-calling and memory patterns,
and examples.

---

## Deployment Quick Reference

See [deployment.md](references/deployment.md) for full details.

Deploy feed scripts or tasks as cronjobs for scheduled execution:

```bash
alva deploy create --name btc-ema-update --path '~/feeds/btc-ema/v1/src/index.js' --cron "0 */4 * * *"
```

Cronjobs execute the script via the same jagent runtime as `alva run`. Min
interval: 1 minute.

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
alva release feed --name btc-ema --version 1.0.0 --cronjob-id 42 \
  --description "Fetches BTC/USDT 1h klines from Binance and emits the 20-period EMA as a time series"
# → {"feed_id":100,"name":"btc-ema","feed_major":1}

# 2. Create playbook draft (creates DB record + ALFS draft files automatically).
alva release playbook-draft --name btc-dashboard --display-name "BTC Trend Dashboard" --description "BTC market dashboard" --feeds '[{"feed_id":100}]' --trading-symbols '["BTC"]' --tags '["btc","macro"]'
# → {"playbook_id":99,"playbook_version_id":200}

# 3. Write playbook README to ALFS (required before release).
alva fs write --path '~/playbooks/btc-dashboard/README.md' --file ./README.md --mkdir-parents

# 4. Release playbook (reads HTML from ALFS, uploads to CDN, writes release files automatically).
#    --readme-url is required and must be the absolute ALFS path to the README
#    written above (the relative shorthand is no longer accepted).
alva release playbook --name btc-dashboard --version v1.0.0 --feeds '[{"feed_id":100}]' --changelog "Initial release" --readme-url '/alva/home/alice/playbooks/btc-dashboard/README.md'
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
  historical records feature computation receives. Strategy lookback controls
  the OHLCV, raw, and feature records delivered to the strategy, and can extend
  upstream raw/feature computation ranges so requested records are available.
- **Quote `~` paths to prevent shell expansion.** The shell expands bare `~` to
  your local home (e.g. `/Users/alice/`), not the ALFS home
  (`'/alva/home/alice/'`). Always quote paths: `--path '~/feeds/...'`.
- **Home directory not provisioned?** If you get `PERMISSION_DENIED` on all
  ALFS operations (including `'~/'`), your home directory was not created during
  sign-up. Call `alva fs mkdir --path '~/'` to provision it. This is idempotent
  and safe to call anytime.
- **Cronjob path must point to an existing script.** The deploy API validates
  the entry_path exists via filesystem stat before creating the cronjob.
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
| Min cron interval     | 1 minute              |
