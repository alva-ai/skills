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

Journal prose alone is not user confirmation. User edits are respected, but
deleting or rewriting an old Journal does not request replay. Dream may promote
durable user memory only from traceable original user statements; never promote
assistant output, automation output, third-party claims, or inference into
`user.md` as if the user stated it.

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

Do not create a new `investing.md`. If one already exists, keep it readable and
do not bulk-migrate or delete it. Put new or revised investment memory in
`user.md`; when the user next revises an overlapping entry, consolidate that
entry into `user.md` without leaving two active copies.

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

## Knowledge

- Level: <!-- Beginner / Intermediate / Advanced / Professional -->
- Strong: <!-- e.g. Technical analysis, On-chain, Macro -->
- Learning:
- External tools: <!-- e.g. TradingView, Bloomberg, Dune -->

## Interaction Preferences

- Communication style: <!-- e.g. terse / detailed / visual -->
- Notification channel:

## Interests

<!-- Areas the user explicitly wants Alva to keep watching or connect to future
research. Keep a flexible flat list. An Interest is not a confirmed Thesis or
intent to trade. -->

## Investment Thesis

<!-- User-explicit or user-confirmed, falsifiable investment judgments. Scope,
Horizon, Thesis, and Last confirmed are the core fields. Optional fields belong
only when supported and useful; never invent missing details. -->

## Action Preferences

<!-- User-explicit or user-confirmed investment action defaults and safety
boundaries across investment theses. Do not store current positions, orders, or
general communication preferences here. -->
```

**When to update:** The user directly states stable personal information,
corrects a preference, reveals expertise, explicitly asks you to remember
something safe, or states, confirms, or revises investment memory. Do not infer
durable memory from repeated behavior or repeated queries alone.

### Investment memory examples

These examples illustrate shape only. Never copy them into a user's memory
without supporting original user statements.

#### Interests

Interests are user-stated areas Alva should keep watching or connect to future
research, alerts, or strategy discussions. They do not imply a confirmed Thesis
or intent to trade. Keep entries flat and include only useful fields:

```markdown
- Topic: AI infrastructure
- Asset: NVDA · Market: NASDAQ · Why: AI compute demand · Horizon: 6-12 months · Updated: 2026-07-10
- Person: Jensen Huang · Why: NVIDIA product and demand signals
- Info source: @Reuters · Type: X account · URL: https://x.com/Reuters
```

Types and fields are flexible. Topics, assets, people, news sites, X accounts,
podcasts, newsletters, and company IR pages are all valid when the user states
the interest. A single query does not create an Interest.

#### Investment Thesis

An Investment Thesis is a user-stated or user-confirmed judgment that later
evidence can support or disprove. Its title should state the conclusion.

- `Scope` — the asset, theme, sector, macro regime, or cross-asset relationship.
- `Horizon` — the expected life of this judgment, not the user's general holding
  period.
- `Thesis` — the concise, falsifiable judgment.
- `Last confirmed` — the latest user-confirmed date and, when available, channel.

```markdown
### US rates · Higher for longer
- Scope: US rates and long-duration growth equities
- Horizon: 3-9 months
- Thesis: Sticky services inflation can keep real yields elevated and limit valuation expansion.
- Last confirmed: 2026-07-10 · Macro Channel
- Key drivers: Services inflation; labor demand; term premium.
- Invalidation: Inflation and labor data weaken enough to support sustained rate cuts.
- Expression: Prefer quality and shorter-duration exposure; remain cautious on long duration.
```

`Scope`, `Horizon`, `Thesis`, and `Last confirmed` are the core shape, not a
validation gate. Update `Last confirmed` whenever the user confirms or revises
the Thesis; omit the channel when unavailable. If the user did not give a
Horizon, do not infer one or add a placeholder. Ask only when the missing
Horizon materially affects the current action.

`Stance`, `Key drivers`, `Catalysts`, `Invalidation`, and `Expression` are
optional; include them only when supported and useful. Dream may append
`Needs review` when the Thesis has a freshness risk. Keep one-off event
judgments in Channel Memory or Journal, and concrete strategy parameters in the
relevant Playbook or Automation domain state.

#### Action Preferences

Action Preferences are user-stated or user-confirmed investment action defaults
and safety boundaries that apply across investment theses. They are not current
positions, orders, or general communication preferences:

```markdown
- Entry: High-volatility assets · Prefer staged entries; do not chase sharp intraday moves.
- Risk: Single position · Warn before planned exposure exceeds 10% of the portfolio.
- Live execution: All assets · Confirm before placing, changing, or cancelling an order.
```

`Expression` describes how one Thesis may be expressed. A rule that applies
across investment theses belongs in Action Preferences.

## Additional topic files

Keep cross-channel user understanding, including market convictions and action
rules, in `user.md` by default. Existing topic files remain valid; create a new
file or pack only for a genuinely separate domain contract or structured
feature memory, then link it from that scope's `MEMORY.md`.

## What NOT to save

- Full transcripts, tool logs, raw large outputs, or temporary debugging state
- Content reliably available from code, ALFS files, Skill docs, or another
  authoritative system
- Secrets, credentials, tokens, private keys, or other unsafe content
- Automation/feed runtime state, cursors, schedules, and delivery state (their
  own DB/feed/state files are authoritative; Journal may retain a useful outcome)
- Current market data, positions, cash, or orders (save only a user-confirmed
  durable interpretation, never the live value)

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
10. **Use original user evidence for durable user memory** — Journal prose,
    assistant output, automation output, third-party claims, inference, and
    repeated behavior are not user confirmation.
11. **Honor corrections and forget requests** — replace or remove obsolete
    durable entries and do not reintroduce forgotten content into later Journal.

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
