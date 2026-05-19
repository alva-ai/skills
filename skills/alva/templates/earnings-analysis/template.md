# Earnings Analysis Template

Post-earnings update for a company under coverage: what the just-reported
quarter showed against expectations, the metric and margin detail, where
estimates moved, and whether the thesis holds. Mirrors the financial-services
equity-research `earnings-analysis` workflow; data re-sourced to Alva.

**Scope** — one company, the most recent reported quarter. The pre-earnings
counterpart is `earnings-preview`; the daily coverage note is `morning-note`.

Generic rules (design system, content legitimacy, README-as-file, naming, the
single-page results-first shell) come from the Alva skill and the
equity-research family shell — not repeated here.

## Data

Arrays data skills (`https://data-tools.prd.space.id`, `Authorization: Bearer
<ARRAYS_JWT>`). Run `list`→`summary`→`endpoint` before coding.

| Need | Endpoint |
|---|---|
| Reported-quarter actuals (revenue, EPS, EBITDA, margins) | `stocks/company/income-statements` `period_type=quarter` |
| Free cash flow | `stocks/company/cashflow-statements` (`free_cash_flow`, `operating_cash_flow`) |
| Beat/miss vs consensus | `stocks/earnings-calendar` (`eps`/`eps_estimated`, `revenue`/`revenue_estimated`) |
| Pre-print and post-print consensus | `stocks/estimates-guidance` `type=estimate` |
| Company guidance | `stocks/estimates-guidance` `type=guidance` |
| Prior-quarter trend | `stocks/company/income-statements` (last 8 quarters) |
| Last call transcript | `stocks/earnings-transcript` |
| Valuation context | `stocks/market-metrics`, `stocks/company/price-target-consensus` |

Gotchas — `earnings-calendar` values are strings; `estimates-guidance`
`fiscal_period` is an integer 1-4. See the alva-template-migration skill's
`data-source-mapping.md` for the full gotcha list. **Coverage gap**: Alva
income statements carry no segment/geographic breakdown; `company/kpi` exposes
some KPIs but not a reliable segment P&L — note the limit, never split revenue
from model knowledge.

## Feeds

Two feeds (family pattern); the narrative feed runs after the quant feed.

**Quant feed `<company>-earnings-analysis`:**

| Output | Pattern | Contents |
|---|---|---|
| `results/reported` | snapshot | the reported quarter: revenue, EPS, EBITDA, margins — actual vs consensus vs year-ago |
| `trends/quarterly` | event log | last 8 quarters: revenue, EPS, gross/operating margin |
| `revisions/consensus` | tabular | consensus EPS/SALES for the forward periods, pre-print vs latest |
| `valuation/snapshot` | snapshot | price, PE, EV/EBITDA, PT consensus |

**Narrative feed `<company>-earnings-analysis-narrative`** (ADK): the "what's
new" read — the beat/miss explanation, the margin and guidance read, and the
thesis impact (does the quarter change the call). Labelled AI analysis.

## Methodology

The original earnings-analysis workflow, preserved.

**Lead with beat or miss.** State whether the company beat or missed, and
quantify the variance — "revenue beat by $120M, or 3%". Then explain *why*
results differed from expectations.

**What's new only.** An earnings update is about the delta — do not rehash
company background. Every section answers "what changed this quarter".

**Beat/miss per key metric.** Revenue, EPS, EBITDA, margins, and guidance each
get an actual-vs-consensus line. The pre-print consensus is the bar — use the
`estimates-guidance` row dated just before the report, not a later revision.

**Margin and guidance analysis.** Walk gross → operating → net margin against
the year-ago quarter; read the guidance against the prior consensus.

**Estimate revisions.** Show consensus EPS for the forward periods before the
print versus after — the post-print revision direction is the Street's verdict.

**Revised thesis.** The ADK read states plainly whether the quarter is
thesis-changing or noise, and what it means for the rating.

## Data contract (frozen field names)

```
results/reported    { date, period, revenue, revEstimate, revYoY, eps,
                      epsEstimate, epsYoY, ebitda, grossMargin, operatingMargin }
trends/quarterly    { date, period, revenue, eps, grossMargin, operatingMargin }
revisions/consensus { date, fiscalPeriod, epsPrePrint, epsLatest,
                      salesPrePrint, salesLatest }
valuation/snapshot  { date, price, peRatio, evEbitda, ptConsensus }
narrative/records   { date, recordDate, generatedAt, verdict, whatsNew,
                      thesisImpact, source }
```

`verdict` ∈ `{beat, miss, mixed}`. `whatsNew`/`thesisImpact` JSON-encoded.

## Playbook

Single-page scroll, results-first. Hero + four cards in the first fold.

1. **Verdict hero** — Free Text Card: beat or miss, the headline variances,
   one line on why. Inline colored numbers.
2. **Four metric cards** — Revenue vs consensus · EPS vs consensus · Operating
   margin · Guidance read.
3. **Beat/miss bars** — actual vs consensus for revenue, EPS, EBITDA.
4. **Quarterly trend** — revenue and margin over the last 8 quarters.
5. **Estimate revisions** — consensus EPS pre-print vs latest, per forward
   period.
6. **What's new / thesis impact** — Free Text Card, ADK, labelled AI analysis.
7. **References** — data sources + cadence.

## Template-specific rules

- One company, the most recent reported quarter.
- Cadence: quant feed daily (catches the print and the revision wave that
  follows); narrative feed after quant.
- The "what's new / thesis impact" block is ADK, labelled AI analysis.
- Segment/geographic analysis only where `company/kpi` actually provides it —
  otherwise note the gap.

## Build

1. Confirm the company; confirm its most recent quarter has reported.
2. Shape-check the endpoints.
3. Write + test + grant + deploy + release the quant feed, then the narrative
   feed (after quant).
4. Build the playbook HTML; write `README.md`; draft; screenshot; release.
