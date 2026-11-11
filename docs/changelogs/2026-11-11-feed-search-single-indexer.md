# Tell agents to index a feed output from one task at a time

## Why

During STG validation of feed semantic search (alva-ai/alfs#348), two `index()` calls covered the same 300 new records at the same moment.

- Both calls embedded all 300 records and were each billed: 17,300 tokens each.
- The stored result was still correct: 300 vectors, one per record.

This is by design. The script computes the embeddings, and ALFS takes its lock only when the vectors are written, so concurrent calls cannot see each other's pending work.

The owner asked for this note to be added after the PRD launch, which completed on 2026-11-11.

## Change

- `skills/alva/references/feed-sdk.md`, Semantic Search: a new bullet, "One indexing task per output". It says to index an output from one task at a time, usually the feed's own run right after `append()`. Concurrent calls over the same new records both pay, while the vectors stay correct.
- `evals/alva-skill-docs/cases.json`: `target.feed-semantic-search` now requires the sentence.
- `evals/alva-skill-docs/mutation-smoke.mjs`: the new mutation `feed-search-concurrent-indexers` replaces the sentence with "Any number of tasks may index an output at once" and expects that case to fail.

## Verification

- `node evals/alva-skill-docs/skill-doc-eval.mjs --skill-dir skills/alva`: no failed cases.
- `node evals/alva-skill-docs/mutation-smoke.mjs --skill-dir skills/alva`: 54/54 mutations failed as expected.
- `node --test evals/alva-skill-docs/durable-agent.test.mjs`: 5 passed.

The same note goes into the in-product ALPI slim skill in sdk-monorepo, together with that skill's first `index()`/`search()` section.
