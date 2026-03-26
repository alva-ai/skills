# Eval Rubric

Use this checklist when evaluating an Alva-generated playbook or feed.

## 1. SDK And Doc Usage

Category: `sdk_doc`

Check:

- Did the run choose the correct partition before selecting a module?
- Did it load a module doc instead of guessing the call shape?
- Did it follow the main `alva` skill's content routing rules?
  (Refer to the main skill's SKILL.md § Content Search and § SDK Partition
  Index — do not maintain a separate routing table here)

Common failures:

- wrong partition
- no doc lookup
- guessed parameter names
- wrong content route (check against current main skill, not this rubric)

## 2. API Contract And Workflow Order

Category: `api_contract`

This category owns **all** API call ordering and sequencing checks. Requires
the API trace (same-session only).

Check:

- Did it check feed/playbook name uniqueness?
- Did it test or run before deploy?
- Did it `grant` before relying on public reads?
- Did it `deploy` before `release/feed`?
- Did it `draft/playbook` before `release/playbook`?
- For remix, did it read the source assets and register lineage?

Common failures:

- release before draft
- release before deploy
- missing public grant
- missing remix lineage

## 3. Content Legitimacy

Category: `content_legitimacy`

All content displayed in a playbook must originate from one of two legitimate
sources:

1. **Alva's own pipeline** — SDK modules (`require("@arrays/...")`), Search
   API modules (Twitter/X, news, Reddit, YouTube, podcasts, web search)
2. **User BYOD** — external HTTP APIs via `require("net/http")` inside the
   runtime, or files uploaded to ALFS

The agent's role is to **build the pipeline**, not to **be the data source**.

### What is and isn't legitimate

**Legitimate** (do not flag):
- LLM-driven transforms inside the runtime: summarization, translation,
  sentiment scoring, formatting — as long as the **input data** comes from a
  legitimate source listed above. The agent is allowed to add processing logic.
- Static UI text: labels, titles, section descriptions, methodology notes,
  "About this playbook" prose.

**Not legitimate** (flag as violation):
- **Fabricated provenance**: agent uses WebSearch/WebFetch to obtain content
  (prices, social posts, news), then injects it into feed scripts or HTML as
  if it came from the Alva pipeline. The content may be factually correct but
  the data lineage is forged.
- **Hardcoded live content**: values that should be dynamic (prices, dates,
  OHLCV, social text) are baked into code as literals instead of fetched at
  runtime.
- **Agent-as-data-source**: agent generates "analysis", "sentiment", or
  "market outlook" text from its own knowledge and presents it as data-driven
  content in the playbook, without any underlying data pipeline backing it.

### Feed script checks (async-safe)

- Does the script acquire data through Alva SDK modules, Search SDK modules,
  or `require("net/http")`?
- Are there hardcoded data literals that should be dynamic: price arrays,
  OHLCV objects, social post text, news snippets, analysis paragraphs?
- If the script produces data output without any data-fetching call →
  `critical`
- If the script contains hardcoded values that should be fetched dynamically
  (prices, dates, social content) → `high`

### Playbook HTML checks (async-safe)

- Does all dynamic content read from Alva data gateway paths
  (`/alva/home/<username>/.../@last/...`) at runtime?
- Are there inline content blocks that look agent-sourced: market analysis
  paragraphs, social sentiment summaries, news excerpts, or data tables
  embedded directly in HTML rather than fetched from a feed?
- Static UI text (labels, titles, section descriptions, methodology notes) is
  legitimate. Content that presents itself as data or live information is not.
- If the HTML contains data-like content not backed by any feed → `high`

### Trace checks (same-session only)

- Did the agent use WebSearch / WebFetch to obtain content that subsequently
  appears in the feed script or playbook HTML?
- Intent distinction: searching to understand requirements or read
  documentation is legitimate; searching to obtain content that will be
  displayed in the playbook is not.
- If agent search results appear verbatim or near-verbatim in the final
  artifacts → `critical` (fabricated provenance)

Common failures:

- agent web-searched prices and hardcoded them in the feed script
- agent wrote market analysis text directly into playbook HTML
- agent fetched social posts via WebSearch and pasted them into HTML instead
  of using Search SDK
- feed script has no data-fetching calls but produces non-empty output
- agent used its own knowledge to generate "sentiment analysis" or "market
  outlook" text presented as data-driven content

## 4. Runtime Constraints

Category: `runtime`

Check:

- no Node builtins like `fs`, `path`, `http`
- no unsupported top-level `await`
- `await altra.run(...)` when Altra is used
- public read paths use absolute Alva paths when required

## 5. Error Handling

Category: `error_handling`

The agent must handle API errors and resource limits gracefully — not silently
skip failed steps and continue as if nothing happened.

Check:

- When an API call fails, did the agent attempt to diagnose and resolve the
  root cause before moving on?
- When a resource limit is hit (e.g. max cronjobs, max feeds), did the agent
  try to free up capacity (list + delete unused resources)?
- If resolution failed, did the agent stop the downstream flow (e.g. not
  release a playbook that has no data refresh) or at minimum warn the user?
- Did the agent avoid releasing artifacts with known unresolved blockers?

Severity guide for this category:

- `high`: agent silently continued past a failed step that makes the final
  artifact broken or misleading (e.g. released playbook with no cronjob)
- `medium`: agent noted the failure but chose a suboptimal fallback without
  exploring alternatives (e.g. logged the error but didn't attempt cleanup)
- `low`: agent handled the error but the resolution was incomplete (e.g.
  cleaned up some cronjobs but not the right ones)

Common failures:

- cronjob limit hit → agent lists jobs but doesn't attempt deletion → releases
  playbook anyway → data goes stale immediately
- feed name conflict → agent doesn't check or rename → opaque error
- grant fails → agent proceeds to release → public reads return 403
- runtime error on one feed → agent fixes it but doesn't re-verify dependent
  feeds or HTML that references the failed output group

## 6. Data Quality

Category: `data_quality`

Check:

- feed output is non-empty
- timestamps are monotonic when expected
- no obvious `NaN` or null-filled chart data
- schema matches the intended reader pattern
- latest data is plausible for the requested asset or topic
- **data freshness**: read `@now` and compare its timestamp to the current
  time and the feed's `cron_expression`. If the latest data point is older
  than 1 cron period + execution tolerance (the greater of 20% of the period
  or 10 minutes), the feed is stale. Severity: `high` — a stale feed means
  the scheduled job is not running, which makes the playbook show outdated
  data to users

## 7. Deploy And Release (Post-Run Observable)

Category: `deploy_release`

This category owns **post-run observable** release state only. API call
ordering (deploy before release, grant before public read, draft before
release) belongs to `api_contract`, not here.

Check:

- published URL exists and resolves
- public read can actually load sample data
- cronjob is active and scheduled
- **cronjob liveness**: if the cronjob has execution history, check that the
  last execution succeeded and occurred within the expected cron period.
  A cronjob that is "active" but has not fired or is consistently failing is
  a `high` severity issue

## 8. Rendering

Category: `rendering`

### Static HTML checks (async-safe)

- generated HTML exists and is well-formed
- page structure is complete enough for the requested playbook type
- **metadata consistency**: if the playbook displays update frequency or
  "last updated" text, cross-check against the actual `cron_expression` and
  feed `@now` timestamp. A mismatch (e.g. page says "updates every hour" but
  cron is `0 */4 * * *`, or "last updated 10:00" when `@now` shows 06:00)
  is severity `high` — the user is seeing false operational claims

### Visual verification (screenshot-based)

The alva skill takes a screenshot after release (`screenshot_playbook` span).
The trace records the screenshot URL (typically
`alva-ai-static.b-cdn.net/prd/avatar/...`). Use this screenshot for visual
verification:

1. **Fetch the screenshot**: use `Read` on the image URL from the trace's
   `screenshot_playbook` span output. If the trace lacks a screenshot span,
   fetch one via the Alva screenshot API:
   `GET /api/v1/screenshot?url=<published_url>` (requires auth).
2. **Visual inspection** — check for:
   - **Empty chart containers**: large blank/white areas where charts should be
   - **Error overlays**: JS error messages, "failed to load" banners, red text
   - **Layout breakage**: overlapping elements, horizontal scroll, content
     clipped or invisible
   - **Missing tabs/sections**: compare visible tab count against the expected
     count from the trace (e.g. `agent_build_dashboard_html` output says
     "8 tabs" — verify 8 are visible)
   - **Data presence**: charts should show lines/bars/candles, not empty axes.
     Tables should have rows, not just headers
   - **Axis readability**: time axis labels must be human-readable dates (e.g.
     "Mar 1", "2026-03-01"), not raw timestamps or epoch numbers. Crowded or
     overlapping axis labels count as unreadable
   - **Information hierarchy**: key widgets (charts, KPI cards) should have
     visual weight proportional to their importance. A core chart squeezed
     into a small fraction of the page while secondary content (text walls,
     quotes) dominates is a layout failure — the chart becomes unreadable
     regardless of its internal rendering quality
3. **Severity guide**:
   - `high`: visible error overlay, entirely blank main content, more than
     half of expected sections missing, **or primary chart/widget is
     unreadable due to sizing or axis issues**
   - `medium`: one or two charts empty while others render, minor layout issues
   - `low`: cosmetic issues (spacing, alignment) that don't affect readability

**Known limitation — single-tab screenshot**: the alva skill's
`screenshot_playbook` captures only the initially visible tab (usually
Overview or the first tab). For multi-tab playbooks, the other tabs are
**unverified visually**. Note this in the report as:
`Visual: verified Overview tab only; {N-1} tabs unverified (single screenshot)`

If no screenshot is available (trace missing, URL expired), mark the visual
check as `N/A` and note it in the report. Do not guess rendering quality from
HTML source alone — client-side rendering (ECharts, dynamic fetch) means HTML
structure does not prove visual correctness.

## 9. Coverage Attribution

Category: `coverage_gap`

Use this only when the failure is not an infra bug but a true capability gap.

Examples:

- unsupported symbol or venue
- unsupported request shape
- missing tool capability
- missing doc coverage that makes reliable execution impossible

Do not use `coverage_gap` to hide ordinary bugs.

## Severity Guide

- `critical`: false success, fabricated release, illegitimate content source, or a bug that makes the eval misleading
- `high`: release path broken, wrong routing, broken API order, unusable output, hardcoded dynamic values
- `medium`: data quality, runtime hygiene, partial rendering issues
- `low`: weaker evidence, polish gaps, or follow-up opportunities

## Health Score

Every eval must produce a numeric health score so playbooks and skill versions
can be compared over time.

### Scoring rules

Each category (excluding `coverage_gap`) has 1 point. A category scores:

- **1** — pass (no findings, or only `low` findings)
- **0.5** — partial (only `medium` findings)
- **0** — fail (any `high` or `critical` finding)

Categories not evaluated (insufficient evidence) are marked `N/A` and excluded
from both numerator and denominator.

**Health score** = sum of category scores / number of evaluated categories,
displayed as a fraction and percentage.

**Coverage**: always output `evaluated: N/8` to show how many categories had
sufficient evidence. A score of `6/6 (100%)` with `evaluated: 6/8` is weaker
than `8/8 (100%)` with `evaluated: 8/8`.

**BLOCKED gate**: if `api_contract` or `deploy_release` has any `high` or
`critical` finding, the overall verdict is **BLOCKED** regardless of the
numeric score. A playbook with a broken release path should not be presented
as partially healthy — it is not shippable. Display the score for reference
but lead with `BLOCKED` in the output.

### Scored categories

| # | Category | Weight | Async-safe |
|---|---|---|---|
| 1 | `sdk_doc` | 1 | trace only |
| 2 | `api_contract` | 1 | trace only |
| 3 | `content_legitimacy` | 1 | partial (HTML yes, trace no) |
| 4 | `runtime` | 1 | yes (needs script) |
| 5 | `error_handling` | 1 | yes (trace or blocker log) |
| 6 | `data_quality` | 1 | yes |
| 7 | `deploy_release` | 1 | yes |
| 8 | `rendering` | 1 | yes |

`coverage_gap` is not scored — it is attribution, not a pass/fail check.

### Output format

```
Verdict: BLOCKED (deploy_release has high finding)
Health: 4/8 (50%) | evaluated: 8/8
  sdk_doc:              1   ✓
  api_contract:         0.5 ~ (medium: release-ungated-on-deploy-failure)
  content_legitimacy:   1   ✓
  runtime:              1   ✓
  error_handling:       0   ✗ (high: cronjob-deploy-failed-unresolved)
  data_quality:         1   ✓
  deploy_release:       0   ✗ (high: no-active-cronjob) ← BLOCKED
  rendering:            0   ✗ (high: unreadable-axis + broken-layout)
  unresolved_blockers:  cronjob rate limit (both feeds)
```
