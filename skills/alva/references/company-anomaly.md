# Company Anomaly Intelligence

A public, read-only Platform Data surface for detecting unusual company price or
volume behavior and explaining a likely driver from aligned market, sector,
peer, and event evidence. Use it when a user asks whether a covered company is
moving abnormally, why an unusual move happened, whether the move is
sector-driven or company-specific, or what evidence supports Alva's attribution.

This is processed intelligence, not a raw quote or news feed. The anomaly
timeline is computed from market signals; the attribution is model-generated
analysis over supplied evidence. Keep those two layers distinct in the answer.

**Not general company research.** For valuation, fundamentals, ordinary price
checks, or news without an anomaly question, use Financial Analysis and Data
Skills. A quiet anomaly state does not mean the stock did not move or that no
news exists.

## Access

- **Host user is `mia`.** Public feeds live under
  `/alva/home/mia/feeds/<ticker-slug>-portfolio-watch-anomaly/v1` in production.
- Use absolute paths, never `~/`; the data is granted `special:user:*` read.
- Build `ticker-slug` by lowercasing the ticker and replacing each run of
  non-alphanumeric characters with `-`, then trimming leading/trailing `-`.
  Examples: `MU` -> `mu`, `BRK.B` -> `brk-b`.
- Coverage is not currently exposed through a directory feed. Try the exact feed
  path and report unavailable coverage when it returns `NOT_FOUND`; do not
  substitute another ticker or fabricate a feed.
- Synth-mount outputs are not discoverable with `alva fs readdir`. Use the
  documented paths below.
- This data is production-only. If an expected path returns `NOT_FOUND`, verify
  the current endpoint with `alva whoami` before declaring that coverage is
  absent.

Feed base:

```text
/alva/home/mia/feeds/<ticker-slug>-portfolio-watch-anomaly/v1
```

## Public Read Contract

| Output                   | Role                                                     | Read rule                                                           |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------- |
| `data/anomaly/timeline`  | Every anomaly-gate evaluation and its state              | Always start here                                                   |
| `data/analysis/decision` | Concise decision plus attribution context for heavy runs | Join by `runAtMs`                                                   |
| `data/audit/run_log`     | Computed anomaly and final attribution payloads          | Read only the named fields below; join by `runAtMs`                 |
| `data/event/items`       | Normalized source records used as supporting evidence    | Optional; filter by the aligned `runAtMs` and stable event identity |

Other outputs such as `portfolio/snapshot`, `portfolio/positions`,
`notify/message`, and persistence audit rows are producer internals, not the
Company Anomaly Platform Data contract.

## Query Workflow

### 1. Read the current anomaly state

```bash
alva fs read --path '/alva/home/mia/feeds/<ticker-slug>-portfolio-watch-anomaly/v1/data/anomaly/timeline/@last/1'
```

Use the row's `date` or `runAtMs` as the state timestamp. Interpret `tag` as a
state-machine value, not as a generic sentiment label:

| `tag`           | Meaning                                                                 | Follow-up                                                                          |
| --------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `not_triggered` | Current price/volume rules did not cross the anomaly gate               | Report the quiet state and metrics; do not claim there was no move or news         |
| `candidate`     | A continued anomaly did not produce a new attribution                   | Report as continued/no new attribution; do not reuse an old explanation as current |
| `no_material`   | New material was checked but did not qualify as novel enough to promote | Report the continued anomaly and failed novelty/materiality outcome                |
| `real`          | A publishable anomaly attribution was produced                          | Follow `attributionRunAtMs` into the aligned analysis and audit rows               |

`realReason` refines a `real` row:

- `first`: first qualifying anomaly in the current state sequence.
- `new_rule`: an additional price/volume rule crossed.
- `promoted`: new qualifying material promoted a continuing anomaly.

### 2. Find the latest meaningful attribution when needed

The latest timeline row is often quiet even though an earlier `real` row is
still the most recent explanation. If the user asks for the latest attributed
anomaly rather than only the current gate state, read a bounded timeline window
and select the newest `tag == "real"` row:

```bash
alva fs read --path '/alva/home/mia/feeds/<ticker-slug>-portfolio-watch-anomaly/v1/data/anomaly/timeline/@last/200'
```

State both timestamps when they differ: the current gate timestamp and the
selected attribution timestamp. If the initial window has no `real` row, page
backward from its oldest `runAtMs` until a `real` row is found or history is
exhausted:

```text
.../data/anomaly/timeline/@before/<oldest-runAtMs>/200
```

Repeat with the next window's oldest timestamp. This bounded pagination is part
of a latest-attribution lookup, not only an explicitly historical request; do
not imply that `@last/200` is the feed's full history.

### 3. Join the attribution run

Read bounded windows from both outputs and select rows whose `runAtMs` equals
the timeline row's non-zero `attributionRunAtMs`:

```bash
alva fs read --path '/alva/home/mia/feeds/<ticker-slug>-portfolio-watch-anomaly/v1/data/analysis/decision/@last/50'
alva fs read --path '/alva/home/mia/feeds/<ticker-slug>-portfolio-watch-anomaly/v1/data/audit/run_log/@last/50'
```

Do not blindly join `@last/1`: quiet timeline ticks can be newer than the last
heavy attribution run. If the target `runAtMs` is outside an initial output
window, page that output backward with `@before/<oldest-runAtMs>/<limit>` until
the target is found or the output is exhausted. Report the attribution as
incomplete only after confirming that an aligned row is absent; never combine
different runs.

Parse only these consumer fields:

- From `analysis/decision`: `reason`, `alertDecision`, `urgency`, `skipReason`,
  and `attributionContextJson`.
- From `audit/run_log`: `anomaliesJson` and `anomalyAttributionsJson`.

All `*Json` values above are JSON-encoded strings. Parse them before reading
nested fields. Inspect live keys because context varies by company; examples
include `sectorVsIdiosyncratic`, `peerMoves`, ETF flow, industry spot data,
analyst target posture, and insider or congressional activity.

### 4. Load supporting events only when useful

```bash
alva fs read --path '/alva/home/mia/feeds/<ticker-slug>-portfolio-watch-anomaly/v1/data/event/items/@last/200'
```

Filter event rows to the aligned attribution `runAtMs`, then match existing
supporting-event identities by `eventKey`, URL, or title. Do not add unrelated
rows merely because they mention the ticker. Preserve source, publication time,
and URL when present; an empty URL stays unavailable.

## Field Interpretation

### Timeline facts

| Field                                                            | Meaning                                              |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| `priceMovePct`                                                   | Move measured on the basis named by `priceMoveBasis` |
| `regularSessionMovePct`, `afterHoursMovePct`, `preMarketMovePct` | Session-specific components when available           |
| `totalMovePct`                                                   | Combined move carried by the anomaly check           |
| `priceZScore`, `volumeZScore`                                    | Standardized anomaly signals used by the gate        |
| `rulesTriggeredJson`                                             | All currently active anomaly rules                   |
| `newRulesJson`                                                   | Rules newly active in this state transition          |
| `newMaterialJson`                                                | New event identities considered for promotion        |
| `headline`                                                       | Short attribution headline for a `real` row          |

These are feed-computed facts. Describe the exact basis: a pre-market move
versus previous close is not interchangeable with a regular-session return.

### Attribution analysis

Within `anomaliesJson`, use the anomaly identity, symbol, trigger kinds, price
and volume packets, summary, and source notes. Within `anomalyAttributionsJson`,
use:

- `headline` and `summary` for the explanation.
- `driverSplit` for market, sector, and company-specific decomposition.
- `attributionStatus` and `confidence` for uncertainty.
- `supportingEvents` and `sourceLinks` for evidence.
- `generatedAtHkt` for attribution freshness.

Treat the attribution as Alva analysis, not proven causality. Evidence may show
that a driver fits the timing and direction without proving that it caused the
move.

## Answer Shape

For a company-anomaly question, always begin with:

1. **Current state**: ticker, latest `tag`, current-state timestamp, and whether
   the anomaly gate is quiet or active.
2. **What moved**: move basis, session components, z-scores, and triggered rules
   from the current timeline row.

For `not_triggered`, `candidate`, or `no_material`, stop there after stating the
no-new-attribution meaning unless the user also asks for the latest prior
attribution. Do not present an old driver as the explanation for the current
tick.

When a `real` attribution was selected, continue with:

3. **Attributed move, when different from the current tick**: selected `real`
   timestamp, move basis, session components, z-scores, and rules from that
   selected timeline row. Do not pair the older attribution with current quiet
   metrics. Omit this separate step when the current row is the selected `real`
   row because step 2 already describes it.
4. **Likely driver**: attribution headline/summary and market-sector-company
   decomposition, explicitly labeled as Alva analysis.
5. **Evidence**: the few supporting events that actually align to the run, with
   source and time.
6. **Confidence and limits**: attribution status, confidence, missing URLs or
   context, and both current-state and attribution timestamps when different.

Do not dump raw JSON, the full event corpus, or the producer's audit trail into
the answer. Summarize only the fields that support the user's question.

## Reliability Boundaries

1. **Live-read every answer.** Company moves, signals, events, and attribution
   state are time-sensitive; never answer from memory or a prior transcript.
2. **Separate fact from inference.** Timeline metrics are computed data;
   attribution narratives and driver splits are analytical inference.
3. **Align runs exactly.** `runAtMs == attributionRunAtMs` is the join contract.
   Never combine a current quiet tick with an older decision without labeling
   the older attribution timestamp.
4. **Avoid truncated audit fields.** `rawEventsJson`, `eventExpansionsJson`, and
   `searchExpansionTraceJson` may be size-capped and invalid JSON. They are not
   part of the public consumer contract.
5. **Context is company-specific.** Missing MU-style memory or semiconductor
   fields for another company is not a schema failure. Inspect the live object
   and use only context actually present.
6. **Read-only.** This source does not authorize writes to `mia`'s namespace and
   does not replace Feed Scope Isolation when building a new playbook or
   automation.
