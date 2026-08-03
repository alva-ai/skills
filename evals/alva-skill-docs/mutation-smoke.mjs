#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../..");
const EVAL_RUNNER = resolve(SCRIPT_DIR, "skill-doc-eval.mjs");
const DEFAULT_SKILL_DIR = resolve(REPO_ROOT, "skills/alva");

const MUTATIONS = [
  {
    id: "simple-latest-one-hop",
    file: "SKILL.md",
    remove: "Simple latest-fact asks stop there after one\nsourced hop; ",
    expectFailedCases: ["issue592.financial-ask-contract", "scenario.simple-latest-price"],
  },
  {
    id: "mandatory-investment-disclaimer",
    file: "SKILL.md",
    remove: "10. **Mandatory disclaimer.** Any answer involving a security price or investment strategy MUST include an investment disclaimer. See [user-facing-prose.md](references/user-facing-prose.md#investment-disclaimer).\n",
    expectFailedCases: [
      "target.mandatory-investment-disclaimer",
      "scenario.equity-price-disclaimer",
      "scenario.backtest-strategy",
    ],
  },
  {
    id: "capability-before-refusal",
    file: "references/request-routing.md",
    remove: "Before saying Alva lacks a capability or recommending BYOD, verify the catalog:",
    expectFailedCases: [
      "issue592.capability-verification-before-refusal",
      "scenario.capability-gap-before-refusal",
    ],
  },
  {
    id: "before-playbook-release-readme",
    file: "references/playbook-creation.md",
    remove: "9. README exists, is current, and is passed via absolute `--readme-url`.\n",
    expectFailedCases: ["issue592.playbook-release-behavior", "scenario.dashboard-playbook-build"],
  },
  {
    id: "udf-strict-opt-in",
    file: "references/playbook-creation.md",
    remove: "User-Defined Functions are strict opt-in. ",
    expectFailedCases: ["scenario.udf-strict-opt-in"],
  },
  {
    id: "automation-knowledge-route",
    file: "references/request-routing.md",
    remove: "Read [alva-knowledge.md](alva-knowledge.md) before design, ",
    expectFailedCases: ["scenario.alert-push-monitor"],
  },
  {
    id: "automation-knowledge-publish-gate",
    file: "references/feed-lifecycle.md",
    remove:
      "1. The applicable [Alva Knowledge](alva-knowledge.md) requirements passed\n" +
      "   consecutive-run checks: longitudinal or decision automations compare bounded\n" +
      "   history, and push-capable automations suppress non-material repeats.\n",
    expectFailedCases: ["scenario.alert-push-monitor"],
  },
  {
    id: "automation-publish-side-effects",
    file: "references/feed-lifecycle.md",
    remove:
      "`--skip-auto-trigger` suppresses only the publish-time run. It does not suppress\n" +
      "the owner alert binding. Because the binding exists immediately after publish,\n" +
      "an explicit `deploy trigger` may deliver a real alert.\n",
    expectFailedCases: ["target.automation-publish-side-effects"],
  },
  {
    id: "automation-knowledge-required-reading",
    file: "SKILL.md",
    remove:
      "## Alva Knowledge (Required Reading)\n\n" +
      "Before designing, modifying, or evaluating any automation, read\n" +
      "[alva-knowledge.md](references/alva-knowledge.md). Every automation must decide\n" +
      "whether bounded history improves its output; longitudinal or decision\n" +
      "automations use that history, and push-capable automations also define semantic\n" +
      "notification novelty.\n\n",
    expectFailedCases: ["scenario.alert-push-monitor"],
  },
  {
    id: "automation-knowledge-reference-index",
    file: "SKILL.md",
    remove:
      "| [alva-knowledge.md](references/alva-knowledge.md)                                     | Required automation reasoning: bounded history, cross-run comparison, semantic notification novelty, quiet runs.                            |\n",
    expectFailedCases: ["scenario.alert-push-monitor"],
  },
  {
    id: "current-topic-channel-destination",
    file: "references/push-notifications.md",
    remove: "  channel-session id. Topic-channel delivery is web-only. In a channel turn,\n",
    expectFailedCases: ["subscriptions.delivery-destination", "scenario.current-topic-channel-alert"],
  },
  {
    id: "feed-alert-output-authoring",
    file: "references/push-notifications.md",
    remove: "1. Declare the intended output with `alertOutput(typeDoc)`. The TypeDoc must\n",
    expectFailedCases: ["scenario.alert-push-monitor"],
  },
  {
    id: "ticker-read-first-tier-route",
    file: "SKILL.md",
    remove: "read [ticker-read.md](references/ticker-read.md) before source selection",
    expectFailedCases: [
      "platform-data.ticker-read-sources",
      "scenario.ticker-read-broad-analysis",
    ],
  },
  {
    id: "ticker-read-anomaly-priority",
    file: "references/ticker-read.md",
    remove:
      "Use `alva/company-anomaly-read` as the first direct-read check for intraday and hourly-scale market tracking.\n",
    expectFailedCases: [
      "platform-data.ticker-read-sources",
      "scenario.ticker-read-broad-analysis",
      "scenario.ticker-read-hourly-tracking",
    ],
  },
  {
    id: "ticker-read-company-anomaly-skillhub-owner",
    file: "references/ticker-read.md",
    remove:
      "- For Company Anomaly reads, do not bypass an unavailable Skillhub method by\n",
    expectFailedCases: [
      "platform-data.ticker-read-sources",
      "scenario.ticker-read-broad-analysis",
      "scenario.ticker-read-hourly-tracking",
    ],
  },
];

function parseArgs(argv) {
  const opts = {
    skillDir: DEFAULT_SKILL_DIR,
    keepTemp: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--skill-dir") {
      opts.skillDir = resolve(argv[++i]);
    } else if (arg === "--keep-temp") {
      opts.keepTemp = true;
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
  console.log(`Usage: node evals/alva-skill-docs/mutation-smoke.mjs [options]

Options:
  --skill-dir <path>   Skill directory to copy and mutate. Default: skills/alva.
  --keep-temp          Keep mutated temporary copies for debugging.
  -h, --help           Show this help.
`);
}

function runEval(skillDir) {
  const result = spawnSync(process.execPath, [EVAL_RUNNER, "--skill-dir", skillDir], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
  };
}

function replaceOnce(filePath, needle) {
  const original = readFileSync(filePath, "utf8");
  if (!original.includes(needle)) {
    throw new Error(`Mutation target not found in ${filePath}: ${JSON.stringify(needle)}`);
  }
  writeFileSync(filePath, original.replace(needle, ""), "utf8");
}

function copySkill(sourceSkillDir, tempRoot, mutationId) {
  const target = join(tempRoot, mutationId, "alva");
  cpSync(sourceSkillDir, target, { recursive: true });
  return target;
}

function assertEvalGreen(sourceSkillDir) {
  const result = runEval(sourceSkillDir);
  if (result.status !== 0) {
    process.stderr.write(result.output);
    throw new Error("Base skill eval must pass before mutation smoke can prove failures.");
  }
}

function assertMutationFails(sourceSkillDir, tempRoot, mutation) {
  const mutatedSkillDir = copySkill(sourceSkillDir, tempRoot, mutation.id);
  replaceOnce(resolve(mutatedSkillDir, mutation.file), mutation.remove);

  const result = runEval(mutatedSkillDir);
  if (result.status === 0) {
    throw new Error(`${mutation.id}: eval unexpectedly passed after removing ${mutation.file}`);
  }

  const missingExpectedCases = mutation.expectFailedCases.filter(
    (caseId) => !result.output.includes(`FAIL ${caseId}`),
  );
  if (missingExpectedCases.length > 0) {
    process.stderr.write(result.output);
    throw new Error(
      `${mutation.id}: eval failed, but not through expected cases: ${missingExpectedCases.join(", ")}`,
    );
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const tempRoot = mkdtempSync(join(tmpdir(), "alva-skill-doc-mutations-"));

  try {
    assertEvalGreen(opts.skillDir);
    for (const mutation of MUTATIONS) {
      assertMutationFails(opts.skillDir, tempRoot, mutation);
      console.log(`PASS ${mutation.id}`);
    }
    console.log(`Mutation smoke passed: ${MUTATIONS.length}/${MUTATIONS.length} mutations failed as expected.`);
  } finally {
    if (opts.keepTemp) {
      console.log(`Kept temporary mutation copies at ${tempRoot}`);
    } else {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

main();
