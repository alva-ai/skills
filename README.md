# Alva Skills

![Agent Skills](https://alva-ai-static.b-cdn.net/images/alva-skill-github-cover.png)

> Turn your AI agent into a finance powerhouse — access 250+ financial skills, build cloud-side analytics, backtest strategies, and ship live investing playbooks.

## Quick Start

### 1. Install

#### Claude Code

```bash
npx skills add https://github.com/alva-ai/skills
```

#### OpenClaw

```bash
clawhub install alva
```

Or manually copy the skill directory:

```bash
cp -r skills/alva ~/.openclaw/skills/alva
```

#### Other Agents

This skill uses the [AgentSkills](https://github.com/anthropics/agent-skills) format. Any agent that supports `SKILL.md` can load it by pointing to the `skills/alva/` directory.

### 2. Configure

Get an API key at [alva.ai](https://alva.ai), then add it to your agent's environment:

#### Claude Code

```json
// ~/.claude/settings.json
{
  "env": {
    "ALVA_API_KEY": "your_api_key"
  }
}
```

#### OpenClaw

```json
// openclaw.json
{
  "skills": {
    "entries": {
      "alva": {
        "enabled": true,
        "env": { "ALVA_API_KEY": "your_api_key" }
      }
    }
  }
}
```

### Auto-Update

The Alva skill automatically checks for updates on first use each session. If a
newer version is available, your agent will display a notification:

```
Alva skill update available.
  Installed: v1.0.0
  Latest:    v1.2.0
Update with one of:
  npx skills update
  clawhub update alva
  git clone https://github.com/alva-ai/skills ./tmp/alva-skills && cp -r ./tmp/alva-skills/skills/alva/* "<skill-dir>/" && rm -rf ./tmp/alva-skills
```

The check is silent when your skill is up to date. It runs at most once every 8 hours and fails gracefully offline.

### 3. Try It

Start with a simple prompt:

```
Build me an NVDA dashboard with insider trading data and financial metrics
```

That's it. Your agent now has full access to the Alva platform. By default, the skill builds live playbooks unless you explicitly ask for a static snapshot.

---

## Example Prompts

| Use Case         | Example Prompt                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Stock Dashboard  | *"Build a playbook tracking AAPL with price charts, analyst targets, and insider trades"* |
| Crypto Monitor   | *"Create a BTC/ETH dashboard with funding rates, exchange flows, and on-chain metrics"*   |
| Trading Strategy | *"Backtest an RSI mean-reversion strategy on BTC with daily rebalancing"*                 |
| Macro Overview   | *"Build a macro dashboard with CPI, GDP, Treasury rates, and recession probability"*      |
| Screening Tool   | *"Screen for stocks with PE < 15, ROE > 20%, and positive insider buying"*                |

---

## Platform Capabilities

### Data — 250+ Financial Skills

Unified access to crypto, equities, ETFs, macro, on-chain, and social data through built-in skills:

| Category      | Highlights                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| Crypto        | Spot & futures OHLCV, funding rates, open interest, long/short ratios, exchange flows, DeFi metrics         |
| Equities      | Fundamentals (income, balance sheet, cash flow), analyst estimates, price targets, insider & senator trades |
| Macro         | CPI, GDP, unemployment, fed funds rate, Treasury rates, VIX, consumer sentiment                             |
| On-Chain      | MVRV, SOPR, NUPL, whale ratio, exchange inflow/outflow                                                      |
| Social & News | Twitter/X, Reddit, YouTube, podcasts, news feeds, web search                                                |
| Technical     | 50+ indicator calculations — RSI, MACD, Bollinger, ATR, VWAP, Ichimoku, and more                            |

For unstructured content, use `feed_widgets` to subscribe to specific accounts or channels, and `unified_search` to discover content about a topic.

### Compute — Cloud JavaScript Runtime

Write JavaScript that runs on Alva Cloud in a secure V8 isolate. No local dependencies, no infrastructure to manage. Full access to built-in skills, HTTP networking, and LLM APIs.

### Pipelines — Feed SDK

Build persistent data pipelines that store time series data. Schedule them as cronjobs for continuous updates — every minute, every hour, or daily.

### Backtest — Altra Trading Engine

Event-driven backtesting with historical data and live paper trading. Define strategies, register features, simulate portfolios, and analyze performance.

### Deploy & Share — Playbook Web Apps

Turn your work into a hosted web app at `https://alva.ai/u/<username>/playbooks/<playbook_name>`. Built with the Alva Design System — charts, KPIs, tables, and more. You can also remix published playbooks and add a creator's note after release.

---

## Architecture at a Glance

```
┌───────────────┐    ┌──────────────────────────────────────────────────────┐
│   AI Agent    │───▶│                      Alva Cloud                      │
│ (Claude, etc) │    │                                                      │
└───────────────┘    │  ┌──────────────┐  ┌──────────┐  ┌──────────────┐    │
                     │  │  Skill Hub   │  │   ALFS   │  │  JS Runtime  │    │
                     │  │ 250+ Skills  │  │  Files   │  │  V8 Isolate  │    │
                     │  └──────┬───────┘  └────┬─────┘  └──────┬───────┘    │
                     │         │               │               │            │
                     │  ┌──────▼────────────────▼───────────────▼───────┐   │
                     │  │               Feed SDK + Altra                │   │
                     │  │         Data Pipelines & Backtesting          │   │
                     │  └───────────────────────┬───────────────────────┘   │
                     │                          │                           │
                     │  ┌───────────────────────▼───────────────────────┐   │
                     │  │          Cronjobs · Playbooks · Releases      │   │
                     │  └───────────────────────────────────────────────┘   │
                     └──────────────────────────────────────────────────────┘
```

---

## Available Skills

| Skill                            | Description                                                                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[alva](skills/alva/SKILL.md)** | Full Alva platform access — data skills, cloud runtime, feeds, backtesting, and playbook deployment. See the [skill reference](skills/alva/SKILL.md) for detailed API docs. |

---

## Links

- **Platform**: [alva.ai](https://alva.ai)
- **Skill Reference**: [skills/alva/SKILL.md](skills/alva/SKILL.md)
- **Issues**: [github.com/alva-ai/skills/issues](https://github.com/alva-ai/skills/issues)
