# screen-and-rank

Filter and deterministically rank an open universe under an explicit,
reproducible formula.

## Trigger

Use this goal when the final output is a filtered or ranked open universe, such
as a stock, ETF, or token screen, top-N list, or watchlist selected by declared
quality, growth, valuation, cash-flow, liquidity, momentum, or event factors.

## Does not own

- Do not use it for a deep comparison of a finite, already named set; use
  `research-and-compare`.
- Do not construct target weights or personalize an allocation; use
  `portfolio-plan-and-allocate`.
- Do not claim the screen worked historically; use `backtest-and-validate`.
- Do not persist or notify on the screen without making
  `build-and-run-monitor` the primary goal.
- Do not silently turn an informal preference into a hidden scoring model.

## Required inputs

Collect the universe definition, eligibility rules, as-of boundary,
point-in-time requirement, factor definitions, periods, units, directions,
hard filters, weights, normalization policy, missing-data policy, stale-data
policy, tie-break order, requested result count, base currency, price type, and
adjustment policy. Define whether unavailable observations exclude a subject or
leave it unranked.

Use `needs_user_input` when the universe, hard constraints, or ranking formula
is too ambiguous to reproduce. Do not invent factor weights or silently relax a
hard filter.

## Workflow

1. Normalize the request with [goal-contracts.md](goal-contracts.md). Freeze an
   eligible universe snapshot with canonical issuer and instrument identities
   before calculating factors.
2. Follow [Data Skills discovery](data-skills.md#discovery-pipeline) with
   `alva data-skills list`, then `alva data-skills summary <skill>`, then
   `alva data-skills endpoint <skill> <File>`. Fetch each endpoint's detail
   before its first use in the session; re-fetch after an unexpected shape.
   Do not infer endpoints or schemas from a factor name.
3. Use Arrays for typed universe, batch factor, point-in-time, source-clock,
   freshness, and coverage evidence. Keep user criteria, formula compilation,
   deterministic ranking, and final explanation in Alva.
4. Retrieve the complete paginated universe and comparable factor observations
   at the declared boundary. Distinguish `zero`, `missing`, `stale`,
   `unsupported`, and `noncomparable`; record exclusions instead of dropping
   rows silently.
5. Use deterministic code to apply units and FX, hard filters, transforms,
   normalization, winsorization when declared, factor direction, weights, and a
   stable tie-break. Version or hash the complete formula and input snapshot.
6. Audit requested versus returned coverage before ranking. If coverage can
   materially change membership or order, stop or return explicit gaps rather
   than presenting a partial list as exhaustive.
7. Produce the filter funnel, component scores, final rank, exclusions, and
   near misses. Make every row traceable to its factor inputs and formula
   version.

## Minimum output

Return `universe_snapshot`, `formula_version`, `coverage`, `filter_funnel`,
`factor_values`, `component_scores`, `ranking`, `exclusions`, and
`near_misses`. Include the as-of boundary, universe size, factor units,
missing-data policy, tie-break, input EvidencePacket refs, and reasons for every
exclusion. The same snapshot and formula must reproduce the same order.

## States

Set `completion_state` independently from `domain_verdict`. Use `ranked` when a
reproducible ranking was produced and `zero_match` when a sufficiently covered
universe yields no subjects after the declared filters. `zero_match` is a
successful result and must not trigger relaxed constraints. Use
`insufficient_data` when coverage cannot support the requested universe or
ordering; use `complete_with_gaps` only when the remaining gaps cannot
materially change the reported result. Keep `actionability_state=informational`.

## Safety and authorization

Never equate missing with zero, combine incomparable periods or units, use a
current-revised value as point-in-time evidence, or hide excluded subjects.
Do not claim exhaustive coverage when pagination or provider coverage is
partial. Separate a deterministic rank from an investment recommendation and
state formula limitations. This goal needs no portfolio-account, write,
notification, or execution scope; it may still use authorized private or BYOD
universe data when provenance and coverage are preserved. A rank is not trading
authorization.

## Composition

Keep this goal primary when open-universe filtering and ranking completes the
request, including "which instruments?" for a stated portfolio objective when
no target weights are requested. Use `research-and-compare` to deepen analysis of named finalists after
the ranking. Make `portfolio-plan-and-allocate` primary when the user requests
target weights, `backtest-and-validate` primary when historical performance is
the final output, and `build-and-run-monitor` primary when the screen must run
or notify repeatedly. As a supporting goal, return only the bounded ranked
universe and never broaden account or side-effect scopes.
