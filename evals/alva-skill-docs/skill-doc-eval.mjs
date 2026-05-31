#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CASES = resolve(SCRIPT_DIR, "cases.json");
const SCRIPT_PATH = fileURLToPath(import.meta.url);

const SCORE_DIAGNOSIS_GUIDE = [
  "Eval score is diagnostic: use every failed check to find a skill gap, not as user-facing scoring copy.",
  "Classify the gap before editing: missing capability summary, missing routing pointer, missing guardrail, missing reference detail, or missing eval coverage.",
  "Do not expose eval scores as product copy, and do not patch demos to hide a weak result.",
  "Instead, fix the canonical skill text or eval case, then rerun baseline and final reports so the regression mechanism proves the gap is closed.",
].join("\n");

function parseArgs(argv) {
  const opts = {
    casesPath: DEFAULT_CASES,
    skillDir: resolve("skills/alva"),
    treeish: null,
    out: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cases") {
      opts.casesPath = resolve(argv[++i]);
    } else if (arg === "--skill-dir") {
      opts.skillDir = resolve(argv[++i]);
    } else if (arg === "--treeish") {
      opts.treeish = argv[++i];
    } else if (arg === "--out") {
      opts.out = resolve(argv[++i]);
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
  console.log(`Usage: node evals/alva-skill-docs/skill-doc-eval.mjs [options]

Options:
  --treeish <ref>      Read skills/alva from a git ref instead of the worktree.
  --skill-dir <path>   Skill directory in the worktree. Default: skills/alva.
  --cases <path>       Cases manifest. Default: evals/alva-skill-docs/cases.json.
  --out <path>         Write markdown report.
  -h, --help           Show this help.
`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function gitShow(treeish, path) {
  try {
    return execFileSync("git", ["show", `${treeish}:${path}`], {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

function gitLsTree(treeish, path) {
  try {
    return execFileSync("git", ["ls-tree", "-r", "--name-only", treeish, path], {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readWorktree(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

function loadEvalMaterials(casesPath) {
  const files = [SCRIPT_PATH, casesPath];
  return files
    .filter((path, index, all) => all.indexOf(path) === index && existsSync(path))
    .map((path) => `\n\n--- ${path} ---\n${readFileSync(path, "utf8")}`)
    .join("");
}

function loadCorpus(opts) {
  const evalText = loadEvalMaterials(opts.casesPath);
  if (opts.treeish) {
    const skill = gitShow(opts.treeish, "skills/alva/SKILL.md");
    if (skill == null) throw new Error(`No skills/alva/SKILL.md at ${opts.treeish}`);

    const files = gitLsTree(opts.treeish, "skills/alva/references");
    let references = "";
    for (const file of files) {
      if (/\.(md|yaml|css)$/.test(file)) {
        const body = gitShow(opts.treeish, file);
        if (body != null) references += `\n\n--- ${file} ---\n${body}`;
      }
    }
    return { label: opts.treeish, skill, references, corpus: `${skill}${references}`, eval: evalText };
  }

  const skillPath = resolve(opts.skillDir, "SKILL.md");
  const skill = readWorktree(skillPath);
  if (skill == null) throw new Error(`No SKILL.md at ${skillPath}`);

  const refFiles = execFileSync("find", [
    resolve(opts.skillDir, "references"),
    "-type",
    "f",
    "(",
    "-name",
    "*.md",
    "-o",
    "-name",
    "*.yaml",
    "-o",
    "-name",
    "*.css",
    ")",
  ], {
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .filter(Boolean);

  let references = "";
  for (const file of refFiles) {
    references += `\n\n--- ${file} ---\n${readFileSync(file, "utf8")}`;
  }
  return { label: opts.skillDir, skill, references, corpus: `${skill}${references}`, eval: evalText };
}

function includesAll(text, needles) {
  const lower = normalizeText(text);
  return needles.map((needle) => ({
    needle,
    pass: lower.includes(normalizeText(String(needle))),
  }));
}

function normalizeText(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function evaluateCase(testCase, docs) {
  const text =
    testCase.target === "skill"
      ? docs.skill
      : testCase.target === "eval"
        ? docs.eval
        : docs.corpus;
  const checks = [];

  if (Array.isArray(testCase.includes)) {
    checks.push(...includesAll(text, testCase.includes));
  }

  if (typeof testCase.max_lines === "number" || typeof testCase.min_lines === "number") {
    const lines = docs.skill.trimEnd().split(/\r?\n/).length;
    if (typeof testCase.min_lines === "number") {
      checks.push({
        needle: `line count >= ${testCase.min_lines} (actual ${lines})`,
        pass: lines >= testCase.min_lines,
      });
    }
    if (typeof testCase.max_lines === "number") {
      checks.push({
        needle: `line count <= ${testCase.max_lines} (actual ${lines})`,
        pass: lines <= testCase.max_lines,
      });
    }
  }

  const passed = checks.filter((check) => check.pass).length;
  return {
    ...testCase,
    passed,
    total: checks.length,
    ok: passed === checks.length,
    checks,
  };
}

function renderReport(manifest, docs, results) {
  const totalCases = results.length;
  const passedCases = results.filter((r) => r.ok).length;
  const totalChecks = results.reduce((sum, r) => sum + r.total, 0);
  const passedChecks = results.reduce((sum, r) => sum + r.passed, 0);
  const pct = totalChecks === 0 ? 100 : (passedChecks / totalChecks) * 100;
  const skillLines = docs.skill.trimEnd().split(/\r?\n/).length;

  const byGroup = new Map();
  for (const result of results) {
    if (!byGroup.has(result.group)) byGroup.set(result.group, []);
    byGroup.get(result.group).push(result);
  }

  let out = "";
  out += `# ${manifest.name}\n\n`;
  out += `Source: \`${docs.label}\`\n\n`;
  out += `SKILL.md lines: ${skillLines}\n\n`;
  out += `Cases: ${passedCases}/${totalCases}\n\n`;
  out += `Checks: ${passedChecks}/${totalChecks} (${pct.toFixed(2)}%)\n\n`;
  out += "## Scoring Diagnosis\n\n";
  out += `${SCORE_DIAGNOSIS_GUIDE}\n\n`;
  const failedResults = results.filter((result) => !result.ok);
  if (failedResults.length === 0) {
    out += "No failed cases. Keep the eval in place as a regression mechanism.\n\n";
  } else {
    for (const result of failedResults) {
      const missing = result.checks
        .filter((check) => !check.pass)
        .map((check) => check.needle)
        .join("; ");
      out += `- ${result.id}: inspect for a skill gap before editing. Missing checks: ${missing}\n`;
    }
    out += "\n";
  }

  for (const [group, groupResults] of byGroup) {
    const gCases = groupResults.filter((r) => r.ok).length;
    const gChecks = groupResults.reduce((sum, r) => sum + r.total, 0);
    const gPassed = groupResults.reduce((sum, r) => sum + r.passed, 0);
    out += `## ${group}\n\n`;
    out += `${gCases}/${groupResults.length} cases, ${gPassed}/${gChecks} checks\n\n`;
    for (const result of groupResults) {
      out += `### ${result.ok ? "PASS" : "FAIL"} ${result.id}\n\n`;
      out += `${result.description}\n\n`;
      for (const check of result.checks) {
        out += `- ${check.pass ? "[x]" : "[ ]"} ${check.needle}\n`;
      }
      out += "\n";
    }
  }

  return `${out.trimEnd()}\n`;
}

const opts = parseArgs(process.argv.slice(2));
const manifest = readJson(opts.casesPath);
const docs = loadCorpus(opts);
const results = manifest.cases.map((testCase) => evaluateCase(testCase, docs));
const report = renderReport(manifest, docs, results);

if (opts.out) {
  writeFileSync(opts.out, report);
}

process.stdout.write(report);
if (results.some((result) => !result.ok)) {
  process.exitCode = 1;
}
