# Memory

A persistent, file-based memory system on ALFS at `'~/memory/'`, created
automatically when the user's account is provisioned. Use it to accumulate
knowledge about the user across conversations — their identity, preferences,
investment style, and any context useful in future sessions.

Memory files are **user-visible and editable**. The user can read, modify, or
delete any memory file through the Alva dashboard or ALFS API. Write memories
as if the user will read them.

## Storage layout

**ALFS paths** — use single quotes in the shell (example: `'~/memory/MEMORY.md'`).

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

Create new files in `'~/memory/'` for knowledge that doesn't fit in `user.md` —
market convictions, strategy assumptions, portfolio rules. Add a pointer to
`MEMORY.md` for each new file.

## What NOT to save

- Ephemeral conversation details (current debugging session, temp state)
- Things derivable from code or ALFS files
- Raw data or large outputs (store on ALFS as feed data, not in memory)
- Anything already in the Alva skill docs
- Market data that changes every minute (save your *interpretation*, not the
  data)

## Writing rules

1. **Read `'~/memory/MEMORY.md'` first** — check if a relevant file already exists
2. **Update existing file** if the topic matches. Don't create duplicates
3. **Create new file** only if no existing file covers the topic
4. **Update `MEMORY.md`** — add a one-line entry for each new file
5. Keep `MEMORY.md` as a concise index — one line per file, under 120 characters
6. **Every write → confirm in chat:** 📌 Memory updated: {one-sentence summary}

## Reading rules

- **Every conversation start**: Read `'~/memory/MEMORY.md'` via ALFS. Then read
  `user.md` and any topic files relevant to the user's request.
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
