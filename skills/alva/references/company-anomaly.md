# Company Anomaly Intelligence

A public, read-only Platform Data surface for analyzing unusual company price or
volume behavior and Alva's evidence-backed explanation of the move. Use it for
questions such as:

- Is a covered company in an anomaly right now?
- If so, what is Alva's confirmed explanation (driver split, evidence,
  confidence)?
- What price or volume signal triggered, and how large is the move?

This is processed intelligence, not a raw quote or news feed. Price and volume
signals are computed data; the driver explanation is model-generated analysis
over supplied evidence. Keep those layers distinct in the answer.

**Not a standalone general company-research source.** For broad analysis of a
covered company, use this reference to add its current anomaly state, then use
Financial Analysis and Data Skills for prices, valuation, fundamentals, and
ordinary news. A quiet anomaly state does not mean the stock did not move or
that no news exists.

## Contents

- [Core Model: Run, Episode, Attribution](#core-model-run-episode-attribution)
- [Source And Access](#source-and-access)
- [Consumer Contract: Is A Ticker In An Anomaly?](#consumer-contract-is-a-ticker-in-an-anomaly)
- [Timeline Fields](#timeline-fields)
- [Attribution Fields](#attribution-fields)
- [Internal Surfaces (Not The Contract)](#internal-surfaces-not-the-contract)
- [Reliability Boundaries](#reliability-boundaries)

## Core Model: Run, Episode, Attribution

Three concepts carry the whole feed. Understand them before reading fields.

- **Run** is each check. **Episode** is the identity of one wave of anomaly.
  **Attribution** is the explanation in that wave actually worth showing a user.

```text
Ticker
  -> many Runs
  -> many Anomaly Episodes
       -> many Runs
       -> zero or many Attributions
```

### Run

One source-feed execution. It answers: **"this check — what state did it see?"**
Every run writes exactly one `anomaly/timeline` row. The timeline is a state
log, not a user-facing explanation.

Typical timeline fields: `runId`, `runAtMs`, `tag`, `attributionClassKey`,
`isActiveAnomaly`, `anomalyEpisodeId`, `episodeFirstRunId`, `priceMovePct`,
`priceZScore`, `volumeZScore`, `newRulesJson`, `newMaterialJson`.

A run's `tag` pairs with an `attributionClassKey` that classifies the run for
episode purposes:

| `tag`                  | `attributionClassKey`                       | Meaning                                                                    |
| ---------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `not_triggered`        | `not_triggered`                             | Signals did not cross an anomaly rule. Quiet — not a claim price was flat. |
| `insufficient_history` | `insufficient_history`                      | Not enough history to evaluate the signal.                                 |
| `real`                 | `new_anomaly` / `continued_new_attribution` | A confirmed, publishable attribution exists for this run.                  |
| `candidate`            | `continued_no_new_attribution`              | Anomaly continued, but this run produced no new confirmed attribution.     |
| `no_material`          | `continued_no_info`                         | Possible new material was checked but did not qualify as novel/material.   |

### Anomaly Episode

A continuous stretch of the _same_ anomaly. It answers: **"are these active runs
one anomaly, or different ones?"** An episode is not a separate file — it is the
**join key between timeline and attribution**, carried on both as
`anomalyEpisodeId` (with `episodeFirstRunId`).

Current episode boundaries, keyed by the run's `attributionClassKey`:

| `attributionClassKey`          | Episode effect                                                                                   | Attribution written to |
| ------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------- |
| `new_anomaly`                  | Open a new `anomalyEpisodeId` — prior run inactive→active, or a new anomaly rule fires while already active | `finding/attribution`  |
| `continued_new_attribution`    | Continue the current episode with a newly published driver                                       | `finding/attribution`  |
| `continued_no_new_attribution` | Continue the current episode; new material was checked and the LLM ran, but it did not pass promotion | `finding/candidate`    |
| `continued_no_info`            | Continue the current episode; no new material, or new info verified as not actually new           | —                      |
| `not_triggered`                | No anomaly rule; close the episode (also `insufficient_history` / stale / no current data)        | —                      |

### Attribution

One confirmed, user-facing explanation. It answers: **"in this anomaly, is there
a real driver worth showing or pushing?"**

- Only `finding/attribution` counts as attribution.
- `finding/candidate` is **not** shown to users and **not** pushed — never read
  it for this contract.
- An episode can have **0, 1, or many** attributions. Many means the anomaly is
  still running and a new confirmed driver appeared.

Attribution rows carry: `runId`, `runAtMs`, `anomalyEpisodeId`,
`episodeFirstRunId`, `headline`, `summary`, `drivers` (market / sector /
asset-specific split), and `supportingEvents`. See
[Attribution Fields](#attribution-fields).

## Source And Access

Use the current Alva CLI filesystem commands to read this source; run
`alva fs --help` before use. This reference owns the data contract and field
semantics, not CLI syntax or time-series suffix behavior.

- **Host user:** `mia`.
- **Feed base:**
  `/alva/home/mia/feeds/<ticker-slug>-portfolio-watch-anomaly/v1`.
- **Ticker slug:** lowercase the ticker, replace each run of non-alphanumeric
  characters with `-`, and trim leading/trailing `-` (`MU` -> `mu`, `BRK.B` ->
  `brk-b`, `AEHR` -> `aehr`).
- **Environment:** production. Verify the current endpoint before treating
  `NOT_FOUND` as missing company coverage.
- **Permissions:** public read through `special:user:*`; never write to this
  namespace.
- **Discovery:** there is no public company directory yet, and synth outputs are
  not enumerable through `readdir`. Test the exact feed path and report
  unavailable coverage instead of inventing a feed.

The two consumer-contract partitions are:

```text
<feed-base>/data/anomaly/timeline        # run state log
<feed-base>/data/finding/attribution     # confirmed explanations
```

## Consumer Contract: Is A Ticker In An Anomaly?

The contract is: **the latest timeline row says the ticker is in an active
anomaly, plus the latest confirmed `finding/attribution` in that same
`anomalyEpisodeId`.** `shouldShowAttribution` is _not_ the contract — it is
compatibility metadata; ignore it for this decision.

Logic for ticker `TICKER`:

1. Read the latest timeline row: `<feed-base>/data/anomaly/timeline/@last/1`.
2. Take `runAtMs` as the latest run time and `anomalyEpisodeId` /
   `episodeFirstRunId` as the current episode identity.
3. **Determine active anomaly:** `isActiveAnomaly === "true"`. The producer sets
   this flag exactly when `tag` is `real`, `candidate`, or `no_material`, so read
   the flag directly rather than re-deriving it from `tag`.
4. **If not active:** return `inAnomaly: false`, `latestRealAttribution: null`.
5. **If active:** read confirmed attributions:
   `<feed-base>/data/finding/attribution/@last/20`. Do **not** read
   `finding/candidate`.
6. Select the latest attribution row where
   `attribution.anomalyEpisodeId === timeline.anomalyEpisodeId`.
7. Return that attribution (or `null` if the active episode has no confirmed
   attribution yet).

### Return Shape

```json
{
  "symbol": "AEHR",
  "inAnomaly": true,
  "latestRunAtMs": 1784117223607,
  "anomalyEpisodeId": "AEHR:episode:AEHR:1784102823773",
  "episodeFirstRunId": "AEHR:1784102823773",
  "latestRealAttribution": {
    "runAtMs": 1784102823773,
    "headline": "...",
    "summary": "...",
    "confidence": "high",
    "attributionStatus": "confirmed",
    "driverMarket": "...",
    "driverSector": "...",
    "driverAssetSpecific": "...",
    "supportingEventsJson": "...",
    "sourceLinksJson": "..."
  }
}
```

Active but no confirmed attribution yet for the current episode:

```json
{
  "symbol": "XYZ",
  "inAnomaly": true,
  "latestRunAtMs": 123,
  "anomalyEpisodeId": "...",
  "latestRealAttribution": null
}
```

The current timeline row can be quiet and newer than the latest `real`
attribution. For `not_triggered`, `candidate`, or `no_material`, do not attach
an older driver to the current tick unless the user separately asks for the
latest prior attribution. When you do surface a prior attribution, report both
timestamps and never pair an old driver with current metrics.

## Timeline Fields

`anomaly/timeline` — one row per run, the entry point for current state and
history.

| Field                 | Meaning                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `runId`               | Run identity                                                               |
| `runAtMs`             | Run (gate-evaluation) timestamp                                            |
| `symbol`              | Covered company ticker                                                     |
| `date`                | Time-series record timestamp                                               |
| `tag`                 | Run state — see [Run](#run)                                                |
| `isActiveAnomaly`     | String boolean; the preferred active-anomaly signal                        |
| `anomalyEpisodeId`    | Episode identity — join key to attribution                                 |
| `episodeFirstRunId`   | First run of the current episode                                           |
| `attributionClassKey` | Attribution class/key for the run                                          |
| `priceMovePct`        | Move on the basis named by `priceMoveBasis`                                |
| `priceMoveBasis`      | Comparison basis (e.g. pre-market vs previous close, after-hours vs close) |
| `priceZScore`         | Standardized price signal                                                  |
| `volumeZScore`        | Standardized volume signal                                                 |
| `newRulesJson`        | JSON array of rules newly active in this transition                        |
| `newMaterialJson`     | JSON array of new event identities considered for promotion                |

The move basis matters: do not present a pre-market move versus previous close
as though it were a regular-session return.

## Attribution Fields

`finding/attribution` — confirmed explanations only. Match to an episode by
`anomalyEpisodeId`, not by array order.

| Field                                   | Meaning                                           |
| --------------------------------------- | ------------------------------------------------- |
| `runId`, `runAtMs`                      | Run that produced the attribution                 |
| `anomalyEpisodeId`, `episodeFirstRunId` | Episode this attribution belongs to               |
| `symbol`                                | Attributed company                                |
| `headline`                              | Short likely-driver statement                     |
| `summary`                               | Full attribution narrative                        |
| `drivers` / driver split                | Decomposition into market, sector, asset-specific |
| `confidence`                            | Confidence classification                         |
| `attributionStatus`                     | Result status; the contract uses `confirmed` rows |
| `supportingEvents`                      | Evidence items (`title`, `why_it_fits`, `url`)    |
| `sourceLinks`                           | Supporting source URLs                            |

Supporting events and source links are already copied onto the attribution, so
the consumer contract does not read the raw `event/items` stream. Label the
driver split and narrative as Alva analysis, not established causality.

## Internal Surfaces (Not The Contract)

These partitions are producer-internal — audit, debug, and observability. They
are **not** the Company Anomaly consumer contract; do not join dashboards or
alerts against them. They are useful only for internal investigation.

| Path                     | Contents                                                                                                                    | Use                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `data/analysis/decision` | LLM/attribution decision, `alertDecision`, `unifiedEvents`, reason, context                                                 | Internal audit only                          |
| `data/audit/run_log`     | Full run log, fetch summary, step log, raw selection, memory audit, prompt/decision payloads, detailed price/volume packets | Internal debug/observability                 |
| `data/event/items`       | Source event stream (news, X, peer moves) used by a run                                                                     | Future "expand raw evidence"; not needed now |

`finding/candidate`, `portfolio/snapshot`, `portfolio/positions`, and
`notify/message` are likewise producer outputs, not the analysis contract.

## Reliability Boundaries

1. **Live-read every answer.** Anomaly state, signals, and attribution are
   time-sensitive.
2. **Separate source facts from platform analysis.** Source title, URL,
   publisher, and timestamps are evidence facts. Summaries, sentiment,
   materiality, the attribution narrative, and the driver split are
   platform-derived analysis.
3. **Join by episode.** Link timeline to attribution by `anomalyEpisodeId`,
   never by array order. `runAtMs` is a run timestamp, not an episode identity.
4. **`finding/attribution` only.** `finding/candidate` is not user-facing.
5. **Respect sparse outputs.** An active episode can legitimately have zero
   confirmed attributions; a quiet run can be newer than the last `real` one.
6. **Read-only.** This source does not authorize writes to `mia`'s namespace and
   does not replace Feed Scope Isolation for new playbooks or automations.
