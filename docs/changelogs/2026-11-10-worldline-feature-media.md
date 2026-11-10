# docs(alva): feature cited Worldline passages through FeatureMedia

Local record. Primary design: mono-meta
`docs/changelogs/2026-11-10-feature-media-tool-row.md` (v2; it replaces the
v1 record `2026-10-29-rich-media-in-agent-chat.md`).

## Change in this repository

- `skills/alva/references/search.md`, Worldline citations: when
  `mcp__alva__FeatureMedia` is available (channel, group and task sessions)
  and the user would want to play a cited audio or video passage, the item is
  featured by `item.name` as `worldline_item`, with the cited turn's
  `offsetSeconds` as `start_seconds`; the inline citation stays. The tool's
  own description owns how to call it and how to close the reply (D9).
- v1 removed: the Markdown media-line formats (podcast `#t=…&i=…`, YouTube
  `&t=`, standalone X line), the reply-language rule for link text, and the
  Apple Podcasts "Playable link" note.
- `evals/alva-skill-docs/cases.json`: `target.worldline-feature-media`
  replaces `target.worldline-media-line`. `mutation-smoke.mjs`:
  `worldline-feature-media-by-item` (featuring `item.uri` as `url` instead)
  must fail it.
- No version bump: the release bump and the sandbox pin
  (`sandbox-agent-ts/alva-deps.lock.json`) follow the repository's release
  process.

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`
  (exit 0), `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir
  skills/alva` (52/52 mutations failed as expected, including the new one),
  `node --test evals/alva-skill-docs/durable-agent.test.mjs` (exit 0).
