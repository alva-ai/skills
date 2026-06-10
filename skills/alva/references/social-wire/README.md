# Social Wire Reference

This reference captures a refined production playbook pattern from
`snarketh/kol-market-chat` and a package-shaped prototype for extracting the
reusable part.

Use it when building or reviewing a playbook that reads Twitter/X or other
social posts, filters them into evidence, and asks an LLM to produce a
source-grounded digest or alert.

## Contents

- `kol-market-chat-original/` is the original code snapshot used for the
  extraction:
  - `feed-index.js` - original feed producer source.
  - `index.html` - original playbook UI.
  - `udf-post_message.js` - original viewer posting UDF.
  - `*.json` - feed/playbook metadata snapshots.
  - `analysis-report.md` - structure and risk notes.
- `package/` is a prototype package named `@alva/social-wire`:
  - `src/social-wire.js` - pipeline orchestrator and default utilities.
  - `src/arrays-x-adapter.js` - Arrays X by-handle adapter.
  - `examples/kol-market-chat-feed.js` - example feed integration.
  - `DESIGN.md` - package boundary and open questions.

## Extraction Boundary

The reusable abstraction is not "summarize Twitter". It is an auditable social
evidence pipeline:

1. read social posts through source adapters
2. normalize post shape
3. attach `published_at`, `fetched_at`, `source_endpoint`, `source_query`, and
   `source_as_of`
4. extract entities and tickers
5. rank and filter posts
6. dedupe durable post ids
7. build a compact evidence pack
8. request strict structured LLM output
9. normalize the summary and ticker context for feed outputs

Keep these product-specific concerns outside the package:

- watchlist/source construction
- channel taxonomy and routing policy
- editorial voice and product-specific prompt rules
- domain-specific scoring weights
- leaderboard credibility wording
- market price fetching
- playbook UI and UDF behavior

## Recommended Usage

Start with the package as a feed-template utility. Move it to a shared runtime
package only after the adapter contract and canonical feed output schemas have
stabilized.

For a new social digest playbook, wire the package as:

```javascript
const { SocialWire, createArraysXByHandleAdapter } = require("@alva/social-wire");

const wire = new SocialWire({
  adapters: [createArraysXByHandleAdapter({ fetchJson, loadSecret })],
  ask,
  kv: ctx.kv,
  allowed_channels: ["market-wire", "semis"],
  default_channel: "market-wire",
  voice: productSpecificVoice,
  route_ticker: productSpecificRouter,
});

const result = await wire.run(subjects, {
  lookbackSeconds: 36 * 60 * 60,
  max_new_posts: 10,
  max_posts: 12,
});
```

Then let the feed write `result.all_posts`, `result.new_posts`, and
`result.summary` into the product's own docs.

## Review Checklist

- Each post has a durable `post_id` and original source URL.
- Each normalized row has a fetch/provenance timestamp.
- The prompt says "use only INPUT" and requires source URLs in output.
- No source-less LLM summary should be shown as a fresh social digest.
- Dedup retention is explicit.
- Empty/new-post skip behavior is silent or intentionally notifies with a
  sentinel such as `<|SKIP_NOTIFICATION|>`.
- Product-specific voice, routing, and watchlist code did not leak into the
  shared package.
