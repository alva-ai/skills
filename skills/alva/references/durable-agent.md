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

The scheduler appends a stable message to the existing Inbox. Jagent first owns
the canonical Agent cwd, then its platform wrapper locks the exact Session and
strictly checks the transcript, complete Inbox and required acknowledgement.
Only pending work loads the live `$cwd/agent.js` and its dependencies. An already
acknowledged target, or an explicitly targetless empty wake, returns
`preflight_noop` without evaluating any user code or calling the model. A missing
required message is `invalid_target`, even when the Inbox is otherwise empty.

One Agent may own multiple Sessions. The host captures `inboxPath`, `messageId`,
`expectedSessionId` and `expectedCwd` before evaluation. Its exact Session
overrides the program's first-launch `sessionId` or `sessionFile` selector.
Changing `env.args.alpiWake` cannot retarget it. A different program cwd fails.
The metadata never supplies tool code, prompt or credentials. Call the helper
once and return its result; never implement a polling or forever loop.

The helper adopts the held Session lock, reconstructs composition, runs an
optional bounded setup callback, drains Inbox and awaits cleanup. The wrapper
retains the Session lock through the whole entrypoint; Jagent retains the Agent
lock through child exit. All Sessions under one cwd serialize, regardless of the
execution principal. Direct Session constructors remain available for ephemeral
or nonstandard use; they do not provide this Agent admission guarantee.

Before user evaluation, contention returns `not_started` and AutoRun durably
defers the same occurrence. After the first root or dependency evaluation,
load/composition/tool/model failure is terminal `failed_after_entrypoint`;
lost results are `execution_unknown`. Neither is automatically retried, including
`EAGAIN` raised before a prompt. On `acknowledged`, Backend rereads the exact
bound transcript/Inbox and requires that message's acknowledgement. An Agent
owns this state, so it is a consistency check rather than a tamper-proof receipt.

Missing/empty/aliased entry files and foreign owner directories fail validation.
Missing or mismatched transcripts never create a replacement. See
[agent-schedules.md](agent-schedules.md) for delivery and acknowledgement rules.
Ordinary recovery still replays unacknowledged work; effects are not exactly once.

Wakes execute the current saved program. The Agent may update agent.js and its
imports for its next wake without version activation. Jagent logs the observed
root SHA-256 for diagnosis; it does not identify the whole dependency graph or
freeze old source. Save business state needed after exit in ALFS.

The host maintains `$cwd/.pi/agent/execution.lock` and a token-specific heartbeat
outside V8. An expired deadline, stale heartbeat or lost RPC never authorizes
takeover. Automatic recovery initially requires this same host's exact
token/generation record that it killed and joined the child. Other host
generations and abandoned `execution.lock.recovery` markers fail closed and need
explicit operational repair after termination is proven. Never delete these
files merely because they look old.
