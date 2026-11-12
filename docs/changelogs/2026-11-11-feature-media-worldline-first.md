# docs(alva): feature found podcasts and YouTube videos by their Worldline item

Local record. Follows `2026-11-10-worldline-feature-media.md`; primary design:
mono-meta `docs/changelogs/2026-11-10-feature-media-tool-row.md`.

## Problem

Podcast captions in Alva apps come only from a Worldline item: the backend
attaches the transcript when FeatureMedia is called with `worldline_item`, and
not for a `url`. The skill asked for `worldline_item` only when citing a
Worldline passage. When the user asked to find podcasts, the agent found
episodes through Apple Podcasts Search and featured the Apple link, so the card
played without captions although Worldline held the same episode with its
transcript (PRD, 2026-11-11: YC "The Mindset That Built NVIDIA", Apple
`i=1000778610475`, 89 timed turns).

YouTube videos found by web search had the same gap: Worldline holds many with
timed transcripts (category `video`, missing from the skill's category list),
which give the cited moment and spare the bot-blockable `yt-dlp` fallback.

## Change in this repository

- `skills/alva/references/search.md`, Worldline: before featuring a podcast
  episode or YouTube video found elsewhere, look it up with `searchItems` in the
  `podcast` or `video` category, a window of a day or two around its release,
  and as `keywordQuery` the show name (a podcast item's title is the show, so
  episode-title keywords do not match) or the video title. Match by the id in
  `item.uri` (Apple `i=` = Apple Search `trackId`, YouTube `v=`), else by show
  and publication time; feature a match by `worldline_item`, with a cited
  turn's `offsetSeconds` as `start_seconds` when a passage is the point, and
  the link only without a match.
- `search.md`: `video` (YouTube) added to `sourceCategories`; the Podcasts and
  YouTube sections point to the lookup.
- X posts are left out: FeatureMedia renders an X card from the X API whether
  it is named by link or by item, so a lookup would add latency without
  changing the card.
- `evals/alva-skill-docs/cases.json`: `target.feature-media-worldline-first`.
  `mutation-smoke.mjs`: `feature-media-by-link` (featuring the link instead)
  must fail it.
- No version bump; the release bump and sandbox pin follow the release process.

## Limits

- Captions: only podcast snapshots carry the Worldline item (backend
  `featuredmedia.source`), and only the podcast player shows captions. A
  YouTube video featured by its item gets its cited start, not captions; those
  need backend and App work.

## Evidence for the lookup recipe

PRD Worldline, 2026-11-11:

- Podcast, window 2026-07-26 to 2026-07-29, `podcast`: `keywordQuery`
  `'"Y Combinator"'` and `'"Jensen Huang"'` return the episode first; the
  semantic `query` with the episode title returns it first (similarity 0.75);
  `keywordQuery` on episode-title words returns nothing.
- YouTube, window 2026-11-08 to 2026-11-11, `video`: `keywordQuery` with a
  title phrase, the show name, or the semantic title `query` each return the
  video (`v=wCfuyC61qOI`, 156 timed turns) first.

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`
