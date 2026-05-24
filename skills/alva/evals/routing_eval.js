#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const skillPath = path.join(root, "skills/alva/SKILL.md");
const casesPath = path.join(root, "skills/alva/evals/routing_cases.json");

function usage() {
  console.error("Usage: node skills/alva/evals/routing_eval.js [--label NAME] [--out FILE]");
  process.exit(2);
}

let label = "eval";
let outPath = null;
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === "--label") {
    label = process.argv[++i];
  } else if (arg === "--out") {
    outPath = process.argv[++i];
  } else {
    usage();
  }
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return [full];
  });
}

function has(text, pattern) {
  return text.toLowerCase().includes(String(pattern).toLowerCase());
}

const skill = readText(skillPath);
const referenceFiles = listFiles(path.join(root, "skills/alva/references"))
  .filter((file) => file.endsWith(".md"))
  .sort();
const corpus = [skillPath, ...referenceFiles].map(readText).join("\n");
const cases = JSON.parse(readText(casesPath));

const results = cases.map((testCase) => {
  const checks = [];
  for (const ref of testCase.skill_refs || []) {
    const exists = fs.existsSync(path.join(root, "skills/alva", ref));
    const routed = has(skill, ref);
    checks.push({ kind: "skill_ref", value: ref, pass: exists && routed });
  }
  for (const pattern of testCase.skill_patterns || []) {
    checks.push({ kind: "skill_pattern", value: pattern, pass: has(skill, pattern) });
  }
  for (const gate of testCase.gate_ids || []) {
    checks.push({ kind: "gate", value: gate, pass: has(skill, `id="${gate}"`) || has(skill, `id='${gate}'`) });
  }
  for (const pattern of testCase.corpus_patterns || []) {
    checks.push({ kind: "corpus_pattern", value: pattern, pass: has(corpus, pattern) });
  }
  const passed = checks.filter((check) => check.pass).length;
  return {
    ...testCase,
    checks,
    passed,
    total: checks.length,
    pass: passed === checks.length,
  };
});

const passedChecks = results.reduce((sum, result) => sum + result.passed, 0);
const totalChecks = results.reduce((sum, result) => sum + result.total, 0);
const passedCases = results.filter((result) => result.pass).length;
const score = totalChecks === 0 ? 0 : passedChecks / totalChecks;

const lines = [];
lines.push(`# Alva Skill Routing Eval — ${label}`);
lines.push("");
lines.push(`- Cases: ${passedCases}/${results.length}`);
lines.push(`- Checks: ${passedChecks}/${totalChecks}`);
lines.push(`- Score: ${(score * 100).toFixed(2)}%`);
lines.push("");
lines.push("## Case Results");
lines.push("");
for (const result of results) {
  const marker = result.pass ? "PASS" : "FAIL";
  lines.push(`### ${marker} ${result.id}`);
  lines.push("");
  lines.push(`Prompt: ${result.prompt}`);
  lines.push("");
  lines.push(`Checks: ${result.passed}/${result.total}`);
  const failed = result.checks.filter((check) => !check.pass);
  if (failed.length) {
    lines.push("");
    lines.push("Missing:");
    for (const check of failed) {
      lines.push(`- ${check.kind}: ${check.value}`);
    }
  }
  lines.push("");
}

const report = lines.join("\n");
if (outPath) {
  fs.writeFileSync(path.join(root, outPath), report + "\n");
} else {
  console.log(report);
}

if (passedChecks !== totalChecks) {
  process.exitCode = 1;
}
