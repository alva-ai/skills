# Memory Management Guide

You have a persistent, file-based memory system on ALFS at `~/memory/`. This is your long-term knowledge about the user — their identity, investment beliefs, decisions, and project context that should survive across conversations.

Memory files are **user-visible and editable**. The user can read, modify, or delete any memory file through the Alva dashboard or ALFS API. Write memories as if the user will read them.

---

## Memory Index

`~/memory/MEMORY_INDEX.md` is the central directory. It is injected into your context at the start of every conversation. Keep it under 2KB.

**Format:**

```markdown
# Memory Index

## Core
- [profile.md](profile.md) — User identity, role, risk tolerance, communication style
- [beliefs.md](beliefs.md) — Investment thesis, market convictions, signal preferences

## Recent
- [recent.md](recent.md) — Last 3 days: key decisions, active tasks, pending items

## Playbooks
- [playbooks/btc-momentum.md](playbooks/btc-momentum.md) — BTC momentum strategy: assumptions, parameters, live status
- [playbooks/eth-carry.md](playbooks/eth-carry.md) — ETH funding rate carry: assumptions, parameters, performance

## Topics
- [topics/portfolio-rules.md](topics/portfolio-rules.md) — Portfolio allocation rules and risk limits
```

Each entry: `- [filename](path) — one-line summary (under 120 chars)`

---

## Memory Types

### profile.md — Who is this user

Persistent facts about the user. Update when you learn something new. Rarely changes day-to-day.

```markdown
# User Profile

## Identity
- Name: (if shared)
- Role: quant trader / data scientist / casual investor / etc.
- Experience: X years in crypto, Y years in quant

## Investment Style
- Primary: trend following / mean reversion / arbitrage / event-driven
- Assets: BTC, ETH, US equities, etc.
- Risk tolerance: conservative / moderate / aggressive
- Max acceptable drawdown: X%
- Time commitment: full-time / check daily / fully agent-managed

## Communication Preferences
- Style: terse / detailed / visual
- Timezone: Asia/Shanghai
- Active hours: 9am-1am (for notification timing)

## Knowledge & Expertise
- Deep: quantitative finance, Python, on-chain analytics
- Learning: Altra backtesting, Alva feed SDK
- Gaps: (things they've asked for help with)
```

**When to update:** User shares personal info, corrects a preference, reveals expertise level, or you learn something that changes how you should work with them.

### beliefs.md — Investment conviction system

**This is the most important memory file.** It captures the user's investment thesis — the assumptions underlying every strategy they build or follow. This drives playbook monitoring, recommendation matching, and proactive alerts.

```markdown
# Investment Beliefs

## Market Convictions (high confidence)
- BTC has persistent momentum in trending regimes (high ADX)
- Crypto markets have momentum effect across assets
- Funding rate is mean-reverting on 4h-1d timeframes

## Market Convictions (developing / being tested)
- On-chain data (active addresses, whale flows) has predictive power for price
- SOL ecosystem activity correlates with SOL price — testing via backtest

## Macro View (update frequently)
- Current narrative: ETF inflows driving BTC bull run (as of 2026-04-08)
- Key variables watching: 10Y yield, ETF net flows, regulatory actions
- Regime assessment: trending / risk-on (last updated: 2026-04-08)

## Signal & Indicator Preferences
- Trusts: moving average systems, ADX, funding rate, on-chain metrics
- Distrusts: pure sentiment, social media signals, LLM-generated predictions
- Preferred timeframes: 4h for entries, daily for regime, weekly for macro

## User-Stated Rules
- "Bull market = full size, bear market = reduce position" (stated 2026-04-08)
- "Never trade during FOMC day" (stated 2026-04-05)
```

**When to update:**
- User states a conviction or market view → add it
- User builds a strategy based on an assumption → extract and record the assumption
- Market data invalidates a conviction → flag it as ⚠️, don't delete (user decides)
- User remixes a playbook → analyze the code, extract implicit beliefs, confirm with user

**How beliefs drive behavior:**
- **Playbook monitoring:** Check if each playbook's assumptions still hold
- **Recommendations:** Match community playbooks to user's belief system
- **Proactive alerts:** When market data contradicts a high-confidence belief
- **Cross-strategy checks:** When two playbooks have conflicting assumptions

### recent.md — Rolling 3-day context

What happened recently. Overwrite (not append) — keep only the last 3 days.

```markdown
# Recent Context

## 2026-04-08
- Deployed BTC momentum strategy v2 (feed: btc-momentum, cronjob: 4835)
- User asked to add SOL to the strategy
- Market signal: ETF outflow $800M — may need to update macro view in beliefs.md

## 2026-04-07
- Optimized stop-loss from 2% to 1.8% based on walk-forward results
- Backtest: Sharpe improved from 0.85 to 0.91

## 2026-04-06
- Built notification e2e test on stg
- User confirmed trend-following as primary style
```

**When to update:** End of a meaningful conversation — summarize what was done, decided, or left pending.

**When to prune:** Remove entries older than 3 days. If something from day 4+ is still important, move it to a playbook file or topic file.

### playbooks/<name>.md — Playbook cognitive profile

One file per playbook the user actively manages. This is NOT code documentation — it's the **cognitive model** of the strategy: what it assumes, how it's performing, what needs attention.

```markdown
# BTC Momentum Strategy

## Core Assumptions
| # | Assumption | Status | Last Verified | Evidence |
|---|-----------|--------|---------------|----------|
| 1 | BTC has momentum in high-ADX regimes | ✅ Active | 2026-04-08 | ADX=28, momentum factor +2.1σ |
| 2 | 50MA/200MA crossover confirms trend | ✅ Active | 2026-04-08 | Golden cross since 2026-03-15 |
| 3 | 2% stop-loss filters noise | ⚠️ Under review | 2026-04-07 | Volatility up, testing 1.8% |
| 4 | Bull market = full size | 📝 User belief | 2026-04-08 | Not coded, monitor macro |

## Parameters
- Lookback: 20 bars (4h candles)
- Regime: EMA crossover (fast=10, slow=30)
- Max position: 0.7x leverage
- Stop-loss: 1.8% (was 2%, optimized 2026-04-07)
- Rebalance: every 4h via cronjob ID 4835

## Performance
- Backtest (6mo): +6.0%, Sharpe 0.91, max DD 18.7%
- Live (paper, since 2026-04-02): +1.2%

## Data Sources
- Using: OHLCV, funding rate
- Relevant but unused: DEX volume (Raydium/Orca), staking rate, GitHub activity
- Agent recommendation: Add DEX volume — backtest shows +23% in active ecosystem periods

## Open Items
- [ ] Add SOL to strategy (user request 2026-04-08)
- [ ] Add macro regime breaker (from beliefs: bear market = reduce position)
- [ ] Test with DEX volume data enhancement
```

**When to create:** User deploys a playbook, remixes a playbook, or updates playbook parameters.

**When to update:** Parameters change, assumptions get validated/invalidated, performance data updates, user makes decisions about the strategy.

### topics/<name>.md — General persistent knowledge

For knowledge that doesn't fit in a playbook file. Portfolio-wide rules, market analysis frameworks, tooling notes.

```markdown
# Portfolio Risk Rules

## Allocation
- Max 30% in any single asset
- Max 2x total leverage across all strategies
- Keep 20% in stablecoins as dry powder

## Correlation
- Don't run two momentum strategies on correlated assets simultaneously
- BTC momentum + ETH carry OK (low correlation)
- BTC momentum + SOL momentum BAD (high correlation)

## Drawdown Rules
- Single strategy DD > 15% → pause and review assumptions
- Portfolio DD > 10% → reduce all positions 50%
- User override: "Never auto-close, just alert me" (stated 2026-04-05)
```

---

## Writing Rules

### What to save

| Signal | Where to save |
|--------|---------------|
| User shares identity, preferences, expertise | `profile.md` |
| User states a market conviction or investment thesis | `beliefs.md` |
| User corrects your approach or confirms a non-obvious choice | `profile.md` (preferences) or `beliefs.md` (conviction) |
| Meaningful conversation completed | `recent.md` |
| User deploys, remixes, or updates a playbook | `playbooks/<name>.md` |
| Portfolio-wide rules, tooling notes | `topics/<name>.md` |
| User says "remember this" | Best-fit file, immediately |

### What NOT to save

- Ephemeral conversation details (current debugging session, temp state)
- Things derivable from code, ALFS files, or git history
- Raw data or large outputs (store on ALFS as feed data, reference in memory)
- Anything already in CLAUDE.md or the Alva skill docs
- Market data that changes every minute (save your *interpretation*, not the data)

### Writing process

1. **Read `~/memory/MEMORY_INDEX.md`** first — check if a relevant file already exists
2. **Update existing file** if the topic matches. Don't create duplicates
3. **Create new file** only if no existing file covers the topic
4. **Update MEMORY_INDEX.md** — add/update the one-line summary
5. **Verify write** — read the file back to confirm it saved correctly

---

## Reading Rules

### When to read memory

- **Every conversation start**: Read `MEMORY_INDEX.md`, `profile.md`, `beliefs.md`, `recent.md`. Read playbook/topic files only if relevant to the user's request.
- **User references prior work**: "that strategy from last time" / "the rules we discussed" → read the relevant memory file.
- **User explicitly asks**: "do you remember" / "check my profile" → you **must** read.
- **User says to ignore memory**: Proceed as if `~/memory/` is empty. Don't apply, cite, or mention remembered content.

### Memory is a claim, not truth

Memory records what was true **when the memory was written**. The user may have changed their mind, deleted a playbook, or updated parameters since then. Before acting on a memory:

- Memory names a **feed or playbook** → check it exists via ALFS API before referencing it.
- Memory names a **cronjob or parameter** → verify current state before recommending changes.
- Memory records a **market view or conviction** → treat as the user's last-known position, not current fact. If the user is about to trade on it, confirm it's still their view.
- Memory records **user preferences** → apply directly (these are stable).

If a memory conflicts with what the user just told you, **trust what the user says now** — and update the memory.

### Memory summaries are frozen in time

`recent.md` and playbook performance snapshots reflect the moment they were written. If the user asks about **current** state, read ALFS or run the feed — don't cite the snapshot.

---

## Conversation Flow

Every conversation: read `MEMORY_INDEX.md`, `profile.md`, `beliefs.md`, `recent.md` at start. Read playbook/topic files only if relevant to the user's request. Update files inline as you learn — don't batch to end. If you extract assumptions from a strategy, confirm with the user before saving. After meaningful work, update `recent.md` and prune entries older than 3 days.
