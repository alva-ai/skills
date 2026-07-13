# Memory

A persistent, file-based memory system on ALFS. The user-global scope lives at
`'~/memory/'`, created automatically when the user's account is provisioned. A
channel session may also provide a channel-scoped memory root. Use memory to
accumulate knowledge across conversations — user identity, preferences,
investment style, and channel context that will matter later.

Memory files are **user-visible and editable**. The user can read, modify, or
delete any memory file through the Alva dashboard or ALFS API. Write memories
as if the user will read them.

## Storage layout

**ALFS paths** — use single quotes in the shell (example: `'~/memory/MEMORY.md'`).

### Scope root

```
~/memory/
├── MEMORY.md     # Concise index — read at the start of every conversation
└── user.md       # Cross-channel identity, preferences, investment style, theses
```

`MEMORY.md` is the entrypoint. Read it at the start of every conversation to
discover what's stored. Keep it concise — under 200 lines. Each entry is one
line linking to a topic file:

```markdown
- [user.md](user.md) — identity, investment style, interests, theses and preferences
```

Keep the default global model in `user.md`; investment style, watched areas,
theses, and action preferences do not get a separate `investing.md`.

### Channel-scoped memory

`~/memory/` is **user-global** (shared across all channels). A **channel** can
also have its own memory at `~/channels/<slug>/memory/`, named in the session
prefill as a `<session-prefill-channel-memory root="...">` block:

```text
~/channels/<slug>/memory/
├── MEMORY.md
└── journal/
    └── YYYY-MM-DD.md
```

- User-global facts (identity, cross-channel preferences) → `~/memory/`.
- Channel-specific facts (this channel's topic, decisions) → the prefill root.
- Read both indexes at the start of a channel turn. No prefill block → no
  channel scope; use `~/memory/` only.
- The default Alva channel uses the same layout at
  `~/channels/alva/memory/`; it is not an alias for global memory.

### Journal

Journal files are user-visible, user-editable daily summaries maintained by an
internal background turn. Normal conversation turns do not append Journal or
load full daily files by default. A new/reset session may receive a small,
quoted Carry Forward prelude; otherwise read Journal only when the user asks or
the current task genuinely needs that history.

Journal is not durable user evidence. User edits are respected, but deleting or
rewriting an old Journal does not request replay. Never promote assistant output,
automation output, third-party claims, or Journal prose into `user.md` as if the
user stated it.

### Scope root resolution

`<scope-root>` is not a literal path. Resolve it before reading or writing pack
memory:

1. Default to the user-global root: `~/memory/`.
2. If the session prefill includes `<session-prefill-channel-memory root="...">`
   and the memory is specific to this channel, use that exact `root`.
3. If no channel-memory prefill is present, there is no channel scope. Do not
   invent `~/channels/<slug>/memory/`.
4. Choose the narrowest correct scope: cross-channel user preferences go to
   `~/memory/`; this channel's topic, decisions, and context go to the channel
   root.
5. A pack root is always `<resolved-scope-root>/packs/<pack-name>/`. If a skill
   helper accepts `--root` or a root environment variable, pass the pack root,
   not the raw scope root.

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

Compatibility: existing topic files directly under `~/memory/` or a channel
memory root remain first-class memory. Do not migrate, rename, or rewrite an
existing topic file into a pack just because packs exist. Use packs for new
feature-, skill-, or domain-specific memory when no existing topic file already
covers the need.

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

## Interaction Preferences

- Communication style: <!-- e.g. terse / detailed / visual -->
- Notification channel:

## Interests

- Topics:
- Companies / assets:

## Investment Thesis

- <!-- Only user-explicit or user-confirmed theses belong here. -->

## Action Preferences

- <!-- e.g. Ask before trading; prefer staged changes; notify on material changes. -->
```

**When to update:** User shares personal info, corrects a preference, reveals
expertise level, states investment convictions, or you learn something that
changes how you should work with them.

## Additional topic files

Keep cross-channel user understanding, including market convictions and action
rules, in `user.md` by default. Existing topic files remain valid; create a new
file or pack only for a genuinely separate domain contract or structured
feature memory, then link it from that scope's `MEMORY.md`.

## What NOT to save

- Ephemeral conversation details (current debugging session, temp state)
- Things derivable from code or ALFS files
- Raw data or large outputs (store on ALFS as feed data, not in memory)
- Automation/feed runtime state, cursors, schedules, and delivery state (their
  own DB/feed/state files are authoritative; Journal may retain a useful outcome)
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
8. **Write files directly** with ordinary `alva fs` operations; do not invent a
   proposal/validator queue or hidden review state.
9. **Every conversational write → confirm in chat:** 📌 Memory updated:
   {one-sentence summary}. Internal Journal/Dream maintenance completes silently.

## Reading rules

- **Every conversation start**: Read `'~/memory/MEMORY.md'` via ALFS, then
  `user.md` and any topic files relevant to the user's request when present. In
  a channel session, also read the channel root's `MEMORY.md` and relevant topic
  files when present. Channel roots do not have their own `user.md`.
- **Journal**: Do not load complete Journal files at every turn. Use a supplied
  Carry Forward prelude, or read a bounded relevant daily file on explicit need.
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
