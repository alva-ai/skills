# Durable ALPI Agents

Use this contract when the user asks you to create a coding Agent that must keep
its Session across runs. A Channel Agent can create this program in ALFS and start
it through `alva run`. Application-level `Agent.ask()` remains appropriate for a
bounded reasoning step inside an Automation or Playbook.

## Pi coding agent on Alva Cloud

ALPI coding agent is the Pi coding agent running on Alva Cloud. `runAlvaAgent`
uses the same Pi `AgentSession` programming model, with ALFS, persistent
Session/Inbox, the official Alva Skill, an authenticated `alva` tool and managed
execution lifetime. It is not a second reasoning framework. Users only need
`runAlvaAgent`; internal implementation layers are not a choice to make.

Reuse your Pi customization knowledge, or consult Pi documentation to understand
a technique, then check the current `@alva/pi` types and runtime documentation.
The current `@alva/pi` contract is authoritative. A local Pi example or a different
Pi version does not establish support on Alva Cloud.

ALPI supports Pi's high-level Agent and AgentSession customization model except
for infrastructure dependencies and capabilities that Alva Cloud must own.
The supported options and explicit exceptions below define that boundary; do not
assume every local Pi API or constructor dependency is compatible.

Full Skill teaches the outer Channel Agent to save and start this program. The
constructed Alva Agent loads Slim Skill; both use this same durable contract.

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
}, async function run({ session }) {
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

## Required options and Session methods

`cwd` and `alvaApiKey` are required. The helper does not load `ALVA_API_KEY` for
you: trusted entry code loads it afresh and passes `alvaApiKey` to construct the
authenticated `alva` tool. This credential is separate from managed model and
search authentication. `alvaEndpoint` is optional and defaults to the Toolkit
Alva API endpoint; save an explicit endpoint together with the matching key for
a non-default environment. It does not configure `web_search`.

| Option | When to save it in live agent.js |
| --- | --- |
| `cwd` | Required workspace and program identity. Choose any valid owner-home directory, not a platform-mandated `agents` folder. |
| `sessionId`, `sessionDir`, `sessionFile` | Omit for `main` in `$cwd/.pi/agent/sessions`. Use a stable `sessionId` and optional `sessionDir`, or a mutually exclusive exact `sessionFile`, to select a conversation. A scheduled wake strictly restores its host-selected existing Session instead. |
| `model`, `thinkingLevel`, `scopedModels` | Save explicit model policy when managed defaults are insufficient. `scopedModels` contains `{ model, thinkingLevel? }` entries for Pi model selection/cycling; each model must be supported and authenticated. |
| `resourceLoaderOptions` | Save prompt/context and additional Skill/template configuration, not a replacement loader. `appendSystemPrompt` is an array of extra prompt strings. ALPI does not auto-discover local `APPEND_SYSTEM.md`; pass the extra text explicitly. |
| `alvaApiKey`, `alvaEndpoint` | Resolve the required key on each invocation; persist only its lookup code and optional matching endpoint, never its plaintext value. |

The earlier configuration table covers `tools`, `excludeTools`, `noTools`,
`customTools`, `secrets` and `isolateRequireAllowlist`, including their defaults.
Save reusable configuration and tool implementations in the program/imports;
put one-off manual input in args. Wakes rebuild composition from that live code.

| Pi AgentSession method | Purpose inside a bounded run callback |
| --- | --- |
| `prompt(text)` | Start a manual turn and await it; guard manual input so a scheduled wake does not repeat it. |
| `subscribe(listener)` | Observe Session events; keep the returned unsubscribe function for listener cleanup. It does not schedule future processes. |
| `followUp(text)` | Queue follow-up work after the current turn. This Session API is not durable Schedule delivery; use embedded `alva schedule` for future work. |
| `waitForIdle()` | Await current Agent work. It does not replace the helper's final Inbox drain or release its Session lock. |
| `setModel(model)`, `setThinkingLevel(level)` | Change the running Session's model/reasoning policy. Use current API persistence options when intended; save repeatable policy in the program. |
| `setScopedModels(entries)` | Update the Session's model-cycling choices using supported authenticated model objects. |
| `compact(instructions?)` | Compact conversation history with optional instructions; await completion. |

## Cloud-owned infrastructure and exceptions

The durable helper owns Session selection, `SessionManager`, Session lock,
Inbox admission/drain, idle settlement and cleanup. Here admission means opening
the selected Session under its lock, not a Jagent pre-entry Agent protocol.
Do not inject `sessionManager`, `fileSystem`, `resourceLoader` or
`baseToolDefinitions`; these are not durable `runAlvaAgent` options. Do not pass
`inbox` or `continueSession`, manually close the lifetime, or change conversation
inside `run`. ALFS replaces Node filesystem dependencies; Jagent owns capability,
network and process isolation. A Node shell/process example is not portable.

Cloud composes base tools, ResourceLoader, the official Alva Slim Skill and the
authenticated `alva` tool. `read` and `alva` are required even with `noTools` or
exclusions. Custom tools cannot replace `read`, `alva` or `web_search` by name.
The official Alva Skill cannot be disabled or replaced (`noSkills` and
`skillsOverride` are not escape hatches). Extension hooks and theme replacement
are not supported in this durable entry. Additional Skills/templates and prompt
customization use `resourceLoaderOptions` instead of replacing that composition.

Managed model and search defaults come from the host; the main execution context
supplies the Alva credential. Only overrides explicitly present in the current
public options may be used. For example `searchClient` replaces search transport
when deliberately supplied; `alvaApiKey`/`alvaEndpoint` do not override it.
Do not copy local credentials, filesystem or process adapters into the cloud.

## The run callback

The second argument is the optional **run callback** (`onRun` is another useful
name). It runs once per process invocation, on both manual runs and scheduled
wakes, including an empty Inbox. The successful lifecycle is:

```text
construct or restore the Pi AgentSession
  -> run(agent) once
  -> drain and settle pending Inbox work
  -> close and release the Session lifetime
```

The callback receives the ALPI session result, commonly destructured as
`async function run({ session })`. Use it for an initial manual prompt, bounded
per-invocation setup or the Pi Session methods above. It runs before final Inbox
drain. It is not an event listener, reasoning loop, polling loop or forever loop.
Do not implement your own Inbox loop. The helper awaits the callback and owns
final drain, idle settlement and close; it also closes on failure.

Every actual invocation repeats callback side effects. Guard initial/manual
input with `!args.alpiWake`, as in the example. Wakes supply scheduled input
through Inbox, not by unconditionally replaying an initial `session.prompt`.

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
