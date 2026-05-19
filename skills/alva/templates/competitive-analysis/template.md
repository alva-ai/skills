# Competitive Analysis Template

A competitive landscape for a set of companies: how the players compare on
scale, growth and profitability, where each is positioned, their moats, and the
strategic synthesis. Mirrors the financial-services `competitive-analysis`
workflow; data re-sourced to Alva, and the deck deliverable re-cast as a
playbook.

**Scope** — a peer set, optionally with one target company as the protagonist.
Multi-company.

Generic rules (design system, content legitimacy, README-as-file, naming, the
single-page results-first shell) come from the Alva skill and the family shell
— not repeated here.

## Data

Arrays data skills (`https://data-tools.prd.space.id`, `Authorization: Bearer
<ARRAYS_JWT>`). Run `list`→`summary`→`endpoint` before coding.

| Need | Endpoint |
|---|---|
| Company identity, sector | `stocks/company/detail` |
| Revenue, growth, margins, EBITDA | `stocks/financial-metrics`, `stocks/company/income-statements` |
| Market cap, enterprise value, multiples | `stocks/market-metrics` |
| M&A and strategic activity | `stocks/mergers-acquisitions` |
| Recent developments | `stocks/market-news` |

**Coverage gaps** — Alva has no market-sizing/TAM data and no industry
operating KPIs (ARR, NRR, GMV, take rate, same-store sales). The comparison
runs on standard financials and valuation; industry-specific KPIs and market
sizing are noted as gaps, never fabricated.

## Migration note — the deck becomes a playbook; opinion becomes labelled ADK

The original ships a PowerPoint deck. Here the deliverable is a playbook. The
quantitative comparison is feed data; the qualitative layer — competitor
strengths/weaknesses, moat ratings, the strategic synthesis, bull/base/bear —
is ADK-generated, labelled AI analysis, kept separate from the data widgets.

## Feeds

Two feeds (family pattern); the narrative feed runs after the quant feed.

**Quant feed `<set>-competitive-analysis`:**

| Output | Pattern | Contents |
|---|---|---|
| `companies/metrics` | tabular | per company: revenue, growth, gross/EBITDA margin, market cap, EV, EV/EBITDA, PE |
| `comparison/dimensions` | tabular | per company, per dimension (scale/growth/margins): the value and a rank |
| `events/strategic` | event log | M&A and strategic moves across the set |

**Narrative feed `<set>-competitive-analysis-narrative`** (ADK): the
industry-defining metrics, each competitor's qualitative profile (business,
strengths, weaknesses, strategy), the moat assessment, and the synthesis.
Labelled AI analysis.

## Methodology

The original competitive-analysis workflow, preserved.

**Industry-defining metrics first.** Identify the 3-5 metrics the industry
actually runs on, and use them consistently across every competitor. Where
those are operating KPIs Alva does not carry, note the gap.

**Same-period comparability.** Every competitor's metrics come from the same
fiscal period; flag any exception explicitly.

**Competitor mapping.** Group the set by a single lens — business model,
segment, or competitive posture.

**Positioning.** Place the companies on a 2×2 (two dominant factors), a radar
(multi-factor), or a tier diagram (natural clusters).

**Competitor deep-dives.** Per company: the metrics table (feed data) plus a
qualitative card — business in one line, 2-3 strengths, 2-3 weaknesses, current
strategy (ADK).

**Comparative analysis.** Rate each company dimension by dimension, and show
the actual value behind the rating — "scale ●●● $160B", not a bare dot.

**Moat assessment.** Rate each competitor Strong / Moderate / Weak on network
effects, switching costs, scale economies, and intangible assets.

**Synthesis.** The durable advantages (hard to replicate), the structural
vulnerabilities (hard to fix), and current state vs trajectory. For an
investment context, a bull/base/bear scenario set.

## Data contract (frozen field names)

```
companies/metrics     { date, symbol, name, revenue, revGrowth, grossMargin,
                        ebitdaMargin, marketCap, ev, evEbitda, peRatio }
comparison/dimensions { date, symbol, dimension, value, rank }
events/strategic      { date, kind, acquirer, target, value, note }
narrative/records     { date, recordDate, generatedAt, industryMetrics,
                        profiles, moats, synthesis, source }
```

`dimension` ∈ `{scale, growth, margins, …}`. `profiles`/`moats`/`synthesis`
are JSON-encoded; each `moats` entry is `{symbol, networkEffects,
switchingCosts, scaleEconomies, intangibles}` rated `Strong|Moderate|Weak`.

## Playbook

Single-page scroll, results-first.

1. **Competitive hero** — Free Text Card: the shape of the field — who leads on
   scale, who on growth, the headline read.
2. **Comparison table** — every company, the metric columns.
3. **Positioning chart** — a 2×2 or scatter on the two dominant factors.
4. **Competitor cards** — per company: the metrics plus the ADK qualitative
   profile (labelled AI analysis).
5. **Dimension ratings** — the rated comparison, actual values shown.
6. **Moat assessment** — the four-moat grid, ADK, labelled.
7. **Strategic activity** — M&A and strategic moves.
8. **Synthesis** — Free Text Card, ADK, labelled; bull/base/bear if an
   investment context.

## Template-specific rules

- A peer set, fixed at build; verify each member's sector via `company/detail`.
- All competitor metrics from the same fiscal period; flag exceptions.
- The deck is now a playbook; qualitative layers are ADK, labelled AI analysis.
- No fabricated market-size or operating-KPI numbers — note the gaps.
- Cadence: quant feed weekly; narrative after quant.

## Build

1. Confirm the peer set (and whether there is a target protagonist).
2. Verify each company's sector; shape-check the endpoints.
3. Write + deploy + release the quant feed, then the narrative feed.
4. Build the playbook HTML; write `README.md`; draft; screenshot; release.
