# Complex Financial Ask Contract

Use this file for direct Financial Analysis / Ask Question responses that need
more than one data hop. It is a lightweight answer blueprint, not a playbook
workflow: stop in chat unless the user asks to track, alert, publish, share, or
turn the analysis into an app.

## When It Triggers

Open this file before answering when the ask requires at least two of:

- structured market or fundamental data
- content search, news, filings, transcripts, social, or web context
- peer, benchmark, scenario, valuation, or ranking work
- company-specific KPIs not guaranteed by standard fundamentals
- agent-computed joins, derived metrics, or thesis judgment

Examples include "is AAPL cheap vs peers", "what changed in MSFT AI thesis",
"rank banks by deposit risk", "META bull and bear case", "TSLA inventory and
robotaxi setup", and "GLP-1 winners with payer coverage".

## Required Pre-Answer Gate

Before writing the answer, explicitly assemble the evidence map:

1. Decomposition: the question split into data hops.
2. Data path: which Data Skills, feeds, BYOD sources, or search modules each
   hop will use.
3. Coverage result: fetched, unavailable, stale, gated, or unresolved for each
   hop.
4. Source boundary: which conclusions are sourced facts, agent-computed
   metrics, source-attributed claims, or inference.

If a decisive hop fails, answer with a reduced scope and name the gap. Do not
fill a KPI or benchmark from memory, search snippets, or generic company
knowledge.

## Evidence Table

Include a compact table or equivalent structured block when the answer uses
more than three key facts or any valuation, ranking, or scenario conclusion.
Each row needs:

| Field | Requirement |
| --- | --- |
| Data point | The metric, claim, event, or benchmark used in the analysis. |
| Value / finding | The fetched value, source-attributed finding, or computed output. |
| Source | Data Skills endpoint, published feed, BYOD source, or specific search source. |
| As-of | Observation date, fiscal period, publication date, or "fetch time" when only live fetch time is available. |
| Use | How the point affects thesis, valuation, catalyst, risk, or confidence. |

For source-attributed qualitative claims, make the source identity visible in
the row or adjacent sentence. For agent-computed values, cite the input rows and
label the output as computed.

## Source Coverage Checklist

State coverage before or after the analysis:

- Structured: which core financial, market, ownership, estimate, macro,
  on-chain, or social endpoints were actually fetched.
- Search: which search path covered news, filings, transcripts, non-US
  finance, or off-catalog context.
- Missing: which requested or desirable KPIs were not available, stale, gated,
  ambiguous, or only described by source commentary.

Company-specific KPIs need special care. Product mix, segment usage,
subscription attach, ad pricing, inventory, deposit beta, CRE exposure,
drug-pipeline milestones, payer coverage, and similar metrics are not verified
just because a headline mentions them. Either fetch a structured endpoint,
filing/transcript/source-backed search result, or mark the KPI as a coverage
gap.

## Analysis Shape

Choose the smallest useful structure:

- Thesis / counter-thesis for narrative questions.
- Base / bull / bear for valuation, scenario, or setup questions.
- Peer anchor for comparisons and rankings.
- Catalyst / risk / watch items for "what changed" or monitoring questions.

Every key judgment should be traceable to the evidence table or explicitly
marked as inference. If a valuation depends on a peer multiple, historical
average, benchmark return, or macro yardstick, source that baseline like any
other financial figure.

## Answer Contract

For complex asks, the final answer should include:

1. Decomposition: what the answer checked and the data path used.
2. Evidence: core data points with source and as-of.
3. Source coverage: structured coverage, search coverage, and missing data.
4. Analysis: thesis/counter-thesis, base/bull/bear, peer anchor, or scenario.
5. Confidence and caveats: separate verified facts, computed metrics, and
   inference.
6. Next action: watch items, levels, follow-up data, or what would close the
   remaining gap.

Use inline citations or source labels near the sentence that uses a fact; do
not hide all provenance in a trailing source list. Keep the answer concise when
the evidence is simple, but do not omit missing-data disclosure for complex
asks.
