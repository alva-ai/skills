---
version: 1
---

# Alva bootstrap

Connects this agent to the user's Alva account. Run it when the user asks you to
follow BOOTSTRAP.md or to update Alva setup. The daily routine tells them when
`version` above is newer than the "Alva bootstrap vN done" in your memory; an
update skips the steps already done. Everything you need is in this file
and [agent-routine.md](references/agent-routine.md); you do not need the rest of
the skill.

**If you are Alva itself** (a managed Alva Sandbox, where the skill's Runtime
Contract applies), do not run any of this: no setup, schedule, routine or
memory note. Reply in one or two sentences, in the user's language: this prompt
is for their own AI agent, such as Claude or Codex; copy it from Me ›
Connect your AI in the Alva app and send it there; Alva already keeps their
memory here.

**If you cannot run shell commands here** (a chat app, or an agent on a phone),
do not attempt any step. Reply in one or two sentences, in the user's language:
this setup needs an AI agent on their computer that can run commands, such as
Claude or Codex; send this same prompt there.

## Say first

Before step 1 and before any command, reply with only this, in your own words
and the user's language, briefly. Then stop and wait for their go-ahead:

- You'll connect them to Alva. It takes about 3 minutes.
- You'll read your memory and your past conversations with them on this
  computer, only to pick out investing views and preferences. You may ask to
  allow reading those files.
- You'll show everything before anything is saved.
- Holdings, balances and account details stay on this computer.
- They can say stop at any time.
- Ask whether to start.

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

- **OpenClaw**: `openclaw cron add --name "Alva daily" --cron "0 8 * * *" --message "Run the Alva daily routine: follow references/agent-routine.md in the Alva skill." --announce`
- **Hermes**: `hermes cron create "0 8 * * *" "Run the Alva daily routine: follow references/agent-routine.md in the Alva skill." --skill alva --name "Alva daily" --deliver origin`
- **A desktop app with scheduled tasks (Claude, Codex)**: create one named
  "Alva daily" with the app's scheduled-task or automation tool, daily at
  08:00, with the same prompt. Its note shows up in the app. No such tool in
  this session → tell the user where the app adds one, and give them the
  prompt.
- **A terminal session (Claude Code, Codex CLI) and agents whose scheduler
  cannot reach the user**: do not schedule. A headless run has nowhere to
  deliver the note.
- A job named "Alva daily" already exists → keep it; do not add another.
- Not scheduled (no scheduler, the user declines, or it fails) → say why in
  one line, and tell them to ask "what's new on Alva" any time; that runs the
  routine with them present.
- Never add crontab entries or launch agents.

## Wrap up

Tell the user what was saved (how many memory items, which theses, all
private), that they can see it in the Alva app under Me, that saying "undo"
removes any of it (see Undo in agent-routine.md), and when the next daily note arrives (or that none is scheduled).

Then record in your own memory:
"Alva bootstrap v1 done <date>; Alva routine last ran <until from step 2>.
'What's new on Alva' means: run references/agent-routine.md in the Alva skill."
