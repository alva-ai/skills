# Company Anomaly Intelligence

A public, read-only Platform Data surface for analyzing unusual company price or
volume behavior, the market and company context around the move, and Alva's
evidence-backed attribution. Use it for questions such as:

- Is a covered company moving abnormally now?
- What price or volume rule triggered?
- Is the move market-wide, sector-driven, or company-specific?
- What events and context support the attribution?
- How confident is the attribution, and what evidence is missing?

This is processed intelligence, not a raw quote or news feed. Price and volume
signals are computed data; driver attribution is model-generated analysis over
supplied evidence. Keep those layers distinct in the answer.

**Not general company research.** Use Financial Analysis and Data Skills for
ordinary prices, valuation, fundamentals, or news without an anomaly question. A
quiet anomaly state does not mean the stock did not move or that no news exists.

## Contents

- [Source And Access](#source-and-access)
- [Coverage Model](#coverage-model)
- [Anomaly Timeline](#anomaly-timeline)
- [Detailed Anomaly Packet](#detailed-anomaly-packet)
- [Attribution](#attribution)
- [Company And Market Context](#company-and-market-context)
- [Event Evidence](#event-evidence)
- [Run And Data Quality Metadata](#run-and-data-quality-metadata)
- [Relationships And Freshness](#relationships-and-freshness)
- [Answer Contract](#answer-contract)
- [Reliability Boundaries](#reliability-boundaries)

## Source And Access

Use the current Alva CLI filesystem commands to read this source; run
`alva fs --help` before use. This reference owns the data contract and field
semantics, not CLI syntax or time-series suffix behavior.

- **Host user:** `mia`.
- **Feed base:**
  `/alva/home/mia/feeds/<ticker-slug>-portfolio-watch-anomaly/v1`.
- **Ticker slug:** lowercase the ticker, replace each run of non-alphanumeric
  characters with `-`, and trim leading/trailing `-` (`MU` -> `mu`, `BRK.B` ->
  `brk-b`).
- **Environment:** production. Verify the current endpoint before treating
  `NOT_FOUND` as missing company coverage.
- **Permissions:** public read through `special:user:*`; never write to this
  namespace.
- **Discovery:** there is no public company directory yet, and synth outputs are
  not discoverable through `readdir`. Test the exact feed path and report
  unavailable coverage instead of inventing a feed.

## Coverage Model

The feed has a lightweight anomaly-gate layer and a heavier attribution layer.
The heavy outputs exist only for runs that entered analysis; this is expected
sparsity, not missing data.

### Data Domains

| Domain                      | Covered data                                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Price anomaly               | Latest price, session/reference prices, move basis, regular/pre-market/after-hours components, total move, historical return mean/stdev/sample, price z-score  |
| Volume anomaly              | Cumulative volume at an intraday cutoff, session/interval, multi-window historical baselines, median/mean/stdev, volume multiple, volume z-score, availability |
| Anomaly state               | Triggered rules, newly triggered rules, promotion/new-material state, current state-machine tag, attribution linkage                                           |
| Company and peer context    | When available: company market metrics, peer roles and returns, sector tone, sector ETF direction/flow, and decomposition inputs                               |
| Industry context            | When configured: company-relevant spot/contract prices, industry indexes, and rate/repricing or prediction-market context                                      |
| Corporate and market events | When available: company and industry news, market news, industry social/X, analyst target changes, insider activity, and congressional activity                |
| Attribution                 | Likely-driver headline/summary, market-sector-company driver split, evidence, confidence, status, search activity, promotion decision                          |
| Quality and operations      | Run status/timing, source coverage, warnings, prompt coverage, gate diagnostics, notification decision                                                         |

### Output Mapping

| Data layer                       | Output                   | Coverage                                                                             |
| -------------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| Anomaly state                    | `data/anomaly/timeline`  | Every gate evaluation: state, price/volume summary, triggered rules, promotion state |
| Decision                         | `data/analysis/decision` | Run-level alert decision, concise explanation, and company attribution context       |
| Anomaly and attribution payloads | `data/audit/run_log`     | Detailed price/volume anomaly packets, final attributions, quality and run metadata  |
| Supporting evidence              | `data/event/items`       | Normalized company, industry, market-news, and social records used by the run        |

`portfolio/snapshot`, `portfolio/positions`, `notify/message`, finding rows, and
persistence diagnostics are producer outputs, not the Company Anomaly analysis
contract.

## Anomaly Timeline

`anomaly/timeline` is the entry point for both current state and anomaly
history. It answers whether the gate fired and records the minimum facts needed
to interpret that decision.

### Identity And Time

| Field                | Meaning                                                  |
| -------------------- | -------------------------------------------------------- |
| `symbol`             | Covered company ticker                                   |
| `date`               | Time-series record timestamp                             |
| `runAtMs`            | Gate-evaluation timestamp; not the heavy-output join key |
| `attributionRunAtMs` | Heavy attribution run to join when non-zero              |

### State

| Field        | Meaning                                                                      |
| ------------ | ---------------------------------------------------------------------------- |
| `tag`        | State-machine result: `not_triggered`, `candidate`, `no_material`, or `real` |
| `promoted`   | String boolean indicating whether new material promoted the run              |
| `realReason` | Why a `real` attribution was emitted: `first`, `new_rule`, or `promoted`     |
| `headline`   | Concise attribution headline when the row has a published attribution        |

State meanings:

| `tag`           | Interpretation                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `not_triggered` | Current price/volume signals did not cross an anomaly rule. This is a quiet gate result, not a claim that price was unchanged. |
| `candidate`     | An anomaly continued, but the run did not produce a new attribution. Do not reuse an older explanation as current.             |
| `no_material`   | Potential new material was checked but did not qualify as novel/material enough to promote.                                    |
| `real`          | A publishable attribution exists for the aligned `attributionRunAtMs`.                                                         |

### Price, Volume, Rules, And Material

| Field                   | Meaning                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `priceMovePct`          | Move measured on the basis named by `priceMoveBasis`                                           |
| `priceMoveBasis`        | Comparison basis, such as pre-market versus previous close or after-hours versus regular close |
| `regularSessionMovePct` | Regular-session component                                                                      |
| `afterHoursMovePct`     | After-hours component                                                                          |
| `preMarketMovePct`      | Pre-market component                                                                           |
| `totalMovePct`          | Combined move carried by the anomaly evaluation                                                |
| `priceZScore`           | Standardized price anomaly signal                                                              |
| `volumeZScore`          | Standardized volume anomaly signal                                                             |
| `rulesTriggeredJson`    | JSON array of all currently active anomaly rules                                               |
| `newRulesJson`          | JSON array of rules newly active in this transition                                            |
| `newMaterialJson`       | JSON array of new event identities considered for promotion                                    |

The move basis matters. Do not present a pre-market move versus previous close
as though it were a regular-session return.

## Detailed Anomaly Packet

`audit/run_log.anomaliesJson` is a JSON-encoded array. Each anomaly object
contains the computed facts behind the timeline summary.

### Anomaly Object

| Field                  | Meaning                                                 |
| ---------------------- | ------------------------------------------------------- |
| `anomalyId`            | Anomaly identity inside the computed anomaly payload    |
| `symbol`               | Company ticker                                          |
| `abnormal`             | Whether the computed packet is abnormal                 |
| `triggerKinds`         | Trigger families, normally price and/or volume          |
| `summary`              | Human-readable computed signal summary                  |
| `price`                | Detailed price signal packet                            |
| `volume`               | Detailed volume signal packet                           |
| `relatedEvents`        | Event records already linked to the anomaly             |
| `attributionContext`   | Company/sector context supplied to attribution          |
| `rateRepricingContext` | Relevant rate or prediction-market context when present |
| `sourceNotes`          | Data provenance and quality notes                       |

### Price Packet

| Coverage             | Fields                                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current observation  | `symbol`, `latestPrice`, `latestPriceAsOfMs`, `latestPriceAsOfHkt`                                                                                                         |
| Reference prices     | `todayOpen`, `todayOpenAsOfMs`, `previousClose`, `previousCloseAsOfMs`, `previousCloseAsOfHkt`, `priorRegularClose`, `priorRegularCloseAsOfMs`, `priorRegularCloseAsOfHkt` |
| Move decomposition   | `todayOpenMovePct`, `priceMovePct`, `priceMoveBasis`, `regularSessionMovePct`, `afterHoursMovePct`, `preMarketMovePct`, `totalMovePct`                                     |
| Statistical baseline | `priceZScore`, `dailyReturnMeanPct`, `dailyReturnStdevPct`, `dailyReturnSampleSize`                                                                                        |
| Gate explanation     | `triggerKinds`, `reasons`                                                                                                                                                  |

### Volume Packet

| Coverage              | Fields                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| Current observation   | `cumulativeVolume`, `currentEtDate`, `cutoffMinuteOfDay`, `currentVolumeAvailable`               |
| Baseline              | `historicalMedianVolume`, `historicalMedianWindow`, `historicalMedianWindows`, `baselineSamples` |
| Comparison            | `volumeMultiple`, `volumeZScore`                                                                 |
| Session semantics     | `volumeSession`, `volumeInterval`, `marketStatus`                                                |
| Availability and gate | `volumeAvailable`, `triggerKinds`, `reasons`                                                     |

Each `historicalMedianWindows` item can include `label`, `configLabel`, `days`,
`basis`, `baselineWindow`, `cutoffMinuteOfDay`, `sampleCount`, `medianVolume`,
`meanVolume`, and `stdVolume`. Use the effective values in the packet rather
than assuming one fixed baseline window.

## Attribution

Attribution answers why the move may have happened. It is analysis, not proven
causality.

### Decision Summary

`analysis/decision` exposes the concise run result:

| Field                                   | Meaning                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `accountId`                             | Source account identifier; ticker-only feeds normally use a static identity |
| `portfolioMode`, `positionCompleteness` | Input mode and whether position sizing was available                        |
| `runSource`                             | Producer run mode, such as an anomaly shard                                 |
| `alertDecision`                         | `push` or `no_push` decision                                                |
| `urgency`                               | Notification urgency classification                                         |
| `reason`                                | Concise driver explanation                                                  |
| `skipReason`                            | Why no notification was selected                                            |
| `notificationMessage`                   | Generated user-facing message when present                                  |
| `attributionContextJson`                | JSON-encoded company, peer, sector, and market context                      |
| `runAtMs`, `date`                       | Attribution timestamp and time-series timestamp                             |

Other decision fields (`selectedFindingIdsJson`, `unifiedEventsJson`,
`selectedEventPacketsJson`, expansion JSON, and cooldown JSON) are producer and
diagnostic material. They are not required to explain the company anomaly.

### Final Attribution Object

`audit/run_log.anomalyAttributionsJson` is a JSON-encoded array. Pair each item
to an anomaly by symbol within the already aligned attribution run. The current
attribution object does not expose `anomalyId`; do not infer a cross-run
identity from array order.

| Field                                  | Meaning                                                             |
| -------------------------------------- | ------------------------------------------------------------------- |
| `symbol`                               | Attributed company                                                  |
| `headline`                             | Short likely-driver statement                                       |
| `summary`                              | Full attribution narrative                                          |
| `attributionStatus`                    | Attribution result quality/status                                   |
| `confidence`                           | Confidence classification                                           |
| `driverSplit`                          | Decomposition into `market`, `sector`, and `asset_specific` drivers |
| `supportingEvents`                     | Evidence items with `title`, `why_it_fits`, and `url`               |
| `sourceLinks`                          | Supporting source URLs                                              |
| `generatedAtHkt`                       | Attribution generation time                                         |
| `promote`, `promoteReason`             | Whether and why the attribution was promoted                        |
| `searched`, `searchCalls`, `searchLog` | Search activity used during attribution                             |
| `parseOk`, `rawPreview`                | Model-output parsing diagnostics                                    |

## Company And Market Context

`attributionContextJson` supplies the comparison data used to separate broad,
sector, and company-specific explanations. Context is company-specific; inspect
the live keys and do not require semiconductor-only fields for other companies.

| Context area                       | Typical fields                                                                                        | What it explains                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Generation and usage               | `generatedAtHkt`, `usage`                                                                             | Context timestamp and which inputs are context-only versus event candidates                   |
| Sector vs idiosyncratic            | `sectorVsIdiosyncratic` with company move/direction, peer counts, ETF direction, sector tone, summary | Whether the move follows the peer/sector tape                                                 |
| Peer moves                         | `peerMoves[]`: `symbol`, `role`, `direction`, `return1dPct`, `return30dPct`, `summary`                | Direct competitor, supplier/customer, storage, or benchmark comparisons                       |
| Self market metrics                | `selfMarketMetrics.latest.<metric>` with `value`, `observedDate`                                      | Price changes, volume, dollar volume, volatility, beta, RSI, and other company market metrics |
| Sector ETF flow                    | Company-relevant ETF object with date, direction, flow, shares, close, summary                        | Whether sector fund flows support the move                                                    |
| Industry spot or contract data     | Industry-specific arrays with item, dates, levels, direction, change, summary                         | Whether underlying industry pricing supports the move                                         |
| Industry index                     | Relevant industry-index value, date, multi-horizon changes, summary                                   | Broader industry-cycle direction                                                              |
| Rate/repricing context             | Relevant market items with id, title, slug, end date, volume, and liquidity                           | Whether policy or rate-expectation repricing fits the move                                    |
| Analyst targets                    | `analystTargetPosture.latest[]`: firm, analyst, posture, target, published, title, summary            | Fresh target changes and analyst posture                                                      |
| Insider and congressional activity | Insider/congress summaries and latest activity lists                                                  | Recent disclosed buying or selling context                                                    |

Observed self-market metric names include `PRICE_CHANGE_1d`, `PRICE_CHANGE_1w`,
`PRICE_CHANGE_1M`, `PRICE_CHANGE_3M`, `PRICE_CHANGE_6M`, `PRICE_CHANGE_1y`,
`SHARES_VOLUME`, `DOLLAR_VOLUME`, `AVERAGE_DAILY_DOLLAR_VOLUME`,
`VOLATILITY_20`, `VOLATILITY_60`, `VOLATILITY_90`, `BETA`, and `RSI_14`.
Availability can vary.

## Event Evidence

`event/items` contains normalized evidence records collected for an attribution
run.

| Field                           | Meaning                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `eventKey`                      | Stable deduplication identity                                                                    |
| `sourceType`                    | Event family; observed examples include `market_news`, `industry_news`, and `industry_x`         |
| `symbol`                        | Company associated with the event                                                                |
| `title`                         | Source-facing event title                                                                        |
| `summary`                       | Normalized or generated event summary; treat as platform-derived                                 |
| `url`, `source`                 | Source location and publisher/account; URL may be empty                                          |
| `dedupeStatus`                  | Whether the event is new, duplicate, or otherwise filtered                                       |
| `publishedAtMs`                 | Source publication time                                                                          |
| `firstSeenAtMs`, `lastSeenAtMs` | Platform observation window                                                                      |
| `runAtMs`, `date`               | Attribution run association and time-series timestamp                                            |
| `metadataJson`                  | JSON-encoded provenance, filtering, materiality, ticker/topic, sentiment, or engagement metadata |

Common `metadataJson` groups include:

- Provenance: `sourceOrigin`, `sourceDomain`, `sourceEventTime`, `storyId`.
- Filtering: `filterPolicy`, `retrievalTopic`, `queryGroup`, `keywordQuery`,
  `configuredKeywords`, `sectorKeywordMatches`.
- Classification: `tickers`, `topics`, `sentiment`, `materiality`.
- Social engagement: `handle`, `likes`, `reposts`, `views`.
- Search expansion: expansion identity, query, summary, top title/URL, and
  result count.

Use only events aligned to the selected attribution run and already connected by
event identity, URL, or title. A ticker mention alone is not sufficient
evidence.

## Run And Data Quality Metadata

`audit/run_log` also exposes whether the analysis completed and how trustworthy
the inputs were.

| Coverage              | Fields                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| Lifecycle             | `status`, `runStartedAtMs`, `runCompletedAtMs`, `durationMs`, `runAtMs` |
| Decision              | `alertDecision`, `shouldPush`, `skipReason`, `notificationPreview`      |
| Warnings and coverage | `warningsJson`, `dataFetchSummaryJson`, `analystPromptCoverageJson`     |
| Analysis summary      | `llmDecisionJson`, `outputSummaryJson`, `analystDecisionJson`           |
| Gate diagnostics      | `candidateAuditJson`, `anomalySignalsJson`, `materialityConfigJson`     |

Large diagnostic fields such as `rawEventsJson`, `eventCandidatesJson`,
`unifiedEventsJson`, `eventExpansionsJson`, and `searchExpansionTraceJson` can
be duplicated, size-capped, or invalid JSON after truncation. They are not part
of the public Company Anomaly consumer contract.

## Relationships And Freshness

- `timeline.runAtMs` identifies a gate evaluation.
- A `real` row's non-zero `attributionRunAtMs` identifies the corresponding
  `analysis/decision` and `audit/run_log` rows by exact `runAtMs` equality.
- `event/items.runAtMs` associates evidence with that attribution run.
- `anomaliesJson` contains computed anomaly facts; `anomalyAttributionsJson`
  contains the inferred explanation.
- The current timeline row can be quiet and newer than the latest `real`
  attribution. Report both timestamps when discussing a prior attribution; do
  not pair old drivers with current metrics.

Use the Alva CLI's current time-series read and pagination behavior to retrieve
the required rows. This reference intentionally does not duplicate those CLI
instructions.

## Answer Contract

1. State the current anomaly state and timestamp.
2. Report the exact move basis, session components, price/volume statistics, and
   triggered rules from the relevant timeline/anomaly packet.
3. When a `real` attribution exists, label the likely driver and driver split as
   Alva analysis rather than established causality.
4. Cite the few aligned supporting events, their source times, and URLs when
   present.
5. State attribution status, confidence, warnings, missing context, and any
   difference between the current-state and attribution timestamps.

For `not_triggered`, `candidate`, or `no_material`, do not attach an older
driver to the current tick unless the user separately asks for the latest prior
attribution.

## Reliability Boundaries

1. **Live-read every answer.** Company moves, signals, events, and attribution
   state are time-sensitive.
2. **Separate source facts from platform analysis.** Source title, URL,
   publisher, and timestamps are evidence facts. Event summaries, sentiment,
   materiality, filtering/classification metadata, attribution narrative, and
   driver decomposition are platform-derived analysis.
3. **Use the explicit run join.** Keep `timeline.runAtMs` as the gate-evaluation
   timestamp. Join a `real` row only when `timeline.attributionRunAtMs` exactly
   equals the `runAtMs` on decision, audit, and event rows.
4. **Respect sparse heavy outputs.** A quiet gate can legitimately have no new
   decision, attribution, or event batch.
5. **Treat context as optional.** Missing company-irrelevant context is not a
   schema failure; use only fields actually present.
6. **Read-only.** This source does not authorize writes to `mia`'s namespace and
   does not replace Feed Scope Isolation for new playbooks or automations.
