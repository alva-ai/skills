# Morning Note Template

A daily pre-open morning-meeting note for a coverage universe — tight,
opinionated, actionable, readable in two minutes. Mirrors the
financial-services equity-research `morning-note` workflow; data re-sourced to
Alva data skills.

**Scope** — one coverage universe (a watchlist of symbols), one note per day,
generated pre-open. Single-name pre-earnings depth is the `earnings-preview`
template; the forward week-ahead calendar is `catalyst-weekly`.

Generic rules (design system, content legitimacy, README-as-file, naming, the
single-page results-first shell) come from the Alva skill and the
equity-research family shell — not repeated here. This doc is the
morning-note-specific substance.

## Data

All endpoints are Arrays data skills (`https://data-tools.prd.space.id`,
`Authorization: Bearer <ARRAYS_JWT>`). Run the `list`→`summary`→`endpoint`
discovery pipeline before coding.

| Need (from the original Step-1 scan) | Alva endpoint |
|---|---|
| Coverage companies reporting today / overnight | `stocks/earnings-calendar` |
| Earnings surprises (beat/miss vs estimate) | `stocks/earnings-calendar` reported rows; `stocks/company/income-statements` |
| Guidance changes | `stocks/estimates-guidance` `type=guidance` |
| Analyst rating changes / price-target moves | `stocks/ratings` (PIT ratings); `stocks/company/price-target-news` |
| M&A announcements touching coverage | `stocks/mergers-acquisitions` |
| Management changes, product launches, regulatory news | `stocks/market-news` (symbol-filtered) |
| Overnight index moves, VIX | `macro/index/real-time`, `macro/index/historical` (`^SPX`, `^IXIC`, `^DJI`, VIX) |
| Pre-market move per coverage name | `stocks/*` spot price / OHLCV |
| Sector ETF performance | `stocks/etf/*` holdings/info + spot price |
| Commodity / FX moves | `macro/commodity/real-time` (`GCUSD`, `CLUSD`), `macro/forex/real-time` |
| Economic data releases | `macro/economic-indicators`, `macro/treasury-rates` |

**Coverage gap** — Alva has no investor-conference / non-deal-roadshow
calendar. "Key Events Today" carries earnings calls and economic releases only;
do not invent conference entries.

## Feeds

Two feeds (equity-research family pattern). The narrative feed is deployed to
run *after* the quant feed.

**Quant feed `<coverage>-morning-note`** — runs pre-open daily, scans the
coverage universe and market context:

| Output | Pattern | Contents |
|---|---|---|
| `coverage/movers` | tabular | per name: prior close, overnight/pre-market % move |
| `coverage/earnings` | tabular | coverage names reporting today, or reported overnight with beat/miss |
| `coverage/ratings` | event log | rating changes and price-target moves across coverage, last 24h |
| `events/today` | tabular | earnings calls (coverage) + economic releases scheduled today |
| `events/ma` | event log | M&A touching coverage names, last 24h |
| `market/context` | snapshot | index overnight, VIX, gold, oil, FX, 10Y treasury |

**Narrative feed `<coverage>-morning-note-narrative`** (ADK) — the opinionated
layer. Reads the quant outputs + `market-news` → one `narrative/records` row:
`topCall`, `developments[]`, `eventsToday`, `earningsTakes[]`, `tradeIdeas[]`.

## Methodology

The original morning-note workflow, preserved. The template's job is to encode
this judgment — the data layer only feeds it.

**Overnight scan.** Surface, across the coverage universe: (a) coverage names
that reported overnight or report pre-market, with beat/miss; (b) guidance
changes; (c) M&A; (d) rating and price-target changes; (e) macro/policy moves
affecting the sector. For market context: overnight index moves, sector ETF,
commodity and FX, today's economic releases.

**The Top Call.** Lead with the single most important thing — never bury the
headline. 2-3 sentences on the development and why it matters, plus the stock
impact.

**Actionable vs noise.** Earnings, M&A, and guidance changes are actionable and
get a line. Minor analyst notes and non-events are noise and get none. Padding
a note with noise destroys its two-minute readability.

**Be opinionated.** Every development carries a *take*, not just a summary — a
morning note that only restates news without a view is useless.

**Earnings quick-takes.** For each coverage name that reported, a
consensus-vs-actual table — Revenue, EPS, one key metric, Guidance — followed
by a 2-3 sentence "Our Take" (good or bad for the stock; does it change the
thesis) and an "Action" (Maintain / Upgrade / Downgrade).

**Trade ideas.** Optional. Long or Short, a 1-2 sentence thesis, the catalyst,
and the risk — what would make the idea wrong.

**"No news" is a valid note.** On a quiet day, say "nothing material overnight,
maintaining positioning" — do not manufacture developments.

**Takes and ratings are AI analysis, not desk research.** The original assumes
a research desk's proprietary rating and price target. Alva has no proprietary
desk, so this is the one place the data swap forces a content change: the data
layer surfaces **consensus** rating and price-target changes (real data); the
opinion layer — Top Call, Our Take, Action, Trade Ideas — is ADK-generated and
**labelled AI-generated analysis**, kept visually distinct from the data
widgets. It is reasoning over feed data, never a data source.

## Data contract (frozen field names)

```
coverage/movers   { date, symbol, name, prevClose, overnightPct }
coverage/earnings { date, symbol, name, when, epsEstimate, epsActual,
                    epsSurprisePct, revEstimate, revActual, revSurprisePct }
coverage/ratings  { date, symbol, name, kind, fromValue, toValue, source }
events/today      { date, time, symbol, kind, label }
events/ma         { date, acquirer, target, value, status }
market/context    { date, spx, ixic, dji, vix, gold, oil, dxy, ust10y }
narrative/records { date, recordDate, generatedAt, topCall, developments,
                    eventsToday, earningsTakes, tradeIdeas, source }
```

`when` ∈ `{amc, bmo}`. `kind` on `coverage/ratings` ∈ `{rating, priceTarget}`.
`kind` on `events/today` ∈ `{earnings, econ}`. `developments`, `earningsTakes`,
`tradeIdeas` are JSON-encoded arrays. `source` = `"adk"` for the narrative row.

## Playbook

Single-page scroll, tight — a two-minute read. Order:

1. **Top Call** — Free Text Card hero, ADK; the headline + stock impact. Header
   labelled AI-generated analysis.
2. **Market Context** — metric strip: index overnight, VIX, gold, oil, 10Y.
3. **Overnight Developments** — per-name list: name, overnight % move, one-line
   development + take.
4. **Earnings Quick-Takes** — one table per reporting coverage name:
   consensus vs actual (Revenue / EPS / key metric / Guidance), then Our Take +
   Action.
5. **Key Events Today** — time-ordered list: earnings calls + economic releases.
6. **Trade Ideas** — cards (Long/Short, thesis, catalyst, risk), ADK, labelled.
   Omit the section entirely when there are none.
7. **References** — data sources + refresh cadence.

On a quiet day, sections 3-6 collapse to the single "nothing material
overnight" line from the methodology.

## Template-specific rules

- Coverage universe is a fixed watchlist of symbols, set at build time.
- Cadence: quant feed daily pre-open (e.g. 06:00 ET), narrative feed ~30 min
  after. State the real cadence in the README.
- Opinion surfaces (Top Call, takes, Action, Trade Ideas) are ADK, labelled AI
  analysis; data surfaces (moves, beat/miss, consensus rating/PT changes) are
  feed outputs.
- A pre-open push notification carrying the `topCall` line is a natural fit —
  see the Alva skill post-release push flow.

## Build

1. Confirm the coverage universe (the watchlist of symbols) with the user.
2. Shape-check each endpoint with a small `alva run` snippet against the Data
   table.
3. Write + test + grant + deploy + release the quant feed.
4. Write + deploy the narrative feed to run after the quant feed.
5. Build the playbook HTML (§Playbook), fetching feed outputs at runtime.
6. Write `README.md`, draft, screenshot-verify, release the playbook.
