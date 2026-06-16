#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../..");
const DEFAULT_SCENARIOS = resolve(SCRIPT_DIR, "scenarios.json");
const DEFAULT_SKILL_DIR = resolve(REPO_ROOT, "skills/alva");
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const ROUTE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["route", "references_to_read", "rationale"],
  properties: {
    route: { type: "string" },
    references_to_read: { type: "array", items: { type: "string" } },
    rationale: { type: "string" },
  },
};

const TRACE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "route",
    "references_to_read",
    "gates_to_satisfy",
    "actions",
    "boundaries",
    "forbidden_actions",
    "quoted_contracts",
    "confidence",
    "rationale",
  ],
  properties: {
    route: { type: "string" },
    references_to_read: { type: "array", items: { type: "string" } },
    gates_to_satisfy: { type: "array", items: { type: "string" } },
    actions: { type: "array", items: { type: "string" } },
    boundaries: { type: "array", items: { type: "string" } },
    forbidden_actions: { type: "array", items: { type: "string" } },
    quoted_contracts: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    rationale: { type: "string" },
  },
};

function parseArgs(argv) {
  const opts = {
    scenariosPath: DEFAULT_SCENARIOS,
    skillDir: DEFAULT_SKILL_DIR,
    out: null,
    jsonOut: null,
    model: process.env.ALVA_SKILL_LLM_EVAL_MODEL ?? "",
    apiKey: process.env.OPENAI_API_KEY ?? "",
    scenarioIds: [],
    limit: null,
    selfTest: false,
    skipWithoutConfig: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--scenarios") {
      opts.scenariosPath = resolve(argv[++i]);
    } else if (arg === "--skill-dir") {
      opts.skillDir = resolve(argv[++i]);
    } else if (arg === "--out") {
      opts.out = resolve(argv[++i]);
    } else if (arg === "--json-out") {
      opts.jsonOut = resolve(argv[++i]);
    } else if (arg === "--model") {
      opts.model = argv[++i];
    } else if (arg === "--scenario") {
      opts.scenarioIds.push(argv[++i]);
    } else if (arg === "--limit") {
      opts.limit = Number.parseInt(argv[++i], 10);
    } else if (arg === "--self-test") {
      opts.selfTest = true;
    } else if (arg === "--skip-without-config") {
      opts.skipWithoutConfig = true;
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
  console.log(`Usage: node evals/alva-skill-docs/llm-scenario-trace.mjs [options]

Options:
  --skill-dir <path>         Skill directory. Default: skills/alva.
  --scenarios <path>         Scenario manifest. Default: evals/alva-skill-docs/scenarios.json.
  --out <path>               Write markdown report.
  --json-out <path>          Write raw trace/check JSON.
  --model <model>            OpenAI model. Defaults to ALVA_SKILL_LLM_EVAL_MODEL.
  --scenario <id>            Run one scenario. Repeatable.
  --limit <n>                Limit scenario count after filtering.
  --self-test                Do not call an LLM; validate checker with synthetic passing traces.
  --skip-without-config      Exit 0 with a skipped report if OPENAI_API_KEY or model is missing.
  -h, --help                 Show this help.
`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function ensureParent(path) {
  mkdirSync(dirname(path), { recursive: true });
}

function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...listFiles(path));
    else out.push(path);
  }
  return out;
}

function normalizePath(path) {
  return path.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^skills\/alva\//, "");
}

function normalizeText(text) {
  return String(text).toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeRef(ref) {
  return normalizePath(String(ref))
    .replace(/^references\//, "")
    .replace(/^skills\/alva\/references\//, "")
    .replace(/^\.\/references\//, "")
    .toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function loadSkillCorpus(skillDir) {
  const skillPath = resolve(skillDir, "SKILL.md");
  if (!existsSync(skillPath)) throw new Error(`No SKILL.md at ${skillPath}`);

  const referencesDir = resolve(skillDir, "references");
  const referenceFiles = listFiles(referencesDir)
    .filter((path) => /\.(md|yaml|css)$/.test(path))
    .sort();
  const references = new Map();
  for (const path of referenceFiles) {
    const key = normalizePath(relative(skillDir, path));
    references.set(key, readFileSync(path, "utf8"));
  }

  return {
    skill: readFileSync(skillPath, "utf8"),
    references,
    referenceList: [...references.keys()],
  };
}

function filterScenarios(manifest, opts) {
  let scenarios = manifest.scenarios ?? [];
  if (opts.scenarioIds.length > 0) {
    const wanted = new Set(opts.scenarioIds);
    scenarios = scenarios.filter((scenario) => wanted.has(scenario.id));
  }
  if (Number.isInteger(opts.limit) && opts.limit >= 0) {
    scenarios = scenarios.slice(0, opts.limit);
  }
  return scenarios;
}

function makeRoutePrompt(corpus, scenario) {
  return [
    "You are acting as the Alva skill routing layer. Use only the supplied skill text.",
    "Do not execute tools. Do not answer the user's finance question.",
    "Choose the route and the reference files a careful agent should read next.",
    "Return only the requested structured trace.",
    "",
    "# User prompt",
    scenario.prompt,
    "",
    "# Available references",
    corpus.referenceList.map((file) => `- ${file}`).join("\n"),
    "",
    "# SKILL.md",
    corpus.skill,
  ].join("\n");
}

function refKeyForOutput(corpus, ref) {
  const wanted = normalizeRef(ref);
  return corpus.referenceList.find((file) => {
    const normalized = normalizeRef(file);
    return normalized === wanted || normalized.endsWith(`/${wanted}`) || wanted.endsWith(normalized);
  });
}

function selectedReferenceBundle(corpus, refs) {
  const keys = unique(["references/request-routing.md", ...refs.map((ref) => refKeyForOutput(corpus, ref))]);
  return keys
    .filter((key) => key && corpus.references.has(key))
    .map((key) => {
      const body = corpus.references.get(key);
      return `\n\n--- ${key} ---\n${body}`;
    })
    .join("");
}

function makeTracePrompt(corpus, scenario, routeTrace) {
  return [
    "You are acting as the Alva skill after its first routing pass.",
    "Use only the supplied SKILL.md and reference excerpts. Do not execute tools.",
    "Produce the next-step trace a careful agent would follow.",
    "For quoted_contracts, copy exact short phrases from the supplied docs that govern the route, gates, actions, and boundaries.",
    "Do not include phrases you cannot find in the supplied docs.",
    "",
    "# User prompt",
    scenario.prompt,
    "",
    "# First-pass route trace",
    JSON.stringify(routeTrace, null, 2),
    "",
    "# SKILL.md",
    corpus.skill,
    "",
    "# Reference excerpts selected by the first-pass trace",
    selectedReferenceBundle(corpus, routeTrace.references_to_read ?? []),
  ].join("\n");
}

async function callResponsesApi(opts, schemaName, schema, prompt) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      store: false,
      input: [
        {
          role: "user",
          content: prompt,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  const bodyText = await response.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = body?.error?.message ?? bodyText;
    throw new Error(`OpenAI Responses API failed (${response.status}): ${message}`);
  }

  const outputText = extractOutputText(body);
  if (!outputText) {
    throw new Error("OpenAI Responses API returned no output_text content.");
  }
  return JSON.parse(outputText);
}

function extractOutputText(responseBody) {
  if (typeof responseBody?.output_text === "string") return responseBody.output_text;
  const parts = [];
  for (const item of responseBody?.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

function syntheticTrace(scenario) {
  const expect = scenario.expect ?? {};
  const gates = (expect.gates ?? []).map((gate) => gate.id ?? gate.heading).filter(Boolean);
  const quoted = [
    expect.top_level_route,
    ...(expect.behaviors ?? []),
    ...(expect.forbidden_behaviors ?? []),
    ...(expect.sections ?? []).flatMap((section) => section.includes ?? []),
    ...(expect.gates ?? []).flatMap((gate) => [gate.id, ...(gate.includes ?? [])]),
  ];

  return {
    route: expect.route ?? "",
    references_to_read: expect.references ?? [],
    gates_to_satisfy: gates,
    actions: expect.behaviors ?? [],
    boundaries: expect.forbidden_behaviors ?? [],
    forbidden_actions: expect.forbidden_behaviors ?? [],
    quoted_contracts: unique(quoted),
    confidence: "high",
    rationale: "Synthetic self-test trace generated from scenario expectations.",
  };
}

function traceText(trace) {
  return normalizeText(JSON.stringify(trace));
}

function hasRef(refs, expected) {
  const normalizedRefs = refs.map(normalizeRef);
  const wanted = normalizeRef(expected);
  return normalizedRefs.some(
    (ref) => ref === wanted || ref.endsWith(`/${wanted}`) || wanted.endsWith(`/${ref}`),
  );
}

function hasText(trace, expected) {
  return traceText(trace).includes(normalizeText(expected));
}

function pushCheck(checks, label, pass, detail = "") {
  checks.push({ label, pass, detail });
}

function evaluateTrace(scenario, trace) {
  const expect = scenario.expect ?? {};
  const checks = [];

  if (expect.route) {
    pushCheck(checks, `route is ${expect.route}`, normalizeText(trace.route) === normalizeText(expect.route), trace.route);
  }

  for (const ref of expect.references ?? []) {
    pushCheck(checks, `references include ${ref}`, hasRef(trace.references_to_read ?? [], ref), (trace.references_to_read ?? []).join(", "));
  }

  if (expect.top_level_route) {
    pushCheck(checks, `trace cites ${expect.top_level_route}`, hasText(trace, expect.top_level_route));
  }

  for (const behavior of expect.behaviors ?? []) {
    pushCheck(checks, `trace cites ${behavior}`, hasText(trace, behavior));
  }

  for (const forbidden of expect.forbidden_behaviors ?? []) {
    pushCheck(checks, `trace preserves boundary ${forbidden}`, hasText(trace, forbidden));
  }

  for (const section of expect.sections ?? []) {
    for (const phrase of section.includes ?? []) {
      pushCheck(checks, `trace cites ${section.file}#${section.heading}: ${phrase}`, hasText(trace, phrase));
    }
  }

  for (const gate of expect.gates ?? []) {
    const gateName = gate.id ?? gate.heading;
    if (gateName) {
      pushCheck(checks, `gates include ${gateName}`, hasText(trace.gates_to_satisfy ?? [], gateName) || hasText(trace, gateName));
    }
    for (const phrase of gate.includes ?? []) {
      pushCheck(checks, `trace cites ${gateName}: ${phrase}`, hasText(trace, phrase));
    }
  }

  const passed = checks.filter((check) => check.pass).length;
  return {
    id: scenario.id,
    group: scenario.group ?? "scenarios",
    prompt: scenario.prompt,
    ok: passed === checks.length,
    passed,
    total: checks.length,
    checks,
    trace,
  };
}

async function runScenario(opts, corpus, scenario) {
  if (opts.selfTest) {
    return evaluateTrace(scenario, syntheticTrace(scenario));
  }

  const routeTrace = await callResponsesApi(opts, "alva_skill_route_trace", ROUTE_SCHEMA, makeRoutePrompt(corpus, scenario));
  const trace = await callResponsesApi(opts, "alva_skill_scenario_trace", TRACE_SCHEMA, makeTracePrompt(corpus, scenario, routeTrace));
  trace.route_stage = routeTrace;
  return evaluateTrace(scenario, trace);
}

function renderReport({ manifest, sourceLabel, model, results, skippedReason }) {
  const now = new Date().toISOString();
  let out = `# ${manifest.name} LLM Trace Eval\n\n`;
  out += `Generated: ${now}\n\n`;
  out += `Source: \`${sourceLabel}\`\n\n`;
  out += `Model: \`${model || "not configured"}\`\n\n`;

  if (skippedReason) {
    out += `Status: skipped\n\nReason: ${skippedReason}\n`;
    return out;
  }

  const passedCases = results.filter((result) => result.ok).length;
  const totalChecks = results.reduce((sum, result) => sum + result.total, 0);
  const passedChecks = results.reduce((sum, result) => sum + result.passed, 0);
  const pct = totalChecks === 0 ? 100 : (passedChecks / totalChecks) * 100;
  out += `Cases: ${passedCases}/${results.length}\n\n`;
  out += `Checks: ${passedChecks}/${totalChecks} (${pct.toFixed(2)}%)\n\n`;
  out += "This is a periodic LLM-as-actor diagnostic. The checker is deterministic, but the actor may vary by model and date; inspect failures before editing docs.\n\n";

  for (const result of results) {
    out += `## ${result.ok ? "PASS" : "FAIL"} ${result.id}\n\n`;
    out += `Prompt: \`${result.prompt}\`\n\n`;
    out += `Route: \`${result.trace.route}\`\n\n`;
    out += `References: ${(result.trace.references_to_read ?? []).map((ref) => `\`${ref}\``).join(", ") || "(none)"}\n\n`;
    for (const check of result.checks) {
      out += `- ${check.pass ? "[x]" : "[ ]"} ${check.label}`;
      if (!check.pass && check.detail) out += ` (actual: ${check.detail})`;
      out += "\n";
    }
    out += "\n";
  }

  return out;
}

function writeOutputs(opts, report, payload) {
  if (opts.out) {
    ensureParent(opts.out);
    writeFileSync(opts.out, report, "utf8");
  }
  if (opts.jsonOut) {
    ensureParent(opts.jsonOut);
    writeFileSync(opts.jsonOut, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const manifest = readJson(opts.scenariosPath);
  const scenarios = filterScenarios(manifest, opts);
  const sourceLabel = opts.selfTest ? "synthetic self-test" : opts.skillDir;

  if (!opts.selfTest && (!opts.apiKey || !opts.model)) {
    const missing = [!opts.apiKey ? "OPENAI_API_KEY" : "", !opts.model ? "ALVA_SKILL_LLM_EVAL_MODEL or --model" : ""]
      .filter(Boolean)
      .join(" and ");
    if (opts.skipWithoutConfig) {
      const payload = { skipped: true, missing, results: [] };
      const report = renderReport({ manifest, sourceLabel, model: opts.model, results: [], skippedReason: `Missing ${missing}.` });
      writeOutputs(opts, report, payload);
      process.stdout.write(report);
      return;
    }
    throw new Error(`Missing ${missing}.`);
  }

  const corpus = loadSkillCorpus(opts.skillDir);
  const results = [];
  for (const scenario of scenarios) {
    results.push(await runScenario(opts, corpus, scenario));
  }

  const payload = {
    model: opts.model,
    source: sourceLabel,
    self_test: opts.selfTest,
    results,
  };
  const report = renderReport({ manifest, sourceLabel, model: opts.model, results });
  writeOutputs(opts, report, payload);
  process.stdout.write(report);
  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.stack ?? String(error));
  process.exitCode = 1;
});
