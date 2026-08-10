# Markets Company Context RFC

Status: API-first design proposal. Nothing in this directory is loaded by the
current Alva Skill.

## Goal

Let a user ask about a company from alva.ai, an IM channel, or a direct Skill
call and receive the same Markets context: Company Narrative plus the relevant
Earnings lifecycle.

## Proposed Boundary

```text
Ticker intent router
  -> stable Company Context API / Toolkit command
  -> backend CompanyService
  -> validated Narrative and Earnings sources
```

- Keep one installable `alva` Skill.
- Make `ticker-read.md` the sole owner of company-context intent routing.
- Keep Narrative and Earnings as internal consumer contracts, not separate
  Skills.
- Keep source addressing, event selection, point-in-time enforcement, status
  normalization, and transcript bounding behind the API.
- Let the Skill request bounded context and synthesize the answer.

The Skill must not read the Markets web page or reconstruct backend selection
logic from storage records.

## Documents

- [Routing integration](routing-integration.md): ownership, API surface,
  rollout sequence, and acceptance criteria.
- [Company Narrative](references/company-narrative.md): normalized Narrative
  contract and synthesis rules.
- [Earnings Context](references/earnings.md): unified Pre, Release, Transcript,
  and Post contract.

The proposal can move into `skills/alva/references/` only after producer,
backend, Toolkit, and cross-channel parity checks pass.
