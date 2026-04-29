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
  version: v1.6.5
---

# Alva

Alva is an agentic finance platform for financial data, cloud-side analytics,
scheduled automations, backtesting, live paper trading, and hosted playbook web
apps. It provides unified access to 250+ data sources across crypto, equities,
ETFs, macro, on-chain analytics, social sentiment, news, fundamentals,
estimates, insider and senator trades, funding, exchange flows, DeFi metrics,
and more.

The skill's job is to turn the user's investing, research, or automation request
into an accurate answer, a feed pipeline, a backtest, or a released playbook. It
must build from real data sources, verify the result, and communicate in
user-facing Alva language.

## Session Pre-flight

Run these checks on first use in each session before doing Alva work.

1. **Skill version**

   ```bash
   bash "<this skill's directory>/scripts/version_check.sh"
   ```

   No output means continue. Any output means show it to the user, apply the
   update, then continue.

2. **CLI and auth**

   The `alva` CLI (`@alva-ai/toolkit`) is required. Run:

   ```bash
   alva --help
   npm install -g @alva-ai/toolkit@latest
   alva whoami
   ```

   If `alva whoami` fails because no API key is configured, run
   `alva auth login`, then re-run `alva whoami`.

3. **Session variables from `alva whoami`**

   Save these for the rest of the session:

   - `username`: public URLs and ALFS paths.
   - `subscription_tier`: `"pro"` or `"free"`; controls release flow.
   - `telegram_username`: if present, push notifications can be recommended.
   - `_meta.arrays_jwt`: if missing, absent, or `renewal_needed: true`, run
     `alva arrays token status` and `alva arrays token ensure`.

4. **Memory**

   If memory has not been read in this conversation, run:

   ```bash
   alva fs read --path '~/memory/MEMORY.md'
   ```

   If present, read `user.md` and any relevant topic files listed in the index.
   If `'~/memory/'` is missing or empty, skip. Use memory only as current
   context after applying the rules in [Memory](#memory).

5. **Reference habit**

   Before any CLI call beyond quick discovery, read the relevant reference doc
   listed in [Reference Routing](#reference-routing), then use
   `alva <command> --help` for flags and examples.

## Communication

Use the canonical vocabulary in [language.md](references/language.md):
**automation**, **feed**, **playbook**, and **script**. Avoid exposing ALFS
paths, raw payloads, automation IDs, function names, or implementation details
unless the user explicitly asks for them.

Lead with the result. During multi-step builds, give short milestone updates.
When direct answers include financial figures, each number must come from a
fresh SDK/BYOD fetch with source attribution, or be explicitly marked as an
estimate that the user should verify.

All user-facing prose in playbook descriptions, display names, HTML copy,
methodology text, ADK prompts, TLDRs, digests, and push messages must follow
[narrative-voice.md](references/narrative-voice.md). Read it before writing or
generating narrative copy. Structured fields such as numbers, dates, tickers,
enum labels, and button labels are exempt.

## Request Routing

Choose one primary route. If the request spans routes, follow the strictest
gates among them.

| Route | Use When | Mandatory Docs | Output Gate |
| --- | --- | --- | --- |
| **Data Query** | User wants a direct number, table, comparison, or explanation. | [api/sdk.md](references/api/sdk.md), [search.md](references/search.md) when content search is needed. | Fresh data fetched, source named, no fabricated fallback. |
| **Dashboard / Playbook** | User wants a hosted dashboard, shareable artifact, tracker, screener, monitor, or automation UI. | [feed-sdk.md](references/feed-sdk.md), [deployment.md](references/deployment.md), [design-system.md](references/design-system.md), relevant API docs. | Feeds deployed, HTML fetches feed outputs, release/draft verified. |
| **Backtest / Strategy** | User asks to test, simulate, trade, generate signals, or run paper trading. | [altra-trading.md](references/altra-trading.md), [feed-sdk.md](references/feed-sdk.md), [design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md). | Altra used, visual result produced, no manual backtest loop. |
| **Remix** | User references an existing playbook to customize or reuse. | [remix-workflow.md](references/remix-workflow.md), [api/remix.md](references/api/remix.md), release/deployment docs as needed. | Source read, changes applied under requesting user namespace, lineage registered if released. |

### Feature Routing

These are capabilities used inside the primary routes above, not standalone
request routes.

| Feature | Use When | Required Docs | Gate |
| --- | --- | --- | --- |
| **ADK** | A Data Query, Playbook, Backtest, or Remix needs LLM-driven classification, synthesis, scheduled research, or tool use. | [adk.md](references/adk.md), [narrative-voice.md](references/narrative-voice.md), source-specific docs. | ADK reasons over real inputs and labels AI-generated analysis. |
| **BYOD** | The primary route needs a user-provided or validated external data source because SDK coverage is missing or insufficient. | [secret-manager.md](references/secret-manager.md), [api/secrets.md](references/api/secrets.md), [jagent-runtime.md](references/jagent-runtime.md). | Data is fetched through runtime HTTP and secrets are stored in Secret Manager. |
| **Push Notifications** | A playbook/backtest feed produces actionable, time-sensitive output. | [feed-sdk.md](references/feed-sdk.md), [api/notifications.md](references/api/notifications.md). | Telegram binding checked and `signal/targets`/`push_notify` configured only with user approval. |

### Template Routing

If the request contains `/use-template:<name>`, this step is mandatory before
planning or building.

1. Resolve `<name>` to `templates/<name>/template.md` relative to this skill.
2. Read that file from disk in this session. Do not rely on memory.
3. If it does not exist, list directories under `templates/` and ask which one
   to use.
4. Treat the template as the authoritative blueprint for layout, sections,
   widgets, data contracts, and cadence unless the user explicitly overrides it.
5. In the plan, state the template used and any intentional deviations.

Template sections are a floor, not a ceiling. Lead with what answers the user's
core question, add sections the request requires, and fold near-empty sections
into stronger neighbors.

### Guided Planning

For every route except **Data Query**, present a plan and get approval before
building unless the user has said "just do it" in this session.

1. Ask missing clarifying questions one at a time, preferably multiple-choice.
   Focus on asset, scope, output type, and purpose.
2. Offer two or three concrete approaches with trade-offs and a recommendation.
3. Confirm the specific feeds and widgets in 5-8 user-facing lines. Avoid
   implementation details.

## Non-negotiable Data Legitimacy

These rules apply to every response and artifact that surfaces financial
values: direct answers, feeds, dashboards, playbooks, backtests, remixes, edits,
follow-ups, charts, tables, metric cards, and descriptions.

The agent builds the pipeline; it is never the data source. Quantitative values
must trace to an Alva SDK module, a published Alva feed, or BYOD data fetched
through `require("net/http")` from a user-provided or explicitly validated
source.

Never use these as factual financial data sources:

- Agent knowledge or LLM output.
- WebSearch/WebFetch snippets.
- Random or synthetic generators.
- User-pasted snapshots unless they are clearly labeled as user-provided input
  and not presented as live data.
- Static HTML or JavaScript literals for chart/table/metric values.

If SDK coverage is missing, report the gap and stop or reduce scope. Do not
invent plausible values.

### Data Pipeline Rules

- Before any Arrays data HTTP call, or any `alva run` that calls Arrays, fetch
  the endpoint detail in this session with
  `alva skills endpoint --name <skill> --file <file>`. Use the summary table's
  **File** value, not the REST path.
- All quantitative data in playbook HTML must be read at runtime from feed
  output paths. Static labels, colors, and layout config are fine.
- A released playbook showing any numbers, charts, tables, or metric cards must
  pass `--feeds` with the deployed feed IDs it reads. `--feeds '[]'` is valid
  only for UI-only pages with zero quantitative runtime values.
- `alva run` is only a test run. It is not a deployed feed and cannot substitute
  for `alva deploy create`.
- Do not reference another feed or another playbook's feed unless the user
  explicitly asks. Build self-contained feeds for new playbooks.
- Qualitative ratings or theses must be either computed from sourced data with
  a shown formula, or separated and labeled as AI-generated analysis.
- When more than 20% of requested symbols fail lookup, report a data-quality
  blocker instead of silently substituting estimates.
- Playbook descriptions and methodology sections may list only sources that the
  feed actually called successfully. Update-frequency claims must match actual
  deployment.
- Thematic ticker lists must be verified with SDK company/sector metadata before
  use; remove mismatches.

### Coverage and Subscription Limits

When a data source is unavailable, be explicit and do not silently substitute.

- If a Pro/subscription-gated SDK is one of several sources, proceed with a
  useful reduced-scope artifact, omit the gated section, and note the omission.
- If the gated SDK is the sole source, tell the user the data requires Pro and
  offer exactly two options: upgrade, or provide a custom data source URL to
  wire through BYOD.
- Never stop with zero output if any useful subset can be built with available
  data sources.
- If the requested asset class or data type is outside the catalog, state the
  limitation upfront and suggest BYOD only when a public API is plausible.
- Never use LLM output, web snippets, or stale hardcoded values as a fallback.

### Tool-Output Accuracy

Only claim verification you actually performed. Do not say a screenshot looks
good unless you took it. Copy `published_url`, `feed_id`, ALFS paths, and other
tool-returned values verbatim from tool output. The canonical user-facing
share link is:

```text
https://alva.ai/u/<username>/playbooks/<playbook_name>
```

Use `published_url` for verification steps such as screenshots, not as the
primary share URL.

## Core Workflows

### Data Query

Arrays serves financial data APIs across 16+ domains. Use this coverage map to
pick likely skills before discovering exact endpoints with the CLI:

- **Market prices and derivatives**: stock, ETF, options, and crypto spot or
  futures OHLCV; intraday/daily bars; funding rates; open interest; derivatives
  market data; exchange-level market structure where available.
- **Equity fundamentals and valuation**: company profiles, sectors/industries,
  financial statements, ratios, market cap, dividends, splits, valuation
  metrics, and comparable company inputs.
- **Estimates, targets, and events**: analyst price targets, ratings, earnings
  estimates, earnings calendars, corporate events, IPO-related data, and other
  scheduled market catalysts.
- **Ownership and flow data**: insider trades, senator/congressional trades,
  institutional holdings, ETF holdings/flows, and other ownership-change
  signals where supported.
- **Macro and rates**: CPI, GDP, labor/economic indicators, Treasury rates,
  yield curves, central-bank or policy-rate style datasets, and broad macro
  time series.
- **Crypto on-chain and exchange flows**: wallet/network metrics, exchange
  inflows/outflows, stablecoin or supply metrics, DeFi/TVL-style metrics, and
  protocol activity where available.
- **News, social, and narratives**: news feeds, Twitter/X, Reddit, YouTube,
  podcasts, web search/scraping, and enrichment workflows. Use
  [search.md](references/search.md) and runtime SDK docs for source-specific
  details.
- **Prediction and alternative markets**: prediction-market data and other
  specialized datasets exposed in the live catalog.

This list is a routing aid, not an exhaustive contract. Always run
`alva skills list`, inspect the relevant summary, and fetch endpoint detail
before coding or answering.

1. Discover the right data skill with `alva skills list`.
2. Fetch the skill summary with `alva skills summary --name <skill>`.
3. Fetch endpoint detail with
   `alva skills endpoint --name <skill> --file <file>`.
   Use the summary table's **File** value, not the REST path.
4. Use the endpoint's documented parameters and response shape. If the response
   is unexpected, re-fetch the endpoint docs instead of guessing.
5. Return the answer directly with source and freshness. If auth fails, report
   the failure; do not replace the answer with web-sourced values.

Data APIs require `ARRAYS_JWT` and `Authorization: Bearer <ARRAYS_JWT>`.
Inside runtime scripts, load it with
`require("secret-manager").loadPlaintext("ARRAYS_JWT")`.
Do not use `X-API-Key` for Arrays data endpoints.

### Feed Build

Read [feed-sdk.md](references/feed-sdk.md) and
[jagent-runtime.md](references/jagent-runtime.md) first.

1. Define schema with `feed.def()` and write records with
   `ctx.self.ts(...).append(...)`.
2. Use `ctx.kv` watermarks for incremental runs; use separate watermarks per
   source when update frequencies differ.
3. Write the script to `'~/feeds/<name>/v1/src/index.js'`.
4. For every Arrays endpoint the feed calls, complete the data skill doc lookup
   from [Data Query](#data-query) in this session.
5. Test with `alva run --entry-path '~/feeds/<name>/v1/src/index.js'`.
   For unfamiliar SDK endpoints, first run a small shape-check snippet.
6. Grant public read on the feed root:

   ```bash
   alva fs grant --path '~/feeds/<name>' --subject "special:user:*" --permission read
   ```

7. Deploy with `alva deploy create`.
8. Register with `alva release feed`.

Use Feed SDK time series for all feed output, including snapshots. Prefer
single-record time series over raw JSON files written with `alfs.writeFile()`.

Recommended schedules:

| Data Type | Schedule |
| --- | --- |
| Stock OHLCV + technicals | `0 */4 * * *` |
| Company detail, price targets | `0 8 * * *` |
| Insider/senator trades | `0 8 * * *` |
| Earnings estimates | `0 8 * * *` |

During development only, stale feed data may be cleared with:

```bash
alva fs remove --path '~/feeds/<name>/v1/data/<group>/<output>' --recursive
alva fs remove --path '~/feeds/<name>/v1/data' --recursive
```

Never reset production feed data unless the user explicitly asks and the impact
is understood.

### Dashboard / Playbook

Read [design-system.md](references/design-system.md) first, then:

- [design-widgets.md](references/design-widgets.md) for charts and widgets.
- [design-components.md](references/design-components.md) for UI components.
- [design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md)
  for strategy playbooks.

Default to a live playbook unless the user explicitly asks for a static
snapshot. HTML must fetch quantitative data from feed output paths at runtime.

Common release flow:

1. Write HTML to `'~/playbooks/<name>/index.html'`.
2. Create a draft with `alva release playbook-draft`, including URL-safe
   `name`, human-readable `display_name`, description, and `--feeds`.
3. Include `--trading-symbols` when the playbook involves specific assets
   (base tickers such as `["BTC", "NVDA"]`, max 50).
4. For free users, publish directly with `alva release playbook`.
5. For pro users, show the draft link and ask whether to publish publicly or
   keep private.
6. Screenshot the `published_url` when released:

   ```bash
   alva screenshot --url <published_url> --out /tmp/screenshot.png
   ```

Display names should put the subject first, be under 40 characters, and avoid
generic names like `Stock Dashboard`, personal markers like `My`, and version
markers like `V2`.

### Backtest / Strategy

Read [altra-trading.md](references/altra-trading.md). Always use Altra for
backtests and signal-producing feeds. Manual loops over OHLCV to evaluate
strategy conditions are not acceptable because they risk timestamp and
look-ahead errors.

Strategy requests should normally produce a usable visual artifact: equity
curve, trade log, metrics, and explanation. If the user only asked for raw code
or analysis, respect that scope but still use Altra for simulation logic.

Any feed that produces `signal/targets` or `signal/alerts` must use
`FeedAltra`, including monitoring, alert, notification, and strategy feeds. Use
Altra target records `{date, instruction, meta}` where `meta.reason` is the
human-readable alert message.

### Push Notifications

After a playbook is released or kept as draft, evaluate whether any backing feed
produces actionable, time-sensitive content such as trade signals, breakout
alerts, anomaly detection, or scheduled research summaries.

If no feed qualifies, skip. If a feed qualifies:

- If `telegram_username` is missing, ask the user to connect Telegram at
  <https://alva.ai/settings> before enabling push.
- If connected, recommend the specific feed and ask whether to enable Telegram
  push notifications.
- On approval, add `signal/targets` if needed and set `--push-notify` on the
  cronjob.
- If the feed already has `signal/targets` and `push_notify: true`, skip.

Owner-only scheduled reports can write to `notify/message`; see
[feed-sdk.md](references/feed-sdk.md) Pattern E and
[api/notifications.md](references/api/notifications.md).

### Remix

Read [remix-workflow.md](references/remix-workflow.md). Use the
`@{owner}/{name}` source identifier when present. Read source feed scripts and
HTML with `alva fs read`; `alva remix` commands are for lineage registration,
not file reads. If the user does not specify what to change, ask before
building.

### ADK

Read [adk.md](references/adk.md). Use ADK for reasoning, classification,
summarization, and synthesis over real inputs. Do not use ADK to generate
factual financial numbers, events, statistics, analyst reports, or missing
source data. Label ADK-generated analysis when shown to the user.

### Secrets and BYOD

Read [secret-manager.md](references/secret-manager.md). Ask users to add or
edit third-party secrets at <https://alva.ai/apikey> when feasible. Do not ask
them to paste secrets into chat. Runtime code should load secrets with:

```javascript
require("secret-manager").loadPlaintext("NAME")
```

If a required secret is missing, stop and name the exact secret the user should
upload.

## Completion Gates

Apply the relevant gate before finishing. If the build was interrupted and
resumed, re-run the gate from the top.

For Dashboard/Playbook and Backtest/Strategy requests, the default goal is to
leave the user with a result they can use. This often means a released playbook,
but do not force release if the user asked only for code, analysis, debugging,
or an intermediate artifact.

### Feed Gate

- Script exists at `'~/feeds/<name>/v1/src/index.js'`.
- `alva run` succeeded for the entry path.
- Public read grant exists on `'~/feeds/<name>'`.
- Unauthenticated read of the data path returns HTTP 200, not 403.
- `alva deploy create` succeeded and returned a cronjob ID.
- `alva release feed` succeeded and returned a feed ID.

### Playbook Gate

- All quantitative runtime values come from feed output paths.
- Every feed read by HTML has a successful deploy and its feed ID appears in
  `--feeds`.
- The HTML exists at `'~/playbooks/<name>/index.html'`.
- Latest data from each referenced feed was read with `@last/1`; warn if older
  than 2x the cron interval.
- Description source and update-frequency claims match actual feed calls and
  cronjob status.
- The playbook is created or released under the authenticated requesting user's
  namespace.
- If released, screenshot `published_url` and return the canonical share link.

### Backtest Gate

- Altra was used for strategy simulation and signal output.
- The result includes a user-usable artifact or summary appropriate to the
  request.
- Metrics, equity curve, trades, and signals are sourced from the Altra/feed
  output, not console-only or hardcoded values.

### Final Response Gate

Lead with what is delivered. Include the canonical share URL when a playbook is
available. Summarize what was built or answered, mention any omitted data due to
coverage/subscription limits, and avoid internal implementation details unless
the user asked for them.

## User Scope and Release Policy

All write, deploy, draft, release, and secret operations must target only the
authenticated requesting user's namespace from `alva whoami`. Do not write to or
release under another user unless the request explicitly asks for a cross-user
operation such as remixing with lineage.

Free users' released playbooks are public. Pro users can keep draft playbooks
private; ask before publishing publicly. Do not proactively upsell. Mention Pro
only when a requested feature is blocked or degraded by free-tier limits.

Resource names for feeds, playbooks, and cronjobs must be 1-63 lowercase
alphanumeric characters or hyphens, cannot start or end with a hyphen, and must
be unique in the user's namespace. Check `'~/feeds'` or `'~/playbooks'` before
creating new names.

## Reference Routing

Use this table to avoid duplicating long API and implementation details in this
file. Read the relevant document before acting.

| Need | Read |
| --- | --- |
| User info and auth state | [api/user-info.md](references/api/user-info.md) |
| Filesystem commands and ALFS permissions | [api/filesystem.md](references/api/filesystem.md) |
| Runtime execution | [api/run.md](references/api/run.md), [jagent-runtime.md](references/jagent-runtime.md) |
| Feed modeling and output patterns | [feed-sdk.md](references/feed-sdk.md) |
| Deployment and automations | [deployment.md](references/deployment.md), [api/deploy-cronjob.md](references/api/deploy-cronjob.md) |
| Feed/playbook release | [api/release.md](references/api/release.md) |
| Screenshots | [api/screenshot.md](references/api/screenshot.md) |
| Data SDK discovery | [api/sdk.md](references/api/sdk.md) |
| Trading and backtesting | [altra-trading.md](references/altra-trading.md), [api/trading.md](references/api/trading.md) |
| Content search | [search.md](references/search.md) |
| Remix | [remix-workflow.md](references/remix-workflow.md), [api/remix.md](references/api/remix.md) |
| Secrets | [secret-manager.md](references/secret-manager.md), [api/secrets.md](references/api/secrets.md) |
| Notifications | [api/notifications.md](references/api/notifications.md) |
| ADK agents | [adk.md](references/adk.md) |
| Design system | [design-system.md](references/design-system.md), [design-widgets.md](references/design-widgets.md), [design-components.md](references/design-components.md), [design-playbook-trading-strategy.md](references/design-playbook-trading-strategy.md) |
| User-facing vocabulary and copy | [language.md](references/language.md), [narrative-voice.md](references/narrative-voice.md) |
| Error handling | [api/error-responses.md](references/api/error-responses.md) |

CLI discovery commands:

```bash
alva --help
alva <command> --help
alva sdk partitions
alva sdk partition-summary --partition <name>
alva sdk doc --name <module>
alva skills list
alva skills summary --name <skill>
alva skills endpoint --name <skill> --file <file>
```

## Runtime Quick Facts

Scripts run on Alva Cloud in a sandboxed V8 isolate. They cannot access the
host machine's filesystem, environment variables, processes, or Node.js
builtins. Use built-in modules:

| Need | Module |
| --- | --- |
| Filesystem | `require("alfs")` |
| Runtime user and args | `require("env")` |
| Secrets | `require("secret-manager")` |
| HTTP | `require("net/http")` |
| Algorithms | `require("@alva/algorithm")` |
| Feeds and Altra | `require("@alva/feed")` |
| ADK | `require("@alva/adk")` |
| Tests | `require("@test/suite")` |

No top-level `await`; wrap async code in `(async () => { ... })();`.
`require("alfs")` needs absolute paths such as
`'/alva/home/<username>/...'`. Quote ALFS `~` paths in shell commands so the
local shell does not expand them.

## Memory

Memory lives in ALFS under `'~/memory/'`, is user-visible, and can be edited or
deleted by the user. Use it to tailor work to stable user preferences,
identity, expertise, investment style, and relevant long-term context.

### Reading Rules

- At conversation start, read `'~/memory/MEMORY.md'`, then `user.md` and any
  relevant topic files listed there.
- If the user references prior work or asks whether you remember something,
  read the relevant memory file before answering.
- If the user says to ignore memory, proceed as if memory is empty.

### Writing Rules

Update memory only for stable facts: personal preferences, expertise, investing
style, portfolio rules, durable market views, or corrections to existing
profile data. Do not save ephemeral debugging state, raw market data, large
outputs, details derivable from code/ALFS, or anything already in the skill
docs.

Before writing, read `MEMORY.md`, update an existing topic file when possible,
create a new topic only when needed, and add one concise index line. After every
write, confirm in chat: `Memory updated: <one-sentence summary>`.

Memory is a claim, not truth. Verify referenced feeds, playbooks, cronjobs, and
parameters before acting. If memory conflicts with the user's latest message,
trust the latest message and update memory if appropriate.

## Common Pitfalls

- `@last` returns chronological oldest-first records.
- Time-series reads return flat JSON arrays; regular paths return file content.
- `last(N)` limits unique timestamps, not records.
- Do not name a feed group `data`; the Feed SDK already mounts `<feed>/data/`.
- Public unauthenticated reads require absolute
  `'/alva/home/<username>/...'` paths.
- If ALFS returns `PERMISSION_DENIED` on all operations, run
  `alva fs mkdir --path '~/'` to provision the home directory.
- Deploy paths must point to an existing script.
- Create a playbook draft before releasing a playbook.
- Create new playbooks from scratch unless doing an explicit version update.
- `FeedAltra.run()` is async; always `await` it.
- Altra feature lookback and strategy lookback are independent.
- For ECharts date axes, use `type: 'time'` or preformatted date strings.
- For ECharts graph series, validate node names and edge source/target values.
- Allocate enough chart height; primary overview charts should be at least
  400px tall, and heatmaps should scale with row count.
- Keep separate `ctx.kv` watermarks per source when a feed combines sources
  with different update cadences.

## Resource Limits

| Resource | Limit |
| --- | --- |
| V8 heap per execution | 2 GB |
| Write payload | 10 MB max per request |
| HTTP response body | 128 MB max |
| Minimum automation interval | 1 minute |
