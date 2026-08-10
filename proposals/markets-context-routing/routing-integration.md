# Proposed Routing Integration

Status: designed, not shipped. This RFC defines the boundary engineering must
implement before changing the live Skill.

## 1. Ownership

| Layer | Owns |
| --- | --- |
| `ticker-read.md` | The only Company Context intent table; decides whether to request Narrative, Earnings, or both. |
| Narrative/Earnings references | Module inputs, normalized outputs, synthesis, and degradation rules. No intent tables or storage recipes. |
| Toolkit | One authenticated, channel-independent command that calls the canonical API and returns bounded JSON. |
| Backend CompanyService | Symbol resolution, version/event selection, point-in-time validation, source priority, typed gaps, and transcript selection. |
| Producers | Evidence cutoffs, timestamps, event identity, and source integrity. |

Do not add parallel routing paragraphs to `SKILL.md` or
`request-routing.md`. Those files should only point named-ticker analysis to
the existing ticker-read chain.

## 2. Ticker-Read Route

The future intent table in `ticker-read.md` should be no larger than this:

| User ask | Company Context request |
| --- | --- |
| Simple price or isolated fact | None unless interpretation is requested. |
| Investor focus, debate, narrative, or narrative change | `scope=narrative` |
| Earnings setup, result, guidance, call, transcript, or thesis impact | `scope=earnings` |
| Broad view such as “How does Alva view AMD?” | `scope=broad`, summary detail |
| Historical or page-selected question | Same scope plus explicit selector and `query_as_of` |

Broad responses begin with compact Narrative and Earnings summaries. History,
full evidence, and transcript passages are fetched only when the question
requires them.

## 3. Stable Agent Interface

Expose one logical operation across web, IM, and direct Skill calls:

```text
alva company context \
  --symbol <canonical-symbol> \
  --scope narrative|earnings|broad \
  --detail summary|evidence \
  [--as-of <timestamp>] \
  [--fiscal-year <year> --fiscal-quarter <quarter>] \
  [--narrative-version <generated-at>]
```

The concrete command name may change, but all channels must call the same
backend contract. The result must include selected identities, source
timestamps, selection reasons, typed gaps, warnings, and bounded content. It
must never expose storage addressing as part of the public contract.

## 4. Required Platform Work

Before the Skill integration:

1. Repair and backfill any Pre-Earnings record containing evidence published
   after its declared cutoff.
2. Add producer fields `generated_at` and `evidence_cutoff_at`; reject evidence
   observed or published after the cutoff.
3. Extend CompanyService and its gateway surface with `query_as_of`, exact
   Narrative selection, fiscal-event selection, release publication time,
   typed gaps, selection reasons, and bounded transcript retrieval.
4. Normalize current and legacy Narrative change-log shapes server-side.
5. Expose the stable Toolkit command and verify authenticated access from every
   supported channel.

## 5. Delivery Sequence

1. Approve this API-first RFC.
2. Fix producer integrity and affected historical data.
3. Ship backend and gateway selection/PIT behavior.
4. Ship the Toolkit command and contract tests.
5. Add compact Narrative/Earnings references and the single ticker-read route.
6. Run gray and cross-channel parity tests before enabling broad routing.

## 6. Acceptance Criteria

- The same request returns the same selected Narrative version, fiscal event,
  stage eligibility, timestamps, and gap reasons in web, IM, and direct calls.
- A historical cutoff cannot return later Narrative, Release, Transcript,
  Post, estimates, or producer-generated evidence.
- Pre, Release, Transcript, and Post always belong to one validated fiscal
  event; a missing stage does not remove available stages.
- Current, upcoming, post-call, and explicitly historical scenarios pass.
- Share classes such as `BRK.B`, ordinary US tickers, and at least one non-US
  symbol pass without Skill-side symbol-to-source logic.
- `AVAILABLE`, `NOT_AVAILABLE_YET`, and `UNAVAILABLE` are distinguished; the
  unavailable reason distinguishes missing source, entitlement, invalid data,
  upstream failure, and outside-cutoff evidence.
- Existing price-only and non-company routes do not load Company Context.
- The final `skills/alva/**` diff contains no source-addressing or deployment
  configuration details.
