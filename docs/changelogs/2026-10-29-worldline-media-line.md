# docs(alva): present Worldline audio and video as one playable line

Local record. Primary design: mono-meta
`docs/changelogs/2026-10-29-rich-media-in-agent-chat.md`.

## Change

- `skills/alva/references/search.md` (Worldline): podcast `source.url` is an
  Apple Podcasts episode or the audio file since 2026-10-15 and `source.title`
  is the show name; transcript times come from `Speaker @ h:mm:ss` / `offset`
  and YouTube `[mm:ss]`. One clip at most, after the conclusion, as a link
  alone on its own line (Alva apps play it in place; inline links stay text),
  with YouTube, podcast and X post formats.
- Podcasts section: playable link from `trackViewUrl` or `episodeUrl` in the
  same format.
- Eval: `target.worldline-media-line` case; mutation
  `worldline-podcast-media-line` drops the `#t=` start and show-name title.

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`:
  112/113 cases. The one failure, `target.mainline-updates` (expects version
  v1.26.5, skill is v1.27.0), fails identically on base `4b83865`.
- `mutation-smoke.mjs` stops on that pre-existing failure ("Base skill eval
  must pass"), so the new mutation was applied by hand to a copy: the eval then
  fails `target.worldline-media-line` as expected.

## Captions (2026-10-30)

The podcast media line adds the cited hit's Observation ID to the fragment:
`[what to listen for (mm:ss 起)](<source.url>#t=<seconds>&o=<observationId> "<show name>")`.
Alva apps fetch that transcript as captions; a line without `o=` still
plays. The eval case and mutation now use the new format. `skill-doc-eval`:
`target.worldline-media-line` passes; the one failing check
(`target.mainline-updates`, version v1.26.5 vs v1.27.0) predates this change.

## Choosing and leading into the media line (2026-11-05)

Owner request: the card rule should be a judgement, not only a format. When
several sources qualify, the line goes to the evidence itself (the quoted
clip, the original post) rather than coverage of it, other citations stay
inline, and the sentence before the line says what to listen or watch for
without repeating what the card shows. Checked with `skill-doc-eval.mjs`
(the only failure is the pre-existing `target.mainline-updates` version
string).

## Blank line before the media line (2026-11-05, Codex review)

A link on the line right after the lead-in sentence parses as part of the
same Markdown paragraph, and the apps only turn a paragraph that is nothing
but the link into a player. `search.md` now asks for the link in its own
paragraph with a blank line before it; the `target.worldline-media-line` eval
checks that wording and the "keep the other citations inline" rule.
