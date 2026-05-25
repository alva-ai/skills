#!/usr/bin/env node

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const skillRel = "skills/alva/SKILL.md";
const refsRel = "skills/alva/references";
const casesPath = path.join(root, "skills/alva/evals/app_workflow_cases.json");

function usage() {
  console.error(
    "Usage: node skills/alva/evals/app_workflow_eval.js [--label NAME] [--out FILE] [--treeish REF]"
  );
  process.exit(2);
}

let label = "app-workflow";
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

function readCurrent(relPath) {
  const full = path.join(root, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

function listCurrentRefs(dirRel) {
  const dir = path.join(root, dirRel);
  if (!fs.existsSync(dir)) return [];
  const walk = (current) =>
    fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) return walk(full);
      return full.endsWith(".md") ? [path.relative(root, full)] : [];
    });
  return walk(dir).sort();
}

function loadDoc(relPath) {
  return treeish ? gitShow(relPath) : readCurrent(relPath);
}

function listRefs() {
  return (treeish ? gitListRefs() : listCurrentRefs(refsRel)).sort();
}

function has(text, pattern) {
  const normalize = (value) => String(value).toLowerCase().replace(/\s+/g, " ").trim();
  return normalize(text).includes(normalize(pattern));
}

function gatePresent(text, gate) {
  return has(text, `id="${gate}"`) || has(text, `id='${gate}'`) || has(text, gate);
}

function makeCheck(kind, value, pass, detail) {
  return { kind, value, pass, detail };
}

const cases = JSON.parse(fs.readFileSync(casesPath, "utf8"));
const skill = loadDoc(skillRel) || "";
const refFiles = listRefs();
const refs = Object.fromEntries(refFiles.map((relPath) => [relPath, loadDoc(relPath) || ""]));
const corpus = [skill, ...Object.values(refs)].join("\n");

const results = cases.map((testCase) => {
  const checks = [];

  for (const ref of testCase.skill_refs || []) {
    const rel = path.posix.join("skills/alva", ref);
    const exists = Object.prototype.hasOwnProperty.call(refs, rel);
    const routed = has(skill, ref);
    checks.push(makeCheck("skill_ref_exists_and_routed", ref, exists && routed));
  }

  for (const pattern of testCase.skill_patterns || []) {
    checks.push(makeCheck("skill_routing_pattern", pattern, has(skill, pattern)));
  }

  for (const gate of testCase.gate_ids || []) {
    checks.push(
      makeCheck(
        "hard_gate_visible_and_canonical",
        gate,
        gatePresent(skill, gate) && gatePresent(corpus, gate)
      )
    );
  }

  for (const pattern of testCase.corpus_patterns || []) {
    checks.push(makeCheck("workflow_step_or_api_detail", pattern, has(corpus, pattern)));
  }

  for (const pattern of testCase.forbidden_guardrails || []) {
    checks.push(makeCheck("guardrail_against_bad_app_behavior", pattern, has(corpus, pattern)));
  }

  for (const pattern of testCase.outcome_patterns || []) {
    checks.push(makeCheck("observable_outcome_or_evidence", pattern, has(corpus, pattern)));
  }

  for (const pattern of testCase.absent_patterns || []) {
    checks.push(makeCheck("stale_or_conflicting_pattern_absent", pattern, !has(corpus, pattern)));
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
const sourceLabel = treeish ? `${label} (${treeish})` : label;

const lines = [];
lines.push(`# Alva App Workflow Eval — ${sourceLabel}`);
lines.push("");
lines.push(
  "This evaluation checks whether a fresh agent has enough instruction to complete representative Alva application workflows end to end. It is intentionally broader than routing: each case requires the right references, workflow/API details, hard gates, guardrails against incorrect app behavior, and observable completion evidence."
);
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
  lines.push(`Task class: ${result.task_class}`);
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
