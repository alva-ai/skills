# docs(alva): teach feed semantic search with index() and search()

Local record. Primary design: alva-ai/alfs
`docs/changelogs/2026-11-02-feed-search-index.md` (alfs#344, synthdb#32,
jagent#1298, jagent-deno#65, sdk-monorepo#514).

## Change in this repository

- `skills/alva/references/feed-sdk.md`, TimeSeries API: `search()` and
  `index()` rows, and a "Semantic Search (`index()` and `search()`)" section:
  explicit indexing after `append()`; the embedded text (non-empty string
  `fields` joined by a blank line, cut at 8,000 bytes, one vector per record);
  one index per output, so an output keeps one set of `fields`; scope by range
  or dates; results always hold up to `limit` hits, so filter by a calibrated
  score; the 10,000-vector `limited` cap; upstream search; cost (22 credits per
  million tokens on the run's credits); a near-duplicate check before
  publishing; `@alva/openai-embeddings` for text outside a Feed. One pitfall
  bullet.
- `evals/alva-skill-docs/cases.json`: `target.feed-semantic-search`.
  `mutation-smoke.mjs`: `feed-search-mixed-fields` (allowing different fields
  per call) must fail it.
- Merge only after `@alva/feed` 1.0.14 and `@alva/openai-embeddings` 1.0.0 are
  published to production (rollout step D9); before that, scripts following
  this section would fail.
- No version bump: the release bump and the sandbox pin follow the
  repository's release process.

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`,
  `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`,
  `node --test evals/alva-skill-docs/durable-agent.test.mjs`: see the PR.
- The two code samples follow the feed examples that ran against the bundled
  `@alva/feed` 1.0.14 and `@alva/openai-embeddings` artifacts with a fake ALFS
  (examples 02 and 03 on the review page).
