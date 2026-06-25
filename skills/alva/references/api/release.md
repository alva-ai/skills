# Release — extras not in CLI help

Run `alva release --help` first for the full workflow, all subcommands,
flags, display-name conventions, and examples. This file covers only:

1. Feed `--description` wording rules
2. Playbook README content shape (the big one — referenced by SKILL.md
   and the `--readme-url` flag)
3. `--trading-symbols` and `--tags` semantics, person-name discovery tags,
   and the required overlap between trading symbols and tags
4. `--skill-id` — when it is required
5. `--agent-type` — marking a feed as a prompt-editable agent

## Feed `--description` conventions

- Write a complete statement covering the feed's **data source**, **what
  it computes**, and the **output it produces**.
- Prefer concrete specifics (symbol, interval, exchange, indicator
  parameters) over vague labels.
- Avoid bare labels like `"BTC EMA"` — they read as names, not descriptions.

Good: `"Fetches BTC/USDT 1h klines from Binance and emits the 20-period EMA as a time series"`
Bad: `"BTC EMA"`

## Trading symbols and tags

- `--trading-symbols` — base asset tickers, e.g. `["BTC"]`, `["NVDA",
  "AAPL"]`. The backend resolves each to a trading-pair object; this
  drives asset routing.
- `--tags` — discovery tags. Drives `/explore` surfacing. Re-running
  `playbook-draft` with `--tags` replaces the prior set (no merge).

**Required overlap.** Every entity in `--trading-symbols` must appear in
`--tags` **verbatim, uppercase**, alongside lowercase topical themes.
Omit the entities and the playbook is invisible to `/explore` searches
for that asset — asset-routing and discovery read different fields.

**Related people.** If the playbook's thesis, screen, or catalyst logic depends
on named people, include those names in `--tags` using the most recognizable
public name. Cover investors, company executives / market-famous company
figures, government-linked officials or policymakers, and Twitter / X KOLs
whose posts or views materially affect the playbook.

Examples:

- `--trading-symbols '["BTC"]' --tags '["BTC","macro"]'`.
- `--trading-symbols '["TSLA"]' --tags '["TSLA","Elon Musk","EV"]'`.

## Skill id

`--skill-id` is required whenever a Skillhub skill informed the build —
i.e. the request carried a `/use-skill:<username>/<name>` directive, or
the agent ran `alva skillhub get` / `alva skillhub file` during building.

## Agent type

`alva release feed --agent-type <kind>` marks the feed as a prompt-editable
agent. `<kind>` must be in the catalog (the backend rejects unknown values with
`InvalidArgument`); `alpi` is the only kind in v1:

| `agent_type` | Meaning |
|--------------|---------|
| `alpi` | `@alva/pi` agent; its script reads & appends the owner's `AGENTS.md` instructions (`${feed.path}/AGENTS.md`) |
| *(omitted)* | ordinary feed, no editable prompt |

The owner edits the feed's `AGENTS.md` (`~/feeds/<name>/v<major>/AGENTS.md`) — no
redeploy. The path is backend-derived (no `--prompt-path` flag). See
[feed-sdk.md](../feed-sdk.md#user-instructions-agentsmd).

## Playbook README

Every released playbook ships a README at `~/playbooks/<name>/README.md`.
This is the canonical specification for what that file must contain. The
HTML's "How does this work?" / methodology modal renders the same content,
so there is one source of truth — the README — not a separate per-template
copy.

### Freshness and version updates

Every `alva release playbook` call needs a freshly reviewed README for the
version being released. Initial releases, version bumps, and re-releases all
follow the same rule: regenerate the README from the current HTML, feed
scripts, feed ids, cron cadences, metadata, and known blind spots, then
write it again to `~/playbooks/<name>/README.md` before release.

Do not point `--readme-url` at a README copied from a prior version. A README
may keep the same wording only if you have re-checked it against the current
implementation and re-written the reviewed file for this release.

### Path and `--readme-url` form

The flow is: **first** write the README to ALFS at
`~/playbooks/<name>/README.md`, **then** pass the **absolute** ALFS path
as `--readme-url`. The server does not write the file — it only validates
that the value matches the canonical README location.

`--readme-url` accepts exactly one form:

- `/alva/home/<username>/playbooks/<name>/README.md` — e.g.
  `/alva/home/alice/playbooks/btc-dashboard/README.md`. Resolve
  `<username>` once via `alva whoami` and pass the path verbatim
  (no `~` expansion, no relative shorthand).

The previously-accepted relative form `<name>/README.md` (and any `~/...`
shorthand) is **no longer accepted**. Any other value is rejected with
`InvalidArgument`.

### Content shape

The README is a markdown file. It is a standalone document — not a copy of
`display_name` or `description`. The reader is someone deciding whether
to trust this playbook's numbers, not someone browsing for ideas.

Structure: required sections (every playbook), then conditional sections
keyed to playbook shape (screener / thesis / what-if), then optional
sections.

#### Required (every playbook)

- **One-paragraph overview** — plain English: what the playbook computes,
  on what universe, the question it answers. Same scope bound as the
  in-app methodology modal's overview.
- **Data sources & freshness** — every feed / SDK / BYOD source the
  playbook reads, with the relevant specifics (symbol, interval, exchange,
  indicator parameters), plus the cron cadence (in ET) and what "fresh"
  means for this playbook. Match the sources actually called by the feed
  scripts and the deployed cronjobs — do not list aspirational sources or
  cadences the cronjob does not enforce.
- **Blind spots** — honest list of what this does NOT capture (sample-size
  caveats, survivorship issues, regime sensitivity, data gaps, anything
  that would change how a reader weighs the output). If there are none,
  write "None known" — do not omit the section.

#### Conditional — Screener / filter shape

- **Filter rules** (basket / hard filters) — every threshold, every
  excluded category. Senate example level of specificity: "excludes ETFs;
  requires ≥ 2 distinct senators + ≥ $50K total".
- **Factor weights + scoring formula** (scored only) — factor name, raw
  measure, normalization, weight. State the formula exactly.
- **Score bands** (scored only) — score ranges → tier label.
- **Flag definitions** (when flags exist) — for each flag: label, tier,
  exact threshold.
- **Worked example** (scored only) — re-derive the current #1 from raw
  inputs. Header (id + name + rank + band) plus per-factor rows
  (`name | raw / 100 × weight% = pts`) plus a total. State the actual
  display relationship: if the displayed score equals the factor-weighted
  sum, say so; if it is a rescaling (e.g. `45 + 50 * normalized composite`),
  state that honestly. Don't claim equality you can't deliver.

#### Conditional — Thesis shape

- **How this playbook works** — quant + alpi pipelines, post-processing
  matcher, exact list of inputs fed to the narrative agent.
- **Thesis pillars** (multi-pillar only) — for each pillar: id, name,
  one-sentence claim, the daily signal that would verify or contradict it.
- **News matching** — ticker overlap + keyword similarity rules; how
  unmatched items flow.
- **TLDR generation** — four-question framework, grounding rule, thrown
  errors, how `pushLine` is written. Include 1-2 gold few-shot TLDRs
  (each a `{thesis, pushLine}` pair).
- **Basket selection** — every name by layer; inclusion criteria;
  change-log policy. If composite scoring: factor table, composite formula,
  band thresholds, flag definitions, worked example re-deriving the
  current #1.
- **Computation rules** — every derived field: alpha definition, risk
  priority matrix, delta surfacing rules, etc.

#### Conditional — What-if / event-study shape

- **How we picked events** — the trigger definition: exact rule, lookback,
  exclusions.
- **How we measured returns** — the cutting dimension and the horizon set
  (e.g. 1W / 1M / 3M / 1Y), aggregation rule (mean / median), benchmark.
- **References** — links to the source for the trigger and the source for
  the return measurement.

#### Optional

- **Glossary** — domain-specific terms.
- **Legal disclaimer** — at the bottom, where applicable.

### Voice

Same rules as all other user-facing prose
([user-facing-prose.md](../user-facing-prose.md)). No marketing language, no
claims unsupported by the feeds, no future tense for behavior that is not
already wired up.
