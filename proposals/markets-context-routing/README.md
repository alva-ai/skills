# Markets Context Routing Proposal

Status: review-only proposal. Nothing in this directory is loaded by the
current Alva Skill.

## Goal

Make the company context already available in Markets readable from every Alva
conversation surface: alva.ai chat, supported IM channels, and direct Agent
Skill calls.

The proposal adds two internal consumer references to the existing top-level
`alva` Skill:

- [Company Narrative](references/company-narrative.md): reads the Markets
  Narrative/WILF feed, including versions, change semantics, timestamps, and
  gaps.
- [Earnings Context](references/earnings.md): resolves one fiscal event and
  reads every eligible Pre-Earnings, Official Release, Transcript, and
  Post-Earnings stage.

These are not proposed as separate installable Skills. They are internal
modules selected by the existing Alva ticker router.

## Why This Lives Under `proposals/`

The first review should not modify `skills/alva/**`. Engineering can review the
feed contracts, time boundaries, fallback behavior, and routing shape before
integrating them into the live Skill.

The proposed production destination after approval is:

```text
skills/alva/
├── SKILL.md
└── references/
    ├── request-routing.md
    ├── ticker-read.md
    ├── company-narrative.md   # new
    └── earnings.md            # new
```

## Design Decisions

1. Keep one top-level `alva` Skill. Narrative and Earnings are reference
   modules, not independently triggered Skills.
2. Treat WILF as the base Narrative record, while preserving Markets-only
   version and `narrative_change_log` semantics.
3. Treat Earnings as one lifecycle workflow rather than four modules. Resolve
   one fiscal event, calculate an information cutoff, then read every stage
   that existed by that cutoff.
4. Missing one source must not erase other valid context. Return typed stage
   gaps and continue.
5. Use the feeds and Data Skills directly. Do not scrape the Markets UI.
6. Apply the same normalized contracts in web, IM, and direct Skill calls.

## What Engineering Should Review

- Environment owner configuration and absolute ALFS paths.
- Canonical ticker-to-feed-slug resolver, especially share classes and non-US
  symbols.
- Shared fiscal-event selector for broad company questions.
- Publication timestamps used for release and transcript point-in-time gates.
- Transcript retrieval/filtering outside model context.
- Whether current runtime tools expose all required reads in every supported
  channel.
- Evaluation coverage before merging into `skills/alva/**`.

See [routing-integration.md](routing-integration.md) for the exact proposed
router changes and acceptance tests.
