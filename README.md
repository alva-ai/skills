# Alva Skills

![Agent Skills](https://alva-ai-static.b-cdn.net/images/alva-skill-github-cover-new.png)

> Turn your AI agent into Alva Agent — research market theses with live financial context, build or remix Playbooks, set alerts, connect accounts, and backtest strategies on Alva Cloud.

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
Explain why NVDA moved last week and what changed in semis
```

That's it. Your agent can now answer market questions, build or remix live Playbooks, set alerts, and work with connected accounts on Alva. By default, the skill builds live Playbooks unless you explicitly ask for a static snapshot. When you explicitly ask for user-callable functions, interactive Playbooks register them through the functions CLI and invoke them through the PBSV + UDF runtime.

---

## Example Prompts

| Use Case                    | Example Prompt                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| Ask Market Questions        | *"Explain why NVDA moved last week and what changed in semis."*                                        |
| Set Alerts                  | *"Create a weekday 8:30am ET alert for SPY, QQQ, NVDA, MSFT, and TSLA meaningful changes."*            |
| Build Playbooks             | *"Build a Playbook tracking AAPL with price charts, analyst targets, and insider trades."*             |
| Discover & Remix Playbooks  | *"Find a semiconductor Playbook tracking AI infrastructure and subscribe me to its alerts."*            |
| Backtest Strategies         | *"Backtest an RSI mean-reversion strategy on BTC with daily rebalancing."*                             |
| Connect Accounts & Trading  | *"Show my connected portfolio holdings and summarize recent activity."*                                |
| Interactive Playbook Tools  | *"Register a Playbook UDF and expose it through a Run analysis button for the selected ticker."*        |

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

Turn your work into a hosted web app at `https://alva.ai/u/<username>/playbooks/<playbook_name>`. Built with the Alva Design System — charts, KPIs, tables, and optional UDF controls for explicitly requested user-registered functions registered by the functions CLI. You can also remix published playbooks and add a creator's note after release.

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
| **[alva](skills/alva/SKILL.md)** | Alva Agent for investing workflows — ask market questions, set alerts, build/remix Playbooks, connect accounts, backtest strategies, and use Alva Cloud data/runtime capabilities. See the [skill reference](skills/alva/SKILL.md) for detailed instructions. |

---

## Official ALPKG Package

The same Skill is published as `@alva/skill@1.19.3` to both npm and ALPKG. Its
`package.json` is public package metadata, but it is not a Node module: it has
no `main`, `module`, `types`, `typings`, or executable entrypoint, and declares
`alpkg.kind` as `skill`. Only these roots are ALPKG artifacts:

- `SKILL.md`
- `references`
- `scripts`

`package.json`, repository tooling, and ignored runtime files are deliberately
outside that explicit set. The validator recursively inspects the three real
roots, rejects unsafe paths and links, enforces the registry's 64-file / 32 MiB
limits, and verifies that package and Skill versions agree:

```bash
node --test tools/alva-skill-package/validate.test.mjs
node tools/alva-skill-package/validate.mjs --skill-dir skills/alva
```

### Manual Immutable Release

Publishing is intentionally never performed by GitHub Actions. A maintainer
must release from a detached, clean checkout of the reviewed artifact commit,
using a separately reviewed checkout for the validator and package metadata.
For `1.19.3`, the artifact source is
`fdf43250da716a7ff6faf85ac03b444591151d54` (44 files, 593,719 bytes).

Set the absolute paths below for the two checkouts and the private `alpkg` CLI.
Keep `ALVA_API_KEY` only in the release process environment; never put it in a
command argument, file, log, or release record.

```bash
export TOOLS_ROOT=/absolute/path/to/reviewed/skills-tooling
export RELEASE_ROOT=/absolute/path/to/detached/skills-source
export ALPKG_CLI=/absolute/path/to/alpkg/bin/alpkg.js
export SOURCE_COMMIT=fdf43250da716a7ff6faf85ac03b444591151d54
export ALVA_ENDPOINT=https://api-llm.prd.alva.ai

test "$(git -C "$RELEASE_ROOT" rev-parse HEAD)" = "$SOURCE_COMMIT"
test -z "$(git -C "$RELEASE_ROOT" status --porcelain)"

node "$TOOLS_ROOT/tools/alva-skill-package/validate.mjs" \
  --skill-dir "$RELEASE_ROOT/skills/alva" \
  --package-json "$TOOLS_ROOT/skills/alva/package.json"

cd "$RELEASE_ROOT/skills/alva"
node "$ALPKG_CLI" publish \
  --endpoint "$ALVA_ENDPOINT" \
  --kind skill \
  --package @alva/skill \
  --version 1.19.3 \
  --files SKILL.md \
  --files references \
  --files scripts \
  --source-repository alva-ai/skills \
  --source-ref "$SOURCE_COMMIT" \
  --dry-run
```

Read every dry-run path and confirm the identity, kind, version, absent
entrypoints, source ref, 44-file count, 593,719-byte total, and the three-root
set. Before removing `--dry-run`, query the exact coordinate with the first
`info` command below. If it exists, compare its complete bundle with the
detached source and reuse it only when identical; never attempt to replace it.
If it is not found, rerun the reviewed publish command without `--dry-run`.
Do not pass `--allow-dirty` or disable readback verification. After publish or
reuse, run exact `info` again before checking the dynamic highest-stable
selection:

```bash
node "$ALPKG_CLI" info @alva/skill@v1.19.3 \
  --kind skill --endpoint "$ALVA_ENDPOINT"
node "$ALPKG_CLI" info @alva/skill \
  --kind skill --endpoint "$ALVA_ENDPOINT"
```

Compare the authoritative exact-version and `latest` manifests, bundle hashes,
and every downloaded file byte with the detached source. Only after that full
maintainer-side comparison should the separate public-read mutation run:

```bash
node "$ALPKG_CLI" set-public @alva/skill \
  --kind skill --endpoint "$ALVA_ENDPOINT"
```

Verify the returned public state, repeat the exact/`latest` download and full
byte/hash comparison with a real non-admin user key, and then run the owning
runtime's consumer smoke. A conflict or bad release is never overwritten; fix
the source, bump the Skill and package patch versions together, and publish a
new immutable coordinate.

Publish the same reviewed package to npm from the detached checkout. Inspect
the tarball before publishing; it must contain only `package.json` and the same
three data roots, with no Node entrypoint:

```bash
cd "$RELEASE_ROOT/skills/alva"
npm pack --dry-run --json --ignore-scripts
npm publish --access public --ignore-scripts
npm view @alva/skill@1.19.3 version dist.integrity
```

---

## Links

- **Platform**: [alva.ai](https://alva.ai)
- **Skill Reference**: [skills/alva/SKILL.md](skills/alva/SKILL.md)
- **Issues**: [github.com/alva-ai/skills/issues](https://github.com/alva-ai/skills/issues)
