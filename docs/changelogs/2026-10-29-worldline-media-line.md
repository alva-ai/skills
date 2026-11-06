# docs(alva): present Worldline audio and video as one playable line

Local record. Primary design: mono-meta
`docs/changelogs/2026-10-29-rich-media-in-agent-chat.md`.

## Change

- `skills/alva/references/search.md` (Worldline v2): a podcast item's
  `item.uri` is an Apple Podcasts episode link or the episode audio file
  (checked on PRD) and `sourceContent.title` is the show name. When one clip
  lets the user hear the cited moment, it goes after the conclusion as a link
  alone in its own paragraph with a blank line before it (Alva apps play such
  a line in place; a link inside a sentence or on the next line of the same
  paragraph stays a text link), at most one per reply, starting at the cited
  turn's `offsetSeconds`. Formats for YouTube, podcast
  (`<item.uri>#t=<seconds>&i=<item.name> "<show name>"`; the item name lets
  Alva apps show its transcript as captions) and X posts. When several
  sources qualify, the line goes to the evidence itself rather than coverage
  of it, the other citations stay inline, and the sentence before it says
  what to listen or watch for without repeating the card.
- Podcasts section: playable link from `trackViewUrl` (Apple episode) or
  `episodeUrl`, with `collectionName` as the show name, in the same format
  without `&i=` (these episodes have no Worldline transcript).
- Eval: `target.mainline-updates` expects v1.29.0, the version main bumped
  to in #671 without updating the case.
- Eval: `target.worldline-media-line` checks the format, the blank line and
  the keep-others-inline rule; mutation `worldline-podcast-media-line` drops
  the `#t=` start and the show-name title.

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`: no
  failed cases on main v1.28.2.
- `node evals/alva-skill-docs/mutation-smoke.mjs`: 51/51.
