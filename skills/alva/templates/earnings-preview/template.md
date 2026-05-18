# Earnings Preview Template

Single-company pre-earnings briefing: when the company reports, what the street
expects, its beat/miss record, where estimates are drifting, and what to watch
on the print.

**Scope** — one company, one upcoming report. Multi-name week-ahead coverage is
the `catalyst-weekly` template; do not blend.

Generic rules are **not repeated here** — design system
([design-system.md](../../references/design-system.md),
[design-widgets.md](../../references/design-widgets.md)), content legitimacy,
README-as-attached-file, title/naming, and the single-page results-first shell
all come from the Alva skill and the equity-research family shell. This doc is
only the earnings-preview-specific substance: data wiring, feed design, and the
analytical methodology.

## Data

All endpoints are Arrays data skills (`https://data-tools.prd.space.id`,
`Authorization: Bearer <ARRAYS_JWT>`). Run the `list`→`summary`→`endpoint`
discovery pipeline before coding.

| Need | Endpoint + params | Fields used |
|---|---|---|
| Next report date/time | `earnings-calendar` · `symbol`, `start_time`, `end_time` | `date`, `time`, `status`, `eps_estimated`, `revenue_estimated`, `fiscal_date_ending` |
| Upcoming-quarter consensus | `estimates-guidance` · `type=estimate`, `period_type=quarterly`, `metrics=EPS,SALES` | `fiscal_period`, `fiscal_year`, `estimate_date`, `mean`, `high`, `low`, `standard_deviation`, `estimate_count`, `up`, `down` |
| Company guidance | `estimates-guidance` · `type=guidance` | `guidance_low/mid/high`, `mean_before`, `mean_surprise_amt_ratio` |
| Deep beat/miss history | `company/income-statements` · `period_type=quarter`, `time_type=CALENDAR_END_DATE` | `calendar_end_date`, `fiscal_year`, `period`, `eps`, `revenue`, `gross_profit_ratio` |
| Analyst price target | `company/price-target-consensus` · `symbol` | `target_high/low/consensus/median` |
| Company identity | `company/detail` · `symbol` | `name`, `sector`, `industry` |

**Gotchas — live-verified, the docs are wrong on these:**

- `estimates-guidance` returns `fiscal_period` as integer `1`–`4` (not `"Q1"`)
  and `periodicity` as `"QTR"`. Normalize yourself.
- `earnings-calendar` returns `eps`/`revenue`/`*_estimated` as **strings**;
  `revenue_estimated` carries float noise (`"…0.00000512"`). Parse and round.
- `earnings-calendar` upcoming rows have no `eps`/`revenue`; it only keeps ~5
  recent reported quarters — use `income-statements` for deeper history.
- `estimates-guidance` returns **many rows per fiscal period**, one per
  `estimate_date` — see consensus selection below.

## Feeds

Two feeds (equity-research family pattern): a **quant feed** for deterministic
data and a **narrative feed** (ADK) for reasoning. The narrative feed is
deployed to run *after* the quant feed so it can read the quant snapshot.

**Quant feed `<slug>-earnings-preview`:**

| Output | Pattern | Contents |
|---|---|---|
| `schedule/next` | snapshot | report `date`, `time`, fiscal period, `daysUntil` |
| `consensus/upcoming` | snapshot | EPS + SALES `mean/high/low/count/up/down` for the upcoming quarter |
| `guidance/latest` | snapshot | guidance low/mid/high, `meanBefore`, `surpriseRatio` |
| `history/beats` | event log | one row per reported quarter (last 8) |
| `revisions/eps` | tabular | consensus EPS `mean` per `estimate_date` for the upcoming quarter |
| `target/consensus` | snapshot | PT high/low/consensus/median |

**Narrative feed `<slug>-earnings-preview-narrative`:** ADK agent reads the
quant outputs + the latest `earnings-transcript` + recent news → one
`narrative/records` row: `lastCall` (themes management stressed last call) and
`watchItems` (3-5 checkable items for this print).

## Methodology

The judgment calls — this is what the template exists to encode.

**Consensus selection (critical).** `estimates-guidance` gives one row per
`estimate_date`; the newest row is often a stale 1-analyst partial. For the
headline consensus, filter to the upcoming fiscal period and pick the row with
the **highest `estimate_count`**. `mean` is the headline; `high`/`low` the
range; `standard_deviation` the dispersion — surface a wide spread, it means
the print is genuinely uncertain.

**Beat/miss surprise.** Per reported quarter,
`epsSurprisePct = (epsActual − epsEstimate) / |epsEstimate| × 100`. Use the
**pre-report** consensus, never a later revision: a reported `earnings-calendar`
row's `eps_estimated` is the at-report estimate; for quarters older than the
calendar window, take the `estimates-guidance` row dated just before
`fiscal_end_date`. Beat rate = share of the last 8 quarters with
`epsSurprisePct > 0` — this is the hero's track-record number. Revenue surprise
is computed the same way.

**Revision trend.** Into a print, the *direction* consensus has moved is the
signal. Plot `mean` for the upcoming quarter across `estimate_date` over ~90
days. `up`/`down` are the counts of analysts who raised/cut; net-positive with
a rising mean = upward revision momentum (and vice versa). State the net count.

**Guidance vs consensus.** `type=guidance` gives the company's own guidance for
the quarter being reported, with `mean_before` (street consensus when guidance
was issued) and `mean_surprise_amt_ratio`. Frame the *current* consensus against
the company's guidance midpoint: consensus above the midpoint = the street
expects a beat of guidance; below = the bar may be set conservatively.

**Price target.** `target_consensus` vs the latest close = implied upside;
the `high − low` spread = degree of analyst disagreement.

**Watch items.** Each ADK `watchItems` entry must be specific and checkable on
the print — a segment revenue line, a margin number, the next-quarter guide, a
named product ramp. Reject vague items ("execution", "macro headwinds").

## Data contract (frozen field names)

```
schedule/next      { date, time, fiscalPeriod, fiscalYear, daysUntil }
consensus/upcoming { date, epsMean, epsHigh, epsLow, epsCount, epsUp, epsDown,
                     salesMean, salesHigh, salesLow, salesCount }
guidance/latest    { date, metric, guidanceLow, guidanceMid, guidanceHigh,
                     meanBefore, surpriseRatio }
history/beats      { date, period, epsEstimate, epsActual, epsSurprisePct,
                     revEstimate, revActual, revSurprisePct, grossMargin }
revisions/eps      { date, estimateDate, epsMean, up, down }
target/consensus   { date, targetHigh, targetLow, targetConsensus, targetMedian }
narrative/records  { date, recordDate, generatedAt, lastCall, watchItems, source }
```

`time` ∈ `{amc, bmo}`. `period` normalized `Q1`–`Q4`. `watchItems` is a
JSON-encoded string array. `source` = `"adk"` for the narrative record.

## Playbook

Single-page scroll, results-first. Hero + four cards in the first fold.

1. **Verdict hero** — Free Text Card, one ≤80-word paragraph: report date +
   `amc`/`bmo` + days away; consensus EPS and revenue; beat record (N of last
   8). Numbers inline, `.pos`/`.neg`.
2. **Four metric cards** — Report date · Consensus EPS · Consensus revenue ·
   EPS beat rate (`beat N of 8` footer).
3. **Beat/miss history** — Chart Card, paired estimate-vs-actual EPS bars per
   quarter, newest right, surprise % in tooltip.
4. **Estimate revision trend** — Chart Card, consensus EPS line over estimate
   dates; subtitle = net up/down analyst count.
5. **Guidance vs consensus** — Chart Card/metric strip, current consensus vs
   guidance midpoint, surprise ratio signed.
6. **Price target** — Chart Card, low/consensus/median/high vs last close.
7. **What to watch** — Free Text Card, ADK `lastCall` + `watchItems`; header
   labelled AI-generated analysis, kept visually distinct from data widgets.
8. **References** — Free Text Card, data sources + refresh cadence.

## Template-specific rules

- One company per playbook; it must have an upcoming earnings date (verify with
  `earnings-calendar` before building — if the next report is >8 weeks out,
  warn the user the preview will be thin).
- Cadence: quant feed daily, narrative feed daily ~30 min after — estimates and
  the calendar move daily into a print.
- The "What to watch" block is labelled AI analysis; no values presented as
  sourced data inside it.
- A "N days until [Company] reports" push notification is a natural fit — see
  the Alva skill post-release push flow.

## Build

1. Confirm the company; verify the upcoming earnings date.
2. Shape-check each endpoint with a small `alva run` snippet against the Data
   table above.
3. Write + test + grant + deploy + release the quant feed.
4. Write + deploy the narrative feed to run after the quant feed.
5. Build the playbook HTML (§Playbook), fetching feed outputs at runtime.
6. Write `README.md`, draft, screenshot-verify, release the playbook.
