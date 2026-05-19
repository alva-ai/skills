# Sector Overview Template

An industry/sector landscape: the competitive set, how the players compare on
growth and profitability, sector valuation, M&A activity, and the investment
implications. Mirrors the financial-services equity-research `sector-overview`
workflow; data re-sourced to Alva.

**Scope** — one sector or subsector, public companies. Multi-company.

Generic rules (design system, content legitimacy, README-as-file, naming, the
single-page results-first shell) come from the Alva skill and the
equity-research family shell — not repeated here.

## Data

Arrays data skills (`https://data-tools.prd.space.id`, `Authorization: Bearer
<ARRAYS_JWT>`). Run `list`→`summary`→`endpoint` before coding.

| Need | Endpoint |
|---|---|
| Sector universe | `stocks/screener/basic-info/sector` (or `industry`) |
| Company profiles | `stocks/company/detail` |
| Revenue, growth, margins, EBITDA | `stocks/financial-metrics`, `stocks/company/income-statements` |
| Valuation multiples (PE, EV/EBITDA, EV/Revenue) | `stocks/market-metrics` |
| Sector M&A | `stocks/mergers-acquisitions` |
| Trends, drivers, news | `stocks/market-news`, content search |

**Coverage gaps** — Alva has no total-addressable-market / market-sizing data
and no true market-share data. Compute *revenue share within the screened
universe* as a labelled proxy ("share of the tracked peer set", not "market
share"). Never fabricate a TAM number; if market size is needed, source it
narratively with a citation, or omit the section.

## Feeds

Two feeds (family pattern); the narrative feed runs after the quant feed.

**Quant feed `<sector>-sector-overview`:**

| Output | Pattern | Contents |
|---|---|---|
| `universe/members` | tabular | the screened companies + profile (name, industry, market cap) |
| `metrics/companies` | tabular | per company: revenue, growth, gross/EBITDA margin, universe revenue share |
| `valuation/multiples` | tabular | per company: PE, EV/EBITDA, EV/Revenue, plus sector median/quartile rows |
| `events/ma` | event log | sector M&A, trailing window |

**Narrative feed `<sector>-sector-overview-narrative`** (ADK): the industry
structure read (fragmented vs consolidated, value chain, barriers), the key
trends and drivers, and the investment implications and bull/bear debates.
Labelled AI analysis.

## Methodology

The original sector-overview workflow, preserved.

**Define the scope.** Sector vs subsector, and the angle — a neutral landscape
or a thematic thesis. Public-company universe.

**Market overview.** Size, growth, segmentation. Alva has no TAM data — state
sizing narratively with a citation or omit it; never fabricate a market-size
number, and distinguish TAM hype from realistic addressable market.

**Industry structure.** Fragmented vs consolidated — use the top-5 share of the
*screened universe's* revenue as the concentration proxy, labelled as such.
Value chain, business-model types, barriers to entry.

**Competitive landscape.** The top players as a comparison table — revenue,
growth, EBITDA margin, valuation — each with a one-line profile.

**Valuation context.** Sector trading multiples now versus their historical
range; what drives the premium or discount.

**Investment implications.** Where the best risk/reward sits, the key bull/bear
debates, the catalysts that could shift the sector narrative.

**Sector overviews age fast** — the feed refresh keeps the data current; the
playbook carries no stale point-in-time figures.

## Data contract (frozen field names)

```
universe/members    { date, symbol, name, industry, marketCap }
metrics/companies   { date, symbol, revenue, revGrowth, grossMargin,
                      ebitdaMargin, universeRevSharePct }
valuation/multiples { date, symbol, peRatio, evEbitda, evRevenue }
narrative/records   { date, recordDate, generatedAt, structure, trends,
                      implications, source }
```

Sector median/quartile rows ride on `valuation/multiples` with `symbol` set to
`__median__` / `__p75__` / `__p25__`. `structure`/`trends`/`implications` are
JSON-encoded.

## Playbook

Single-page scroll, results-first.

1. **Sector hero** — Free Text Card: the sector snapshot — how many names, the
   growth and valuation picture, the headline structural read.
2. **Four cards** — Universe size · Sector median revenue growth · Sector
   median EV/EBITDA · M&A deal count.
3. **Company comparison table** — the players: revenue, growth, EBITDA margin,
   PE, EV/EBITDA, universe revenue share.
4. **Valuation scatter** — growth vs EV/EBITDA, one point per company.
5. **Sector multiple vs history** — the sector median multiple over time.
6. **M&A activity** — recent sector deals.
7. **Structure / trends / implications** — Free Text Card, ADK, labelled.
8. **References** — data sources, the proxy/gap notes, cadence.

## Template-specific rules

- One sector; the universe is the screened member set, fixed at build time.
- "Revenue share" is universe-relative and labelled a proxy — never presented
  as true market share.
- No fabricated TAM/market-size numbers.
- Cadence: quant feed weekly (sector data moves slowly); narrative after quant.

## Build

1. Confirm the sector/subsector and the angle (neutral vs thematic).
2. Screen the universe; verify each member's sector via `company/detail`.
3. Shape-check the endpoints.
4. Write + deploy + release the quant feed, then the narrative feed.
5. Build the playbook HTML; write `README.md`; draft; screenshot; release.
