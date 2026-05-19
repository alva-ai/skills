# Comparable Company Analysis Template

A peer comparison: operating metrics and valuation multiples for a set of
comparable companies, with quartile statistics that show where each name sits
in the distribution. Mirrors the financial-services `comps-analysis` workflow;
data re-sourced to Alva.

**Scope** — a peer set of truly comparable public companies.

Generic rules (design system, content legitimacy, README-as-file, naming, the
single-page results-first shell) come from the Alva skill and the family shell
— not repeated here.

## Data

Arrays data skills (`https://data-tools.prd.space.id`, `Authorization: Bearer
<ARRAYS_JWT>`). Run `list`→`summary`→`endpoint` before coding.

| Need | Endpoint |
|---|---|
| Company identity, sector | `stocks/company/detail` |
| Revenue, growth, gross profit, net income, EBITDA | `stocks/company/income-statements` |
| Free cash flow | `stocks/company/cashflow-statements` (`free_cash_flow`) |
| Margins, ROE/ROA, TTM ratios | `stocks/financial-metrics` |
| Market cap, EV, EV/Revenue, EV/EBITDA, P/E, dividend yield | `stocks/market-metrics` |

## Feeds

**Quant feed `<set>-comps`:**

| Output | Pattern | Contents |
|---|---|---|
| `comps/operating` | tabular | per company: revenue, revenue growth, gross margin, EBITDA margin, FCF margin |
| `comps/valuation` | tabular | per company: market cap, EV, EV/Revenue, EV/EBITDA, P/E, FCF yield |
| `comps/statistics` | tabular | max / 75th percentile / median / 25th percentile / min, per comparable metric |

A short optional ADK card ("where each name screens rich or cheap vs the peer
median") can be added as labelled AI analysis — comps is data-first, so keep any
narrative minimal. A narrative feed is optional for this template.

## Methodology

The original comps-analysis workflow, preserved.

**Define the peer group.** Companies must be genuinely comparable — similar
business model, scale, and geography. Better three clean comps than six
questionable ones; verify each member's sector via `company/detail`.

**Consistent period.** All companies on the same basis — LTM smooths
seasonality. Flag any company on a different fiscal period.

**Operating metrics, then valuation multiples.** ~5 operating columns (revenue,
growth, 2-3 margins) and ~5 valuation columns (market cap, EV, three core
multiples). The 5-10 rule — beyond ~15 metrics is noise.

**Cross-reference, don't double-enter.** A valuation multiple is computed from
the operating data already in the feed — revenue is sourced once.

**Quartile statistics.** For every *comparable* metric — margins, growth,
multiples — compute max / 75th / median / 25th / min. The 75th percentile is
where premium names trade, the 25th is discount territory; this answers "is a
given name rich or cheap versus its peers". Use the **median**, not the mean —
averaging percentages misleads. Do **not** compute statistics on size metrics
(revenue, market cap, EV) — absolute size is not comparable across companies of
different scale.

**Sanity checks.** Gross margin > EBITDA margin > net margin, always. Watch the
multiple ranges — a negative-EBITDA company cannot be valued on EV/EBITDA (show
it on revenue multiples instead); a P/E above ~100x needs a hypergrowth story.

## Data contract (frozen field names)

```
comps/operating  { date, symbol, name, revenue, revGrowth, grossMargin,
                   ebitdaMargin, fcfMargin }
comps/valuation  { date, symbol, name, marketCap, ev, evRevenue, evEbitda,
                   peRatio, fcfYield }
comps/statistics { date, statistic, metric, value }
```

`statistic` ∈ `{max, p75, median, p25, min}`. `metric` names match the
operating/valuation field names. Statistics cover comparable metrics only —
never `revenue`, `marketCap`, or `ev`.

## Playbook

Single-page scroll, results-first.

1. **Comps hero** — Free Text Card: the read — which name screens cheapest and
   richest against the peer median, on which multiple.
2. **Four cards** — Peer count · Median EV/EBITDA · Median revenue growth ·
   Median EBITDA margin.
3. **Operating metrics table** — every company, the operating columns, with the
   max/75th/median/25th/min rows below a separating gap.
4. **Valuation multiples table** — every company, the valuation columns, with
   the same statistics rows.
5. **Valuation scatter** — EV/EBITDA vs revenue growth, one point per company,
   peer-median lines drawn.
6. **Multiple bars** — each company's EV/EBITDA and P/E against the peer
   median.
7. **References** — data sources, the peer-set definition, the period basis.

## Template-specific rules

- A peer set of truly comparable companies; verify each member's sector.
- Statistics are computed only on comparable metrics (margins, growth,
  multiples), never on absolute size.
- Median, not mean, for percentage metrics.
- A negative-EBITDA name is shown on revenue multiples, not EV/EBITDA.
- Cadence: quant feed daily (multiples move with price).

## Build

1. Confirm the peer set; verify each company is genuinely comparable.
2. Shape-check the endpoints.
3. Write + test + grant + deploy + release the quant feed.
4. Build the playbook HTML; write `README.md`; draft; screenshot; release.
