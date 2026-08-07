# Company Narrative Context

Use this reference when a single-company question needs the context shown in
Markets > Narrative: the current investor debate, what investors are focusing
on, what could move the stock, recent changes in that debate, competitive
context, or Street positioning.

This is a read-only consumer contract. It does not generate a new WILF card,
run the narrative producer, or scrape the Markets page. The page and the agent
must consume the same underlying feed so the same context is available in web,
IM, chat, and direct Skill calls.

## Boundary: Narrative Is Built On WILF, But Is Not Only WILF

The WILF card is the base company narrative record. Markets adds version and
change semantics that the older published WILF method may not document:

- the current one-line read and six narrative sections;
- the card's `date` and analytical `as_of` timestamps;
- weekly card-to-card changes in `change_summary`;
- material event-driven changes in `narrative_change_log`;
- version selection and historical point-in-time reads;
- explicit gaps and coverage state.

Therefore, do not implement Markets Narrative by calling only the documented
fields of `alva/what-investors-are-looking-for`. Read the current raw record and
apply this contract. The published WILF method can still be used as the source
method, but this reference owns the consumer behavior required for Markets
parity.

Narrative is analytical context, not a source of live price, official earnings
actuals, current event timing, estimates, filings, or raw news. Fetch those
from Data Skills or primary sources when the question needs them.

## When To Read It

Read Company Narrative for requests such as:

- "How does Alva view AMD?"
- "What are investors focused on for AAPL?"
- "What is the current debate?"
- "What changed in the narrative?"
- "What would make the stock work or fail?"
- "How does the competitive landscape look?"
- "Where does the Street stand?"

For a broad ticker read, Company Narrative is one context layer. Combine it
with live price, fundamentals, earnings, or anomaly evidence only when those
layers are relevant to the user's question. Do not load every company source by
default.

## Inputs And Resolution

Required inputs:

| Input | Rule |
| --- | --- |
| `ticker` | Resolve the canonical listed symbol before constructing a path. |
| `feed_slug` | Lowercase the canonical symbol and replace `.` with `-`, for example `BRK.B` -> `brk-b`. Preserve the canonical symbol separately for validation. |
| `query_as_of` | User's explicit historical cutoff, page-selected version time, or current time when no cutoff is supplied. |
| `environment` | Active Alva profile/environment. Never infer it from the hostname alone. |
| `owner` | Environment-configured Markets feed owner. Production is currently `eddiid`; other environments must provide their configured owner. Never silently reuse the production owner in staging. |

If ticker resolution is ambiguous, resolve it through company detail/search
before reading the feed. Never fall back to a different share class, exchange,
or similarly named company.

## Feed Path And Queries

Base output:

```text
/alva/home/{owner}/feeds/wilf-{feed_slug}/v1/data/wilf/card
```

Use an absolute path. Do not use `~/feeds/...`, because `~` resolves to the
caller's home rather than the Markets feed owner.

| Intent | Query | Rule |
| --- | --- | --- |
| Current narrative | `.../card/@last/1` | The result is an array. Use its last element, never assume the first element is newest. |
| What changed | `.../card/@last/{N}` | Use the smallest bounded history that answers the question. Results are chronological, oldest first. |
| Exact Markets version | `.../card/@range/{dateMs-1}..{dateMs}` | `@range` has an exclusive lower bound. Select and validate the record whose `date` equals `dateMs`. |
| Historical cutoff | bounded `@before` or `@range` | Select the newest record whose `date <= query_as_of`; never use a later card. |

Do not use `@last/1` for a page-selected historical version. Do not use an
unbounded history read. See the existing
[ALFS reference](../../../skills/alva/references/api/filesystem.md) for supported
synth-mount suffixes.

## Record Contract

The current feed record contains the following fields. Consumers must tolerate
legacy records that predate later fields, but must not silently ignore a field
present in the current record.

| Field | Type at rest | Consumer meaning |
| --- | --- | --- |
| `date` | integer timestamp | Time-series key and version selector. |
| `symbol` | string | Canonical company symbol used to validate the record. |
| `name` | string | Company display name. |
| `as_of` | string/datetime | Analytical information cutoff of the card. It is not necessarily equal to `date`. |
| `oneliner` | string | Concise current investor read. |
| `brief` | string | Source-of-truth narrative document from which the six section mirrors are derived. |
| `focusing_now` | string | Current investor questions and decision variables. |
| `competitive_landscape` | string | Peer, positioning, and competitive context. |
| `what_would_move` | string | Bullish/bearish evidence or events that would change the debate. |
| `market_focus` | string | Focus across recent reported quarters. |
| `recent_events` | string | Recent official events included by the producer. Not an exhaustive current-news feed. |
| `street_stands` | string | Street expectations and positioning context available to the producer. |
| `news_feed_keywords` | JSON-encoded string | Search terms associated with the narrative. Parse before use. |
| `changed` | boolean | Whether the generated card changed versus the comparison used by the producer. It does not itself prove a material narrative change. |
| `change_summary` | JSON-encoded string | Weekly/card-run change reasoning. Parse before use. |
| `gaps` | JSON-encoded string | Missing evidence or unresolved coverage gaps. Parse and surface when material. |
| `narrative_change_log` | JSON-encoded string or legacy null/missing | Material event-driven investor-question changes. Parse before use. |

`brief` is the authored source of truth. The six split section fields are
mirrors for structured display and retrieval. If both are present but materially
conflict, mark the record `invalid_schema` rather than choosing whichever text
is more convenient.

Parse JSON-encoded fields defensively:

- valid JSON string -> parsed value;
- legacy `null` or missing `narrative_change_log` -> empty history with
  `legacy_schema=true`;
- malformed JSON -> preserve the raw field, mark `invalid_schema`, and do not
  invent a parsed value;
- malformed `gaps` must not be interpreted as "no gaps."

## Narrative Change Semantics

`change_summary` and `narrative_change_log` are different products:

| Field | Meaning | Typical cadence |
| --- | --- | --- |
| `change_summary` | What changed between generated WILF cards, including ordinary edits. | Card/weekly refresh. |
| `narrative_change_log` | A material event changed the investor question, mechanism, or decision variable. | Event-driven scan; usually no entry. |

An unchanged or empty change log is normal. It must not be rewritten as
"nothing happened" or "the thesis is unchanged" without supporting evidence.

Each `narrative_change_log` entry has this shape:

```json
{
  "at": "ISO-8601 timestamp",
  "narrative": "Exact bullet added to focusing_now",
  "change_type": "new_question | rewritten_mechanism | resolved_question",
  "prior_debate": "...",
  "post_event_debate": "...",
  "changed_mechanism_or_decision_variable": "...",
  "event_key": "...",
  "source_links": ["..."]
}
```

Entries are newest first and the record retains at most the latest 10. The
`narrative` value should be byte-identical to the corresponding appended bullet
in `focusing_now`. If it is not, retain the entry but add a schema warning.

The scan audit feed is producer health telemetry. Do not load it for an
ordinary company answer.

## Read Algorithm

1. Resolve canonical ticker, feed slug, environment owner, and `query_as_of`.
2. Choose current, bounded-history, or exact-version query from the intent.
3. Read the absolute ALFS path.
4. Normalize grouped ALFS output if returned as `{date, items: [...]}`.
5. Select the record and validate `symbol`, `date`, and `as_of`.
6. Parse every JSON-encoded field and retain parse warnings.
7. Validate `brief` against the structured section mirrors when both exist.
8. For change questions, compare selected records and separately interpret
   `change_summary` and `narrative_change_log`.
9. Return normalized context plus gaps, freshness, selection reason, and source
   path to the answer synthesizer.

Suggested normalized internal result:

```json
{
  "status": "available",
  "ticker": "AAPL",
  "selected_version_ms": 0,
  "query_as_of": "ISO-8601",
  "selection_reason": "latest | historical_cutoff | exact_version",
  "source_path": "/alva/home/.../card/@last/1",
  "record": {},
  "parsed": {
    "news_feed_keywords": [],
    "change_summary": {},
    "gaps": [],
    "narrative_change_log": []
  },
  "warnings": []
}
```

Allowed `status` values are `available`, `not_covered`, `empty`,
`not_entitled`, `invalid_schema`, and `failed`.

## Point-In-Time Rules

- An explicit historical date is a hard upper bound on both `date` and the
  evidence represented by `as_of`.
- If the selected record has `as_of > query_as_of`, exclude it and select an
  earlier valid record.
- A later record cannot be used merely because it describes an earlier event.
- A current `@last/1` read is allowed only when the user asks for the present
  view and no historical page version was supplied.
- Preserve the card's timestamp in the answer. Never describe a weekly card as
  real-time.

## Synthesis Contract

Do not return the raw card as the answer. Synthesize only the sections relevant
to the question, and keep these layers distinct:

1. **Current debate:** the dated one-line read and the most relevant current
   investor questions.
2. **What could change it:** the explicit decision variables or evidence from
   `what_would_move`.
3. **What changed:** material change-log entries first, then ordinary weekly
   card changes when relevant.
4. **Evidence gaps:** unresolved `gaps`, stale timestamps, or missing history.

Label Narrative statements as Alva analysis. When the answer makes a current
price, earnings, filing, guidance, or event claim, source that claim separately.

## Failure And Fallback

| Condition | Required behavior |
| --- | --- |
| `PATH_NOT_FOUND` | Report `not_covered` only after confirming owner, environment, and slug. A wrong owner is configuration failure, not missing company coverage. |
| Empty result | Report `empty`; do not interpret it as a neutral narrative. |
| Permission/entitlement error | Report `not_entitled`; continue with other authorized sources. |
| Symbol mismatch | Reject the record as `invalid_schema`; never answer for the wrong security. |
| Malformed JSON or conflicting mirrors | Preserve raw evidence, add a warning, and use only fields that remain valid. |
| Stale card | State the timestamp and use it only as dated baseline context. Add current sources when the question requires current facts. |

Missing Narrative must not block a useful company answer when other evidence is
available. It does block claims such as "Alva's current narrative is..." because
that claim requires a valid Narrative record.
