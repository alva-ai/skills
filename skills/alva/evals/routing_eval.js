#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = process.cwd();
const skillRel = "skills/alva/SKILL.md";
const refsRel = "skills/alva/references";
const skillPath = path.join(root, skillRel);
const casesPath = path.join(root, "skills/alva/evals/routing_cases.json");

function usage() {
  console.error("Usage: node skills/alva/evals/routing_eval.js [--label NAME] [--out FILE] [--treeish REF]");
  process.exit(2);
}

let label = "eval";
let outPath = null;
let treeish = null;
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === "--label") {
    label = process.argv[++i];
  } else if (arg === "--out") {
    outPath = process.argv[++i];
  } else if (arg === "--treeish") {
    treeish = process.argv[++i];
  } else {
    usage();
  }
}

function gitShow(relPath) {
  try {
    return execFileSync("git", ["show", `${treeish}:${relPath}`], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function gitListRefs() {
  try {
    return execFileSync("git", ["ls-tree", "-r", "--name-only", treeish, refsRel], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .filter((line) => line.endsWith(".md"));
  } catch {
    return [];
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

function loadDoc(relPath) {
  return treeish ? gitShow(relPath) : readText(path.join(root, relPath));
}

function listRefs() {
  return treeish
    ? gitListRefs()
    : listFiles(path.join(root, refsRel))
        .filter((file) => file.endsWith(".md"))
        .map((file) => path.relative(root, file))
        .sort();
}

function has(text, pattern) {
  return text.toLowerCase().includes(String(pattern).toLowerCase());
}

const skill = loadDoc(skillRel) || "";
const referenceFiles = listRefs();
const corpus = [skill, ...referenceFiles.map((file) => loadDoc(file) || "")].join("\n");
const cases = JSON.parse(readText(casesPath));

const results = cases.map((testCase) => {
  const checks = [];
  for (const ref of testCase.skill_refs || []) {
    const exists = treeish
      ? referenceFiles.includes(path.posix.join("skills/alva", ref))
      : fs.existsSync(path.join(root, "skills/alva", ref));
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
lines.push(`# Alva Skill Capability Map Eval — ${label}`);
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
