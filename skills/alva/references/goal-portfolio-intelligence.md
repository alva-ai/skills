# portfolio-intelligence

Diagnose an existing portfolio under read-only authorization without creating
a target allocation or executable rebalance.

## Trigger

Use this goal when the final output is a current-portfolio diagnosis: explain
performance, concentration, correlation, liquidity, factor, sector, country,
currency, or theme exposure; identify unusual holdings; or compare current
exposure with a benchmark or mandate.

## Does not own

- Do not construct a new portfolio, target weights, resize amounts, or
  rebalance legs; use `portfolio-plan-and-allocate`.
- Do not produce a single-instrument entry or exit plan.
- Do not claim interval attribution without the required historical holdings,
  transactions, cash flows, corporate actions, and valuation snapshots.
- Do not create monitors, notifications, or account mutations.
- Do not infer holdings from memory, prior messages, or public market data.

## Required inputs

Require either an authenticated account with approved `account:read` scope or a
portfolio snapshot explicitly supplied in the current turn. Capture snapshot
time, holdings, quantities, cash, and available cost basis. Collect the base
currency, benchmark or mandate, requested risk horizon, and look-through policy.
For interval attribution, also require start and end boundaries, historical
positions or transactions, external cash flows, corporate actions, and
valuation snapshots. Record missing input fields explicitly.

## Workflow

1. Validate the input source, snapshot time, and completeness. For an account,
   validate its read scope and identity and ask the user to choose when several
   accounts are plausible. For a user snapshot, do not infer omitted holdings.
2. Resolve each holding to a canonical issuer and instrument, preserving venue,
   instrument type, and quote currency. Keep unresolved holdings visible.
3. Follow [Data Skills discovery](data-skills.md#discovery-pipeline) with
   `alva data-skills list`, then `alva data-skills summary <skill>`, then
   `alva data-skills endpoint <skill> <File>`. Fetch each endpoint's detail
   before its first use in the session; re-fetch after an unexpected shape.
   Never infer an endpoint from an exposure category.
4. Use Arrays for typed public quotes, FX, fund holdings, market metrics,
   events, and freshness or coverage metadata. Keep account truth, privacy,
   joins, user-specific calculations, and diagnosis in Alva.
5. Use deterministic code to value positions and calculate supported P&L,
   concentration, currency and sector exposure, ETF look-through, correlation,
   liquidity, and factor measures. Distinguish zero, missing, stale,
   unsupported, and noncomparable values.
6. Calculate interval attribution only when the historical ledger supports it;
   otherwise limit the result to current exposure and supported unrealized P&L.
7. Rank findings by materiality and confidence, attach EvidencePacket refs,
   and explain what additional account or public evidence would resolve each
   gap. Stop before proposing a target state.

## Minimum output

Return `portfolio_snapshot_ref`, `coverage`, `exposure_map`,
`supported_attribution`, `risk_findings`, `materiality_confidence`, and
`unresolved_gaps`. Include the base currency, valuation time, public-data
freshness, calculation versions, assumptions, and the exact account fields
used. Mark unsupported attribution explicitly instead of estimating it.

## States

Set `completion_state` independently from the portfolio verdict. Set
`domain_verdict` to `healthy`, `attention`, or `critical` based on declared and
versioned criteria. Track `account_context` as `required`, `loaded`,
`user_snapshot`, or `invalid`, and normally keep
`actionability_state=informational`. Do not use an
account-read success, a risk verdict, or public-data freshness as substitutes
for one another. This goal does not set artifact, monitor-run, condition, or
delivery state.

## Safety and authorization

Use least-privilege `account:read` only for authenticated account input; never
infer write permission from it. Keep holdings, lots, balances, and account
identifiers in Alva. Treat a user-supplied snapshot as private. Do not copy private
portfolio state into Arrays requests, public Feeds, logs, or reusable prompts.
Minimize stored account data and use snapshot references where possible. Do not
place orders, mutate an account, create target weights, or authorize live
execution. Fail closed when the selected input identity or freshness is
ambiguous.

## Composition

Keep this goal primary when read-only diagnosis is the requested completion.
Use `event-risk-and-impact`, `earnings-evidence`, or `research-and-compare` as
bounded supporting evidence for material findings. Make
`portfolio-plan-and-allocate` primary when the user asks what to change, and
make `build-and-run-monitor` primary when the user asks to keep checking or
notify. Supporting goals receive only the minimum necessary account-derived
context and cannot broaden authorization.
