# Release

Register feeds and playbooks for public hosting. All commands are under
`alva release`.

## Release Feed

```
alva release feed --name NAME --version VERSION --cronjob-id ID --description TEXT [--view-json 'JSON']
```

Register a feed in the database after deploying its cronjob. **Must be called
after** `alva deploy create` -- the `cronjob-id` comes from the
cronjob response.

**Name uniqueness**: The `name` must be unique within your user space. Use
`alva fs readdir --path '~/feeds'` to check existing feed names before
releasing.

| Flag | Type | Required | Description |
| --- | --- | --- | --- |
| --name | string | yes | URL-safe feed name (e.g. `btc-ema`), must be unique per user |
| --version | string | yes | SemVer (e.g. `1.0.0`) |
| --cronjob-id | int64 | yes | Cronjob ID from deploy create response |
| --view-json | object | no | View configuration JSON |
| --description | string | yes | Complete statement of what the feed does (see below) |

`description` conventions:

- Write a complete statement covering the feed's **data source**, **what
  it computes**, and the **output it produces**.
- Prefer concrete specifics (symbol, interval, exchange, indicator
  parameters) over vague labels.
- Avoid bare labels like `"BTC EMA"` — they read as names, not
  descriptions.

```
alva release feed --name btc-ema --version 1.0.0 --cronjob-id 42 \
  --description "Fetches BTC/USDT 1h klines from Binance and emits the 20-period EMA as a time series"
→ {"feed_id": 100, "name": "btc-ema", "feed_major": 1, "feed_path": "/alva/home/alice/feeds/btc-ema"}
```

## Release Playbook

## Create Playbook Draft

```
alva release playbook-draft --name NAME --display-name "Title" --feeds '[{"feed_id":100}]' [--description TEXT] [--trading-symbols '["BTC"]']
```

Create a new playbook with a draft version.

Requires both a URL-safe `name` and a human-readable `display-name`.

| Flag | Type | Required | Description |
| --- | --- | --- | --- |
| --name | string | yes | URL-safe playbook name (e.g. `btc-dashboard`), must be unique per user |
| --display-name | string | yes | Human-readable playbook title, max 40 chars |
| --feeds | array | yes | Feed references `[{feed_id, feed_major?}]` |
| --description | string | no | Short description of the playbook |
| --trading-symbols | string[] | no | Base asset tickers (e.g. `["BTC","ETH"]`). Resolved server-side to full trading pairs, stored in playbook metadata. Max 50. |

`display-name` conventions:

- Format: `[subject/theme] [analysis angle/strategy logic]`
- Max 40 characters
- Avoid personal markers such as `My`, `Test`, or `V2`
- Avoid generic-only titles such as `Stock Dashboard` or `Trading Bot`
- If the user provides `display-name`, use it and normalize any non-compliant parts

``` bash
alva release playbook-draft --name btc-dashboard --display-name "BTC Trend Dashboard" --description "BTC market dashboard with price, technicals, and volume" --feeds '[{"feed_id": 100}]' --trading-symbols '["BTC"]'
→ {"playbook_id": 99, "playbook_version_id": 200, "playbook_path": "/alva/home/alice/playbooks/btc-dashboard"}
```

## Release Playbook

```
alva release playbook --name NAME --version VERSION --feeds '[{"feed_id":100}]' --changelog "text" --readme-url '~/playbooks/NAME/README.md'
```

Release an existing playbook for public hosting. Reads the playbook HTML from
`'~/playbooks/{name}/index.html'` (ALFS — quote in CLI) and uploads it to CDN.

Changelog lives on the release, not the draft — set it when publishing.

`--readme-url` is a **required CLI flag**: the command fails argument
parsing if it is missing. It declares the ALFS location of the playbook's
README, and the server validates the value against a fixed convention (see
[Playbook README](#playbook-readme) below). Write the README to that path
**before** calling this command.

| Flag         | Type   | Required | Description                                                                                |
| ------------ | ------ | -------- | ------------------------------------------------------------------------------------------ |
| --name       | string | yes      | URL-safe playbook name (must already exist)                                                |
| --version    | string | yes      | SemVer (e.g. `v1.0.0`)                                                                     |
| --feeds      | array  | yes      | Feed references `[{feed_id, feed_major?}]`                                                 |
| --changelog  | string | yes      | Release changelog                                                                          |
| --readme-url | string | yes      | Owner-attested README location. See [Playbook README](#playbook-readme) for accepted forms. |

Feed reference fields:

| Field      | Type  | Required | Description                              |
| ---------- | ----- | -------- | ---------------------------------------- |
| feed_id    | int64 | yes      | Feed ID (own or others' feed)            |
| feed_major | int32 | no       | Major version (defaults to feed default) |

```
# 1. Write README to ALFS first (see Playbook README below for content shape).
alva fs write --path '~/playbooks/btc-dashboard/README.md' --file ./README.md --mkdir-parents

# 2. Then release, passing the same ALFS path you wrote to as --readme-url.
alva release playbook --name btc-dashboard --version v1.0.0 --feeds '[{"feed_id": 100, "feed_major": 1}]' --changelog "Initial release" --readme-url '~/playbooks/btc-dashboard/README.md'
→ {"playbook_id": 99, "version": "v1.0.0", "published_url": "https://alice.playbook.alva.ai/btc-dashboard/v1.0.0/index.html", "playbook_path": "/alva/home/alice/playbooks/btc-dashboard"}
```

After a successful release, output the alva.ai playbook link to the user:
`https://alva.ai/u/<username>/playbooks/<playbook_name>`

## Playbook README

Every released playbook ships a README at `~/playbooks/<name>/README.md`.
This is the canonical specification for what that file must contain. The
HTML's "How does this work?" / methodology modal renders the same content,
so there is one source of truth — the README — not a separate per-template
copy.

### Path and `--readme-url` forms

The flow is: **first** write the README to ALFS, **then** pass that same
ALFS path verbatim as `--readme-url`. The server does not write the file —
it only validates that the value matches the canonical README location.

The server accepts two forms for `--readme-url`:

1. **Relative** (preferred): `~/playbooks/<name>/README.md` — e.g.
   `~/playbooks/btc-dashboard/README.md`. This matches the same `~/playbooks/...`
   shorthand used by `alva fs write`, so the publish call mirrors the path
   you wrote to. Quote it in the shell (`'~/playbooks/<name>/README.md'`)
   to prevent local `~` expansion.
2. **Absolute**: `/alva/home/<username>/playbooks/<name>/README.md` — e.g.
   `/alva/home/alice/playbooks/btc-dashboard/README.md`. Use this only
   when hard-coding the username is unavoidable (e.g. cross-user references).

Both forms point to the same ALFS path. Any other value is rejected with
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

- **How this playbook works** — quant + ADK pipelines, post-processing
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
([narrative-voice.md](../narrative-voice.md)). No marketing language, no
claims unsupported by the feeds, no future tense for behavior that is not
already wired up.
(use the playbook `name` and the username from `alva whoami`)
