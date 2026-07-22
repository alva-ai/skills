# Ticker Read

Use this reference for any single-ticker read: broad company analysis, current
investor focus, an unusual move, a catalyst check, or a comparison of what
changed. Treat these as first-tier ticker-read sources: check
the matching official Platform Data method before generic search, then add Data
Skills or primary-source verification where the method's contract requires it.

First-tier does not mean exhaustive. Select the smallest sufficient combination
for the user's question, time horizon, ticker coverage, and requested depth. Do
not execute every source by default, and do not turn a direct analysis into a
feed, Automation, or Playbook unless the user asks for a durable artifact.

## Source Router

The five official methods form two lanes. Fetch the selected method's current
instructions from Skillhub before using it; the contracts and public paths can
change.

Use `alva/company-anomaly-read` as the first direct-read check for intraday and hourly-scale market tracking.
Its feed checks roughly every 15 minutes during US market hours, so it is the
primary ticker-state source for hour-scale tracking, not a live quote.

### Direct-read lane

| Official Skillhub id | Choose it for | Coverage and boundary |
| --- | --- | --- |
| `alva/company-anomaly-read` | Primary intraday/hourly-scale tracking: whether a covered US ticker is anomalous now, its current signal, the latest confirmed attribution in the active episode, or anomaly history. | Public read-only coverage is a curated roughly 3,000-symbol US universe with roughly 15-minute checks during US market hours. A quiet state does not prove that price was flat or that no news exists. |
| `alva/what-investors-are-looking-for` | Weekly investor focus, the one-line read, competitive landscape, bullish/bearish movers, four-quarter focus, recent official events, Street positioning, or what changed between weekly cards. | Per-ticker WILF cards cover roughly 2,960 symbols. During the catalog rename rollout, the active profile may still expose this method as `alva/wilf`. The feed contains generated card content, not prices, charts, fundamentals, or raw source documents. |
| `alva/query-breaking-news-feed` | Current macro/cross-market event discovery that may explain market, sector, or highly watched-company behavior. | It is not a company-by-company news feed. Missing coverage means the feed did not surface a matching event, not that no event exists. |

### Build-on-demand lane

| Official Skillhub id | Choose it for | Coverage and boundary |
| --- | --- | --- |
| `alva/company-data-aggregate` | Build one provenance-tagged company record set containing price/return/z values, peers, market metrics, news, X, insider/congress activity, earnings, revisions, and analyst targets. | Aggregation computes values but makes no anomaly judgment. US is fully supported; non-US uses daily price and skips or degrades US-only sources. The run writes to a caller-selected ALFS path. |
| `alva/company-move-attribution` | Explain a move already identified as anomalous using a company record set: decompose market, sector, and idiosyncratic contribution, then identify a dated driver. | Attribution assumes an already-identified anomalous move and records produced by `alva/company-data-aggregate`. It performs no detection and no web search inside attribution. |

Use the Direct-read lane first when its coverage matches. Use the Build-on-demand
lane for an off-list, non-US, user-defined, or otherwise uncovered move, or when
the user explicitly needs a custom assembled record set. A build fallback stays
inside the Financial Analysis answer route; it does not silently become an
Automation or Playbook.

## Loading A Method

These source modules are official and known, but publication is profile-specific
and may lag the source repository:

1. Run `alva skillhub --help` if it has not been used in this session.
2. Run `alva skillhub get <official-id>` to verify that exact method and inspect
   its current file listing.
3. If the exact id is unavailable, run
   `alva skillhub list --username alva` in the active profile and accept only one
   obvious rollout alias. For WILF, `alva/wilf` is the known legacy id for
   `alva/what-investors-are-looking-for`; verify that alias with `get` and do not
   infer other aliases.
4. Read the listed instruction file with
   `alva skillhub file <resolved-id> <file>`. Do not guess a stale local path or
   bulk-download unrelated files. Pull bundled scripts only when the selected
   build method requires them.
5. Follow the fresh method contract for paths, fields, coverage, and execution.

This proactive source route is Financial Analysis source selection, not the
generic Skillhub Blueprint route. Using one of these methods for an answer does
not imply Playbook Creation or `--skill-id`; those apply only if the user also
asks to build a playbook.

### Availability Gate

Local source files are not proof that a method is published in the active
profile. If neither the exact id nor a documented rollout alias exists, do not
claim the method was used and do not block the whole answer:

- Continue with the remaining available Platform Data sources plus ordinary
  Data Skills and primary-source search.
- For Company Anomaly reads, the bundled
  [company-anomaly.md](company-anomaly.md) remains the maintained public-feed
  consumer contract even when the standalone Skillhub method is not published.
- If either build-on-demand method is unavailable, do not reconstruct its
  script from memory. Explain that custom aggregation/attribution is unavailable
  in the active profile, answer with the evidence that can be sourced, and mark
  the attribution gap.

Method availability is rollout state, not company coverage. Keep a catalog 404
separate from a published method reporting that a particular ticker is not
covered.

## Intent Routing

### Intraday and hourly-scale tracking

1. Use Data Skills for the live price, the move basis, and the requested
   one-hour or intraday window.
2. Read `alva/company-anomaly-read` first. Start with
   `anomaly/timeline/@last/1` for current state and timestamp; use a bounded
   range only when the user asks about the preceding hour or another window.
3. If active, join the current `anomalyEpisodeId` to the latest confirmed
   attribution in that episode. Do not attach an old episode's driver.
4. Add Breaking News only when a current macro/sector event may explain the
   move. Add WILF only when weekly investor focus helps interpret it.

A quiet state does not prove that price was flat. It means no anomaly rule
crossed in that run; report the live move from Data Skills separately.

### Broad ticker read

For every broad ticker read, check the Direct-read lane before generic search:

1. Resolve the canonical ticker and requested horizon.
2. Check Company Anomaly exact-ticker coverage and current state first. When
   covered, add the anomaly state and freshness; when uncovered, continue
   without treating the missing feed as a company signal.
3. Read WILF when the question needs current investor priorities, debate,
   competitive context, or recent changes. Surface `gaps` and the card's `date`
   / `as_of`.
4. Query Breaking News when the user asks about recent catalysts, today's
   context, or a move that may be market- or sector-driven.
5. Use Data Skills for live price, returns, fundamentals, valuation, estimates,
   and peer facts, then apply the normal Complex Ask Router.

Data Skills remain the source for live price, fundamentals, valuation, and
other ordinary financial facts. Platform Data contributes processed company
context; it does not replace the financial evidence needed by the answer.

### Why did it move?

1. Establish the ticker, move, time window, and price basis with Data Skills.
2. For a covered ticker, use `alva/company-anomaly-read`. Join the current
   timeline state to confirmed attribution by `anomalyEpisodeId`; do not attach
   a prior episode's driver to current metrics.
3. For an off-list, non-US, user-defined, or otherwise uncovered move, use
   `alva/company-data-aggregate`, confirm the supplied move is the one being
   explained, then run `alva/company-move-attribution` over the kept records. If
   either method is unavailable in the active profile, follow the Availability
   Gate instead of fabricating the missing workflow.
4. Use `alva/query-breaking-news-feed` as a separate current macro/sector
   discovery check when relevant. Do not imply that its events were inputs to
   the no-web attribution run unless they are actually present in the supplied
   records.
5. Label the decomposition and driver narrative as Alva analysis, not
   established causality. If there is no dated matching event, say so and lower
   confidence.

### What are investors watching?

Use `alva/what-investors-are-looking-for` as the primary source. Read `@last/1`
for the current card and `@last/N` only when the user asks how focus changed.
Report the weekly card timestamp and surface `gaps`; a 404 means not covered
yet, not a bearish or empty result.

Do not generate a missing WILF card merely to answer a read-only question. The
generation path spends credits and persists a new feed; use it only when the
user explicitly asks to create coverage and has authorized that mutation.

When the question also asks what may matter today, combine the WILF frame with
`alva/query-breaking-news-feed` for current macro/cross-market event discovery.
Verify material event claims against source entries marked
`supports_event: true`; `sourceConfidence` and `primarySourceUrl` alone are not
verification.

### Breaking events and catalysts

Use `alva/query-breaking-news-feed` for recent macro, rates, currency,
commodity, geopolitical, crypto, broad-risk, major-industry, and highly watched
company events. Check the audit freshness; the method defines a latest audit as
stale after 30 minutes.

For a ticker or keyword miss, say the feed **did not surface a matching event**.
Because it is not a company-by-company news feed, continue with ordinary
company news or primary-source search when the question requires exhaustive
company coverage.

## Synthesis Gate

Before answering, keep each layer and timestamp explicit:

| Layer | Preferred evidence | State clearly |
| --- | --- | --- |
| Performance now | Data Skills | Price/return basis, as-of time, fundamentals or valuation periods. |
| Investor focus | WILF | Weekly `date` / `as_of`, changed vs unchanged, and `gaps`. |
| Anomaly state | Company Anomaly | Current timeline timestamp, active/quiet state, episode identity, and attribution timestamp. |
| Current catalysts | Breaking News plus supporting sources | Observation/update time, whether a source supports the event, and coverage limits. |
| Custom move explanation | Aggregate + Move Attribution | Records run time, supplied move basis, decomposition, dated evidence, and confidence. |

Separate upstream facts, computed values, and model-generated analysis. A
missing feed, source gap, quiet anomaly, or unsurfaced breaking event is a
coverage statement, never a negative conclusion about the company. Synthesize
the selected layers into one answer rather than returning five disconnected
source summaries.
