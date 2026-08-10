# Earnings Context

Status: proposed consumer contract. Producer integrity, server-side
point-in-time enforcement, and bounded transcript retrieval must ship before
the live Skill adopts it.

## Contents

- [Purpose and invariant](#purpose-and-invariant)
- [Request and event selection](#request-and-event-selection)
- [Stage eligibility](#stage-eligibility)
- [Normalized response](#normalized-response)
- [Stage contracts](#stage-contracts)
- [Point-in-time enforcement](#point-in-time-enforcement)
- [Synthesis and degradation](#synthesis-and-degradation)

## Purpose And Invariant

Earnings is one lifecycle, not four Skills:

```text
Pre-Earnings -> Official Release -> Earnings Transcript -> Post-Earnings
```

The backend resolves one fiscal event, applies an information cutoff, and
returns every eligible stage that is valid and available. User intent changes
emphasis, not event identity. Pre remains the frozen expectation baseline after
the release; it never becomes a source of reported actuals.

The Skill does not locate records, map symbols, select fiscal events, determine
publication time, filter full transcripts, or enforce point-in-time rules.

## Request And Event Selection

```json
{
  "symbol": "AMD",
  "query_as_of": "optional ISO-8601 timestamp",
  "event": {
    "fiscal_year": "optional",
    "fiscal_quarter": "optional",
    "fiscal_period_end": "optional",
    "selection": "NEXT_CONFIRMED | LATEST_COMPLETED | PAGE_SELECTED"
  },
  "intent": "SETUP | RESULTS | CALL | THESIS_IMPACT | BROAD",
  "detail": "summary | evidence"
}
```

Backend selection order:

1. Page-selected event or exact fiscal-period identity.
2. Explicit fiscal year and quarter.
3. Explicit release mapped to its fiscal period.
4. Setup intent selects next confirmed event.
5. Results, call, and thesis-impact intents select latest completed event.
6. Broad intent uses the canonical company-event selector.

Stable identity includes canonical symbol, fiscal year, fiscal quarter, and
fiscal period end. Release date alone is not an event key. If selection is
ambiguous, return a typed gap instead of merging adjacent events.

## Stage Eligibility

Eligibility is determined by what existed at `query_as_of`:

| State at cutoff | Pre | Release | Transcript | Post |
| --- | --- | --- | --- | --- |
| Before official release | Eligible | Not yet | Not yet | Not yet |
| Release published, call unavailable | Frozen baseline | Eligible | Not yet | Initial print if valid |
| Transcript available | Frozen baseline | Eligible | Eligible | Post-call if valid |
| One source fails | Preserve other eligible stages | Preserve | Preserve | Preserve |

Every stage returns:

- `content_status`: `AVAILABLE`, `NOT_AVAILABLE_YET`, or `UNAVAILABLE`;
- `unavailable_reason` when relevant: `SOURCE_MISSING`, `NOT_ENTITLED`,
  `INVALID_SOURCE`, `UPSTREAM_FAILURE`, or `OUTSIDE_AS_OF`;
- event identity, source publication/availability time, evidence cutoff, and
  warnings.

## Normalized Response

```json
{
  "event": {
    "symbol": "AMD",
    "fiscal_year": 2026,
    "fiscal_quarter": 2,
    "fiscal_period_end": "YYYY-MM-DD",
    "release_published_at": "ISO-8601",
    "selection_reason": "LATEST_COMPLETED"
  },
  "query_as_of": "ISO-8601",
  "stages": {
    "pre": { "content_status": "AVAILABLE", "summary": {} },
    "release": { "content_status": "AVAILABLE", "summary": {} },
    "transcript": { "content_status": "NOT_AVAILABLE_YET" },
    "post": { "content_status": "AVAILABLE", "analysis_state": "INITIAL_PRINT", "summary": {} }
  },
  "gaps": [],
  "warnings": []
}
```

`summary` is bounded for default broad answers. `evidence` may include detailed
KPI comparisons, source-backed variances, and selected transcript passages;
it must not return an unbounded document.

## Stage Contracts

### Pre-Earnings

The producer must attach:

- exact fiscal-event identity;
- `generated_at` and `evidence_cutoff_at`;
- the consensus snapshot and observation times used;
- the company guidance, KPI expectations, scenario framework, and material
  evidence gaps.

Every estimate, price, option observation, quote, revision, and event included
must have been available by `evidence_cutoff_at`. A record generated after the
release is valid only if all visible evidence is independently bounded to the
pre-release cutoff. Otherwise the backend returns `INVALID_SOURCE` and the
record must be repaired or backfilled.

### Official Release

Use the official release or filed results exhibit as authority for actuals,
guidance, KPIs, accounting basis, units, and release quotations. Structured
data can reconcile or supplement it but cannot silently override event-time
official figures.

The backend records `release_published_at` and excludes the stage when it is
later than `query_as_of`. A locator or filing cover page is not equivalent to
the underlying results document.

### Earnings Transcript

The backend matches the exact fiscal event and requires a defensible
availability time. It returns only relevant continuous passages with speaker,
title, and section metadata.

Selection terms may come from the user question, Pre decision variables,
Release variances, guidance, and Post claims requiring verification. The API
must enforce a configurable passage/character budget and support a second
targeted window when the first omits a material topic. The Skill never loads a
full transcript merely to search it.

### Post-Earnings

Post has two explicit states:

| State | Minimum evidence | Allowed interpretation |
| --- | --- | --- |
| `INITIAL_PRINT` | Official release | Results, guidance, immediate debate change; no call claims. |
| `POST_CALL` | Release plus transcript | Management framing, prepared remarks, Q&A, and call-informed thesis change. |

Post must carry the same fiscal-event identity, `generated_at`,
`evidence_cutoff_at`, and evidence-state label. A post-call claim without an
eligible transcript is invalid.

## Point-In-Time Enforcement

`query_as_of` is a hard server-side boundary. The backend must ensure:

1. Every stage existed by the cutoff.
2. Every generated analysis has `generated_at` and `evidence_cutoff_at` no
   later than the cutoff.
3. Every cited or structured input was observed or published no later than the
   stage's evidence cutoff.
4. Later revisions, transcripts, estimates, or analysis are excluded even when
   they discuss the selected historical event.
5. Uncertain same-day timing is returned as a warning and cannot be treated as
   proof that later evidence was available.

These checks must be executable backend rules and contract tests, not prompt
instructions.

## Synthesis And Degradation

For broad company questions, return a compact lifecycle delta:

1. What the pre-event bar was.
2. What the company officially reported and guided.
3. What management emphasized on the call, if eligible.
4. How the event changed the investor debate, separating initial print from
   post-call interpretation.
5. Which stages or evidence remain unavailable.

For narrow questions, emphasize the requested stage but retain enough adjacent
context to avoid false interpretation. Release actuals and guidance outrank
generated analysis; transcript evidence outranks a Post characterization of
what management said.

Missing or unauthorized stages do not suppress valid stages. If no valid stage
is available, return the typed status and reason without inventing a neutral
earnings view.
