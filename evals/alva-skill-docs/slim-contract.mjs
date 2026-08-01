#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateSlimPackage } from "./slim-contract-lib.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONTRACT = resolve(SCRIPT_DIR, "slim-top-level-contract.json");

function usage() {
  return `Usage: node evals/alva-skill-docs/slim-contract.mjs \\
  --skill-dir <path> --baseline-dir <path> --max-skill-bytes <integer>
`;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--skill-dir") options.candidateDir = argv[++index];
    else if (argument === "--baseline-dir") options.baselineDir = argv[++index];
    else if (argument === "--max-skill-bytes") options.maxSkillBytes = Number(argv[++index]);
    else if (argument === "--help" || argument === "-h") {
      process.stdout.write(usage());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!options.candidateDir || !options.baselineDir || !Number.isInteger(options.maxSkillBytes)) {
    throw new Error("--skill-dir, --baseline-dir, and integer --max-skill-bytes are required.");
  }
  return options;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n${usage()}`);
    process.exitCode = 2;
    return;
  }

  const topLevelContract = JSON.parse(readFileSync(DEFAULT_CONTRACT, "utf8"));
  const result = validateSlimPackage({ ...options, topLevelContract });
  const verdict = result.valid ? "PASS" : "FAIL";
  process.stdout.write(
    `${verdict} alva-slim contract: SKILL.md ${result.stats.skillBytes}/${result.stats.maxSkillBytes} bytes; references ${result.stats.referenceFiles}/${result.stats.baselineReferenceFiles}.\n`,
  );
  for (const item of result.violations) {
    const row = item.rowId ? ` [${item.rowId}]` : "";
    process.stdout.write(`- ${item.code}${row} ${item.path}: ${item.message}\n`);
  }
  if (!result.valid) process.exitCode = 1;
}

main();
