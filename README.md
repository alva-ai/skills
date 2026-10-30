# Alva Skills

![Agent Skills](https://alva-ai-static.b-cdn.net/images/alva-skill-github-cover-new.png)

> Turn your AI agent into Alva Agent: get sourced market answers, run research
> Automations, build and subscribe to Playbooks, and backtest or trade on Alva
> Cloud.

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

Any [Agent Skills](https://agentskills.io) client can load `skills/alva/`.

### 2. Connect Alva

Install the Alva toolkit, sign in, and verify the active account:

```bash
npm install -g @alva-ai/toolkit@latest
alva auth login
alva whoami
```

For headless environments, create an API key at [alva.ai](https://alva.ai) and
configure it directly:

```bash
alva configure --api-key alva_your_key_here
```

You can also provide the key as `ALVA_API_KEY` in your agent's environment.

### 3. Try It

Ask a market question:

```text
Explain why NVDA moved last week and what changed in semis
```

Alva answers one-off questions in chat. For ongoing research, ask it to build an
Automation or Playbook. Playbooks use live data by default; request a static
snapshot explicitly.

### Keep It Updated

The skill checks GitHub for updates on first use, at most once every eight
hours. It stays silent when current or offline. When needed, it prints the exact
update command.

- Agent Skills CLI: `npx skills update`
- OpenClaw: `clawhub update alva`

## Example Prompts

| Use Case                         | Example Prompt                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Ask Market Questions             | Explain why NVDA moved last week and what changed in semiconductors.                                         |
| Check Company Anomalies          | Analyze AAPL and check whether its latest move looks company-specific or sector-driven.                      |
| Research Fintwit                 | Who are the top tracked semiconductor voices on Fintwit, and what are they saying about AI infrastructure?   |
| Automate Research & Alerts       | Track meaningful changes in SPY, QQQ, NVDA, MSFT, and TSLA every weekday at 8:30am ET and alert me.          |
| Build Playbooks                  | Build a Playbook tracking AAPL with price charts, analyst targets, and insider trades.                       |
| Discover, Subscribe & Remix      | Find a semiconductor Playbook tracking AI infrastructure, subscribe to it, and show me how I could remix it. |
| Use a Skillhub Method            | Use the Alva thesis method from Skillhub to track NVDA's AI infrastructure thesis.                           |
| Backtest Strategies              | Backtest an RSI mean-reversion strategy on BTC with daily rebalancing.                                       |
| Work with Connected Accounts     | Show my connected portfolio holdings and summarize recent activity.                                          |
| Add Interactive Playbook Actions | Add a Run analysis action to this Playbook for the selected ticker.                                          |

## Platform Capabilities

### Research

One-off market questions return sourced results in chat. Alva keeps Data Skills,
Platform Data, and source-backed search separate, so you can see where each
claim comes from.

#### Structured Data Skills

Alva exposes 250+ structured endpoints across these data areas:

| Data Area                       | Representative Coverage                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Equity prices & volume          | US intraday and daily OHLCV; curated non-US daily bars; raw price, volume, and price-change history                                                                                                                             |
| Equity fundamentals & valuation | Company profiles, financial statements, KPIs, shares and float, TTM metrics, margins, leverage and liquidity ratios, P/E, P/B, P/S, enterprise value, EV/EBITDA, estimates, price targets, and company guidance                 |
| Equity events & ownership       | Dividends, splits, earnings calendars, transcripts and SEC releases, IPOs, M&A and offerings, institutional holdings, insider and Congress trades, and short interest                                                           |
| Stock screening & technicals    | Country, exchange, industry and sector screens; financial, event and technical filters; moving averages, RSI, MACD, Bollinger Bands, VWAP, beta, volatility, dark-pool OHLC, and point-in-time ratings                          |
| ETFs                            | Fund details, holdings, country and sector weights, and fund flows                                                                                                                                                              |
| Options                         | Contract specifications, OHLCV and VWAP history, full option chains, historical Greeks, implied volatility, volume, and open interest                                                                                           |
| Crypto spot & derivatives       | Binance and Hyperliquid spot/perpetual OHLCV, funding rates, open interest, long/short ratios, taker buy/sell volume, and supported HIP-3 tokenized equities                                                                    |
| Crypto on-chain                 | Token metadata, market cap and supply, Fear & Greed, MVRV, NUPL, SOPR, realized price, leverage and whale metrics, exchange/miner/entity flows, unlock schedules, AMM/DEX data, network statistics, and company crypto holdings |
| Macro & cross-asset             | Treasury rates, CPI, GDP, unemployment, inflation, consumer sentiment, forex, gold, silver, oil, major equity indexes, and VIX                                                                                                  |
| Semiconductor pricing           | DRAM and NAND spot/contract prices, memory-card prices, and the DXI index                                                                                                                                                       |
| Prediction markets              | Polymarket discovery, real-time and historical prices, order books, spreads, positions and P&L, trade history, top holders, and open interest                                                                                   |
| News & indexed Twitter/X        | Market news, tracked-handle history and recent posts, post lookup by URL, full-text search, handle metadata, and the tracked-accounts registry                                                                                  |

Coverage and access tiers can change, so Alva checks the live catalog before it
chooses a source.

#### Alva Platform Data

| Surface                         | What It Adds                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Company Anomaly Intelligence    | Current anomaly state, company-versus-sector breakdown, supporting events, and the latest attributed driver |
| Fintwit Intelligence / KOL data | Tracked-account rankings, handle coverage, account views, ticker sentiment, and historical track records    |
| Fintwit Digest SDK              | Reusable Fintwit data for market-attention and alpha-radar Automations                                      |

#### Search and External Data

Search covers global Twitter/X, the broader web, and public content sources.
That includes Reddit, YouTube, and podcasts. It also fills gaps in non-US market
coverage. For off-catalog assets, you can connect your own source. Alva checks
freshness and tells you what is missing before using the results.

### Automations and Alerts

- Turn screens, watchlists, digests, thesis checks, and signal monitors into
  Automations that keep running on a schedule.
- Compare each run with prior results and alert only when the change matters.
- Send alerts in Alva or a connected channel. Quiet runs stay quiet.
- Edit an Automation without losing its history or subscriptions.

### Playbooks

- Publish dashboards, screeners, thesis trackers, event studies, what-if tools,
  and strategy surfaces as hosted Playbooks.
- Use Skillhub methods to define the research process; Data Skills supply the
  financial data.
- Discover and subscribe to published Playbooks.
- Remix a Playbook without losing its source lineage, then add a creator's note
  when you publish.
- Add buttons or parameterized analyses that viewers can run on demand.

### Backtesting and Trading

- Use Altra for event-driven backtests, feature registration, portfolio
  simulation, signal generation, and performance analysis.
- Inspect connected portfolios and account activity.
- Preview orders with a dry run, then confirm before Alva sends a real order to
  a supported crypto or US-equity broker.

### Alva Cloud

- Run JavaScript on Alva Cloud with financial data and external APIs. Secrets
  and persistent storage are built in.
- Add scheduled LLM analysis with `alpi` or run ONNX models over live data.
- Use those results in chat, Automations, Playbooks, alerts, or signals.

### Data Rules

Alva Agent uses the model for analysis, not as a source of market facts.
Financial values must come from live Data Skills, Platform Data, or a validated
external source. Search and LLM output can add context, but they cannot replace
source data. Real orders require a dry run and explicit confirmation.

## How Alva Fits Together

| Stage     | Includes                                                             |
| --------- | -------------------------------------------------------------------- |
| Sources   | Data Skills, Platform Data, external sources, and Skillhub methods   |
| Execution | Alva Cloud, Automations, Altra, and connected brokers                |
| Results   | Sourced answers, alerts, Playbooks, trading signals, and real orders |

## Links

- **Platform**: [alva.ai](https://alva.ai)
- **Instructions**: [SKILL.md](skills/alva/SKILL.md)
- **Release**: [Latest](https://github.com/alva-ai/skills/releases/latest)
- **Toolkit**: [npm](https://www.npmjs.com/package/@alva-ai/toolkit)
- **Issues**: [GitHub](https://github.com/alva-ai/skills/issues)
