# Company Narrative Context

Status: proposed consumer contract. The canonical API does not yet expose all
required selection and point-in-time behavior.

## Contents

- [Purpose and boundary](#purpose-and-boundary)
- [Request](#request)
- [Response](#response)
- [Selection and time rules](#selection-and-time-rules)
- [Change semantics](#change-semantics)
- [Synthesis and degradation](#synthesis-and-degradation)

## Purpose And Boundary

Company Narrative supplies the Markets view of the investor debate: the dated
one-line read, current questions, competitive context, what would move the
debate, recent changes, and known evidence gaps.

It is analytical context, not authority for live price, official results,
guidance, filings, event timing, or raw news. The Skill consumes a normalized
API result; it does not read the page, locate a source record, select a version,
or parse legacy storage shapes.

## Request

```json
{
  "symbol": "AAPL",
  "query_as_of": "optional ISO-8601 timestamp",
  "version": { "generated_at": "optional exact version timestamp" },
  "detail": "summary | evidence"
}
```

- No cutoff means the latest valid version available now.
- An exact version is used for page-selected history.
- `summary` is the default for broad company questions.
- `evidence` adds bounded change history and supporting fields when requested.

## Response

```json
{
  "status": "AVAILABLE | NOT_AVAILABLE_YET | UNAVAILABLE",
  "unavailable_reason": null,
  "symbol": "AAPL",
  "selected_version": {
    "generated_at": "ISO-8601",
    "evidence_cutoff_at": "ISO-8601",
    "selection_reason": "LATEST_VALID | EXACT_VERSION | AS_OF"
  },
  "summary": {
    "oneliner": "...",
    "focusing_now": ["..."],
    "competitive_landscape": ["..."],
    "what_would_move": ["..."],
    "street_stands": ["..."]
  },
  "changes": {
    "run_change_summary": [],
    "material_narrative_changes": []
  },
  "gaps": [],
  "warnings": []
}
```

The backend may retain additional provenance internally. The Toolkit should
return only the bounded fields needed by the caller.

## Selection And Time Rules

The backend must:

1. Resolve the canonical security and reject a mismatched record.
2. Select latest valid, exact version, or newest valid version at
   `query_as_of`.
3. Require both `generated_at` and `evidence_cutoff_at` to be at or before an
   explicit historical cutoff.
4. Exclude a record whose evidence cannot be proven to respect its cutoff.
5. Return the selection reason, timestamp, gaps, and any legacy normalization
   warning.

The Skill must not simulate these checks in prompting. A later record cannot
be used merely because it discusses an earlier event.

## Change Semantics

Keep two products distinct:

| Field | Meaning |
| --- | --- |
| `run_change_summary` | Ordinary differences between generated Narrative versions. |
| `material_narrative_changes` | An event changed the investor question, mechanism, or decision variable. |

An empty material-change list is normal; it does not prove that “nothing
happened” or that the thesis is unchanged. Legacy string arrays, object arrays,
null values, and malformed entries are normalized or rejected by the backend,
not interpreted ad hoc by each channel.

## Synthesis And Degradation

For a broad answer, use at most:

1. The dated one-line view.
2. Two or three current investor questions.
3. The decision variables most likely to change the debate.
4. A material recent change only when relevant.
5. Material gaps or staleness.

Label the content as Alva analysis and preserve its timestamp. Fetch current
facts from their authoritative sources.

If Narrative is unavailable, continue with other company evidence but do not
claim “Alva's current narrative.” Return one of these reasons with
`UNAVAILABLE`: `SOURCE_MISSING`, `NOT_ENTITLED`, `INVALID_SOURCE`,
`UPSTREAM_FAILURE`, or `OUTSIDE_AS_OF`.
