# Agent Skills

## Installation

```bash
npx skills add https://github.com/alva-ai/skills
```

## Setup

1. Get an API key at [alva.ai](https://alva.ai)
2. Add to `~/.claude/settings.json`:
   ```json
   {
     "env": {
       "ALVA_API_KEY": "your_api_key"
     }
   }
   ```
3. Ask your agent to build something:
   ```
   Build me an NVDA dashboard with insider trading data and financial metrics
   ```

## Available Skills

| Skill | Description |
|-------|-------------|
| **[alva](skills/alva/SKILL.md)** | Build and deploy agentic finance applications on the Alva platform. Access 250+ financial data sources, run cloud-side analytics, backtest trading strategies, and publish interactive playbooks. |
