import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ALLOWED_ROOTS,
  REGISTRY_LIMITS,
  validateSkillPackage,
} from "./validate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../..");
const REAL_SKILL_DIR = join(REPO_ROOT, "skills/alva");
const EXPECTED_FILE_COUNT = 44;
const EXPECTED_TOTAL_BYTES = 591_813;

function makeFixture(t) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "alva-skill-package-"));
  const skillDir = join(temporaryRoot, "alva");
  mkdirSync(skillDir);

  // Copy only the explicit artifact roots. In particular, never copy ignored
  // runtime configuration such as .env from the real Skill directory.
  copyFileSync(join(REAL_SKILL_DIR, "SKILL.md"), join(skillDir, "SKILL.md"));
  cpSync(join(REAL_SKILL_DIR, "references"), join(skillDir, "references"), {
    recursive: true,
  });
  cpSync(join(REAL_SKILL_DIR, "scripts"), join(skillDir, "scripts"), {
    recursive: true,
  });
  copyFileSync(join(REAL_SKILL_DIR, "package.json"), join(skillDir, "package.json"));

  t.after(() => rmSync(temporaryRoot, { recursive: true, force: true }));
  return skillDir;
}

function updatePackage(skillDir, mutate) {
  const packagePath = join(skillDir, "package.json");
  const packageJSON = JSON.parse(readFileSync(packagePath, "utf8"));
  mutate(packageJSON);
  writeFileSync(packagePath, `${JSON.stringify(packageJSON, null, 2)}\n`);
}

test("validates the real 44-file data-only Skill package", async () => {
  const result = await validateSkillPackage({ skillDir: REAL_SKILL_DIR });

  assert.equal(result.canonicalPackage, "@alva/skill");
  assert.equal(result.version, "1.19.3");
  assert.equal(result.kind, "skill");
  assert.deepEqual(result.roots, ALLOWED_ROOTS);
  assert.equal(result.fileCount, EXPECTED_FILE_COUNT);
  assert.equal(result.totalBytes, EXPECTED_TOTAL_BYTES);
  assert.equal(result.files.length, EXPECTED_FILE_COUNT);
  assert.equal(result.files[0].path, "SKILL.md");
  assert.deepEqual(
    [...new Set(result.files.map(({ path }) => path.split("/")[0]))],
    ALLOWED_ROOTS,
  );
  assert.equal(result.files.some(({ path }) => path === "package.json"), false);
});

test("validates a detached artifact tree against separate reviewed package metadata", async (t) => {
  const skillDir = makeFixture(t);
  const packageJSONPath = join(dirname(skillDir), "package.json");
  copyFileSync(join(skillDir, "package.json"), packageJSONPath);
  rmSync(join(skillDir, "package.json"));

  const result = await validateSkillPackage({ skillDir, packageJSONPath });

  assert.equal(result.fileCount, EXPECTED_FILE_COUNT);
  assert.equal(result.totalBytes, EXPECTED_TOTAL_BYTES);
});

test("validates a detached artifact tree through the reusable CLI", (t) => {
  const skillDir = makeFixture(t);
  const packageJSONPath = join(dirname(skillDir), "package.json");
  copyFileSync(join(skillDir, "package.json"), packageJSONPath);
  rmSync(join(skillDir, "package.json"));

  const result = spawnSync(
    process.execPath,
    [
      join(HERE, "validate.mjs"),
      "--skill-dir",
      skillDir,
      "--package-json",
      packageJSONPath,
    ],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).fileCount, EXPECTED_FILE_COUNT);
});

test("rejects a package identity other than @alva/skill", async (t) => {
  const skillDir = makeFixture(t);
  updatePackage(skillDir, (packageJSON) => {
    packageJSON.name = "@alva/not-the-official-skill";
  });

  await assert.rejects(
    validateSkillPackage({ skillDir }),
    /package name must be @alva\/skill/,
  );
});

test("rejects a non-skill ALPKG kind", async (t) => {
  const skillDir = makeFixture(t);
  updatePackage(skillDir, (packageJSON) => {
    packageJSON.alpkg.kind = "sdk";
  });

  await assert.rejects(validateSkillPackage({ skillDir }), /alpkg\.kind must be skill/);
});

test("rejects executable or typed package entrypoint fields", async (t) => {
  for (const field of ["main", "module", "types", "typings", "bin", "exports"]) {
    await t.test(field, async (subtest) => {
      const skillDir = makeFixture(subtest);
      updatePackage(skillDir, (packageJSON) => {
        packageJSON[field] = field === "bin" ? { alva: "SKILL.md" } : "SKILL.md";
      });

      await assert.rejects(
        validateSkillPackage({ skillDir }),
        new RegExp(`Skill package must not define ${field}`),
      );
    });
  }

  await t.test("alpkg.entrypoints", async (subtest) => {
    const skillDir = makeFixture(subtest);
    updatePackage(skillDir, (packageJSON) => {
      packageJSON.alpkg.entrypoints = { main: "SKILL.md" };
    });

    await assert.rejects(
      validateSkillPackage({ skillDir }),
      /Skill package must not define alpkg\.entrypoints/,
    );
  });
});

test("rejects package and Skill metadata version drift", async (t) => {
  await t.test("package.json", async (subtest) => {
    const skillDir = makeFixture(subtest);
    updatePackage(skillDir, (packageJSON) => {
      packageJSON.version = "1.19.4";
    });

    await assert.rejects(validateSkillPackage({ skillDir }), /version must be 1\.19\.3/);
  });

  await t.test("SKILL.md", async (subtest) => {
    const skillDir = makeFixture(subtest);
    const skillPath = join(skillDir, "SKILL.md");
    const skill = readFileSync(skillPath, "utf8").replace(
      "  version: v1.19.3",
      "  version: v1.19.4",
    );
    writeFileSync(skillPath, skill);

    await assert.rejects(
      validateSkillPackage({ skillDir }),
      /SKILL\.md metadata version must be v1\.19\.3/,
    );
  });
});

test("accepts valid YAML frontmatter formatting variants", async (t) => {
  const skillDir = makeFixture(t);
  const skillPath = join(skillDir, "SKILL.md");
  const skill = readFileSync(skillPath, "utf8")
    .replace("metadata:", "metadata: # release metadata")
    .replace("  author: alva", "  author: alva\n# root-level comment")
    .replace("  version: v1.19.3", '  version: "v1.19.3" # package version');
  writeFileSync(skillPath, `\uFEFF${skill}`);

  const result = await validateSkillPackage({ skillDir });
  assert.equal(result.version, "1.19.3");
});

test("requires exactly SKILL.md, references, and scripts publish roots", async (t) => {
  const skillDir = makeFixture(t);
  updatePackage(skillDir, (packageJSON) => {
    packageJSON.files = ["SKILL.md", "references", "docs"];
  });

  await assert.rejects(
    validateSkillPackage({ skillDir }),
    /files must be exactly SKILL\.md, references, scripts/,
  );
});

test("rejects a hidden artifact path", async (t) => {
  const skillDir = makeFixture(t);
  writeFileSync(join(skillDir, "references/.hidden.md"), "must not publish\n");

  await assert.rejects(validateSkillPackage({ skillDir }), /reserved artifact path.*\.hidden/);
});

test("rejects the reserved manifest artifact root", async (t) => {
  const skillDir = makeFixture(t);
  writeFileSync(join(skillDir, "manifest.json"), "{}\n");
  updatePackage(skillDir, (packageJSON) => {
    packageJSON.files = [...ALLOWED_ROOTS, "manifest.json"];
  });

  await assert.rejects(validateSkillPackage({ skillDir }), /reserved artifact path.*manifest\.json/);
});

test("rejects a backslash artifact path", async (t) => {
  const skillDir = makeFixture(t);
  updatePackage(skillDir, (packageJSON) => {
    packageJSON.files = ["SKILL.md", "references\\unsafe", "scripts"];
  });

  await assert.rejects(validateSkillPackage({ skillDir }), /unsafe artifact path.*backslash/);
});

test("rejects a traversal artifact path", async (t) => {
  const skillDir = makeFixture(t);
  updatePackage(skillDir, (packageJSON) => {
    packageJSON.files = ["SKILL.md", "../references", "scripts"];
  });

  await assert.rejects(validateSkillPackage({ skillDir }), /unsafe artifact path.*\.\./);
});

test("rejects symbolic links anywhere below an artifact root", async (t) => {
  const skillDir = makeFixture(t);
  symlinkSync("../SKILL.md", join(skillDir, "references/linked-skill.md"));

  await assert.rejects(validateSkillPackage({ skillDir }), /must not traverse a symbolic link/);
});

test("enforces the registry's 64-file limit", async (t) => {
  const skillDir = makeFixture(t);
  const extraFiles = REGISTRY_LIMITS.maxFiles - EXPECTED_FILE_COUNT + 1;
  for (let index = 0; index < extraFiles; index += 1) {
    writeFileSync(join(skillDir, `references/limit-${index}.md`), `${index}\n`);
  }

  await assert.rejects(
    validateSkillPackage({ skillDir }),
    /contains more than 64 files/,
  );
});

test("enforces the registry's 32 MiB total-byte limit", async (t) => {
  const skillDir = makeFixture(t);
  const oversizedPath = join(skillDir, "references/oversized.bin");
  writeFileSync(oversizedPath, "");
  truncateSync(oversizedPath, REGISTRY_LIMITS.maxTotalBytes);

  await assert.rejects(
    validateSkillPackage({ skillDir }),
    /exceeds the 32 MiB artifact limit/,
  );
});
