---
version: 1
---

# Alva bootstrap

Connects this agent to the user's Alva account. Run it when the user asks you to
follow BOOTSTRAP.md, or when `version` above is newer than the one your own
memory records as "Alva bootstrap vN done". Everything you need is in this file
and [agent-routine.md](references/agent-routine.md); you do not need the rest of
the skill.

## Say first

In your own words, in the user's language, briefly:

- You'll connect them to Alva. It takes about 3 minutes.
- You'll read your memory and your past conversations with them on this
  computer, only to pick out investing views and preferences. You may ask to
  allow reading those files.
- You'll show everything before anything is saved.
- Holdings, balances and account details stay on this computer.
- They can say stop at any time.

## 1. Get ready

- `alva --help` fails → `npm install -g @alva-ai/toolkit` (needs Node.js 18+).
  If that fails, say in one line how to install Node.js, and that they can say
  "continue Alva setup" afterwards. Stop here.
- `alva whoami` shows no user → `alva auth login` (a browser opens; on a
  machine without a browser, `alva auth login --no-browser`).
- Already signed in → move on without comment.

## 2. Daily routine

Schedule [agent-routine.md](references/agent-routine.md) for 08:00 local time
every day, then run it once right now with the user present. That first run is
the initial memory and thesis sync.

- **OpenClaw**: `openclaw cron add --name "Alva daily" --cron "0 8 * * *" --message "Run the Alva daily routine." --announce`
- **Hermes**: `hermes cron create "0 8 * * *" "Run the Alva daily routine." --skill alva --name "Alva daily" --deliver origin`
- **Claude Code, Codex and agents without a scheduler**: ask before adding a
  system schedule (launchd or cron) that runs you headless with only the `alva`
  command allowed, for example
  `claude -p "Run the Alva daily routine." --allowedTools "Bash(alva:*)" "Read"`.
  Codex needs network enabled for its sandbox.
- A job named "Alva daily" already exists → keep it; do not add another.
- The user declines, or the scheduler fails (permission prompt, no network,
  a cloud job cannot reach this computer's Alva login) → skip scheduling, say
  why in one line, and tell them they can ask "what's new on Alva" any time.
- Never change crontab, launch agents or scheduler settings without a yes.

## Wrap up

Tell the user what was saved (how many memory items, which theses, all
private), that they can see it in the Alva app under Me, that "undo" removes
anything, and when the next daily note arrives (or that none is scheduled).

Then record in your own memory:
"Alva bootstrap v1 done <date>; Alva routine last ran <until from step 2>".
