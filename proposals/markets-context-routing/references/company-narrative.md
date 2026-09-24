# Company Narrative Context

Status: proposed Skill consumer contract for the current Markets backend view.

## Contents

- [Command](#command)
- [What it supplies](#what-it-supplies)
- [Consumption rules](#consumption-rules)
- [Synthesis](#synthesis)
- [Failure and degradation](#failure-and-degradation)

## Command

```text
alva markets narrative --ticker <CANONICAL_TICKER>
```

The command accepts only `--ticker`. The Toolkit/backend owns company
resolution and source normalization. The Skill must not construct source paths,
derive source-specific slugs, or scrape the Markets page.

## What It Supplies

The normalized Narrative response is expected to cover:

- current market narrative and investor questions;
- bullish and bearish catalysts;
- focus across the latest four reported quarters;
- changes in Street expectations;
- comparable companies;
- dated Narrative snapshots and material change records;
- data gaps and warnings when present.

Narrative is Alva analysis. It is not authority for live price, official
results, guidance, filing contents, or earnings timing.

## Consumption Rules

- Use the current record for present-tense investor-focus questions.
- Use returned history only to explain changes leading to the current record.
- Keep ordinary version changes distinct from material narrative changes.
- Treat an empty material-change log as “no recorded material change,” not proof
  that the thesis is unchanged.
- Preserve Narrative timestamps and disclose staleness or material gaps.
- Do not answer a historical point-in-time question from the latest record.

The current command has no exact-version or `query_as_of` selector. A question
such as “What did Alva believe on January 15?” is unsupported even when the
response contains historical snapshots, because later knowledge may affect the
current normalized view.

## Synthesis

For a broad company answer, use only:

1. The dated one-line market view.
2. Two or three decision-relevant investor questions.
3. The catalysts or evidence that would change the view.
4. One material recent Narrative change when relevant.
5. Material gaps or staleness.

For a narrow Narrative question, add only the relevant competitive, Street, or
change-history detail. Do not dump every Narrative section.

Label conclusions as Alva analysis and source current factual claims
separately.

## Failure And Degradation

- If current Narrative is available but one history row is invalid, the backend
  should preserve the current result and return the history problem as a typed
  gap.
- If the command fails or the current record is invalid, continue with other
  company sources but do not claim “Alva's current Narrative.”
- Missing history does not make a valid current Narrative unavailable; it only
  limits change analysis.
- A mismatched security, malformed current record, or upstream failure must not
  be rephrased as a neutral market view.
