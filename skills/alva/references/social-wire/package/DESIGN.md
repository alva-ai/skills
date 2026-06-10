# social-wire package design

## Purpose

`social-wire` should own the reusable mechanics between "read social posts" and "produce auditable structured summaries".

It should not own a product's editorial identity, channel taxonomy, or source-specific business logic. Those stay in each playbook feed or skill template.

## Proposed package API

```js
const { SocialWire, createArraysXByHandleAdapter } = require("@alva/social-wire");

const wire = new SocialWire({
  adapters: [createArraysXByHandleAdapter({ fetchJson, loadSecret })],
  ask,
  kv: ctx.kv,
  allowed_channels: ["market-wire", "semis"],
  default_channel: "market-wire",
  voice: "... product-specific prompt voice ...",
  route_ticker: (ticker, context) => "semis",
});

const result = await wire.run(subjects, {
  lookbackSeconds: 36 * 60 * 60,
  max_new_posts: 10,
  max_posts: 12,
});
```

## Package-owned concerns

- adapter contract for social sources
- X/Twitter post normalization
- durable post ids
- ticker extraction from entities and cashtags
- fetched_at/source_endpoint/source_query/source_as_of provenance
- rank/filter ordering
- KV dedup with retention
- evidence pack shape
- prompt skeleton that enforces source-grounded structured output
- fallback summary when LLM fails
- summary normalization
- ticker context construction

## Product-owned concerns

- how to build subjects/watchlists
- channel names and routing policy
- prompt voice and language quality requirements
- domain-specific scoring boosts
- leaderboard/author credibility wording
- price fetching
- feed doc schema and writes
- UI filtering/layout
- UDF posting

## Why this split

`kol-market-chat` mixes three layers today:

1. reusable social evidence pipeline
2. Algostonk/KOL leaderboard business logic
3. playbook-specific chat UI output

Layer 1 is safe to abstract. Layers 2 and 3 should remain explicit because they define the product behavior.

## Important design choices

### Evidence first

The abstraction is not "LLM summarize Twitter". It is "build auditable social evidence and then summarize it". The package keeps `post_id`, `url`, `published_at`, `fetched_at`, `source_endpoint`, and `source_query` with every normalized post.

### Runtime injection

The package does not import `env`, `net/http`, `secret-manager`, or `@alva/alvaask` directly. Feed runtime code injects:

- `fetchJson`
- `loadSecret`
- `ask`
- `kv`
- `logger`

This keeps the package testable and usable outside one runtime.

### Dedup at package layer

Dedup is core social-wire behavior. Product feeds should not repeatedly solve "do not notify the same post twice".

### Adapter shape

Adapters return raw rows plus source metadata:

```js
{
  raw: { ...provider post... },
  source: {
    platform: "x",
    handle: "handle",
    fetched_at: "2026-06-10T08:01:00Z",
    source_endpoint: "https://...",
    source_query: { twitter_handle: "handle", since: 123 },
    source_as_of: "2026-06-10T08:01:00Z",
    author_context: { best_rank: 10 },
    domain_context: { top_tickers: ["NVDA"] }
  }
}
```

## Open questions before productionizing

- Should this live as a feed-runtime npm package or as a skill template utility?
- Does feed runtime support shared package versioning cleanly enough?
- Should `agent/posts`, `agent/tickers`, `chat/messages`, and `notify/message` become canonical doc schemas?
- How strict should the prompt skeleton be across products?
- Should price fetching be a separate `market-context` package rather than part of `social-wire`?
- Should provenance include provider response metadata beyond query/fetched_at, such as upstream cursor/cache age if Arrays exposes it?
