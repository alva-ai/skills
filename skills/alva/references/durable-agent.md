# Durable ALPI Agents

Use this contract when the user asks you to create a coding Agent that must keep
its Session across runs. A Channel Agent can create this program in ALFS and start
it through `alva run`. Application-level `Agent.ask()` remains appropriate for a
bounded reasoning step inside an Automation or Playbook.

## One directory, one Agent program

The Agent's identity is its canonical owner-home `cwd`. Save its entrypoint at
`$cwd/agent.js` before starting it or creating a Session Schedule. Both the first
launch and future wakes execute that file through Jagent's normal metered path.

Keep the system prompt, custom tools and implementations, model/reasoning policy,
Skill/resource configuration and scoped secret grants in this program or its
imports. They are reconstructed on every launch; a transcript does not contain
executable tool implementations. Omit model and reasoning options to follow the
host default; explicit options in the program remain authoritative.

Use `runAlvaAgent` for Layer 3 (coding tools, official Alva Skill and authenticated
`alva` tool), or `runAlpiAgent` for Layer 2 coding sessions without that composition.
The helpers enable Inbox, open the selected Session, run the optional application
callback, drain pending work, await completion and release the lock before return.
They do not keep a process alive until the next Schedule.

## Entrypoint example

Save this as `~/agents/company-research/agent.js`:

```javascript
const { runAlvaAgent, Type } = require("@alva/pi");
const env = require("env");
const alfs = require("alfs");
const args = env.args || {};
const cwd = `/alva/home/${env.username}/agents/company-research`;

return await runAlvaAgent({
  cwd,
  alvaApiKey: require("secret-manager").loadPlaintext("ALVA_API_KEY"),
  resourceLoaderOptions: {
    systemPrompt: "Research companies using original filings. Cite sources and state missing evidence.",
  },
  customTools: [{
    name: "readCompanyFilings",
    label: "Read company filings",
    description: "Read previously collected filings for a company ticker.",
    parameters: Type.Object({ ticker: Type.String({ pattern: "^[A-Z][A-Z0-9.-]{0,15}$" }) }),
    execute: async (_id, { ticker }) => ({
      content: [{ type: "text", text: alfs.readFileSync(`${cwd}/filings/${ticker}.txt`) }],
      details: {},
    }),
  }],
}, async ({ session }) => {
  // Run-specific input belongs in args; durable configuration belongs above.
  if (!args.alpiWake && typeof args.prompt === "string") {
    await session.prompt(args.prompt);
  }
});
```

Load credentials afresh from `secret-manager`; never put plaintext credentials in
the file, args, Inbox or transcript. Grant worker access only through the original
program's explicit `secrets` option. For a non-default Alva environment, persist
the intended `alvaEndpoint` in the program alongside the credential selection.

Start the saved entry with the current CLI:

```bash
alva run --entry-path '~/agents/company-research/agent.js' \
  --args '{"prompt":"Research ACME, then schedule a follow-up for tomorrow."}'
```

With no session selector, every launch uses `main` under
`$cwd/.pi/agent/sessions/main.jsonl`. Ordinary completion returns `status: "idle"`,
`sessionId`, `cwd` and `inboxPath`. To adopt an existing Session, configure its
existing `sessionId` and directory, or its exact `sessionFile`, in agent.js. Keep
that selection stable; do not generate a fresh ID or use `continueSession`.

## Wake contract

The scheduler appends the message to the existing Inbox and executes only
`$cwd/agent.js`. Reserved `env.args.alpiWake` metadata contains `inboxPath`,
`messageId`, `expectedSessionId` and `expectedCwd`. The SDK checks that the program
selects that exact existing Session before processing it. The metadata never
supplies tool code, prompt or credentials. Return the helper's result unchanged.

An application callback runs on launches that construct the Session; use it for
startup hooks, subscriptions, or an application-specific Inbox loop. The helper
performs the final drain and cleanup. An already-acknowledged wake skips Session
construction and the callback. The top-level program still executes, so keep
startup effects repeatable and avoid replaying a bootstrap prompt on wake.

Missing/empty/aliased entry files and foreign owner directories fail validation.
Missing or mismatched transcripts fail instead of creating a replacement Agent.
Busy locks defer; failed or unknown execution is not blindly retried. See
[agent-schedules.md](agent-schedules.md) for scheduling and acknowledgement rules.

Wakes execute the current saved program. Updating agent.js or an imported tool
changes later behavior; the contract does not snapshot a process or freeze an old
source version. Save business state needed after exit in ALFS.
