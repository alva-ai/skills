# Markets Context Skill Integration

Status: review-only proposal. Nothing in this directory is loaded by the
current Alva Skill.

## Goal

Let users receive the same current Markets company context from alva.ai, IM
channels, and direct Skill calls.

The canonical Toolkit surface already exists:

```text
alva markets narrative --ticker <TICKER>
alva markets earnings --ticker <TICKER> [event selector]
```

This proposal therefore does not invent a new Company Context API or ask the
Skill to read underlying records. It defines how the existing `alva` Skill
routes to these commands and synthesizes their normalized output.

## Decisions

- Keep one installable `alva` Skill.
- Make `ticker-read.md` the sole owner of company-context intent routing.
- Keep Narrative and Earnings as internal references, not separate Skills.
- Use the current backend view only; historical point-in-time reads are not yet
  supported.
- Keep source resolution, fiscal-event selection, and data normalization behind
  `alva markets`.

See [routing-integration.md](routing-integration.md) for rollout gates and the
two consumer contracts for synthesis behavior:

- [Company Narrative](references/company-narrative.md)
- [Earnings Context](references/earnings.md)
