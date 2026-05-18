# Idea Generation Template

Systematic stock screening and idea sourcing — quantitative screens (value /
growth / quality / short / special-situation) plus thematic sweeps, surfacing a
ranked shortlist of long and short candidates. Mirrors the financial-services
equity-research `idea-generation` workflow; data re-sourced to Alva data skills.

**Scope** — one screen configuration per playbook (a style + universe +
direction). The output is a shortlist of *candidates*, never conclusions.

Generic rules (design system, content legitimacy, README-as-file, naming, the
single-page results-first shell) come from the Alva skill and the
equity-research family shell — not repeated here.

## Data

Arrays data skills (`https://data-tools.prd.space.id`,
`Authorization: Bearer <ARRAYS_JWT>`). Run `list`→`summary`→`endpoint` first.

| Need | Alva endpoint + metrics |
|---|---|
| Universe by sector / exchange / country | `stocks/screener/basic-info/{sub}` |
| Value / growth / quality / short factor filters | `stocks/screener/financial-metrics` — `PE_RATIO`, `EV_EBITDA_RATIO`, `PS_RATIO`, `PB_RATIO`, `DIVIDEND_YIELD`, `ROE_TTM`, `ROIC_TTM`, `ROA_TTM`, `REVENUE_GROWTH_YOY_TTM`, `EPS_GROWTH_YOY_TTM`, `FCF_GROWTH_YOY_TTM`, `GROSS/OPERATING/NET/FCF_MARGIN_MRQ`, `DEBT_TO_EQUITY_MRQ`, `CURRENT_RATIO_MRQ` |
| Price-action filters | `stocks/screener/technical-metrics` — `PRICE_CHANGE_*`, `RSI_14`, `BETA`, `VOLATILITY_*` |
| Special-situation events | `stocks/screener/events` — `IPO Date`, `Split Date`, `Earnings Date` |
| Per-idea metric table | `stocks/financial-metrics`, `stocks/market-metrics` |
| Crowding check | `equity-ownership-and-flow` (institutional, insider); `stocks/estimates-guidance` `estimate_count` (coverage breadth) |
| Insider buying/selling signal | `equity-ownership-and-flow` (insider transactions) |

**Coverage gaps** — Alva has no short-interest data, no accounting-red-flag
signal (auditor change / restatement), and no SaaS net-retention metric. Screen
criteria that need these are dropped or approximated; state the gap in the
README. Do not fabricate a substitute.

## Feeds

Two feeds (equity-research family pattern); the narrative feed runs after the
quant feed.

**Quant feed `<screen>-idea-generation`:**

| Output | Pattern | Contents |
|---|---|---|
| `screen/results` | tabular | ranked shortlist with the metric table per name |
| `screen/criteria` | snapshot | the filters applied — for documentation |
| `enrich/crowding` | tabular | per name: institutional ownership concentration, insider activity, analyst coverage count |

**Narrative feed `<screen>-idea-generation-narrative`** (ADK): per shortlisted
name — a one-line thesis, why it is mispriced / what the market is missing, the
catalyst, and the key risks. Labelled AI analysis (these are hypotheses, not
data).

## Methodology

The original idea-generation workflow, preserved.

**Screens surface candidates, not conclusions.** Every screen output is a
starting point for fundamental work — never a buy/sell call. The playbook
frames the shortlist as candidates.

**The five screens** — translate each style into concrete `screener` filters:

- **Value** — `PE_RATIO` below sector median, low `EV_EBITDA_RATIO`, `PB_RATIO`
  < 1.5, `DIVIDEND_YIELD` above market; cross-check insider buying.
- **Growth** — `REVENUE_GROWTH_YOY_TTM` > 15%, `EPS_GROWTH_YOY_TTM` > 20%,
  `ROIC_TTM` > 15%, expanding margins.
- **Quality** — `ROE_TTM` > 15%, low `DEBT_TO_EQUITY_MRQ`, stable/expanding
  margins, consistent multi-year revenue growth.
- **Short** — declining revenue / decelerating growth, margin compression,
  valuation premium to peers, insider selling.
- **Special situation** — recent IPOs (`screener/events` `IPO Date`); spin-offs
  / restructuring / activist involvement have no direct Alva data — approximate
  via events + news and note the gap.

**Sector-relative, not absolute.** Where the original criterion is relative
("PE below sector median"), compute the metric against the sector cohort, not a
fixed cut-off.

**Intersections beat single factors.** The best ideas sit at intersections — a
quality company at a value price because of a temporary headwind. Support
multi-factor screens.

**Crowding check.** Before presenting an idea, check ownership concentration,
insider activity, and analyst coverage breadth. Flag crowded longs and
heavily-owned names.

**Contrarian needs a catalyst.** A cheap stock with no catalyst is not an idea
— each idea must name a catalyst.

**Short ideas need higher conviction.** Flag short candidates as higher-bar —
timing is harder and the risk is asymmetric.

**Thematic sweep.** For a theme, the ADK maps the value chain — direct vs
indirect beneficiaries, pure-play vs diversified, priced-in vs
under-appreciated, second-order names. Verify every surfaced ticker's sector
with `company/detail` — no agent-knowledge ticker-to-sector mapping.

## Data contract (frozen field names)

```
screen/results  { date, rank, symbol, name, direction, marketCap, evEbitda,
                  peRatio, revGrowth, ebitdaMargin, fcfYield, roe }
screen/criteria { date, screenStyle, direction, universe, filters }
enrich/crowding { date, symbol, instOwnershipPct, insiderNet90d, analystCount }
narrative/records { date, recordDate, generatedAt, ideas, source }
```

`direction` ∈ `{long, short}`. `screenStyle` ∈
`{value, growth, quality, short, special-situation, thematic}`. `filters` and
`ideas` are JSON-encoded arrays.

## Playbook

Single-page scroll, results-first.

1. **Screen hero** — the screen style, direction, universe, and how many names
   surfaced.
2. **Shortlist table** — ranked, the metric columns against sector/peer median;
   crowding flags inline.
3. **Idea cards** — per name: one-line thesis + 3-5 bullets (why mispriced /
   what the market is missing) + catalyst + key risks. ADK, labelled AI
   analysis.
4. **Screen criteria** — the filters applied, documented.
5. **References** — data sources + cadence.

## Template-specific rules

- One screen configuration per playbook.
- Shortlist counts and metric values are feed data; the per-idea thesis,
  catalyst, and risks are ADK, labelled AI analysis.
- Verify every thematic-sweep ticker's sector via `company/detail` — no
  agent-knowledge mapping.
- Note dropped screen criteria where Alva lacks the data (short interest,
  accounting red flags, net retention).
- Cadence: weekly or monthly — screens are not intraday.

## Build

1. Capture the screen config: direction, market cap, sector, style, geography,
   theme.
2. Translate the style into concrete `screener/*` metric filters (§Data).
3. Shape-check the screener endpoints with a small `alva run` snippet.
4. Write + test + grant + deploy + release the quant feed, then the narrative
   feed (deployed after the quant feed).
5. Build the playbook HTML; write `README.md`; draft; screenshot-verify;
   release.
