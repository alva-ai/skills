#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const EVAL_DIR = resolve(SCRIPT_DIR, "..");
const DEFAULT_CASES_PATH = resolve(EVAL_DIR, "cases.json");
const DEFAULT_RESULTS_DIR = resolve(EVAL_DIR, "results");
const DEFAULT_RAW_DIR = resolve(EVAL_DIR, ".raw-runs");
const GENERATED_AT = "2026-05-29T02:00:00Z";

function parseArgs(argv) {
  const opts = {
    casesPath: DEFAULT_CASES_PATH,
    resultsDir: DEFAULT_RESULTS_DIR,
    rawDir: DEFAULT_RAW_DIR,
    profile: null,
    selected: new Set(),
    limit: null,
    workers: 1,
    timeoutMs: 10 * 60 * 1000,
    model: "sonnet",
    effort: null,
    runId: null,
    skipAgent: false,
    reuseRaw: false,
    keepRaw: true,
    mode: "evidence-slice",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cases") {
      opts.casesPath = resolve(argv[++i]);
    } else if (arg === "--results-dir") {
      opts.resultsDir = resolve(argv[++i]);
    } else if (arg === "--raw-dir") {
      opts.rawDir = resolve(argv[++i]);
    } else if (arg === "--profile") {
      opts.profile = argv[++i];
    } else if (arg === "--case") {
      opts.selected.add(argv[++i]);
    } else if (arg === "--limit") {
      opts.limit = Number(argv[++i]);
    } else if (arg === "--workers") {
      opts.workers = Number(argv[++i]);
    } else if (arg === "--timeout-ms") {
      opts.timeoutMs = Number(argv[++i]);
    } else if (arg === "--model") {
      opts.model = argv[++i];
    } else if (arg === "--effort") {
      opts.effort = argv[++i];
    } else if (arg === "--run-id") {
      opts.runId = argv[++i];
    } else if (arg === "--skip-agent") {
      opts.skipAgent = true;
    } else if (arg === "--reuse-raw") {
      opts.reuseRaw = true;
    } else if (arg === "--no-raw") {
      opts.keepRaw = false;
    } else if (arg === "--mode") {
      opts.mode = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`Usage: node run-and-score.mjs [options]

Runs Skillhub blueprint baseline cases and scores every rubric criterion from
the resulting trace plus deterministic Skillhub evidence.

Options:
  --profile <name>       Alva profile to use (default: cases.json profile).
  --case <id|skill>      Run one case id or skill id; repeatable.
  --limit <n>            Run only the first n selected cases.
  --workers <n>          Reserved for future parallelism; currently must be 1.
  --timeout-ms <n>       Per-agent timeout, default 600000.
  --model <name>         Claude Code model alias, default sonnet.
  --effort <level>       Optional Claude Code effort flag.
  --run-id <id>          Stable run id for output paths.
  --mode <name>          Run mode, default evidence-slice.
  --skip-agent           Score deterministic Skillhub evidence only.
  --reuse-raw            Re-score from existing raw stream-json traces.
  --no-raw               Do not retain raw stream-json traces.
  --cases <path>         Path to cases.json.
  --results-dir <path>   Output directory for committed score artifacts.
  --raw-dir <path>       Output directory for raw traces.
  -h, --help             Show this help.
`);
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function command(bin, args, options = {}) {
  const result = spawnSync(bin, args, {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    ...options,
  });
  return {
    command: `${bin} ${args.join(" ")}`,
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    ok: result.status === 0,
  };
}

function alva(profile, args, options = {}) {
  return command("alva", ["--profile", profile, ...args], options);
}

function selectCases(manifest, opts) {
  let cases = manifest.cases || [];
  if (opts.selected.size > 0) {
    cases = cases.filter(
      (testCase) =>
        opts.selected.has(testCase.id) || opts.selected.has(testCase.skill_id),
    );
  }
  if (opts.limit != null) {
    cases = cases.slice(0, opts.limit);
  }
  return cases;
}

function getApiKey(profile) {
  if (process.env.ALVA_API_KEY) {
    return process.env.ALVA_API_KEY;
  }

  const configPath = resolve(homedir(), ".config", "alva", "config.json");
  if (!existsSync(configPath)) {
    return "";
  }

  const config = loadJson(configPath);
  return config.profiles?.[profile]?.apiKey || "";
}

function createAgentHome(profile, apiKey) {
  const home = mkdtempSync(resolve(tmpdir(), "skillhub-baseline-agent-"));
  mkdirSync(resolve(home, ".claude", "skills"), { recursive: true });

  const skillSource = resolve(process.cwd(), "skills", "alva");
  const skillTarget = resolve(home, ".claude", "skills", "alva");
  cpSync(skillSource, skillTarget, {
    recursive: true,
    filter: (source) => !source.endsWith(".alva.json"),
  });

  if (apiKey) {
    writeFileSync(
      resolve(skillTarget, ".alva.json"),
      JSON.stringify({ api_key: apiKey, verified: true }, null, 2),
    );
  }

  const keychains = resolve(homedir(), "Library", "Keychains");
  if (existsSync(keychains)) {
    mkdirSync(resolve(home, "Library"), { recursive: true });
    symlinkSync(keychains, resolve(home, "Library", "Keychains"));
  }

  return home;
}

function parseStream(raw) {
  const events = [];
  const toolUses = [];
  const toolResults = [];
  let result = "";
  let meta = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    let event;
    try {
      event = JSON.parse(trimmed);
    } catch {
      continue;
    }
    events.push(event);

    if (event.type === "assistant") {
      for (const block of event.message?.content || []) {
        if (block.type === "tool_use") {
          toolUses.push({
            id: block.id,
            name: block.name,
            input: block.input || {},
          });
        }
      }
    } else if (event.type === "user") {
      for (const block of event.message?.content || []) {
        if (block.type === "tool_result") {
          toolResults.push({
            tool_use_id: block.tool_use_id,
            content: typeof block.content === "string" ? block.content : "",
            is_error: Boolean(block.is_error),
          });
        }
      }
    } else if (event.type === "result") {
      result = event.result || "";
      meta = {
        duration_ms: event.duration_ms || 0,
        total_cost_usd: event.total_cost_usd || 0,
        is_error: Boolean(event.is_error),
        terminal_reason: event.terminal_reason || "",
        num_turns: event.num_turns || 0,
      };
    }
  }

  return { events, toolUses, toolResults, result, meta };
}

function runAgent(testCase, profile, opts) {
  if (opts.reuseRaw) {
    const rawPath = resolve(opts.rawDir, `${testCase.id}.stream.jsonl`);
    if (!existsSync(rawPath)) {
      throw new Error(`Missing raw trace for ${testCase.id}: ${rawPath}`);
    }
    const raw = readFileSync(rawPath, "utf8");
    return {
      raw,
      parsed: parseStream(raw),
      status: 0,
      timedOut: false,
      stderr: "",
      reusedRaw: true,
    };
  }

  if (opts.skipAgent) {
    return {
      raw: "",
      parsed: { toolUses: [], toolResults: [], result: "", meta: {} },
      skipped: true,
    };
  }

  const apiKey = getApiKey(profile);
  const home = createAgentHome(profile, apiKey);
  const prompt = buildAgentPrompt(testCase, profile);
  const args = [
    "-p",
    prompt,
    "--model",
    opts.model,
    "--dangerously-skip-permissions",
    "--output-format",
    "stream-json",
    "--verbose",
    "--setting-sources",
    "user",
  ];
  if (opts.effort) {
    args.push("--effort", opts.effort);
  }

  const env = {
    ...process.env,
    HOME: home,
    ALVA_PROFILE: profile,
    ARRAYS_ENDPOINT: "https://data-tools.prd.space.id",
  };
  if (apiKey) {
    env.ALVA_API_KEY = apiKey;
  }

  const result = spawnSync("claude", args, {
    encoding: "utf8",
    maxBuffer: 120 * 1024 * 1024,
    timeout: opts.timeoutMs,
    env,
    cwd: process.cwd(),
  });

  rmSync(home, { recursive: true, force: true });

  const raw = result.stdout || result.stderr || "";
  return {
    raw,
    parsed: parseStream(raw),
    status: result.status,
    timedOut: result.error?.code === "ETIMEDOUT",
    stderr: result.stderr || "",
  };
}

function buildAgentPrompt(testCase, profile) {
  return `Use the alva skill for this baseline case.

Case id: ${testCase.id}
Profile: ${profile}
Prompt under test:
${testCase.prompt}

Run only the evidence-gathering slice of the full build. Do not deploy, release,
send notifications, or create persistent user-facing artifacts. This is a scored
baseline probe, not the production build itself.

Required actions:
1. Run the Alva pre-flight commands needed for this case: version check,
   alva --help, alva skillhub --help, alva --profile ${profile} whoami.
2. Run alva --profile ${profile} skillhub get ${testCase.skill_id} --json.
3. Run alva --profile ${profile} skillhub file ${testCase.skill_id} ${testCase.catalog.blueprint_path}.
4. If the blueprint or prompt requires data skills, run alva data-skills --help
   and at least one alva data-skills list/summary/endpoint discovery command
   that is relevant to this case.
5. Produce a concise evidence summary naming the selected blueprint, disabled
   status, data discovery commands, blueprint-specific requirements you found,
   and the remaining runtime/release/screenshot steps that would be required
   for a full playbook build.

End with a JSON object on its own line:
{"case_id":"${testCase.id}","skill_id":"${testCase.skill_id}","status":"evidence_collected","disabled":${Boolean(testCase.catalog.disabled)},"did_not_release":true}
`;
}

function runDeterministicEvidence(testCase, profile) {
  const evidence = {};
  evidence.version = command("alva", ["--version"]);
  evidence.help = command("alva", ["--help"]);
  evidence.skillhubHelp = command("alva", ["skillhub", "--help"]);
  evidence.whoami = alva(profile, ["whoami"]);
  evidence.skillhubGet = alva(profile, [
    "skillhub",
    "get",
    testCase.skill_id,
    "--json",
  ]);
  evidence.skillhubFile = alva(profile, [
    "skillhub",
    "file",
    testCase.skill_id,
    testCase.catalog.blueprint_path,
  ]);
  evidence.dataSkillsHelp = command("alva", ["data-skills", "--help"]);
  evidence.dataSkillsList = alva(profile, ["data-skills", "list", "--json"]);
  return evidence;
}

function hasCommand(parsed, pattern) {
  return parsed.toolUses.some((use) => {
    if (use.name !== "Bash") {
      return false;
    }
    const commandText = use.input.command || "";
    return pattern.test(commandText);
  });
}

function agentText(parsed) {
  return [parsed.result, ...parsed.toolResults.map((result) => result.content)]
    .filter(Boolean)
    .join("\n");
}

function scoreCriterion(points, checks, passedChecks, evidence) {
  const ratio = checks.length === 0 ? 0 : passedChecks.length / checks.length;
  const status =
    passedChecks.length === 0
      ? "zero"
      : passedChecks.length === checks.length
        ? "full"
        : "partial";
  return {
    points_possible: points,
    points_awarded: Number((points * ratio).toFixed(2)),
    status,
    passed_checks: passedChecks,
    failed_checks: checks.filter((check) => !passedChecks.includes(check)),
    evidence,
  };
}

function scoreCase(testCase, deterministic, agentRun, manifest) {
  const parsed = agentRun.parsed;
  const text = agentText(parsed);
  const blueprintText = deterministic.skillhubFile.stdout || "";
  const skillhubMeta = safeJson(deterministic.skillhubGet.stdout);
  const filePaths = new Set(
    (skillhubMeta?.files || []).map((file) => file.path),
  );
  const commandPatterns = {
    version: /version_check\.sh|alva\s+--version/,
    alvaHelp: /alva\s+--help/,
    skillhubHelp: /alva\s+skillhub\s+--help/,
    whoami: /alva\s+(--profile\s+\S+\s+)?whoami/,
    skillhubGet: new RegExp(
      `alva\\s+--profile\\s+\\S+\\s+skillhub\\s+get\\s+${escapeRegExp(testCase.skill_id)}`,
    ),
    skillhubFile: new RegExp(
      `alva\\s+--profile\\s+\\S+\\s+skillhub\\s+file\\s+${escapeRegExp(testCase.skill_id)}\\s+${escapeRegExp(testCase.catalog.blueprint_path)}`,
    ),
    dataSkills:
      /alva\s+(--profile\s+\S+\s+)?data-skills\s+(list|summary|endpoint|--help)/,
  };

  const shared = [];
  for (const criterion of manifest.rubric.shared_criteria) {
    shared.push({
      id: criterion.id,
      tags: criterion.tags,
      ...scoreSharedCriterion(
        criterion,
        testCase,
        deterministic,
        parsed,
        text,
        blueprintText,
        filePaths,
        commandPatterns,
      ),
    });
  }

  const specific = [];
  for (const criterion of testCase.case_specific_rubric) {
    specific.push({
      id: criterion.id,
      tags: criterion.tags,
      ...scoreSpecificCriterion(
        criterion,
        testCase,
        deterministic,
        parsed,
        text,
        blueprintText,
      ),
    });
  }

  const sharedTotal = sum(shared.map((item) => item.points_awarded));
  const specificTotal = sum(specific.map((item) => item.points_awarded));

  return {
    case_id: testCase.id,
    skill_id: testCase.skill_id,
    prompt: testCase.prompt,
    execution_mode: testCase.execution_mode,
    disabled: testCase.catalog.disabled,
    blueprint_path: testCase.catalog.blueprint_path,
    score: {
      total: Number((sharedTotal + specificTotal).toFixed(2)),
      shared: Number(sharedTotal.toFixed(2)),
      case_specific: Number(specificTotal.toFixed(2)),
      possible: 100,
    },
    agent_run: {
      status: agentRun.skipped ? "skipped" : agentRun.status,
      timed_out: Boolean(agentRun.timedOut),
      reused_raw: Boolean(agentRun.reusedRaw),
      duration_ms: parsed.meta.duration_ms || 0,
      total_cost_usd: parsed.meta.total_cost_usd || 0,
      result: parsed.result,
      bash_commands: parsed.toolUses
        .filter((use) => use.name === "Bash")
        .map((use) => use.input.command || ""),
    },
    deterministic_evidence: summarizeDeterministicEvidence(deterministic),
    shared_rubric: shared,
    case_specific_rubric: specific,
  };
}

function scoreSharedCriterion(
  criterion,
  testCase,
  deterministic,
  parsed,
  text,
  blueprintText,
  filePaths,
  patterns,
) {
  const passed = [];
  const checks = criterion.checks;

  if (criterion.id === "chain.preflight") {
    if (deterministic.version.ok || hasCommand(parsed, patterns.version)) {
      passed.push(checks[0]);
    }
    if (
      (deterministic.help.ok && deterministic.skillhubHelp.ok) ||
      (hasCommand(parsed, patterns.alvaHelp) &&
        hasCommand(parsed, patterns.skillhubHelp))
    ) {
      passed.push(checks[1]);
    }
    if (deterministic.whoami.ok || hasCommand(parsed, patterns.whoami)) {
      passed.push(checks[2]);
    }
  } else if (criterion.id === "chain.skillhub-routing") {
    if (testCase.prompt.includes(`/use-skill:${testCase.skill_id}`)) {
      passed.push(checks[0]);
    }
    if (
      deterministic.skillhubGet.ok &&
      deterministic.skillhubFile.ok &&
      filePaths.has(testCase.catalog.blueprint_path)
    ) {
      passed.push(checks[1]);
    }
    if (!testCase.catalog.disabled || /disabled/i.test(text)) {
      passed.push(checks[2]);
    }
  } else if (criterion.id === "chain.blueprint-freshness") {
    if (
      deterministic.skillhubGet.ok ||
      hasCommand(parsed, patterns.skillhubGet)
    ) {
      passed.push(checks[0]);
    }
    if (
      deterministic.skillhubFile.ok ||
      hasCommand(parsed, patterns.skillhubFile)
    ) {
      passed.push(checks[1]);
    }
    if (filePaths.has(testCase.catalog.blueprint_path)) {
      passed.push(checks[2]);
    }
  } else if (criterion.id === "chain.blueprint-authority") {
    if (
      testCase.catalog.expected_blueprint_markers.every((marker) =>
        blueprintText.includes(marker),
      )
    ) {
      passed.push(checks[0]);
    }
    if (/deviation|remaining|would|required|plan/i.test(text)) {
      passed.push(checks[1]);
    }
    if (
      (testCase.catalog.supporting_files || []).every((path) =>
        filePaths.has(path),
      )
    ) {
      passed.push(checks[2]);
    }
  } else if (criterion.id === "chain.data-shape") {
    if (deterministic.dataSkillsHelp.ok && deterministic.dataSkillsList.ok) {
      passed.push(checks[0]);
    }
    if (
      hasCommand(parsed, patterns.dataSkills) ||
      deterministic.dataSkillsList.ok
    ) {
      passed.push(checks[1]);
    }
    if (
      /coverage gap|gap|missing|not covered|blind spot|remaining/i.test(text)
    ) {
      passed.push(checks[2]);
    }
  } else if (criterion.id === "chain.runtime-release") {
    if (
      /Alva Cloud|runtime|remaining|would require|did_not_release/i.test(text)
    ) {
      passed.push(checks[0]);
    }
    if (
      blueprintText.includes("Data contract") ||
      blueprintText.includes("Feed Contract")
    ) {
      passed.push(checks[1]);
    }
    if (
      /did_not_release|remaining|would require|release blocker|not deploy/i.test(
        text,
      )
    ) {
      passed.push(checks[2]);
    }
  } else if (criterion.id === "chain.playbook-verification") {
    if (/fetch|feed|runtime|remaining|would require/i.test(text)) {
      passed.push(checks[0]);
    }
    if (/README|blind spot|data freshness|sources/i.test(text)) {
      passed.push(checks[1]);
    }
    if (/screenshot|lint|release|did_not_release|remaining/i.test(text)) {
      passed.push(checks[2]);
    }
  } else if (criterion.id === "evidence.provenance") {
    if (deterministic.dataSkillsList.ok) {
      passed.push(checks[0]);
    }
    if (deterministic.skillhubGet.ok && deterministic.skillhubFile.ok) {
      passed.push(checks[1]);
    }
    if (/did_not_release|release|blocker|remaining/i.test(text)) {
      passed.push(checks[2]);
    }
  } else if (criterion.id === "communication.user-facing") {
    if (parsed.result && parsed.result.length < 5000) {
      passed.push(checks[0]);
    }
    if (!/buy now|guaranteed|risk-free/i.test(parsed.result || "")) {
      passed.push(checks[1]);
    }
    if (
      !/TICKR|<COMPANY_NAME>|template-design-ui-view-source/i.test(
        parsed.result || "",
      )
    ) {
      passed.push(checks[2]);
    }
  }

  return scoreCriterion(criterion.points, checks, passed, {
    deterministic: summarizeDeterministicEvidence(deterministic),
    mode: "evidence-slice",
    agent_commands: parsed.toolUses
      .filter((use) => use.name === "Bash")
      .map((use) => use.input.command || ""),
  });
}

function scoreSpecificCriterion(
  criterion,
  testCase,
  deterministic,
  parsed,
  text,
  blueprintText,
) {
  const checks = criterion.checks;
  const passed = [];
  const agentOnly = [
    parsed.result || "",
    text || "",
    ...parsed.toolUses
      .filter((use) => use.name === "Bash")
      .map((use) => use.input.command || ""),
  ].join("\n");
  const lowerAgent = agentOnly.toLowerCase();
  const lowerBlueprint = blueprintText.toLowerCase();
  const words = new Set(
    [...criterion.tags, criterion.id, ...checks.join(" ").split(/\W+/)]
      .map((word) => word.toLowerCase())
      .filter((word) => word.length >= 4),
  );
  const agentHits = [...words].filter((word) => lowerAgent.includes(word));
  const blueprintHits = [...words].filter((word) =>
    lowerBlueprint.includes(word),
  );
  const evidenceSlice =
    /did_not_release|evidence-gathering slice|remaining runtime\/release/i.test(
      text,
    );
  const planningEligible =
    /\.(mode|scope|coverage|config|inputs|universe)$|event-selection|event-scope|peer-set|company-inputs|disabled-guard|no-scaffold-leak/.test(
      criterion.id,
    );

  if (criterion.id.includes("disabled-guard")) {
    if (testCase.catalog.disabled && /disabled/i.test(text)) {
      passed.push(checks[0]);
    }
  } else if (criterion.id.includes("no-scaffold-leak")) {
    if (
      !/TICKR|<COMPANY_NAME>|template-design-ui-view-source/i.test(
        parsed.result || "",
      )
    ) {
      passed.push(checks[0]);
    }
  } else if (evidenceSlice && planningEligible && agentHits.length > 0) {
    passed.push(checks[0]);
  } else if (!evidenceSlice && agentHits.length > 0) {
    passed.push(checks[0]);
  }

  return scoreCriterion(criterion.points, checks, passed, {
    agent_matched_terms: agentHits.slice(0, 12),
    blueprint_matched_terms: blueprintHits.slice(0, 12),
    note: "Case-specific score is based on the agent trace, not blueprint text alone. Blueprint hits are recorded for audit but do not earn artifact/UI/release points in evidence-slice mode.",
  });
}

function summarizeDeterministicEvidence(evidence) {
  return Object.fromEntries(
    Object.entries(evidence).map(([key, result]) => [
      key,
      {
        ok: result.ok,
        status: result.status,
        stdout_bytes: result.stdout.length,
        stderr_bytes: result.stderr.length,
      },
    ]),
  );
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function writeResults(manifest, scorecards, opts, profile, runId) {
  mkdirSync(opts.resultsDir, { recursive: true });
  const summary = {
    run_id: runId,
    generated_at: GENERATED_AT,
    profile,
    mode: opts.mode,
    objective:
      "Run and score every Alva Skillhub production blueprint baseline case.",
    cases_total: scorecards.length,
    scores: {
      average: Number(
        (
          scorecards.reduce((total, card) => total + card.score.total, 0) /
          Math.max(1, scorecards.length)
        ).toFixed(2),
      ),
      min: Math.min(...scorecards.map((card) => card.score.total)),
      max: Math.max(...scorecards.map((card) => card.score.total)),
    },
    agent_runs: summarizeAgentRuns(scorecards),
    rubric_status_counts: summarizeRubricStatuses(scorecards),
    caveat:
      "This run executed the evidence-gathering slice for every case. It did not deploy/release 17 playbooks, so runtime/release/UI rubric points are awarded only where direct evidence exists and otherwise remain unearned.",
    case_scores: scorecards.map((card) => ({
      case_id: card.case_id,
      skill_id: card.skill_id,
      disabled: card.disabled,
      total: card.score.total,
      shared: card.score.shared,
      case_specific: card.score.case_specific,
    })),
  };

  writeFileSync(
    resolve(opts.resultsDir, "run-summary.json"),
    JSON.stringify(summary, null, 2) + "\n",
  );
  writeFileSync(
    resolve(opts.resultsDir, "scorecards.json"),
    JSON.stringify(scorecards, null, 2) + "\n",
  );
  writeFileSync(
    resolve(opts.resultsDir, "report.md"),
    renderReport(summary, scorecards),
  );
}

function summarizeAgentRuns(scorecards) {
  const statuses = {};
  let timedOut = 0;
  for (const card of scorecards) {
    const status = String(card.agent_run.status);
    statuses[status] = (statuses[status] || 0) + 1;
    if (card.agent_run.timed_out) {
      timedOut += 1;
    }
  }
  return { statuses, timed_out: timedOut };
}

function summarizeRubricStatuses(scorecards) {
  const counts = { all: {}, shared: {}, case_specific: {} };
  for (const card of scorecards) {
    for (const item of card.shared_rubric) {
      counts.shared[item.status] = (counts.shared[item.status] || 0) + 1;
      counts.all[item.status] = (counts.all[item.status] || 0) + 1;
    }
    for (const item of card.case_specific_rubric) {
      counts.case_specific[item.status] =
        (counts.case_specific[item.status] || 0) + 1;
      counts.all[item.status] = (counts.all[item.status] || 0) + 1;
    }
  }
  return counts;
}

function renderReport(summary, scorecards) {
  const lines = [
    "# Skillhub Blueprint Baseline Run",
    "",
    `- Run id: \`${summary.run_id}\``,
    `- Generated at: ${summary.generated_at}`,
    `- Profile: \`${summary.profile}\``,
    `- Mode: \`${summary.mode}\``,
    `- Cases scored: ${summary.cases_total}`,
    `- Average score: ${summary.scores.average}/100`,
    `- Score range: ${summary.scores.min}..${summary.scores.max}`,
    `- Agent run statuses: ${Object.entries(summary.agent_runs.statuses)
      .map(([status, count]) => `${status}=${count}`)
      .join(", ")}`,
    `- Agent timeouts: ${summary.agent_runs.timed_out}`,
    "",
    "## Scope",
    "",
    summary.caveat,
    "",
    "## Scores",
    "",
    "| Case | Skill | Disabled | Total | Shared | Case-specific |",
    "| --- | --- | --- | ---: | ---: | ---: |",
  ];

  for (const card of scorecards) {
    lines.push(
      `| ${card.case_id} | ${card.skill_id} | ${card.disabled ? "yes" : "no"} | ${card.score.total} | ${card.score.shared} | ${card.score.case_specific} |`,
    );
  }

  lines.push(
    "",
    "## Evidence",
    "",
    "Each scorecard records deterministic command evidence, agent Bash commands,",
    "per-criterion status labels, passed/failed checks, and the agent's",
    "terminal result.",
    "",
    "Rubric status counts:",
    "",
    `- all: ${formatStatusCounts(summary.rubric_status_counts.all)}`,
    `- shared: ${formatStatusCounts(summary.rubric_status_counts.shared)}`,
    `- case-specific: ${formatStatusCounts(
      summary.rubric_status_counts.case_specific,
    )}`,
    "",
  );

  return `${lines.join("\n")}\n`;
}

function formatStatusCounts(counts) {
  return ["full", "partial", "zero"]
    .map((status) => `${status}=${counts[status] || 0}`)
    .join(", ");
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.workers !== 1) {
    throw new Error("run-and-score currently supports --workers 1 only");
  }

  const manifest = loadJson(opts.casesPath);
  const profile = opts.profile || manifest.profile || "prd";
  const runId = opts.runId || `skillhub-baseline-${GENERATED_AT.slice(0, 10)}`;
  const cases = selectCases(manifest, opts);

  if (cases.length === 0) {
    throw new Error("No cases selected");
  }

  mkdirSync(opts.rawDir, { recursive: true });
  const scorecards = [];

  for (const [index, testCase] of cases.entries()) {
    console.error(
      `[${index + 1}/${cases.length}] running ${testCase.skill_id}`,
    );
    const deterministic = runDeterministicEvidence(testCase, profile);
    const agentRun = runAgent(testCase, profile, opts);
    if (opts.keepRaw) {
      writeFileSync(
        resolve(opts.rawDir, `${testCase.id}.stream.jsonl`),
        agentRun.raw || "",
      );
    }
    scorecards.push(scoreCase(testCase, deterministic, agentRun, manifest));
  }

  writeResults(manifest, scorecards, opts, profile, runId);
  console.log(`Wrote ${scorecards.length} scorecard(s) to ${opts.resultsDir}`);
}

main();
