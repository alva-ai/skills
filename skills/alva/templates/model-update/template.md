# Model Update Template

Track how a company's consensus estimates and implied valuation move as new
data lands — reported actuals against the prior estimate, the forward-estimate
revisions, and the valuation impact. Mirrors the financial-services
equity-research `model-update` workflow; data re-sourced to Alva.

**Scope** — one company. A consensus-estimate and valuation revision tracker.
The post-earnings narrative report is `earnings-analysis`; the intrinsic-value
model is `dcf-model`.

Generic rules (design system, content legitimacy, README-as-file, naming, the
single-page results-first shell) come from the Alva skill and the
equity-research family shell — not repeated here.

## Migration note — the "model" is the consensus

The original updates the user's own Excel model. Alva has no editable
proprietary model, so this template tracks the **consensus** model — the
Street's estimates and the implied valuation, and how they revise. It is not a
private analyst model. The DCF-based fair-value leg reuses the `dcf-model`
template's logic at default assumptions. State this in the README.

## Data

Arrays data skills (`https://data-tools.prd.space.id`, `Authorization: Bearer
<ARRAYS_JWT>`). Run `list`→`summary`→`endpoint` before coding.

| Need | Endpoint |
|---|---|
| Reported actuals | `stocks/company/income-statements` |
| Consensus estimates over time (revisions) | `stocks/estimates-guidance` `type=estimate` |
| Company guidance | `stocks/estimates-guidance` `type=guidance` |
| Valuation inputs | `stocks/market-metrics` (PE, EV/EBITDA), `stocks/company/price-target-consensus` |
| DCF fair-value leg | `stocks/company/cashflow-statements`, `stocks/company/balance-sheets` |

## Feeds

Two feeds (family pattern); the narrative feed runs after the quant feed.

**Quant feed `<company>-model-update`:**

| Output | Pattern | Contents |
|---|---|---|
| `actuals/reported` | tabular | latest reported quarter vs the pre-print estimate, per line item, with the delta |
| `estimates/revisions` | tabular | consensus revenue/EBITDA/EPS for this FY and next FY — value over time |
| `valuation/recalc` | snapshot | forward-PE, EV/EBITDA, and DCF fair values; prior vs updated; vs current price |

**Narrative feed `<company>-model-update-narrative`** (ADK): the estimate-change
summary — what changed, why, thesis-changing or noise — and the rating /
price-target implication. Labelled AI analysis.

## Methodology

The original model-update workflow, preserved.

**Identify what changed.** The update trigger — an earnings release, a guidance
change, an estimate revision, a macro move, or an event.

**Reconcile actuals first.** Before projecting anything, reconcile the reported
figures against the prior estimate — actual vs estimate vs delta, per line.
Note GAAP vs adjusted.

**Track forward-estimate revisions.** Consensus revenue / EBITDA / EPS for this
fiscal year and next — the old value vs the new, and the change. The revision
direction and magnitude are the signal.

**Valuation impact.** Recalculate fair value three ways — a forward-PE
multiple, an EV/EBITDA multiple, and a DCF — prior vs updated, and the implied
price target.

**Summary and action.** One read: what changed, why, and whether it is
thesis-changing or noise; maintain or change the rating.

**Share count matters** — dilution from stock comp, converts, or buybacks moves
EPS independent of operations; reconcile it.

## Data contract (frozen field names)

```
actuals/reported    { date, period, lineItem, priorEstimate, actual, deltaPct }
estimates/revisions { date, fiscalPeriod, metric, estimateOld, estimateNew,
                      changePct }
valuation/recalc    { date, method, fairValuePrior, fairValueNew, currentPrice,
                      impliedUpsidePct }
narrative/records   { date, recordDate, generatedAt, trigger, changeSummary,
                      ratingAction, source }
```

`method` ∈ `{forwardPE, evEbitda, dcf}`. `metric` ∈ `{revenue, ebitda, eps}`.
`trigger` ∈ `{earnings, guidance, revision, macro, event}`.

## Playbook

Single-page scroll, results-first.

1. **Update hero** — Free Text Card: what changed and the direction of the
   revision; the valuation impact.
2. **Four cards** — Revenue delta · EPS delta · New FY EPS estimate ·
   Valuation impact.
3. **Reported vs estimate table** — the reconciliation, per line item.
4. **Estimate revision chart** — consensus EPS for this FY and next FY over
   time, with the latest revision marked.
5. **Valuation recalc** — fair value by the three methods, prior vs updated vs
   price.
6. **Estimate change summary / action** — Free Text Card, ADK, labelled.
7. **References** — data sources + cadence.

## Template-specific rules

- One company. The tracked "model" is consensus, not a proprietary model —
  state this in the README.
- Cadence: quant feed daily (estimates revise continuously); narrative after.
- The change summary and rating action are ADK, labelled AI analysis.

## Build

1. Confirm the company.
2. Shape-check the endpoints.
3. Write + deploy + release the quant feed, then the narrative feed.
4. Build the playbook HTML; write `README.md`; draft; screenshot; release.
