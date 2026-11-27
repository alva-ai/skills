# feat(alva): watchpoint conditions, trade mode, rebalance proposals and rebalance Updates (v1.37.1)

Local record. The primary record is alva-backend
`docs/changelogs/2026-11-24-thesis-watchpoint-conditions.md`
(alva-ai/alva-backend#3904); this record covers the Skill part of B16, B17
and B22's conversation path. The CLI it documents is alva-ai/toolkit-ts#227.

## Change

- `references/thesis.md` gains "Conditions and rebalances", after "Signal
  settings". It holds only what the Agent would get wrong; what each
  condition field, state and trade mode means, what accept and decline do and
  the refused states are in `alva thesis --help` (alva-ai/toolkit-ts#227) and
  are not repeated (Rule 0):
  - intro: describe a condition in plain words with its label; the trade mode
    and proposals are the author's only, and a refusal is explained that way;
    a button outcome shown in the conversation is reported, not answered
    again;
  - "Trade mode": change it only when the author asks, never suggest `auto`
    or `yolo` unprompted; before `set`, say what the mode does and wait for
    confirmation; for `auto`/`yolo` say Alva then publishes without asking
    (under `auto` only the confident ones) and that switching back to
    `manual` only stops later ones, so a
    published rebalance is changed only by a new Update;
  - "Answering a proposal": list with `proposals list`; act directly only
    when exactly one proposal waits, the author's words are a clear decision
    about it and its change is already in the conversation (its proposal
    message or a listing the Agent showed); otherwise show the waiting ones
    and ask; say that accepting publishes at that moment's prices and
    notifies followers; the answer is the confirmation (no publication
    preview or `asset-candidates`); report an accepted one with the preview
    block; a refused answer is reported by its state (the CLI help already says not
    to retry it);
  - "Rebalance Updates": present one as Alva's change with its trigger,
    changes and reasoning, never as the author's words; draft an Update when
    the author wants the text to match, keeping the current shares as
    explicit weights.
- "What the author asks for" gets one routing bullet to the section; "Thesis
  tracking" points from a watchpoint's `condition` to it.
- The opening rule from v1.36.1 (create or update a Thesis only in a turn
  that confirms a full preview shown earlier) gains one sentence: a
  rebalance proposal shown in this conversation is that preview, answered per
  "Answering a proposal". Without it the two rules contradicted each other:
  an accept publishes a rebalance Update.
- `SKILL.md`: one routing row for conditions, proposals, rebalance Updates and
  the trade mode; version v1.37.1 (`main` reached v1.37.0 with
  alva-ai/skills#707). The durable-agent sentence in Runtime Contract is
  rewrapped from three lines to two (no wording change) to keep `SKILL.md`
  at the 240-line budget.
- Evals: `target.thesis-watchpoint-conditions`; five mutations
  (`thesis-proposal-answered-without-listing`,
  `thesis-proposal-accepted-unseen`, `thesis-trade-mode-suggested`,
  `thesis-trade-mode-manual-undoes`, `thesis-trade-mode-set-unconfirmed`);
  `target.thesis-write-needs-confirmed-preview` also checks the proposal
  sentence; version pin v1.37.1.

## Decisions made here (for the owner's review)

- A proposal's change is shown with the preview's direction labels (“NVDA 无方向
  → 看多 25%” / "NVDA No direction → Bullish 25%") rather than the CLI's
  `long`/`short`/`none`, because the publication preview forbids long/short
  wording toward the user; the brief's "NVDA none → long 25%" is the same
  change.
- "Never suggest sizing or rebalancing the author did not ask for" stays: a
  rebalance proposal comes from Alva's research, not from this Agent, so the
  rule and the new section do not conflict.
- After an accept, the Agent reports the rebalance Update with the GET-backed
  preview block, as for any published Update.
- A matching-text Update sends the current shares from `allocation` as
  explicit weights so the position stays as the rebalance set it.

## Cold-read audit (alva-skill-standard step 5)

A subagent ran the judgment pass on the first commit without this record's
rationale. Applied: the "model-written data" rule said once in the section
intro instead of twice; the mode explanation tightened; rebalance changes shown
with the direction labels; "What the author asks for" now says positions are
also what a rebalance the author accepted or let Alva publish set; "Answering a
proposal" covers no waiting proposal and says the answer is the confirmation
(no publication preview or `asset-candidates`); a mode change leaves waiting
proposals waiting; the matching-text Update no longer names an undefined
"Alva asks"; Positions notes that a condition may later rebalance a ticker
with no direction in. Not changed: `SKILL.md` Completion Criteria says an
Update emits no "creation preview" while `thesis.md` emits the preview block
for every published Update; that wording predates this change and is left for
its own fix.

Trim (2026-11-27, on the owner's request that the section hold only what the
Agent must do): the section went from 110 lines to 50, and the explanatory
additions to "Positions", "What the author asks for" and "Know the current
position" were withdrawn. A second cold read on the trimmed text was applied:
no restating of the CLI help (field meanings, author-only, "do not retry",
and with it the `thesis-refused-answer-retried` mutation); `auto` described
as publishing only the confident ones; "shown in this conversation" instead
of "shown to its author" and "its proposal message"; "draft" instead of
"offer" an Update the author already asked for. Not applied: a note that an
earlier Update preview is stale after an accept (the Update already carries
the expected author version and fails on a conflict), a 调仓-vs-调吧 routing
clause (the section already names “调吧”), and reading every page of
`proposals list` (a proposal expires in 24 hours; the first page holds the
waiting ones).

## Rollout

Merge and release only after the toolkit-ts release that contains
alva-ai/toolkit-ts#227 is published (and reaches the agent image), which in
turn waits for the Gateway routes (primary record, "Compatibility and
rollout" step 5).

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`:
  exit 0; SKILL.md lines 240; Cases 138/138; Checks 1772/1772 (100.00%).
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`:
  exit 0; "Mutation smoke passed: 128/128 mutations failed as expected."
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`: exit 0; tests 5,
  pass 5, fail 0.
- alva-skill-standard `scripts/audit.sh skills/alva`: exit 0; broken links
  none; orphan references none; SKILL.md 240 lines.
- Not run against a live agent; the CLI commands do not exist in a released
  toolkit yet.
