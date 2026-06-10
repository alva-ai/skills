# @alva/social-wire prototype

This is a prototype extraction from `snarketh/kol-market-chat`.

The package goal is not "summarize Twitter". The useful abstraction is an auditable social evidence pipeline:

1. read social posts from one or more adapters
2. normalize them to a stable post schema
3. attach freshness and source provenance
4. rank and filter posts
5. dedupe by durable post ids
6. build a small evidence pack
7. ask an LLM for strict structured output
8. return records a feed can write to `agent/posts`, `agent/tickers`, `chat/messages`, and `notify/message`

Business-specific inputs stay outside the package:

- watchlist source, such as KOL leaderboard rows
- channel names and routing policy
- voice/prompt style
- ticker/topic scoring weights
- UI layout and UDF posting

## Files

- `src/index.js` exports the package surface.
- `src/social-wire.js` contains the orchestrator and default utilities.
- `src/arrays-x-adapter.js` is an Arrays `social-feeds/x/by-handle` adapter.
- `examples/kol-market-chat-feed.js` shows how the current playbook feed would use the package.

## Runtime dependencies

The package receives runtime primitives by dependency injection:

- `fetchJson(url, headers)`
- `loadSecret(name)`
- `ask(prompt)`
- `kv.load(key)` / `kv.put(key, value)`
- optional `logger`

This keeps it usable in Alva feed runtime without hard-coding `env`, `net/http`, `secret-manager`, or `@alva/alvaask`.
