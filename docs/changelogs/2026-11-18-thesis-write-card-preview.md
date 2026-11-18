# fix(alva): report every created or updated Thesis as its card

## 1. Background and Current State

- `references/thesis.md` asks for the `<thesis-preview>` block only after a
  creation ("Created Thesis preview"). An Update has no reporting rule.
- The standalone-link rule from #677 covers Theses presented from reads, not
  ones Alva writes.
- A background task's result reaches the main chat as a notice that the main
  agent relays in its own voice, so a block written by the task is not
  guaranteed to survive the relay.
- The Alva App renders a Thesis card from a `<thesis-preview>` block, or from a
  `https://alva.ai/thesis/<id>` link on a line of its own with no query
  parameters. A link inside a sentence stays text.

## 2. Evidence (STG, 2026-11-18)

Four replies to Today cards that day:

- Two published Updates (Theses 9588 and 9291) ended with a sentence such as
  "已按确认的完整正文更新你的[QQQ看空观点](https://alva.ai/thesis/9588)，公开可见。"
  No block was emitted and the link sat inside the sentence, so the App showed
  no card.
- One creation (Thesis 9652) emitted a complete block. The App's parser
  (`richSegments`) splits it into a Thesis card.
- One Update was still waiting for confirmation.

All four ran in the foreground. No sample took the background-task path, so
that part of the rule is preventive.

## 3. Change

- `references/thesis.md`, Created Thesis preview: a published Update ends with
  the same block, read through `thesis get` for the new `author_version_id`.
  Every created or updated Thesis is reported with the block on lines of its
  own, one per Thesis, outside sentences, lists, quotes and code fences. A
  background task's final result must carry the block for each Thesis it
  created or updated, alongside its summary. Only when the block cannot be
  emitted, a standalone `https://alva.ai/thesis/<id>` link with no query
  parameters replaces it. A link inside a sentence alone is not allowed.
- `references/thesis.md`, Existing Thesis lifecycle: the `update` entry points
  to that rule.
- The main-chat relay of task results is changed in sandbox-agent-ts
  (`config/profiles/CHANNEL.md`), which keeps the block as written.
- Version v1.32.1.

## 4. Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs`: no failed cases, including
  the new `target.thesis-write-card-preview`.
- `node evals/alva-skill-docs/mutation-smoke.mjs`: 72/72 mutations failed as
  expected, including `thesis-update-without-preview` and
  `thesis-task-result-without-preview`.
- No live Agent turn was run against the new rule.
