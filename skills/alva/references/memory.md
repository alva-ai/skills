# Memory

A persistent, file-based memory system on ALFS. The user-global scope lives at
`'~/memory/'`, created automatically when the user's account is provisioned. A
channel session may also provide a channel-scoped memory root. Use memory to
accumulate knowledge across conversations — user identity, preferences,
investment style, channel context, and feature-specific state that will matter
later.

Memory files are **user-visible and editable**. The user can read, modify, or
delete any memory file through the Alva dashboard or ALFS API. Write memories
as if the user will read them.

## Storage layout

**ALFS paths** — use single quotes in the shell (example: `'~/memory/MEMORY.md'`).

### Scope root

```
~/memory/
├── MEMORY.md     # Concise index — read at the start of every conversation
└── user.md       # User profile, preferences, expertise, investment style
```

`MEMORY.md` is the entrypoint. Read it at the start of every conversation to
discover what's stored. Keep it concise — under 200 lines. Each entry is one
line linking to a topic file:

```markdown
- [user.md](user.md) — User identity, investment style, knowledge level
- [market-views.md](market-views.md) — Current macro thesis, conviction trades
```

Topic files (like `user.md`) hold the actual content. They are read on demand
when relevant to the user's request.

### Channel-scoped memory

`~/memory/` is **user-global** (shared across all channels). A **channel** can
also have its own memory at `~/channels/<slug>/memory/`, named in the session
prefill as a `<session-prefill-channel-memory root="...">` block. Same layout —
a `MEMORY.md` index plus topic files.

- User-global facts (identity, cross-channel preferences) → `~/memory/`.
- Channel-specific facts (this channel's topic, decisions) → the prefill root.
- Read both indexes at the start of a channel turn. No prefill block → no
  channel scope; use `~/memory/` only.

### Memory packs

A Memory Pack groups feature-, skill-, or domain-specific memory inside the
current scope:

```text
<scope-root>/packs/<pack-name>/
├── MEMORY.md
├── state.md
├── rules.md
└── data/          # optional synth mount with append-only streams
```

- `MEMORY.md` is the pack index and short summary.
- `state.md` is editable current state or a bounded projection.
- `rules.md` is durable user or process rules.
- `data/` is optional append-only ledger storage for compact events, refs,
  hashes, and as-of timestamps.

First-version memory semantics use editable Markdown files and optional
append-only ledgers. Do not rely on `@kv` as product memory, user-visible truth,
or a stable memory contract.

Pack docs are read on demand. Do not load every pack at conversation start; use
the scope root index to discover relevant packs, then read the pack index and
specific files needed for the task. Append ledgers are never default prompt
context; read a bounded projection, exact stream, or latest N records only when
history or audit is needed.

### Ledger definition contract

Never create an opaque ledger stream. Before writing to an append-only stream,
the stream's meaning must be discoverable from one of two places:

1. **Skill-defined ledger** — the current skill documents the stream name, path,
   what records belong there, when to write it, when to read it, and any
   typedoc/schema. The pack memory may only need to point to that skill contract
   and record local overrides.
2. **Memory-defined custom ledger** — the user defined it, or the skill tailored
   it for this user/channel. In that case, write the contract into the current
   scope/pack memory first, usually the pack `MEMORY.md` or `ledger.md`: stream
   name, path, record contents, write triggers, read triggers, and projection
   file.

If a stream is not defined by the skill, define it in memory before using it.
Skill defaults are the baseline; per-user or per-channel memory records the
active custom contract.

## user.md — Who is this user

Persistent facts about the user. Update when you learn something new.

```markdown
# User Profile

> Auto-maintained by Alva Agent. You can edit directly.

## Identity

- Name:
- Role: <!-- e.g. Independent Trader, PM at Fund, Research Analyst, Student -->
- Timezone:
- Language:

## Investment Style

- Markets: <!-- e.g. US Equities, Crypto, Macro, Commodities -->
- Strategy: <!-- e.g. Momentum, Mean Reversion, Fundamental, Event-driven -->
- Holding period: <!-- Intraday / Swing / Position / Long-term -->
- Risk tolerance: <!-- Conservative / Moderate / Aggressive -->
- Watching:

## Knowledge

- Level: <!-- Beginner / Intermediate / Advanced / Professional -->
- Strong: <!-- e.g. Technical analysis, On-chain, Macro -->
- Learning:
- External tools: <!-- e.g. TradingView, Bloomberg, Dune -->

## Preferences

- Communication style: <!-- e.g. terse / detailed / visual -->
- Notification channel:
- Playbook publishing: <!-- e.g. default public release / draft-only before publishing -->
```

**When to update:** User shares personal info, corrects a preference, reveals
expertise level, states investment convictions, or you learn something that
changes how you should work with them.

## Additional topic files

Create new files in the relevant scope root for knowledge that doesn't fit in
`user.md` — market convictions, strategy assumptions, portfolio rules. Add a
pointer to that scope's `MEMORY.md` for each new file. If the topic belongs to a
feature or domain, use that scope's `packs/<pack-name>/` instead.

## What NOT to save

- Ephemeral conversation details (current debugging session, temp state)
- Things derivable from code or ALFS files
- Raw data or large outputs (store on ALFS as feed data, not in memory)
- Anything already in the Alva skill docs
- Market data that changes every minute (save your *interpretation*, not the
  data)

## Writing rules

1. **Choose the narrowest correct scope** — user-global facts go to
   `'~/memory/'`; channel-specific facts go to the channel root from prefill.
2. **Use a pack for feature/domain state** — write Alvest, playbook-builder,
   creator-style, or other feature-specific memory under the current scope's
   `'packs/<pack-name>/'`.
3. **Read the scope `MEMORY.md` first** — check if a relevant file or pack
   already exists.
4. **Update existing files** if the topic matches. Don't create duplicates.
5. **Create new files or packs** only if no existing entry covers the topic.
6. **Update the relevant `MEMORY.md` index** — add a one-line entry for each new
   file or pack.
7. Keep indexes concise — one line per file or pack, under 120 characters.
8. **Every write → confirm in chat:** 📌 Memory updated: {one-sentence summary}

## Reading rules

- **Every conversation start**: Read `'~/memory/MEMORY.md'` via ALFS, then
  `user.md` if it exists. In a channel session, also read the channel root's
  `MEMORY.md` and `user.md` if present.
- **Pack relevance**: Read a pack's `MEMORY.md`, `state.md`, `rules.md`, or
  other Markdown files only when the request, current skill, or scope index
  makes that pack relevant.
- **Append ledgers**: Never load ledger streams by default. Read bounded latest
  records or a projection only when the task needs history, evidence, or audit.
- **User references prior work**: "that strategy from last time" / "the rules
  we discussed" → read the relevant memory file.
- **User explicitly asks**: "do you remember" / "check my profile" → you
  **must** read.
- **User says to ignore memory**: Proceed as if `'~/memory/'` is empty.

## Memory is a claim, not truth

Memory records what was true **when the memory was written**. Before acting on
a memory:

- Memory names a **feed or playbook** → verify it exists on ALFS before
  referencing it.
- Memory names a **cronjob or parameter** → verify current state before
  recommending changes.
- Memory records a **market view** → treat as the user's last-known position,
  not current fact.
- Memory records **user preferences** → apply directly (these are stable).

If a memory conflicts with what the user just told you, **trust what the user
says now** — and update the memory.
