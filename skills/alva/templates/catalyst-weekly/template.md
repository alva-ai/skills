# Catalyst Weekly Preview Template

A forward calendar of upcoming catalysts across a coverage universe — earnings,
corporate events, and macro releases — with a week-ahead preview that flags
what matters and why. Mirrors the financial-services equity-research
`catalyst-calendar` workflow (its Step-4 Weekly Preview); data re-sourced to
Alva data skills.

**Scope** — one coverage universe, a rolling forward horizon (default 2 weeks).
Single-name pre-earnings depth is the `earnings-preview` template; the daily
overnight note is `morning-note`.

Generic rules (design system, content legitimacy, README-as-file, naming, the
single-page results-first shell) come from the Alva skill and the
equity-research family shell — not repeated here.

## Data

Arrays data skills (`https://data-tools.prd.space.id`,
`Authorization: Bearer <ARRAYS_JWT>`). Run `list`→`summary`→`endpoint` first.

| Catalyst type | Alva endpoint |
|---|---|
| Earnings dates + time | `stocks/earnings-calendar` |
| Dividends, splits | `stocks/dividends`, `stocks/splits` |
| IPOs | `stocks/ipo-calendar`, `stocks/ipo-confirmed-calendar` |
| M&A milestones | `stocks/mergers-acquisitions` |
| Earnings consensus (for the preview) | `stocks/estimates-guidance` |
| Macro releases | `macro/economic-indicators`, `macro/treasury-rates` |

**Coverage gaps — significant for this template.** Alva has no structured
calendar for investor days / capital-markets days, product launches, FDA or
other regulatory decisions, conferences and trade shows, debt maturities, or
lockup expirations. The calendar reliably covers **earnings, dividends, splits,
IPOs, M&A, and macro economic releases**. Do not invent the missing event
types — state the covered scope in the README. A specific known event (e.g. an
FDA PDUFA date) can be added via BYOD only if the user supplies a source.

## Feeds

Two feeds (equity-research family pattern); the narrative feed runs after the
quant feed.

**Quant feed `<coverage>-catalyst-weekly`:**

| Output | Pattern | Contents |
|---|---|---|
| `calendar/events` | tabular | all upcoming catalysts over the horizon |
| `calendar/earnings` | tabular | upcoming earnings with consensus EPS/revenue attached |
| `calendar/macro` | tabular | upcoming macro releases |

**Narrative feed `<coverage>-catalyst-weekly-narrative`** (ADK): the weekly
preview — per key event, why it matters; a next-week heads-up; position
implications; an impact rating. Labelled AI analysis.

## Methodology

The original catalyst-calendar workflow (Step-4 Weekly Preview), preserved.

**Gather by type.** The original's four buckets — earnings & financial events,
corporate events, industry events, macro events. Alva covers the earnings/
financial and macro buckets structurally; the corporate/industry buckets are
the coverage gap above.

**The weekly preview — the core artifact.** "This week's key events",
date-ordered, each carrying: the company; for an earnings event, the consensus
and the key metric to watch; for a macro release, the expectation. Then a
"next week" heads-up and "position implications".

**Impact rating.** Each event tagged High / Medium / Low — an ADK judgment,
labelled AI analysis. Binary events (an earnings print, an M&A close) outrank
routine ones (a small dividend).

**Earnings dates shift.** Treat dates as provisional — the quant feed re-pulls
daily so a moved date self-corrects; `earnings-calendar` `status` flags
confirmed vs estimated dates. Surface unconfirmed dates as such.

**Recurring catalysts auto-populate.** Monthly/quarterly events — dividends,
macro releases — come from the feeds each run; no manual entry.

## Data contract (frozen field names)

```
calendar/events   { date, eventDate, type, symbol, name, label }
calendar/earnings { date, eventDate, symbol, name, when, epsConsensus,
                    revConsensus }
calendar/macro    { date, eventDate, indicator, label }
narrative/records { date, recordDate, generatedAt, thisWeek, nextWeek,
                    positionImplications, impactRatings, source }
```

`type` ∈ `{earnings, dividend, split, ipo, ma, macro}`. `when` ∈
`{amc, bmo}`. `thisWeek`, `nextWeek`, `positionImplications`, `impactRatings`
are JSON-encoded arrays. `source` = `"adk"` for the narrative row.

## Playbook

Single-page scroll, results-first.

1. **This-week hero** — count of events ahead + the single headline event.
2. **This Week's Key Events** — date-ordered list; earnings rows carry the
   consensus.
3. **Calendar view** — full table over the horizon: date / event / company /
   type / impact.
4. **Next Week Preview** — a heads-up on the following week.
5. **Position Implications** — ADK, labelled AI analysis.
6. **References** — data sources, the covered event scope, and refresh cadence.

## Template-specific rules

- One coverage universe; default horizon 2 weeks, configurable.
- Event dates, types, and consensus values are feed data; impact ratings and
  the why-it-matters / position-implications copy are ADK, labelled AI analysis.
- State the covered event types and the gaps in the README — never imply
  conferences, product launches, or FDA dates are tracked.
- Cadence: quant feed daily (dates shift); narrative feed weekly (e.g. Monday
  pre-open) for the preview.

## Build

1. Confirm the coverage universe, the horizon, and whether macro events are
   included.
2. Shape-check the calendar endpoints with a small `alva run` snippet.
3. Write + test + grant + deploy + release the quant feed, then the narrative
   feed (deployed after the quant feed).
4. Build the playbook HTML; write `README.md`; draft; screenshot-verify;
   release.
