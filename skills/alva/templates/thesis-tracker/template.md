# Thesis Tracker Template

Maintain one investment thesis for a position — the falsifiable claim, the
pillars that support it, the risks that would break it, a running scorecard of
how each pillar is tracking, the update log, and the catalysts ahead. Mirrors
the financial-services equity-research `thesis-tracker` workflow; data
re-sourced to Alva data skills.

**Scope** — one company, one thesis (long or short). For a multi-position
review, build one tracker per position. For theme/sector tracking without a
directional position, use the generic `thesis` template instead.

Generic rules (design system, content legitimacy, README-as-file, naming, the
single-page results-first shell) come from the Alva skill and the
equity-research family shell — not repeated here.

## Data

Arrays data skills (`https://data-tools.prd.space.id`,
`Authorization: Bearer <ARRAYS_JWT>`). Run `list`→`summary`→`endpoint` first.

| Need | Alva endpoint |
|---|---|
| Pillar metrics over time (growth, margins, ROE/ROIC) | `stocks/financial-metrics` (metric series per symbol); `stocks/company/income-statements` |
| Estimate trajectory — does the street agree | `stocks/estimates-guidance` |
| Update-log developments (earnings, news) | `stocks/earnings-calendar`, `stocks/company/income-statements`, `stocks/market-news` |
| Upcoming catalysts | `stocks/earnings-calendar`, `stocks/dividends`, `stocks/mergers-acquisitions` |
| Valuation vs target | `stocks/company/price-target-consensus`; `stocks/market-metrics` (`PE_RATIO`, `EV_EBITDA_RATIO`) |
| Ownership shifts | `equity-ownership-and-flow` (institutional, insider) |

The thesis itself — statement, pillars, risks, target price, stop trigger — is
**user-authored config set at build time**, not market data. It lives as static
labels in the playbook HTML. Only the metrics tracking each pillar flow through
feeds.

## Feeds

Two feeds (equity-research family pattern); the narrative feed runs after the
quant feed.

**Quant feed `<company>-thesis-tracker`:**

| Output | Pattern | Contents |
|---|---|---|
| `pillars/metrics` | time series | per pillar, its bound metric's value over time |
| `updates/log` | event log | developments — earnings prints, rating moves, news |
| `catalysts/upcoming` | tabular | upcoming events that could prove/disprove the thesis |
| `valuation/snapshot` | snapshot | price, PE, EV/EBITDA, PT consensus, implied vs target |

**Narrative feed `<company>-thesis-tracker-narrative`** (ADK): per pillar, the
status and trend judged against the original expectation; the conviction level;
update-log entries with thesis impact and action. All labelled AI analysis.

## Methodology

The original thesis-tracker workflow, preserved.

**Falsifiable pillars.** Each pillar is a measurable claim bound to a concrete
metric — "revenue growth >20%" → `REVENUE_GROWTH_YOY_TTM`; "margin expansion" →
`OPERATING_MARGIN_MRQ` trend; "product ramp" → a segment/KPI line. A pillar with
no bound metric is not trackable — rewrite it until it is. If nothing could
disprove the thesis, it is not a thesis.

**Scorecard — the core artifact.** Each pillar carries: Original Expectation
(set at build), Current Status (latest metric value vs the expectation — on
track / behind / ahead), and Trend (direction over recent prints).

**Disconfirming evidence.** Track evidence that *weakens* a pillar as rigorously
as confirming evidence. The narrative agent must not soft-pedal a missed pillar.

**Update log.** Each development: date, data point, thesis impact (which pillar;
strengthens / weakens / neutralizes), action (hold / add / trim / exit), updated
conviction.

**Conviction (High / Medium / Low).** An ADK judgment over the scorecard,
labelled AI analysis — it falls when pillars go "behind". Not a price-driven
number.

**Valuation vs target.** Current price and multiples against the build-time
target — the implied upside if the thesis plays out.

**Review cadence.** Refresh at least quarterly even on quiet stretches — an
unchecked thesis is a stale thesis.

## Data contract (frozen field names)

```
pillars/metrics    { date, pillarId, metricType, value, expectation }
updates/log        { date, headline, pillarId, impact, action, source }
catalysts/upcoming { date, eventDate, kind, label }
valuation/snapshot { date, price, peRatio, evEbitda, ptConsensus, targetPrice,
                     impliedUpsidePct }
narrative/records  { date, recordDate, generatedAt, conviction, scorecard,
                     updates, riskReads, source }
```

`impact` ∈ `{strengthens, weakens, neutralizes}`. `action` ∈
`{hold, add, trim, exit}`. `conviction` ∈ `{High, Medium, Low}`. `scorecard`,
`updates`, `riskReads` are JSON-encoded arrays. The thesis statement, pillar
definitions, and risk list are static HTML config, not feed records.

## Playbook

Single-page scroll, results-first.

1. **Thesis hero** — the thesis statement (static) + current conviction (ADK,
   labelled).
2. **Scorecard table** — pillar / original expectation / current status / trend.
3. **Pillar metric charts** — each pillar's bound metric over time with the
   expectation line drawn.
4. **Update log** — recent developments, newest first, each with a
   thesis-impact tag.
5. **Catalyst calendar** — upcoming events.
6. **Valuation vs target** — current price and multiples vs the target, implied
   upside.
7. **Risks** — the risk register (static), each with a current read (ADK,
   labelled).
8. **References** — data sources + cadence.

## Template-specific rules

- One company, one thesis. A short thesis surfaces disconfirming evidence on
  the bear case the same way a long does.
- Thesis statement, pillars, risks, and target are build-time config (static
  HTML labels); only the tracked metrics come from feeds.
- Conviction, scorecard status/trend, and risk reads are ADK, labelled AI
  analysis.
- Cadence: quant feed daily or weekly (match the pillar metrics' update
  frequency); narrative feed after quant; flag a full review at least quarterly.

## Build

1. Capture the thesis from the user: statement, position, 3-5 pillars (each
   with a measurable metric), 3-5 risks, target price, stop trigger.
2. Bind each pillar to a concrete Alva metric; if a pillar can't be bound, push
   back before building.
3. Shape-check each endpoint with a small `alva run` snippet.
4. Write + test + grant + deploy + release the quant feed, then the narrative
   feed (deployed after the quant feed).
5. Build the playbook HTML; write `README.md`; draft; screenshot-verify;
   release.
