import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";

const files = ["../../skills/alva/references/durable-agent.md"];

function sections(text) {
  return text.split(/^## /mu).slice(1).map((part) => part.slice(part.indexOf("\n") + 1));
}

function checkContract(text) {
  const parts = sections(text);
  const mental = parts.find((part) => part.includes("@alva/pi") && /authoritative|最终权威/u.test(part));
  assert.ok(mental, "current @alva/pi must be authoritative for migration");
  assert.match(mental, /Pi coding agent running on Alva Cloud|运行在 Alva Cloud 上的 Pi coding agent/u);
  assert.match(mental, /infrastructure dependencies|基础设施/u);
  assert.match(mental, /Full Skill[\s\S]*Slim Skill/u);
  const options = parts.find((part) => /\| `cwd` \|/u.test(part) && part.includes("scopedModels"));
  assert.ok(options, "required options and supported Session methods must be taught together");
  assert.match(options, /`cwd` and `alvaApiKey` are required|`cwd` 和 `alvaApiKey` 是必需参数/u);
  for (const name of ["sessionId", "sessionDir", "sessionFile", "model", "thinkingLevel", "scopedModels", "resourceLoaderOptions", "alvaEndpoint"]) {
    assert.ok(options.split("\n").some((line) => line.startsWith("|") && line.includes('`'+name+'`')), name);
  }
  for (const method of ["prompt(text)", "subscribe(listener)", "followUp(text)", "waitForIdle()", "setModel(model)", "setThinkingLevel(level)", "compact(instructions?)"]) {
    assert.ok(options.split("\n").some((line) => line.startsWith("|") && line.includes('`'+method+'`')), method);
  }
  const cloud = parts.find((part) => part.includes("baseToolDefinitions") && part.includes("SessionManager"));
  assert.ok(cloud, "Cloud-owned constructor dependencies must be explicit exceptions");
  assert.match(cloud, /Do not inject|不属于持久/u);
  assert.match(cloud, /cannot replace `read`, `alva` or `web_search`|不能覆盖\s+`read`、`alva`、`web_search`/u);
  assert.match(cloud, /cannot be disabled or replaced|不能禁用或替换/u);
  const run = parts.find((part) => part.includes("run(agent) once") && part.includes("forever loop"));
  assert.ok(run, "run callback must explain the complete lifecycle and loop prohibition");
  assert.match(run, /once per process invocation|每次进程 invocation 执行一次/u);
  assert.match(run, /Do not implement your own Inbox loop|不要自己写 Inbox 循环/u);
  const flow = run.match(/```text\n([\s\S]*?)```/u)?.[1];
  assert.deepEqual(flow?.trim().split(/\n\s*-> /u), [
    "construct or restore the Pi AgentSession",
    "run(agent) once",
    "drain and settle pending Inbox work",
    "close and release the Session lifetime",
  ]);
}

for (const file of files) {
  const text = readFileSync(new URL(file, import.meta.url), "utf8");
  // #130: these are teaching-contract checks, not proof of model comprehension.
  test(`${file}: complete Pi migration and run contract`, () => checkContract(text));
  test(`${file}: deleted teaching sections and reversed lifecycle fail`, () => {
    checkContract(text);
    for (const marker of ["authoritative", "scopedModels", "baseToolDefinitions", "run(agent) once"]) {
      const actual = marker === "authoritative" && !text.includes(marker) ? "最终权威" : marker;
      const part = sections(text).find((body) => body.includes(actual));
      assert.ok(part, actual);
      assert.throws(() => checkContract(text.replace(part, "\n")), actual);
    }
    assert.throws(() => checkContract(text.replace(
      "run(agent) once\n  -> drain and settle pending Inbox work",
      "drain and settle pending Inbox work\n  -> run(agent) once",
    )));
  });
  test(`${file}: saved entry prompts only on manual invocation`, async () => {
    const source = text.match(/```javascript\n([\s\S]*?)```/u)?.[1];
    assert.ok(source);
    for (const wake of [false, true]) {
      const prompts = [];
      let calls = 0;
      const modules = {
        "env": { args: { prompt: "manual input", ...(wake ? { alpiWake: {} } : {}) } },
        "alfs": {},
        "secret-manager": { loadPlaintext: () => "test-fixture" },
        "@alva/pi": {
          Type: { Object: (value) => value, String: (value) => value },
          runAlvaAgent: async (options, run) => {
            assert.match(options.cwd, /^~\//u);
            assert.equal(run.name, "run");
            calls++;
            await run({ session: { prompt: async (value) => { prompts.push(value); } } });
          },
        },
      };
      await new Script(`(async () => {${source}\n})()`).runInNewContext({ require: (name) => modules[name] }, { timeout: 1000 });
      assert.equal(calls, 1);
      assert.deepEqual(prompts, wake ? [] : ["manual input"]);
    }
  });
  test(`${file}: UDF guard rejects missing or forged callers before owner work`, () => {
    const source = [...text.matchAll(/```javascript\n([\s\S]*?)```/gu)].at(-1)?.[1];
    assert.ok(source?.includes("callerUserId"));
    for (const callerUserId of [undefined, "viewer", "<owner-user-id>"]) {
      let ownerEffects = 0;
      const invoke = () => new Script(`${source}\nownerWork();`).runInNewContext({
        require: () => ({ callerUserId, userId: "<owner-user-id>", args: { callerUserId: "<owner-user-id>" } }),
        ownerWork: () => { ownerEffects++; },
      }, { timeout: 1000 });
      if (callerUserId === "<owner-user-id>") invoke();
      else assert.throws(invoke, /Only the owner/u);
      assert.equal(ownerEffects, callerUserId === "<owner-user-id>" ? 1 : 0);
    }
  });
}
