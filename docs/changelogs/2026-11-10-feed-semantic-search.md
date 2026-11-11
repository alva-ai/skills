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
  million tokens on the run's credits, checked per embedding request, so a
  call that runs out partway keeps what it already paid for and wrote); a
  near-duplicate check before publishing whose text helper applies the same
  8,000-byte cut as indexing; `@alva/openai-embeddings` for text outside a
  Feed. One pitfall bullet.
- `evals/alva-skill-docs/cases.json`: `target.feed-semantic-search`.
  `mutation-smoke.mjs`: `feed-search-mixed-fields` (allowing different fields
  per call) and `feed-search-whole-call-credit-check` (promising a whole-call
  credit check) must fail it.
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
- Codex round 7 (changes): R7-1 the credit check is per request, not per
  call; R7-2 the duplicate-check helper must apply the 8,000-byte cut. Fixed
  in the doc; checked by running the document's own snippet and a budget that
  runs out partway through `index()` against the bundled SDK artifacts: the
  old helper is rejected for a 9,000-byte text, the new one sends exactly the
  text ALFS indexes when a 2-byte character crosses the cut; with 6 payable
  requests over 304 records, `index()` throws after 6 paid requests with the
  first 152 vectors kept, and a rerun embeds only the other 152.
