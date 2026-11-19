# fix(alva): the author can correct a Thesis direction; map author requests to direction terms

Stacked on alva-ai/skills#688 (v1.32.3); ships in the same release.

## 1. Background and Current State

- Since 2026-11-16 (#3743 B6), the Agent never overrides a judged direction.
  When the author disagrees, it suggests stating the direction in the body and
  previewing again.
- Vague wording gets misjudged. alva-ai/alva-backend#3809 is one example: the
  author asked to keep CRWD and PANW with no direction, without editing the
  body. Under #688 the Agent still has to edit the body before it can publish
  `none`.
- The skill has no rule for author requests worded in position terms:
  加仓 / 减仓, 平仓观望, 关掉 (which could mean archive or notifications), or
  pausing Signals.

## 2. Problem Model and End-to-End Behavior

Product goal (Zet, 2026-11-19): an author publishes without thinking about
positions. Looking back, the Thesis return algorithm still reads as fair. The
direction labels in the preview are the only position-like thing the author
confirms, so the work goes into getting those labels right, not into
explaining positions.

- B1: the author can correct a ticker's direction (long, short or no direction)
  in chat. The Agent previews it marked “（按你的指定）” and publishes it. The
  body does not need to change. Only the author's explicit words count: the
  Agent never picks a direction itself or infers one from research or
  discussion.
- B2: if the body explicitly states the opposite call, one Notes line flags the
  mismatch and offers a one-line body addition. Publication is not blocked.
- B3: a later Update is judged again from the stored directions. A change the
  author did not ask for is named in the preview.
- B4: Notes flag a relative call, which counts as one long and one short, and a
  conditional or "avoid" call, which has no direction and no return.
- B5: "What the author asks for" routes each request about an existing Thesis
  by the author's goal, however it is worded, and never by words inside a
  body being published. The goals are: stop the Thesis (archive), keep it
  running with a changed call (an Update with changed tickers and directions,
  including no direction), change a ticker's weight (say the return splits
  equally and weights cannot be set, then one question in direction terms;
  never published as a direction), hide or show it
  (`set-visibility`), stop research and Signals (`set-signal-enabled`), not
  have a return (only while `UNSET`), and bring it back (an Update with
  `--archived false`). Results are described in view terms, never positions.
- B6: a close or delete request leads with one archive action, saying the
  record stays and the return holds. The Agent archives only after the author
  accepts. It leads with an Update instead when the view changed or the Thesis
  should stay visible. An explicit archive request runs directly.

- B7: direction labels are “看多 / 看空 / 无方向” / "Bullish / Bearish / No
  direction" everywhere the Agent names a direction, never long/short or
  看涨/看跌. The `THESIS_RETURN_SWITCH_FINAL` message uses the editor's copy.

## 3. Research, Findings, and Architecture Decision

The App and web editors already let the author pick Bullish or Bearish per
ticker (`ticker-direction-toggle.tsx`), so B1 matches the editors; the Agent
also offers no direction, which the editors do not yet. The Backend already
stores every direction as sent (alva-ai/alva-backend#3794
D6), so B1 changes only the skill. A correction affects only the return from
the moment of publishing onward. It cannot change any return already earned,
which is why the return-integrity reason behind #3743 B6 does not apply.
Archiving and a no-direction Update hold the return the same way and differ
only in visibility, so a misrouted request is cheap and B5 asks no
disambiguation question.

## 4. Implementation Design

- `references/thesis.md`:
  - "Directions and the Thesis return": the author correction, Notes flags and
    later-Update rule.
  - "Existing Thesis lifecycle": the inheritance sentence, plus the new
    subsection "What the author asks for".
  - "Closing or deleting a Thesis": the archive lead and its confirmation.
  - Payload and readback now use the confirmed directions.
- Eval cases:
  - `target.thesis-return-preview` and `target.thesis-create-preview-card` pin
    the correction rule.
  - The two excludes that encoded "explicit direction wins" as forbidden are
    removed.
  - New case `target.thesis-author-intent`.
- Mutations: the old override mutation is replaced with six mutations that
  guard the new rules.

## 5. Verification and E2E Design

`evals/alva-skill-docs` includes match; no model run is claimed.

## 6. Human Decisions and Interaction

- Zet, 2026-11-19: "agent 应该要能改的……用户主动矫正肯定是可以的……这个和收益无关".
- Zet, 2026-11-19: the author should not need to think about positions when
  publishing, and the return algorithm should feel fair in hindsight. A close
  request still goes to archive with one confirmation.
- Zet, 2026-11-19: "按意图重写". The subsection lists goals, not trading
  vocabulary as triggers, so body text such as "我会在 100 止盈" is not read as
  an exit request.
- Zet, 2026-11-19: unify direction labels as 看多 / 看空 / 无方向; pausing
  Signals stays an Agent-only control.
- Zet, 2026-11-19: a weight request is told that the Thesis return splits
  equally and weights cannot be set.

## 7. Outcome and Evidence

Docs only. 2026-11-19: `node evals/alva-skill-docs/skill-doc-eval.mjs
--skill-dir skills/alva` exit 0 (132/132); mutation smoke 83/83; durable agent
5/5.

## 8. Remaining Work

- Merges into #688 and follows its merge order.
- Frontend follow-up (frontend-monorepo):
  - labels to 看多 / 看空 / 无方向 (now 看涨 / 看跌, and no label for no
    direction);
  - a 无方向 choice in the direction toggle (now Bullish / Bearish only);
  - feed-app Updates start from the stored directions, as web and the Agent
    do (now reset to Unknown and judged again without `thesisId`).
- The ALPI Slim skill (sdk-monorepo `skills/alpi-slim-skill`) still says an
  explicit `unknown` clears a direction; it needs its own change.
