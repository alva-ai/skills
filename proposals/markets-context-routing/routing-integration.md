# Routing Integration

Status: designed, not shipped. The Toolkit command is available in the current
rollout build; the live Skill has not adopted it.

## 1. Single Routing Owner

Only `skills/alva/references/ticker-read.md` should own the Company Context
intent table.

- `SKILL.md`: point named-ticker analysis to `ticker-read.md`; add no parallel
  Markets router.
- `request-routing.md`: keep the generic Financial Analysis gate; add no
  Narrative/Earnings intent table.
- `company-narrative.md` and `earnings.md`: define command use, consumption,
  synthesis, and degradation only.

## 2. Command Router

| User ask | Command |
| --- | --- |
| Simple price or isolated fact | Do not call Markets unless interpretation is requested. |
| Investor focus, current debate, narrative change, peers | `alva markets narrative --ticker <TICKER>` |
| Latest completed earnings, results, call, thesis impact | `alva markets earnings --ticker <TICKER>` |
| Next confirmed earnings setup | `alva markets earnings --ticker <TICKER> --event next-confirmed` |
| Explicit fiscal period | Add both `--fiscal-year <YEAR>` and `--fiscal-quarter <Q1..Q4>`. |
| Broad view such as “How does Alva view AMD?” | Call Narrative plus default Earnings; synthesize compactly. |

Command invariants:

- `--event` accepts `latest-completed` or `next-confirmed`; default is
  `latest-completed`.
- Do not combine `--event` with fiscal-year/quarter flags.
- Fiscal year and quarter must be provided together.
- A typed event-not-found response means no matching confirmed event; do not
  silently substitute another quarter.

## 3. Current Boundary

The commands return the latest backend view. They do not accept
`query_as_of`, an exact Narrative version, or a historical evidence cutoff.

Therefore:

- current and explicitly selected fiscal-period questions are supported;
- Narrative history may explain how the current record changed;
- “What would I have seen on date X?” is unsupported and must be disclosed;
- the Skill must not simulate historical point-in-time correctness from current
  records.

## 4. Readiness Gaps

Before enabling automatic broad routing:

1. Narrative must return a usable current record even when one history row is
   malformed; invalid history should be isolated or returned as a typed gap.
2. Pre-Earnings records generated after the release must be repaired or rejected
   when they contain post-event evidence.
3. Default Earnings output must be bounded. The current response includes the
   full transcript; add a summary mode that returns transcript status and
   selected passages only.
4. Keep a detailed transcript mode for explicit call questions, with a query or
   section selector and a hard passage/character budget.

The first two are backend/data-integrity work. Transcript bounding may be
implemented in the backend or Toolkit, but the Skill-facing output must be
bounded before broad auto-routing.

Historical `query_as_of` support is a later capability and does not block
current-view routing once the four readiness gaps above pass.

## 5. Rollout Sequence

1. Fix Narrative invalid-history isolation and contaminated Pre records.
2. Add bounded default Earnings output and targeted transcript retrieval.
3. Smoke-test the commands on AAPL, AMD, `BRK.B`, an upcoming event, an explicit
   quarter, and a ticker with no matching event.
4. Add the two references and one compact intent table to `ticker-read.md`.
5. Confirm price-only and non-company routes do not call Markets.
6. Verify equivalent normalized results from web, IM, and direct Skill calls.

## 6. Acceptance Criteria

- Broad reads return compact Narrative plus latest-completed Earnings context.
- Next-confirmed and explicit-quarter selectors follow the documented flag
  constraints.
- Earnings preserves the validated fiscal event across Pre, Release,
  Transcript, and Post; a missing stage does not erase available stages.
- Malformed Narrative history does not destroy a valid current Narrative.
- Default broad reads never inject an entire transcript into model context.
- A Pre record containing post-release evidence is excluded or clearly invalid.
- Historical point-in-time questions receive an explicit unsupported response.
- The final `skills/alva/**` diff contains no deployment configuration or
  underlying source-addressing details.
