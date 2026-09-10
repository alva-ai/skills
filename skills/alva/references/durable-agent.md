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

Use `runAlvaAgent` from `@alva/pi`. It includes coding tools, the official Alva
Skill and the authenticated `alva` tool. It opens the Session with Inbox enabled,
runs the optional callback once, drains pending input and awaits cleanup.
The process exits after this work; Backend owns future timing.

## Entrypoint example

Save this as `~/agents/company-research/agent.js` (example path; directory names
are your choice). `~/research/agent.js` is equally valid. Only the `agent.js`
filename under the chosen cwd is conventional:

```javascript
const { runAlvaAgent, Type } = require("@alva/pi");
const env = require("env");
const alfs = require("alfs");
const args = env.args || {};
const cwd = "~/agents/company-research"; // Example path, not a required directory.

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

## Configuration and Pi capabilities

Keep configuration in agent.js or its imports so every launch reconstructs it.
The callback receives the native Pi `session`; use `prompt`, `subscribe`,
`setModel`, `setThinkingLevel`, `compact` and transcript inspection as needed.
Await asynchronous operations. The standard helper owns final Inbox drain and
close; do not switch to a new Session inside its callback.

| Need | Configuration and default |
| --- | --- |
| System prompt and context | `resourceLoaderOptions.systemPrompt`, `appendSystemPrompt`, and context files in ALFS. Without an override, the Alva finance prompt and host runtime guidance apply. |
| Custom tools | `customTools` with a schema and `execute` implementation; restore the implementation from code each launch. |
| Tool selection | `tools` selects names; `excludeTools` removes optional tools; `noTools` disables optional defaults. `read` and `alva` remain required. `web_search` is available when the host supports it. |
| Model and reasoning | Omit `model` and `thinkingLevel` for managed defaults, unless saved settings explicitly select a model. Set them in code for a fixed policy. Transcript model history alone does not pin future runs. |
| Skills and templates | `resourceLoaderOptions.additionalSkillPaths` and `additionalPromptTemplatePaths` add ALFS resources. The official Alva Skill remains enabled; shell extensions and themes are unavailable. |
| Worker secrets | Omitted `secrets` grants none. Prefer a scoped name-to-value map resolved afresh; `"inherit"` delegates all available secrets. Never persist values. |
| Worker modules | Omitted `isolateRequireAllowlist` uses host defaults; an explicit list restricts capability modules. Standard computation modules remain available. A nonempty secret grant also permits `secret-manager`. |

Pi manages conversation history, model turns, tool execution, compaction and
resource loading. Cloud execution uses ALFS and the Jagent JavaScript worker;
it does not provide a local shell or an indefinitely running process. Business
state needed after exit belongs in ALFS. Use the authenticated `alva` tool for
platform operations, without exposing its credential to model-written code.

ALPI cwd and native `alfs` path arguments both expand `~` using the authenticated
host username. `~/a/../b` stays inside that home; `~other` and `~/../other` fail.
Native relative symlink targets retain their original meaning. This alias does
not bypass ALFS permissions. Schedule CLI `--inbox-path` still requires its
canonical absolute target; it is not a native ALFS path argument.

## Wake contract

Backend durably accepts a wake intent, appends a stable-ID follow-up to Inbox,
and dispatches ordinary execution of the live `$cwd/agent.js`. Delivery means both
the intent and input are stored. A worker can complete an interrupted append.

`runAlvaAgent` reads `env.args.alpiWake` as a Session selector containing
`inboxPath`, `expectedSessionId` and `expectedCwd`. It strictly opens that existing
transcript and checks identity, overriding first-launch selectors. Missing or
mismatched transcripts fail without creating a replacement. This metadata carries
no tools, prompt or credentials and is not an authorization credential.

The helper acquires the Session lock, reconstructs configuration, runs the callback
once, drains all pending messages and awaits close. Different Sessions under one
cwd may run concurrently. Protect shared business files explicitly if needed.
An empty Inbox still evaluates user code and runs the callback; it causes no model
call by itself. Guard an initial prompt as in the example so wakes do not repeat it.

After dispatch, busy, errors and unknown results end that AutoRun without retry.
Only temporary delivery failures before dispatch may defer. Execution success
means the program completed; it does not certify an exact message acknowledgement.
Unacknowledged work may replay on a later ordinary run or independent wake;
already-acked input is not delivered to the model again. External effects need
business idempotency where repetition matters. Pausing or deleting a Schedule
does not retract accepted work. See [agent-schedules.md](agent-schedules.md).

Every wake loads the current program and imports. Self-edits apply on the next
execution without version activation. There is no Agent cwd execution lock,
pre-entry wrapper or host ownership recovery protocol to manage.

## Owner-only UDF entry

If exposing this program as a UDF for its owner only, validate the authenticated
caller before reading secrets or constructing the Agent:

```javascript
const env = require("env");
const ownerUserId = "<owner-user-id>"; // Set from the intended owner's identity.
if (env.callerUserId == null || String(env.callerUserId) !== ownerUserId) {
  throw new Error("Only the owner may invoke this Agent");
}
// Only now load credentials and call runAlvaAgent.
```

`env.userId` is an execution identity, not a substitute for the UDF caller check.
Do not add an invented platform `owner_only` registration field.
