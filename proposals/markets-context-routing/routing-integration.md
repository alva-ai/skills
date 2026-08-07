# Proposed Routing Integration

This document describes the minimal changes engineering should make after the
consumer contracts are approved. It intentionally does not patch the current
Skill.

## 1. Target Files

| Existing file | Proposed change |
| --- | --- |
| `skills/alva/SKILL.md` | Add direct routing links for Company Narrative and Earnings Context. State that a broad company view attempts both Markets context modules. |
| `skills/alva/references/ticker-read.md` | Replace the WILF-only consumer assumption with the Company Narrative contract. Add Earnings Context to broad ticker reads. |
| `skills/alva/references/request-routing.md` | Route all earnings/release/transcript/post-earnings intents through one Earnings Context reference. |
| `skills/alva/references/company-narrative.md` | Add the approved Narrative consumer contract from this proposal. |
| `skills/alva/references/earnings.md` | Add the approved Earnings consumer contract from this proposal. |

Do not create `pre-earnings`, `earnings-release`, `earnings-transcript`, or
`post-earnings` top-level Skills. Stage selection belongs inside the unified
Earnings Context workflow.

## 2. Router Behavior

### Narrow requests

| Intent | Required module |
| --- | --- |
| Current debate, investor focus, narrative change, Street view | Company Narrative |
| Pre-earnings setup, results, guidance, call, transcript, post-earnings | Earnings Context |
| Live price or one isolated fundamental fact | Neither module unless interpretation is requested |

### Broad company requests

Examples include "How does Alva view AMD?", "Analyze AAPL", or "What matters
for NVDA now?"

The ticker router should:

1. Resolve canonical ticker and user information cutoff.
2. Attempt current Company Narrative.
3. Resolve one relevant fiscal event and attempt all eligible Earnings stages.
4. Add anomaly, live price, fundamentals, valuation, or current catalysts only
   when relevant to the user's question.
5. Synthesize one answer; do not dump modules as disconnected sections.

The caller must pass page-selected Narrative or earnings versions when the
request originates from Markets. IM and direct Skill calls use the same router
without page state.

## 3. Logical Interface

The platform tool names may differ by channel. The behavior should remain
equivalent to:

```text
read_company_narrative(
  ticker,
  query_as_of,
  selected_version_ms?,
  environment
) -> NarrativeResult

read_earnings_context(
  ticker,
  query_as_of,
  event_selector?,
  user_intent,
  environment
) -> EarningsResult
```

Both functions are read-only and must return normalized source paths,
timestamps, gaps, warnings, and selection reasons. They must not generate a
missing feed or scrape the Markets page.

## 4. Narrative Route

The route reads:

```text
/alva/home/{owner}/feeds/wilf-{feed_slug}/v1/data/wilf/card
```

Selection:

- current question -> `@last/1`;
- change question -> bounded `@last/N`;
- page-selected version -> exact `@range/{dateMs-1}..{dateMs}`;
- historical question -> newest record whose `date` and `as_of` do not exceed
  `query_as_of`.

The implementation must parse `news_feed_keywords`, `change_summary`, `gaps`,
and `narrative_change_log`, and preserve legacy null/missing change logs.

## 5. Earnings Route

The route resolves one fiscal event before reading evidence. It must never
merge the upcoming Pre record with the previous quarter's Release/Post record
as if they were one event.

Pre and Post paths:

```text
/alva/home/{owner}/feeds/pre-earnings-{feed_slug}/v1/data/earnings/pre/
  @range/{fiscalEndMs-1}..{fiscalEndMs}

/alva/home/{owner}/feeds/post-earnings-{feed_slug}/v1/data/earnings/post/
  @range/{fiscalEndMs-1}..{fiscalEndMs}
```

Confirmed current owners:

| Environment | Owner |
| --- | --- |
| Production | `eddiid` |
| Staging | `zal` |

Release and Transcript come from live Data Skills discovery plus the official
document returned by the locator. The official release/filed exhibit is source
of truth for actuals and guidance. Transcript passages retain speaker and
section metadata.

Eligibility is controlled by `query_as_of`:

```text
before release:          Pre
after release:           Pre + Release + optional initial-print Post
after transcript:        Pre + Release + Transcript + optional post-call Post
```

If an eligible stage is missing or not entitled, preserve the other stages and
return a typed gap.

## 6. Required Platform Decisions

These are implementation decisions, not reasons to redesign the Skill:

1. Where environment-to-owner configuration lives.
2. Which shared function owns canonical Markets `feed_slug` resolution.
3. Which shared function selects the relevant earnings event for broad company
   questions.
4. How transcript sections are filtered outside model context.
5. How page-selected event/version state is passed into the same router used by
   IM and direct Skill calls.

If these helpers already exist in Markets, reuse them or expose their behavior
to the agent runtime. Do not duplicate subtly different selectors in each
channel.

## 7. Acceptance Tests

### Narrative

- A current AAPL question reads the production owner and returns the latest
  card with `as_of`, `gaps`, and parsed change fields.
- A page-selected historical version reads the exact `@range`, not `@last/1`.
- A legacy record with null `narrative_change_log` returns empty history plus a
  legacy-schema warning.
- A wrong owner is classified as configuration error before `not_covered`.

### Earnings

- A pre-event question reads only evidence available before release.
- Immediately after the release, the route returns Pre + Release and continues
  when Transcript/Post are unavailable.
- After the call, the route returns all available stages for the same fiscal
  event.
- A missing Transcript does not suppress valid Release or Post initial-print
  context.
- A transcript entitlement error is distinct from an absent transcript.
- Production uses `eddiid`; staging uses `zal`.
- Exact Pre/Post reads use `fiscal_period_end` milliseconds, not release date.
- Historical requests never include later releases, estimates, transcripts, or
  generated analyses.

### Cross-channel parity

- The same ticker, event selector, and `query_as_of` produce the same normalized
  Narrative/Earnings context from web, IM, and direct Skill calls.
- Channel-specific rendering may differ; event selection, data selection,
  timestamps, gaps, and source priority may not.

## 8. Merge Sequence

1. Approve the two consumer contracts.
2. Confirm or implement shared owner, slug, and event-selection helpers.
3. Add the two references under `skills/alva/references/`.
4. Add the three minimal router links described in section 1.
5. Add acceptance scenarios to the existing `evals/alva-skill-docs/` suite.
6. Validate current simple-price and non-company routes do not load unnecessary
   context.
7. Merge only after cross-channel and point-in-time tests pass.
