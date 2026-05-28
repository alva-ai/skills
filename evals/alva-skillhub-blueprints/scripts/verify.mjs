#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CASES_PATH = resolve(SCRIPT_DIR, "..", "cases.json");

function parseArgs(argv) {
  const opts = {
    casesPath: DEFAULT_CASES_PATH,
    offline: false,
    profile: null,
    selected: new Set(),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--offline") {
      opts.offline = true;
    } else if (arg === "--cases") {
      opts.casesPath = resolve(argv[++i]);
    } else if (arg === "--profile") {
      opts.profile = argv[++i];
    } else if (arg === "--case") {
      opts.selected.add(argv[++i]);
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
  console.log(`Usage: node verify.mjs [options]

Options:
  --offline           Validate the manifest only; skip alva CLI calls.
  --profile <name>    Override cases.json profile (default: prd).
  --case <id|skill>   Verify one case id or skill id; repeatable.
  --cases <path>      Path to cases.json.
  -h, --help          Show this help.
`);
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fail(errors, message) {
  errors.push(message);
}

function warn(warnings, message) {
  warnings.push(message);
}

function command(args, options = {}) {
  return execFileSync("alva", args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
}

function alvaJson(args) {
  return JSON.parse(command(args));
}

function rubricPoints(criteria) {
  return criteria.reduce((sum, item) => sum + Number(item.points || 0), 0);
}

function validateManifest(manifest, errors, warnings) {
  if (manifest.schema_version !== "2026-05-29") {
    warn(warnings, `schema_version is ${manifest.schema_version}`);
  }

  if (
    !Array.isArray(manifest.required_chain) ||
    manifest.required_chain.length < 6
  ) {
    fail(errors, "required_chain must include the full Alva skill chain");
  }

  if (!manifest.rubric || manifest.rubric.total_points !== 100) {
    fail(errors, "rubric.total_points must be 100");
  }

  const sharedPoints = rubricPoints(manifest.rubric?.shared_criteria || []);
  if (sharedPoints !== manifest.rubric?.shared_points) {
    fail(
      errors,
      `shared rubric points are ${sharedPoints}, expected ${manifest.rubric?.shared_points}`,
    );
  }

  if (sharedPoints !== 70) {
    fail(errors, `shared rubric must total 70 points, got ${sharedPoints}`);
  }

  const ids = new Set();
  const skillIds = new Set();

  for (const testCase of manifest.cases || []) {
    if (ids.has(testCase.id)) {
      fail(errors, `duplicate case id: ${testCase.id}`);
    }
    ids.add(testCase.id);

    if (skillIds.has(testCase.skill_id)) {
      fail(errors, `duplicate skill id: ${testCase.skill_id}`);
    }
    skillIds.add(testCase.skill_id);

    if (!testCase.prompt?.includes(`/use-skill:${testCase.skill_id}`)) {
      fail(
        errors,
        `${testCase.id}: prompt must include /use-skill:${testCase.skill_id}`,
      );
    }

    if (!testCase.catalog?.blueprint_path) {
      fail(errors, `${testCase.id}: missing catalog.blueprint_path`);
    }

    if (!Array.isArray(testCase.catalog?.expected_blueprint_markers)) {
      fail(
        errors,
        `${testCase.id}: expected_blueprint_markers must be an array`,
      );
    }

    const specificPoints = rubricPoints(testCase.case_specific_rubric || []);
    if (specificPoints !== manifest.rubric?.case_specific_points) {
      fail(
        errors,
        `${testCase.id}: case-specific rubric points are ${specificPoints}, expected ${manifest.rubric?.case_specific_points}`,
      );
    }

    for (const criterion of testCase.case_specific_rubric || []) {
      if (!Array.isArray(criterion.tags) || criterion.tags.length === 0) {
        fail(errors, `${testCase.id}/${criterion.id}: missing tags`);
      }
      if (!Array.isArray(criterion.checks) || criterion.checks.length === 0) {
        fail(errors, `${testCase.id}/${criterion.id}: missing checks`);
      }
    }
  }

  if ((manifest.cases || []).length === 0) {
    fail(errors, "manifest must contain cases");
  }

  return { ids, skillIds };
}

function selectCases(manifest, selected) {
  if (selected.size === 0) {
    return manifest.cases;
  }

  return manifest.cases.filter(
    (testCase) => selected.has(testCase.id) || selected.has(testCase.skill_id),
  );
}

function validateCatalog(manifest, cases, profile, errors, warnings) {
  const catalog = alvaJson([
    "--profile",
    profile,
    "skillhub",
    "list",
    "--json",
  ]);
  const catalogSkills = catalog.skills || [];
  const catalogIds = new Set(
    catalogSkills.map((skill) => `${skill.username}/${skill.name}`),
  );
  const caseIds = new Set(manifest.cases.map((testCase) => testCase.skill_id));

  const missingCases = [...catalogIds].filter((id) => !caseIds.has(id)).sort();
  const staleCases = [...caseIds].filter((id) => !catalogIds.has(id)).sort();

  if (missingCases.length > 0) {
    fail(
      errors,
      `cases.json missing catalog skills: ${missingCases.join(", ")}`,
    );
  }
  if (staleCases.length > 0) {
    fail(
      errors,
      `cases.json has skills absent from catalog: ${staleCases.join(", ")}`,
    );
  }

  const catalogById = new Map(
    catalogSkills.map((skill) => [`${skill.username}/${skill.name}`, skill]),
  );

  for (const testCase of cases) {
    const skill = catalogById.get(testCase.skill_id);
    if (!skill) {
      continue;
    }

    if (Boolean(skill.disabled) !== Boolean(testCase.catalog.disabled)) {
      fail(
        errors,
        `${testCase.skill_id}: disabled mismatch, catalog=${skill.disabled} cases.json=${testCase.catalog.disabled}`,
      );
    }

    if (skill.updated_at !== testCase.catalog.updated_at) {
      warn(
        warnings,
        `${testCase.skill_id}: updated_at drift, catalog=${skill.updated_at} cases.json=${testCase.catalog.updated_at}`,
      );
    }
  }
}

function validateBlueprintFetch(cases, profile, errors) {
  for (const testCase of cases) {
    const meta = alvaJson([
      "--profile",
      profile,
      "skillhub",
      "get",
      testCase.skill_id,
      "--json",
    ]);
    const files = meta.files || [];
    const byPath = new Map(files.map((file) => [file.path, file]));
    const blueprint = byPath.get(testCase.catalog.blueprint_path);

    if (!blueprint) {
      fail(
        errors,
        `${testCase.skill_id}: blueprint path ${testCase.catalog.blueprint_path} is not in skillhub get file list`,
      );
      continue;
    }

    if (blueprint.size_bytes < (testCase.catalog.min_blueprint_bytes || 0)) {
      fail(
        errors,
        `${testCase.skill_id}: blueprint size ${blueprint.size_bytes} < ${testCase.catalog.min_blueprint_bytes}`,
      );
    }

    for (const path of testCase.catalog.supporting_files || []) {
      if (!byPath.has(path)) {
        fail(
          errors,
          `${testCase.skill_id}: supporting file missing from listing: ${path}`,
        );
      }
    }

    const content = command([
      "--profile",
      profile,
      "skillhub",
      "file",
      testCase.skill_id,
      testCase.catalog.blueprint_path,
    ]);

    for (const marker of testCase.catalog.expected_blueprint_markers || []) {
      if (!content.includes(marker)) {
        fail(
          errors,
          `${testCase.skill_id}: fetched blueprint missing marker ${JSON.stringify(marker)}`,
        );
      }
    }
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const manifest = loadJson(opts.casesPath);
  const errors = [];
  const warnings = [];
  const profile = opts.profile || manifest.profile || "prd";

  validateManifest(manifest, errors, warnings);

  const cases = selectCases(manifest, opts.selected);
  if (opts.selected.size > 0 && cases.length === 0) {
    fail(errors, `No case matched: ${[...opts.selected].join(", ")}`);
  }

  if (!opts.offline) {
    validateCatalog(manifest, cases, profile, errors, warnings);
    validateBlueprintFetch(cases, profile, errors);
  }

  for (const message of warnings) {
    console.warn(`WARN ${message}`);
  }

  if (errors.length > 0) {
    for (const message of errors) {
      console.error(`FAIL ${message}`);
    }
    process.exit(1);
  }

  const mode = opts.offline ? "offline manifest" : `profile ${profile}`;
  console.log(`OK ${cases.length} case(s) verified against ${mode}`);
}

main();
