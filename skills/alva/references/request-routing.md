# Request Routing

Read this before planning an Alva task, and every time a `/use-skill:` directive
appears. It owns route selection, Skillhub blueprint handling, planning gates,
and completion gates.

## Route types

| Request type | Core objective |
| --- | --- |
| Dashboard / Playbook | Identify data sources, validate the data flow, and deliver a usable dashboard or playbook when the user wants a shareable artifact. |
| What-if / Event Study | Use the official what-if blueprint when available, use Altra for event computation, and deliver a narrative results-first playbook or usable visual analysis. |
| Quant Research / Strategy | Use the official quant blueprint when available, use Altra for strategy metrics, and deliver reproducible research, predictions, or a strategy playbook. |
| Data Query | Fetch the requested data accurately and answer directly unless the user asks for a richer artifact. |
| Remix | Reuse the source playbook, apply the requested customization, and deploy or return the updated result under the requesting user's namespace. |
| Debug / Edit | Locate the actual source of the issue, change the generator or pipeline, and re-run the relevant gate. |

## Skillhub directive gate

If the user message contains `/use-skill:<username>/<name>`, this gate is
mandatory before Guided Planning and before build work.

1. Run `alva skillhub --help` if you have not used `skillhub` this session.
2. Inspect the id:

   ```bash
   alva skillhub get <username>/<name>
   ```

   The response lists files and sizes. Confirm a blueprint file is present.
   Convention is `template.md`; if absent, look for a clearly named template or
   `README.md`; ask the user only if no blueprint is identifiable.

3. On 404 or not found, recover leniently:
   - Run `alva skillhub list` and search case-insensitively.
   - Ignore separator differences when comparing ids.
   - If exactly one candidate is obvious, use it and tell the user the id you
     interpreted.
   - If multiple candidates are plausible, show them and ask.
   - If none match, use `--tag` when the user hinted at a topic and ask them to
     pick.

4. Read the blueprint fresh:

   ```bash
   alva skillhub file <username>/<name> template.md
   ```

   Use the actual filename if step 2 found a different blueprint. Do not rely on
   a previous session's memory of the template.

5. Pull other files only on demand. For example, fetch `src/index.js` only if
   you intend to mirror strategy logic. Do not bulk-download.

6. Treat the blueprint as authoritative for layout, sections, widgets, data
   contracts, cadence, and template-specific hard rules unless the user
   explicitly overrides it.

7. If the Skillhub entry includes both an instructional blueprint and a source
   sample, the instructional blueprint wins when they conflict. Source samples
   can be stale implementation examples; never copy them over a newer blueprint
   rule. In particular, if a blueprint removes a legacy UI pattern such as an
   in-HTML README modal, title row, or template label, do not reintroduce it
   from an attached source file.

8. If any Skillhub skill informed the build, pass `--skill-id <username>/<name>`
   during playbook draft. See [api/release.md](api/release.md#skill-id).

`/use-skill:` plus a concrete topic is a strong build directive. Present one
short plan, then build after approval; do not stack extra clarification flows.

## Official template route

Before planning non-trivial quant research, factor research, ML signal,
backtest, or what-if/event-study work, check the official Alva Skillhub
templates even when the user did not write `/use-skill:`.

1. Run `alva skillhub list --username alva --json`.
2. Select the matching official template:
   - `alva/backtest` for what-if, after/before-trigger, drawdown/recovery, or
     event-study narrative playbooks.
   - `alva/quant-research-lab` for factor ideas, paper reproduction, ML
     signals, allocation rules, portfolio analysis, strategy validation, or
     live quant playbook production.
3. Run the Skillhub directive gate above for the selected template: `get`, then
   `file` the blueprint, then apply its hard rules.
4. If an official template informed the build, pass
   `--skill-id alva/<name>` during playbook draft.

If no official template matches, continue with normal references. Do not invent
an `alva/*` id.

### What-if / Event Study template rules

For `alva/backtest`, the blueprint's current layout rules override generic
strategy-dashboard rules and any stale companion source file.

- Do not apply [design-playbook-trading-strategy.md](design-playbook-trading-strategy.md)
  unless the blueprint explicitly changes to the Overview/Analytics/Strategy/Feed
  tab structure.
- The HTML starts with the hero card and exactly four horizon metric cards;
  the first fold on 1440 x 900 must contain hero card + four horizon cards and
  nothing between them.
- Use a single-scroll narrative layout: path chart, two side-by-side analysis
  charts, audit ledger, then a short References card.
- Every chart has a `widget-subtitle`; use
  [design-widgets.md](design-widgets.md#chart-card).
- The attached `README.md` is the methodology. Do not add an in-HTML README
  chip, methodology modal, title row, `What-If` label, Q1-Q3 band,
  counter-narrative card, filters, dropdowns, or page timestamp unless the
  fetched blueprint explicitly reintroduces them.

### Quant Research Lab template rules

For `alva/quant-research-lab`, extract the research contract before coding:
question, thesis, universe, label, horizon, features, model/rule, validation,
and output. Build raw, cleaned, and feature-ready stages separately; preserve
source, timestamp, availability, feature order, and missingness.

Default output groups when the research needs them:

- `research/summary`
- `research/features`
- `model/predictions`
- `model/summary`
- `run/state`
- `portfolio/analysis`
- `signal/targets`
- FeedAltra `sim/*`
- FeedAltra `perf/*`

Validation rules: run a baseline before complex ML; use chronological,
walk-forward, or purged splits; never use random splits for financial
time-series labels; never tune on the final test/backtest; never report only
the best run; do not present paper results as live performance until reproduced
with real data. Raw model outputs are not trading instructions until thresholds,
sizing, and no-trade bands are documented and FeedAltra validates the strategy.

Quant playbooks should preserve these content groups when relevant:
Performance, Portfolio And Alpha, Prediction Timeline And State, Model And
Feature Evaluation, and Methodology with README evidence. Prediction-only
results may use a simpler results-first layout, but keep the same evidence
groups.

## Guided planning

For every route except a simple Data Query, present a plan once before building.
Exactly one blocking user gate is allowed per session:

1. **Clarify one missing parameter** only when asset, scope, output, or purpose
   is missing and has no obvious default. Ask one question, preferably
   multiple-choice. If you ask this, the user's answer is approval to build.
2. **Offer options** only when there are real strategic alternatives. Lead with
   the recommended path and explain trade-offs briefly.
3. **Confirm a concrete plan** when the request is already clear or a
   `/use-skill:` blueprint pins the shape. Keep it to 5-8 lines listing feeds,
   widgets, cadence, and key defaults.

If the user says "just do it", or used `/use-skill:` with a concrete topic,
skip clarifying questions for the rest of the session and move from one short
plan into implementation.

## Content arrangement

A Skillhub template's default sections are a floor, not a ceiling. Lead with
the section that carries the user's core question, add sections the request
requires, and cut or fold near-empty sections rather than padding them.

Push-driven requests such as digests, threshold trackers, stream watches, or
periodic alerts are a natural fit for `alva/ai-digest` when available, but any
playbook can add push through [push-notifications.md](push-notifications.md).

## Completion gate

For Dashboard/Playbook and Backtest/Strategy requests, default to leaving the
user with something usable. That often means a released playbook and a
`published_url`, but do not force release when the user only asked for code,
debugging, analysis, or an intermediate artifact.

Before finishing:

- Confirm the delivered result matches the user's actual goal.
- If a shareable playbook was part of the task, confirm `alva release playbook`
  returned a `published_url`.
- Use the canonical user-facing share URL
  `https://alva.ai/u/<username>/playbooks/<playbook_name>`; reserve
  `published_url` for verification screenshots.
- Summarize what was delivered in user-facing language. Use
  [language.md](language.md) and [narrative-voice.md](narrative-voice.md).

## Capability verification

Before saying Alva does not have a data type or recommending BYOD, run:

```bash
alva data-skills list | grep -i <topic>
```

Decompose compound requests and verify each part independently. Training memory
is not authoritative.
