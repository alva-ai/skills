# Earnings Context

Status: proposed Skill consumer contract for the current Markets backend view.

## Contents

- [Commands](#commands)
- [Event selection](#event-selection)
- [Lifecycle response](#lifecycle-response)
- [Consumption and source priority](#consumption-and-source-priority)
- [Safety boundaries](#safety-boundaries)
- [Synthesis and degradation](#synthesis-and-degradation)

## Commands

Latest completed event:

```text
alva markets earnings --ticker <TICKER>
```

Next confirmed event:

```text
alva markets earnings --ticker <TICKER> --event next-confirmed
```

Explicit fiscal period:

```text
alva markets earnings --ticker <TICKER> \
  --fiscal-year <YEAR> --fiscal-quarter <Q1..Q4>
```

`--event` and explicit fiscal-period flags are mutually exclusive. Fiscal year
and quarter must be supplied together.

## Event Selection

| Intent | Selector |
| --- | --- |
| “What should I watch into earnings?” | `--event next-confirmed` |
| “What did the company report?” | Default latest completed |
| “What did management say?” | Default latest completed |
| “How did the quarter change the thesis?” | Default latest completed |
| Explicit fiscal year/quarter | Paired fiscal flags |
| Broad company view | Default latest completed |

The backend resolves the fiscal event. The Skill must not infer a different
period when the command returns event-not-found.

## Lifecycle Response

One response covers a single event:

```text
Pre-Earnings -> Official Release -> Earnings Transcript -> Post-Earnings
```

Observed normalized sections include:

- `period`: fiscal identity, earnings date/session, completion state, and
  selection status;
- `preEarningsAnalysis`: dated expectation baseline and scenario framing;
- `earningsRelease`: availability, release date, and official document;
- `earningsTranscript`: availability, publication time, sections, speakers,
  and entries;
- `postEarningsSummary`: dated Alva interpretation and evidence state such as
  initial print or post-call.

Missing or not-yet-available stages must not erase valid stages.

## Consumption And Source Priority

Use this order when claims conflict:

1. Official release/filed exhibit for actuals, guidance, KPIs, units, and
   accounting basis.
2. Transcript passages for management statements, preserving speaker and
   section.
3. Pre for the dated expectation baseline only.
4. Post for Alva's dated interpretation of what changed.

Never treat Pre as reported results. Never use Post alone to quote management
when transcript evidence is available. Do not calculate beat/miss across
incompatible periods, currencies, units, accounting bases, or EPS definitions.

## Safety Boundaries

### Current view only

The command does not support `query_as_of`. It can answer current or explicitly
selected fiscal-event questions, but not “what information was available on a
past date.” The Skill must disclose that boundary rather than reconstructing a
historical view from current output.

### Pre integrity

A Pre record must represent evidence available before the release. If its
timestamp is after the release or its text contains reported actuals/current
post-event evidence, exclude it from the expectation baseline and report it as
invalid. The producer/backend must repair or reject such records.

### Transcript budget

The current response can contain the full transcript. Broad routing must not
inject that document into model context. Before enabling the route, provide a
bounded summary response containing transcript status and only selected
passages. Detailed call questions may request a targeted evidence mode with a
hard passage/character limit.

## Synthesis And Degradation

For a broad company answer, synthesize a compact lifecycle delta:

1. The valid pre-event bar, if available.
2. What the company officially reported and guided.
3. The most relevant management explanation, if a bounded passage is available.
4. How Alva's Post analysis says the investor debate changed.
5. Missing, invalid, or not-yet-available stages.

For narrow questions, emphasize the requested stage while retaining enough
adjacent context to avoid false interpretation.

- No next-confirmed event: say none is currently confirmed; do not substitute
  the latest completed event.
- Transcript unavailable: use Release and eligible Post initial-print context;
  do not imply the call was reviewed.
- Post unavailable: synthesize valid Pre, Release, and bounded Transcript
  evidence without generating a replacement Post.
- Invalid Pre: use Release/Transcript/Post for the completed event and state
  that a trustworthy stored pre-event baseline is unavailable.
