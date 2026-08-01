import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";

const EXPECTED_PACKAGE_NAME = "@alva/alva-slim";
const EXPECTED_PACKAGE_VERSION = "0.0.5";
const EXPECTED_FRONTMATTER_VERSION = "v0.0.5";
const EXPECTED_FILES = ["SKILL.md", "references", "scripts"];

function violation(code, path, message, details = {}) {
  return { code, path, message, ...details };
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files.push(relative(root, path).split(sep).join("/"));
    }
  };
  visit(root);
  return files.sort();
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  const block = match[1];
  const name = block.match(/^name:\s*([^\r\n]+)\s*$/m)?.[1]?.trim();
  const author = block.match(/^\s{2}author:\s*([^\r\n]+)\s*$/m)?.[1]?.trim();
  const version = block.match(/^\s{2}version:\s*([^\r\n]+)\s*$/m)?.[1]?.trim();
  return { name, author, version };
}

function majorVersion(value) {
  const match = String(value ?? "").match(/^v?(\d+)\./);
  return match ? Number(match[1]) : null;
}

function readJson(path, violations, code) {
  if (!existsSync(path)) {
    violations.push(violation(code, path, "Required JSON file is missing."));
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    violations.push(violation(code, path, `Invalid JSON: ${error.message}`));
    return null;
  }
}

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

function referenceFingerprint(referenceRoot, files) {
  const aggregate = createHash("sha256");
  for (const file of files) {
    aggregate.update(file);
    aggregate.update("\0");
    aggregate.update(sha256(readFileSync(resolve(referenceRoot, file))));
    aggregate.update("\n");
  }
  return aggregate.digest("hex");
}

function validatePackageJson(candidateDir, violations) {
  const packagePath = resolve(candidateDir, "package.json");
  const pkg = readJson(packagePath, violations, "PACKAGE_JSON");
  if (!pkg) return;

  if (pkg.name !== EXPECTED_PACKAGE_NAME) {
    violations.push(
      violation("PACKAGE_NAME", "package.json", `Expected package name ${EXPECTED_PACKAGE_NAME}.`, {
        actual: pkg.name,
        expected: EXPECTED_PACKAGE_NAME,
      }),
    );
  }
  if (pkg.version !== EXPECTED_PACKAGE_VERSION) {
    violations.push(
      violation("PACKAGE_VERSION", "package.json", `Expected package version ${EXPECTED_PACKAGE_VERSION}.`, {
        actual: pkg.version,
        expected: EXPECTED_PACKAGE_VERSION,
      }),
    );
  }
  if ((majorVersion(pkg.version) ?? 0) >= 1) {
    violations.push(
      violation("VERSION_MAJOR_DISALLOWED", "package.json", "Slim releases must remain below v1.", {
        actual: pkg.version,
      }),
    );
  }
  const files = Array.isArray(pkg.files) ? [...pkg.files].sort() : pkg.files;
  if (!Array.isArray(files) || JSON.stringify(files) !== JSON.stringify([...EXPECTED_FILES].sort())) {
    violations.push(
      violation("PACKAGE_FILES", "package.json", "Package files allowlist must contain only SKILL.md, references, and scripts.", {
        actual: pkg.files,
        expected: EXPECTED_FILES,
      }),
    );
  }
  if (pkg.alpkg?.kind !== "skill") {
    violations.push(
      violation("PACKAGE_KIND", "package.json", "Expected alpkg.kind to be skill.", {
        actual: pkg.alpkg?.kind,
        expected: "skill",
      }),
    );
  }
}

function validateFrontmatter(skill, violations) {
  const frontmatter = parseFrontmatter(skill);
  if (!frontmatter) {
    violations.push(violation("FRONTMATTER", "SKILL.md", "SKILL.md must start with YAML frontmatter."));
    return;
  }
  if (frontmatter.name !== "alva") {
    violations.push(
      violation("FRONTMATTER_NAME", "SKILL.md", "Expected frontmatter name alva.", {
        actual: frontmatter.name,
        expected: "alva",
      }),
    );
  }
  if (frontmatter.author !== "alva") {
    violations.push(
      violation("FRONTMATTER_AUTHOR", "SKILL.md", "Expected frontmatter author alva.", {
        actual: frontmatter.author,
        expected: "alva",
      }),
    );
  }
  if (frontmatter.version !== EXPECTED_FRONTMATTER_VERSION) {
    violations.push(
      violation("FRONTMATTER_VERSION", "SKILL.md", `Expected frontmatter version ${EXPECTED_FRONTMATTER_VERSION}.`, {
        actual: frontmatter.version,
        expected: EXPECTED_FRONTMATTER_VERSION,
      }),
    );
  }
  if ((majorVersion(frontmatter.version) ?? 0) >= 1) {
    violations.push(
      violation("VERSION_MAJOR_DISALLOWED", "SKILL.md", "Slim releases must remain below v1.", {
        actual: frontmatter.version,
      }),
    );
  }
}

function validateReferences(candidateDir, baselineDir, baselineLock, violations) {
  const candidateRoot = resolve(candidateDir, "references");
  const baselineRoot = resolve(baselineDir, "references");
  const candidateFiles = listFiles(candidateRoot);
  const baselineFiles = listFiles(baselineRoot);
  const candidateSet = new Set(candidateFiles);
  const baselineSet = new Set(baselineFiles);
  const baselineFingerprint = referenceFingerprint(baselineRoot, baselineFiles);

  if (!baselineLock || !Number.isInteger(baselineLock.count) || typeof baselineLock.fingerprint !== "string") {
    violations.push(
      violation(
        "BASELINE_REFERENCE_LOCK",
        "slim-top-level-contract.json",
        "Contract must lock the v1.20.1 baseline reference count and fingerprint.",
      ),
    );
  } else {
    if (baselineFiles.length !== baselineLock.count) {
      violations.push(
        violation(
          "BASELINE_REFERENCE_COUNT",
          "references",
          `Baseline has ${baselineFiles.length} references; locked v1.20.1 baseline requires ${baselineLock.count}.`,
          { actual: baselineFiles.length, expected: baselineLock.count },
        ),
      );
    }
    if (baselineFingerprint !== baselineLock.fingerprint) {
      violations.push(
        violation(
          "BASELINE_REFERENCE_FINGERPRINT",
          "references",
          "Baseline references do not match the locked v1.20.1 fingerprint.",
          { actual: baselineFingerprint, expected: baselineLock.fingerprint },
        ),
      );
    }
  }

  for (const file of baselineFiles) {
    if (!candidateSet.has(file)) {
      violations.push(
        violation("REFERENCE_MISSING", `references/${file}`, "Baseline reference is missing from Slim."),
      );
    } else {
      const candidateContents = readFileSync(resolve(candidateRoot, file));
      const baselineContents = readFileSync(resolve(baselineRoot, file));
      if (candidateContents.equals(baselineContents)) continue;
      violations.push(
        violation(
          "REFERENCE_CHANGED",
          `references/${file}`,
          "Slim reference differs from the v1.20.1 baseline.",
          {
            expectedSha256: sha256(baselineContents),
            actualSha256: sha256(candidateContents),
          },
        ),
      );
    }
  }
  for (const file of candidateFiles) {
    if (!baselineSet.has(file)) {
      violations.push(
        violation("REFERENCE_EXTRA", `references/${file}`, "Slim contains a reference absent from the v1.20.1 baseline."),
      );
    }
  }
  return { candidateFiles, baselineFiles };
}

function isInside(root, path) {
  const offset = relative(root, path);
  return offset === "" || (!offset.startsWith(`..${sep}`) && offset !== "..");
}

function validateRelativeLinks(candidateDir, violations) {
  // References are immutable baseline artifacts and can describe runtime paths
  // that are intentionally absent from this package. Validate links introduced
  // by the only editable document: the Slim top-level router.
  const markdownFiles = ["SKILL.md"];

  for (const markdownFile of markdownFiles) {
    const sourcePath = resolve(candidateDir, markdownFile);
    if (!existsSync(sourcePath)) continue;
    const markdown = readFileSync(sourcePath, "utf8");
    for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
      let target = match[1].trim();
      if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
      if (!target || target.startsWith("#") || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue;
      target = target.split(/\s+["']/)[0].split("#")[0];
      let decoded;
      try {
        decoded = decodeURIComponent(target);
      } catch {
        decoded = target;
      }
      const destination = resolve(dirname(sourcePath), decoded);
      if (!isInside(candidateDir, destination) || !existsSync(destination) || !lstatSync(destination).isFile()) {
        violations.push(
          violation("RELATIVE_LINK_BROKEN", markdownFile, `Broken relative link: ${target}`, {
            target,
          }),
        );
      }
    }
  }
}

function validateSlimUpdater(candidateDir, violations) {
  const updaterRelative = "scripts/version_check.sh";
  const updaterPath = resolve(candidateDir, updaterRelative);
  if (!existsSync(updaterPath) || !lstatSync(updaterPath).isFile()) {
    violations.push(
      violation("SLIM_UPDATER_MISSING", updaterRelative, "Slim must ship the updater path required by preflight.md."),
    );
    return;
  }
  if ((lstatSync(updaterPath).mode & 0o444) === 0) {
    violations.push(
      violation("SLIM_UPDATER_NOT_READABLE", updaterRelative, "Slim version checker must be readable for bash invocation."),
    );
    return;
  }
  const source = readFileSync(updaterPath, "utf8");
  const required = [
    "@alva/alva-slim",
    "/alva/registry/skill/alva/alva-slim/releases",
    "https://api-llm.prd.alva.ai",
    "JSON.parse",
    "node",
  ];
  const forbidden = ["alva-ai/skills", "@alva/skill", "npx skills", "clawhub", "git clone"];
  if (required.some((text) => !source.includes(text)) || forbidden.some((text) => source.includes(text))) {
    violations.push(
      violation(
        "SLIM_UPDATER_SCOPE",
        updaterRelative,
        "Version checker must query and notify only the Alva Slim registry line.",
      ),
    );
  }
  const preflightPath = resolve(candidateDir, "references/preflight.md");
  if (!existsSync(preflightPath) || !readFileSync(preflightPath, "utf8").includes(updaterRelative)) {
    violations.push(
      violation("PREFLIGHT_UPDATER_PATH", "references/preflight.md", "Preflight must invoke the packaged Slim version checker."),
    );
  }
}

function validateTopLevelContract(skill, topLevelContract, violations) {
  if (!topLevelContract || !Array.isArray(topLevelContract.rows)) {
    violations.push(
      violation("CONTRACT_INVALID", "slim-top-level-contract.json", "Top-level contract must define a rows array."),
    );
    return;
  }
  if (topLevelContract.releaseVersion !== EXPECTED_FRONTMATTER_VERSION) {
    violations.push(
      violation(
        "CONTRACT_RELEASE_VERSION",
        "slim-top-level-contract.json",
        `Top-level contract must describe ${EXPECTED_FRONTMATTER_VERSION}.`,
      ),
    );
  }
  for (const row of topLevelContract.rows) {
    const requiredText = Array.isArray(row.requiredText) ? row.requiredText : [];
    const missingText = requiredText.filter((text) => typeof text !== "string" || !skill.includes(text));
    if (!row.id || requiredText.length === 0 || missingText.length > 0) {
      violations.push(
        violation("TOP_LEVEL_CONTRACT", "SKILL.md", `Missing top-level contract row: ${row.id ?? "unknown"}.`, {
          rowId: row.id,
          label: row.label,
          missingText,
        }),
      );
    }
  }
}

export function validateSlimPackage({ candidateDir, baselineDir, maxSkillBytes, topLevelContract }) {
  const candidateRoot = resolve(candidateDir);
  const baselineRoot = resolve(baselineDir);
  const violations = [];
  const skillPath = resolve(candidateRoot, "SKILL.md");
  const skillExists = existsSync(skillPath);
  const skillBuffer = skillExists ? readFileSync(skillPath) : Buffer.alloc(0);
  const skill = skillBuffer.toString("utf8");

  if (!skillExists) {
    violations.push(violation("SKILL_MISSING", "SKILL.md", "Candidate SKILL.md is missing."));
  }
  if (!Number.isInteger(maxSkillBytes) || maxSkillBytes < 0) {
    violations.push(
      violation("MAX_SKILL_BYTES", "SKILL.md", "maxSkillBytes must be a non-negative integer.", {
        actual: maxSkillBytes,
      }),
    );
  } else if (skillBuffer.byteLength > maxSkillBytes) {
    violations.push(
      violation("SKILL_SIZE", "SKILL.md", `SKILL.md is ${skillBuffer.byteLength} bytes; maximum is ${maxSkillBytes}.`, {
        actual: skillBuffer.byteLength,
        expectedMaximum: maxSkillBytes,
      }),
    );
  }

  validatePackageJson(candidateRoot, violations);
  if (skillExists) validateFrontmatter(skill, violations);
  const references = validateReferences(
    candidateRoot,
    baselineRoot,
    topLevelContract?.baselineReferences,
    violations,
  );
  validateSlimUpdater(candidateRoot, violations);
  validateRelativeLinks(candidateRoot, violations);
  if (skillExists) validateTopLevelContract(skill, topLevelContract, violations);

  return {
    valid: violations.length === 0,
    violations,
    stats: {
      skillBytes: skillBuffer.byteLength,
      maxSkillBytes,
      referenceFiles: references.candidateFiles.length,
      baselineReferenceFiles: references.baselineFiles.length,
    },
  };
}
