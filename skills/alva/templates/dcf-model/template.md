# DCF Valuation Template

An intrinsic-value playbook: project a company's free cash flow, discount it,
add a terminal value, and bridge to a per-share value — with the assumptions as
interactive inputs and a sensitivity grid. Mirrors the financial-services
`dcf-model` workflow; data re-sourced to Alva.

**Scope** — one company. A what-if valuation: the base data comes from feeds,
the assumptions are reader inputs.

Generic rules (design system, content legitimacy, README-as-file, naming) come
from the Alva skill and the family shell. The interactive what-if shell is
shared with the `what-if` template — study it as a model.

## Migration note — an Excel model becomes a what-if playbook

The original builds a cell-auditable Excel model. A playbook cannot be that:
the DCF math runs in the page over feed-sourced historicals and market inputs,
and the assumptions (growth, margins, WACC inputs, terminal growth) are
interactive controls. This is **lower fidelity** than an Excel model — there
are no auditable formula cells — but it is live and shareable. State this limit
in the README.

## Data

Arrays data skills (`https://data-tools.prd.space.id`, `Authorization: Bearer
<ARRAYS_JWT>`). Run `list`→`summary`→`endpoint` before coding.

| Need | Endpoint | Key fields (shape-verified) |
|---|---|---|
| Historical revenue, EBIT, margins, tax, diluted shares | `stocks/company/income-statements` | `revenue`, `operating_income`, `ebit`, `income_tax_expense`, `weighted_average_shs_out_dil` |
| D&A, capex, working-capital change, FCF | `stocks/company/cashflow-statements` | `depreciation_and_amortization`, `capital_expenditure`, `change_in_working_capital`, `free_cash_flow` |
| Net debt, cash | `stocks/company/balance-sheets` | `net_debt`, `total_debt`, `cash_and_cash_equivalents` |
| Current price, market cap, beta | `stocks/market-metrics` | beta — confirm the exact `indicator` param via the endpoint doc |
| Risk-free rate (10Y) | `macro/treasury-rates` | `year10` |

Diluted share count: use `income-statements.weighted_average_shs_out_dil` —
the `outstanding-shares` endpoint returned empty in shape-checks.

## Feeds

**Quant feed `<company>-dcf`:**

| Output | Pattern | Contents |
|---|---|---|
| `history/drivers` | event log | last ~5 years: revenue, revenue growth, EBIT margin, D&A % of revenue, capex % of revenue, ΔNWC % of revenue, tax rate |
| `inputs/market` | snapshot | current price, market cap, diluted shares, net debt, beta, 10Y rate |
| `valuation/base` | snapshot | the base-case DCF output at default assumptions — EV, equity value, per-share value, implied upside, WACC, terminal value, TV % of EV |

The playbook recomputes the DCF in-browser when the reader changes an
assumption — client-side math over `history/drivers` and `inputs/market`. The
feed always publishes the base case so the page has a verified anchor.

## Methodology

The original DCF methodology, preserved.

**Historical analysis (3-5 years).** From `history/drivers`: revenue CAGR,
margin progression, and D&A / capex / ΔNWC as a percent of revenue — these
percentages seed the default projection assumptions.

**Revenue projection.** Project 5-10 years; growth starts near recent actuals
and moderates toward the terminal rate. Offer bear / base / bull assumption
sets.

**Free cash flow.** EBIT → less taxes → NOPAT → plus D&A → less capex → less
ΔNWC → unlevered free cash flow.

**WACC (CAPM).** Cost of equity = risk-free rate + β × equity risk premium
(5-6%). After-tax cost of debt = pre-tax rate × (1 − tax rate). Weight by the
market values of equity and debt.

**Discounting.** Mid-year convention — discount periods 0.5, 1.5, 2.5, … —
discount factor `1 / (1 + WACC)^period`.

**Terminal value.** Perpetuity growth — `TV = FCF × (1+g) / (WACC − g)`, and
`g` must be below WACC — or an exit EBITDA multiple. Terminal value should be
roughly 50-70% of enterprise value; flag it if it exceeds 75%.

**Equity bridge.** Enterprise value − net debt = equity value; ÷ diluted shares
= implied per-share value; versus the current price = implied upside.

**Sensitivity.** Grids with an odd number of rows and columns so the base case
sits in the center cell — WACC × terminal growth, and revenue growth × EBIT
margin.

## Data contract (frozen field names)

```
history/drivers  { date, fiscalYear, revenue, revGrowth, ebitMargin,
                   daPctRev, capexPctRev, nwcPctRev, taxRate }
inputs/market    { date, price, marketCap, dilutedShares, netDebt, beta,
                   riskFreeRate }
valuation/base   { date, enterpriseValue, equityValue, perShareValue,
                   impliedUpsidePct, wacc, terminalValue, tvPctOfEv }
```

The page's assumption controls (revenue-growth path, EBIT-margin path, equity
risk premium, terminal growth, cost of debt) are reader inputs, not feed
records.

## Playbook

Single-page scroll, results-first. Shares the `what-if` interactive shell.

1. **Value hero** — Free Text Card: the base-case implied per-share value vs
   the current price, and the implied upside.
2. **Four cards** — Base-case fair value · Implied upside · WACC · Terminal
   value % of EV.
3. **Assumption controls** — interactive inputs: revenue growth, EBIT margin,
   WACC inputs, terminal growth. Changing one recomputes the page.
4. **FCF projection chart** — projected unlevered free cash flow by year.
5. **Equity bridge** — PV of FCF + PV of terminal value → EV → less net debt →
   equity → per share.
6. **Sensitivity grids** — WACC × terminal growth, revenue growth × EBIT
   margin; the base case in the center cell.
7. **Historical drivers** — the 5-year driver table the assumptions seed from.
8. **References** — data sources, the lower-fidelity-than-Excel note, cadence.

## Template-specific rules

- One company. A what-if playbook, not an auditable Excel model — state the
  fidelity limit in the README.
- Base data (historicals, market inputs) is feed-sourced; assumptions are
  reader inputs; the recomputation is client-side math over feed data.
- The feed always publishes the base case as the verified anchor.
- Cadence: quant feed daily (price and rates move daily).

## Build

1. Confirm the company.
2. Shape-check the endpoints — especially the `market-metrics` beta param.
3. Write + test + grant + deploy + release the quant feed.
4. Build the what-if playbook HTML (reuse the `what-if` shell); write
   `README.md`; draft; screenshot; release.
