# Earnings Context

Use this reference for every single-company earnings question: pre-earnings
expectations, the earnings release, reported results, the call transcript,
post-earnings interpretation, or a broad company question for which the latest
earnings event is material.

Earnings is one logical workflow, not four separate top-level Skills. The
workflow resolves one fiscal event, determines which evidence stages were
available at the user's information cutoff, reads every eligible stage, and
then emphasizes the stage relevant to the question.

The four stages are:

```text
Pre-Earnings -> Official Release -> Earnings Transcript -> Post-Earnings
```

This is a read-only consumer contract. It does not regenerate analysis, scrape
the Markets page, or write a feed. Markets, IM integrations, alva.ai chat, and
direct Skill callers should all invoke this same contract so they receive the
same event context.

## Routing Invariant

User wording changes emphasis, not the underlying event pipeline.

| User intent | Resolve | Eligible stages to inspect |
| --- | --- | --- |
| "What should I watch into earnings?" | Next confirmed event | Pre only, bounded immediately before release. |
| "What did the company report?" | Latest completed or explicit event | Pre + Release; add Transcript/Post when already available. |
| "What did management say on the call?" | Latest completed or explicit event | Pre + Release + Transcript; add Post when available. |
| "How did the quarter change the thesis?" | Latest completed or explicit event | All available stages. |
| "How does Alva view AMD?" | Shared company router chooses the relevant earnings event | All eligible stages, but earnings remains one layer of the broader company answer. |

Never call only Post-Earnings for a post-event question when the official
release is available. Never treat Pre-Earnings as current after the release;
preserve it as the frozen expectation baseline.

## Required Inputs

```text
ticker
event_selector?       # fiscal year/quarter, fiscal period end, release date,
                      # page-selected event, next confirmed, latest completed
query_as_of?          # explicit historical cutoff or current time
environment
owner                 # Markets earnings-feed owner for that environment
user_intent
```

Confirmed owners for the current Markets feeds:

| Environment | Owner |
| --- | --- |
| Production | `eddiid` |
| Staging | `zal` |

Owner must come from environment configuration. A cross-environment hardcode
can look like missing coverage and must be reported as configuration failure.

## Step 1: Establish The Information Cutoff

Compute `query_as_of` before reading evidence:

1. Explicit date/time from the user or calling page wins.
2. "Pre-earnings", "going into earnings", or equivalent means the instant
   immediately before the confirmed release publication. Later stages are
   ineligible even if they exist today.
3. "Before the call" means the instant immediately before `call_start_at`.
4. Otherwise use current time.

Date-only cutoffs are not enough to adjudicate same-day releases or calls. If
the exact time cannot be resolved, use verified release timing
(`before_open`, `after_close`, `time_unconfirmed`), retain the uncertainty, and
do not include evidence that may have arrived later that day.

## Step 2: Resolve Exactly One Fiscal Event

Resolve event identity in this order:

1. Page-selected event or explicit `fiscal_period_end`.
2. Explicit fiscal year and quarter.
3. Explicit release date mapped to the company's fiscal period.
4. Pre-earnings intent -> next confirmed event.
5. Release, transcript, or post-earnings intent -> latest completed event.
6. Broad company intent -> the platform's shared event selector, with its
   `selection_reason` preserved.

If the shared selector cannot distinguish a recently completed event from the
next scheduled event, return `ambiguous_event` rather than merging two events.
The caller may present both choices, but each must be read independently.

Stable event identity is:

```text
canonical ticker + fiscal year + fiscal quarter + fiscal period end
```

Release dates may move and are lookup attributes, not the sole event key.
Always resolve fiscal period before reading Pre/Post feeds, release documents,
transcripts, actuals, or estimates. Read the existing
[fiscal-period reference](../../../skills/alva/references/fundamentals-periods.md)
for fiscal/calendar rules.

Use live Data Skills discovery for event resolution:

```text
alva data-skills list
alva data-skills summary arrays-data-api-equity-fundamentals
alva data-skills endpoint arrays-data-api-equity-fundamentals <company-detail-file>
alva data-skills endpoint arrays-data-api-equity-fundamentals <fiscal-dates-file>
alva data-skills summary arrays-data-api-equity-events
alva data-skills endpoint arrays-data-api-equity-events <earnings-calendar-file>
```

File names and endpoint schemas must be taken from the current catalog, not
from this reference or memory. Follow the existing
[Data Skills reference](../../../skills/alva/references/data-skills.md).

## Step 3: Determine Stage Eligibility

A stage can be read only when its evidence existed by `query_as_of`.

| Lifecycle state at cutoff | Pre | Release | Transcript | Post |
| --- | --- | --- | --- | --- |
| Scheduled; release not published | Read | Not yet available | Not yet available | Not yet available |
| Official release published; call incomplete | Read frozen baseline | Read | Not yet available | Read `initial_print` if available |
| Prepared remarks/Q&A available | Read frozen baseline | Read | Read | Read `post_call` if available |
| A feed or provider is missing | Read other eligible stages | Read other eligible stages | Read other eligible stages | Read other eligible stages |

Use these internal stage statuses:

- `available`
- `not_yet_available`
- `missing`
- `not_entitled`
- `invalid`
- `failed`

Missing one stage never erases the other stages. It becomes a typed gap in the
normalized result and, when material, in the answer.

## Step 4: Read Pre-Earnings Analysis

The Markets Pre-Earnings record is keyed by fiscal period end, not release date.

```text
/alva/home/{owner}/feeds/pre-earnings-{feed_slug}/v1/data/earnings/pre/
  @range/{fiscalEndMs-1}..{fiscalEndMs}
```

Rules:

- `feed_slug` must come from the same canonical Markets slug resolver used by
  the producer. For simple US symbols it is lowercase. Do not guess the path
  for a special share class if the resolver is unavailable.
- `fiscalEndMs` is UTC midnight at `fiscal_period_end` / `fiscalDateEnding`.
- The range lower bound is exclusive, hence `fiscalEndMs-1`.
- Never use earnings date, call date, filing date, current time, or a calendar
  quarter-end as the path timestamp.
- `@last/1` is allowed only for an unambiguous latest-event convenience read,
  and the returned event identity must still match the resolved event. Exact
  event reads use the range above.
- Use absolute paths. `~/feeds/...` reads the caller's home and is wrong.

Validate:

- canonical ticker;
- fiscal year, fiscal quarter, and period end;
- `analysis_as_of` / `as_of` is before the actual release publication;
- every estimate, guidance item, price, options observation, quote, and
  revision used by the analysis was available by the pre-event cutoff.

A pre analysis created after the event can be used only if it records a
separate historical evidence cutoff and every visible input respects that
cutoff. Otherwise mark it `invalid` for point-in-time use.

Pre is the expectation baseline: central debate, consensus bar, company guide,
key KPIs, scenario framework, historical reactions, options-implied move, and
evidence gaps when present. It is not the source of reported actuals.

## Step 5: Read The Official Earnings Release

Discover the current Equity Events release locator each session, conventionally
under `arrays-data-api-equity-events` and the catalog endpoint corresponding to
`/api/v1/stocks/sec-earnings-release`.

The locator is not itself always the full earnings release. The consumer must:

1. Resolve the exact fiscal event.
2. Read the returned official document metadata and publication timestamp.
3. If the filing is an 8-K or 6-K, follow the earnings-results exhibit,
   commonly Exhibit 99.1, rather than treating the filing cover page as the
   results.
4. If the SEC locator lags, use the company's official investor-relations
   release or official newswire copy and label the fallback.
5. Exclude the release when `published_at > query_as_of`.

The official release or filed earnings exhibit is source of truth for:

- reported actuals;
- company guidance;
- reported KPIs;
- accounting basis and units;
- release quotations.

Structured income statement, balance sheet, cash-flow, and company-KPI Data
Skills may supplement or reconcile the release after ingestion. They do not
override event-time official figures without an explicit reconciliation note.

## Step 6: Read The Earnings Transcript

Discover the current transcript endpoint under
`arrays-data-api-equity-events`, conventionally corresponding to
`/api/v1/stocks/earnings-transcript`.

Transcript rules:

- Match canonical ticker, fiscal year, fiscal quarter, and period end.
- Require the transcript publication/availability time to be on or before
  `query_as_of`.
- Preserve speaker name, speaker title, and section
  (`prepared_remarks` or `qa`) for every passage used.
- A Pro/entitlement failure is `not_entitled`, not `missing`.
- An empty or absent transcript means Post remains `initial_print`; never imply
  that the call was reviewed.
- For a strict historical read, a transcript without a defensible availability
  timestamp is ineligible. For a current read it may be used with an explicit
  timestamp warning.

Do not inject an entire transcript into model context merely to find relevant
passages. The runtime should select outside model context when the provider
returns a full document:

1. Build search terms from the user question, Pre central debate/KPIs, Release
   variances/guidance, and Post claims that require verification.
2. Retrieve or filter to relevant prepared remarks and Q&A turns.
3. Default context budget: at most 12 speaker turns and 12,000 characters total.
   This is a configurable safety default, not a provider limitation.
4. Preserve continuous passages; do not splice words from separate turns into
   one quote.
5. If the cap omits material sections, summarize the selection boundary and
   fetch a second targeted window instead of silently truncating evidence.

## Step 7: Read Post-Earnings Analysis

The Markets Post-Earnings record uses the same fiscal-period key:

```text
/alva/home/{owner}/feeds/post-earnings-{feed_slug}/v1/data/earnings/post/
  @range/{fiscalEndMs-1}..{fiscalEndMs}
```

Apply the same absolute-path, slug, timestamp, range, and event-identity rules
as Pre.

Post has two valid evidence states:

| State | Minimum evidence | Allowed claim |
| --- | --- | --- |
| `initial_print` | Official release is available; call is incomplete | Interpret the print, variances, guidance, and known KPIs. Do not claim call/Q&A insight. |
| `post_call` | Relevant prepared remarks and/or Q&A are available | Interpret the print plus management explanation and call evidence. |

Validate Post `as_of`, `evidence_state`, source URLs, quoted passages, fiscal
event identity, and evidence gaps. A stored `post_call` analysis may remain
readable when the current caller lacks transcript entitlement, but the answer
must distinguish "Alva's stored post-call analysis" from transcript passages
independently re-read in the current request.

## Normalized Result

Every caller should receive the same internal shape regardless of channel:

```json
{
  "status": "available | partial | ambiguous_event | failed",
  "ticker": "AAPL",
  "event": {
    "fiscal_year": 2026,
    "fiscal_quarter": "Q3",
    "fiscal_period_end": "2026-06-27",
    "release_date": "2026-07-30",
    "release_timing": "after_close",
    "release_published_at": null,
    "call_start_at": null
  },
  "query_as_of": "ISO-8601",
  "selection_reason": "explicit_period | page_selected | next_confirmed | latest_completed | shared_selector",
  "stages": {
    "pre": {"status": "available", "as_of": null, "source": {}, "data": {}},
    "release": {"status": "available", "published_at": null, "source": {}, "data": {}},
    "transcript": {"status": "not_yet_available", "published_at": null, "source": {}, "data": {}},
    "post": {"status": "available", "as_of": null, "evidence_state": "initial_print", "source": {}, "data": {}}
  },
  "gaps": [],
  "warnings": []
}
```

Use top-level `partial` when at least one eligible stage is usable and at least
one eligible stage is missing, invalid, not entitled, or failed. A future stage
marked `not_yet_available` does not by itself make a pre-event result partial.

For each stage source retain, when available:

```text
source_type, source_name, source_url, source_id,
published_at/as_of, retrieved_at, status, confidence
```

For each financial fact retain:

```text
value, unit, currency, fiscal period, accounting/per-share basis,
as_of, source reference
```

Derived facts must also retain method and input references.

## Source Priority And Conflict Rules

Use this order:

1. Reported figures and formal guidance: official release or filed exhibit.
2. Management explanation and quotes: official release, prepared remarks, then
   Q&A transcript with speaker metadata.
3. Consensus: one compatible provider, fiscal period, currency, unit,
   accounting basis, and per-share basis frozen before release.
4. Structured statements/KPIs: reconciliation and history after ingestion.
5. Pre/Post feed records: Alva's dated analytical interpretation.
6. Company Narrative/WILF: investor-focus baseline only.

Never calculate a beat/miss or revision across incompatible periods,
currencies, units, accounting bases, or per-share definitions. If sources
conflict, show the official value, identify the conflicting source and basis,
and do not average them.

## Point-In-Time Rules

These rules are hard gates:

- No source, record, quote, estimate, price, guidance item, transcript passage,
  or analysis with an availability time after `query_as_of` may enter the
  answer.
- Pre-print consensus is the latest compatible observation strictly before the
  official release publication.
- A current feed record cannot be used in a historical answer simply because
  it discusses the correct fiscal quarter.
- If only a date is known for same-day evidence, prefer exclusion over leakage
  and state the gap.
- Preserve both analysis generation time and evidence cutoff when they differ.
- WILF/Narrative is never the authority for event timing or actuals.

## Synthesis Contract

Answer the user's question rather than returning four disconnected source
summaries. When all stages are relevant, synthesize in this order:

1. **Expectation before the print:** the central debate and measurable bar from
   Pre.
2. **What officially happened:** actuals, guide, and KPI variances from the
   Release.
3. **Why management says it happened:** relevant prepared remarks and Q&A from
   the Transcript.
4. **What changed for investors:** dated Alva interpretation from Post, with
   remaining uncertainties.

Always include event identity and the evidence cutoff. Surface missing stages
when they would change the conclusion. Separate sourced facts, calculations,
management claims, and Alva analysis.

Market reaction is a separate evidence layer. Fetch price and benchmark data
only when the user asks about the reaction or it is necessary to answer the
question. Align the reaction window to `release_timing`; do not read a raw price
move from the earnings analysis as if it were a live quote.

## Failure And Fallback

| Condition | Required behavior |
| --- | --- |
| Wrong owner or environment | Return configuration error. Do not relabel it as missing coverage. |
| Pre/Post `PATH_NOT_FOUND` | Recheck owner, slug, fiscal period end, and millisecond calculation; then mark only that stage `missing`. |
| Event identity mismatch | Reject that stage as `invalid`; never merge it into the selected event. |
| Release locator lags | Use official IR/newswire or filed exhibit, label fallback, and keep the structured lag warning. |
| Transcript entitlement error | Mark Transcript `not_entitled`; continue with Release and eligible Pre/Post. |
| Transcript unavailable | Mark `not_yet_available` before the call or `missing` after expected availability; keep Post at `initial_print` unless stored evidence proves `post_call`. |
| Post missing | Synthesize Pre + Release + Transcript and say Alva Post analysis is unavailable. Do not generate one silently. |
| Pre contaminated by later data | Mark Pre `invalid` and reconstruct only the sourced expectation baseline if the question requires it. Do not call the reconstruction the stored Pre analysis. |
| One stage fails | Continue all independent eligible reads and return `partial`. |

## Implementation Boundary

The Skill needs read access to ALFS, Data Skills discovery/calls, and official
document retrieval. The calling product may wrap these in platform tools, but
must preserve this event selector, normalized result, stage statuses,
point-in-time gates, and source priority.

If a required platform capability is unavailable, return a typed stage gap. Do
not scrape the Markets UI, substitute model memory, generate a feed, or claim
that a stage was read when it was not.

This reference defines consumption and synthesis. Producer schemas, feed
generation, UI rendering, schedule logic, and analysis prompt design remain
separate contracts.
