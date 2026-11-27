# feat(alva): watchpoint conditions, trade mode, rebalance proposals and rebalance Updates (v1.37.0)

Local record. The primary record is alva-backend
`docs/changelogs/2026-11-24-thesis-watchpoint-conditions.md`
(alva-ai/alva-backend#3904); this record covers the Skill part of B16, B17
and B22's conversation path. The CLI it documents is alva-ai/toolkit-ts#227.

## Change

- `references/thesis.md` gains "Conditions and rebalances", after "Signal
  settings":
  - who reads what: conditions and rebalance Updates are readable by every
    reader; the trade mode and proposals are the author's only, and a
    refusal is explained that way;
  - "Watchpoint conditions": the `condition` on `thesis watchpoints` entries
    (`numeric` with metric, comparison and threshold; `informational` with a
    model-written event), its states and close reasons, that Alva writes it
    and the author changes it only through an Update, and that it triggers
    once;
  - "What a trigger does": the three modes, that a waiting proposal reaches
    the author with buttons Alva carries out itself, and its 24 hours;
  - "Trade mode": read with `trade-mode get`; before `set`, say what
    the mode does (for `auto`/`yolo`: rebalances published on the author's
    Thesis without asking, undone only by a new Update or switching back)
    and wait for confirmation; never suggest `auto` or `yolo` unprompted;
  - "Answering a proposal": list with `proposals list`, act directly only
    when exactly one proposal waits and the author's words are a clear
    decision, otherwise show the candidates (watchpoint, condition, what was
    observed, the change per ticker, reasoning, expiry) and ask; accepting
    publishes at that moment's prices and notifies followers, reported with
    the preview block; a refused answer is reported by its state and never
    retried;
  - "Rebalance Updates": `rebalance` on an Update is Alva's change to the
    position with its trigger and reason, model-written data; the text is
    unchanged, so offer an Update when the author wants the text to match,
    keeping the current shares as explicit weights.
- "What the author asks for" routes answering a proposal, choosing the
  trade mode and matching the text to a rebalance; "Know the current
  position" says the shares include a rebalance Alva published. "Thesis
  tracking" points from watchpoints to the conditions.
- `SKILL.md`: one routing row for conditions, proposals, rebalance Updates and
  the trade mode; version v1.37.0. The durable-agent sentence in Runtime
  Contract is rewrapped from three lines to two (no wording change) to keep
  `SKILL.md` at the 240-line budget.
- Evals: `target.thesis-watchpoint-conditions`; four mutations
  (`thesis-proposal-answered-without-listing`,
  `thesis-trade-mode-suggested`, `thesis-trade-mode-set-unconfirmed`,
  `thesis-refused-answer-retried`); version pin v1.37.0.

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

## Rollout

Merge and release only after the toolkit-ts release that contains
alva-ai/toolkit-ts#227 is published (and reaches the agent image), which in
turn waits for the Gateway routes (primary record, "Compatibility and
rollout" step 5).

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`:
  exit 0; SKILL.md lines 240; Cases 136/136; Checks 1762/1762 (100.00%).
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`:
  exit 0; "Mutation smoke passed: 119/119 mutations failed as expected."
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`: exit 0; tests 5,
  pass 5, fail 0.
- alva-skill-standard `scripts/audit.sh skills/alva`: exit 0; broken links
  none; orphan references none; SKILL.md 240 lines.
- Not run against a live agent; the CLI commands do not exist in a released
  toolkit yet.
