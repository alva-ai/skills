import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { validateSlimPackage } from "./slim-contract-lib.mjs";

const contract = JSON.parse(
  readFileSync(new URL("./slim-top-level-contract.json", import.meta.url), "utf8"),
);

function packageJson(overrides = {}) {
  return {
    name: "@alva/alva-slim",
    version: "0.0.3",
    files: ["SKILL.md", "references", "scripts"],
    alpkg: { kind: "skill" },
    ...overrides,
  };
}

function skillText() {
  const matrix = contract.rows.map((row) => row.requiredText.join("\n")).join("\n\n");
  return `---
name: alva
description: Slim Alva routing fixture.
metadata:
  author: alva
  version: v0.0.3
---

# Alva Slim

${matrix}
`;
}

function markdownTargets(markdown) {
  return [...markdown.matchAll(/\]\(([^)#]+)(?:#[^)]+)?\)/g)]
    .map((match) => match[1])
    .filter((target) => !target.includes(":"));
}

const validSlimUpdater = `#!/usr/bin/env bash
PACKAGE="@alva/alva-slim"
RELEASES_PATH="/alva/registry/skill/alva/alva-slim/releases"
REGISTRY_ENDPOINT="https://api-llm.prd.alva.ai"
`;

function writeTree(root, { skill = skillText(), pkg = packageJson(), references = {}, updater = validSlimUpdater } = {}) {
  mkdirSync(join(root, "references"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "SKILL.md"), skill);
  writeFileSync(join(root, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
  writeFileSync(join(root, "scripts", "version_check.sh"), updater);
  chmodSync(join(root, "scripts", "version_check.sh"), 0o755);

  const requiredReferences = Object.fromEntries(
    markdownTargets(skill)
      .filter((target) => target.startsWith("references/"))
      .map((target) => {
        const path = target.slice("references/".length);
        return [path, path === "preflight.md" ? "Run scripts/version_check.sh.\n" : "fixture reference\n"];
      }),
  );
  const fillerCount = 42 - Object.keys(requiredReferences).length;
  assert.ok(fillerCount >= 0, "fixture contract cannot require more than 42 references");
  const fillerReferences = Object.fromEntries(
    Array.from({ length: fillerCount }, (_, index) => [
      `fixture-${String(index + 1).padStart(2, "0")}.md`,
      `fixture reference ${index + 1}\n`,
    ]),
  );
  for (const [relativePath, contents] of Object.entries({
    ...requiredReferences,
    ...fillerReferences,
    ...references,
  })) {
    const target = join(root, "references", relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }
}

function referenceLock(skillDir) {
  const referenceRoot = join(skillDir, "references");
  const paths = [];
  const visit = (directory, prefix = "") => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) visit(join(directory, entry.name), relativePath);
      else if (entry.isFile()) paths.push(relativePath);
    }
  };
  visit(referenceRoot);
  paths.sort();
  const aggregate = createHash("sha256");
  for (const relativePath of paths) {
    const digest = createHash("sha256")
      .update(readFileSync(join(referenceRoot, relativePath)))
      .digest("hex");
    aggregate.update(relativePath);
    aggregate.update("\0");
    aggregate.update(digest);
    aggregate.update("\n");
  }
  return { count: paths.length, fingerprint: aggregate.digest("hex") };
}

function fixture(options = {}) {
  const root = mkdtempSync(join(tmpdir(), "alva-slim-contract-"));
  const baselineDir = join(root, "baseline");
  const candidateDir = join(root, "candidate");
  writeTree(baselineDir, options.baseline);
  writeTree(candidateDir, options.candidate);
  return {
    baselineDir,
    candidateDir,
    topLevelContract: {
      ...contract,
      baselineReferences: referenceLock(baselineDir),
    },
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

function validate(instance, maxSkillBytes = 45_000, topLevelContract = instance.topLevelContract) {
  return validateSlimPackage({
    candidateDir: instance.candidateDir,
    baselineDir: instance.baselineDir,
    maxSkillBytes,
    topLevelContract,
  });
}

function codes(result) {
  return result.violations.map((violation) => violation.code);
}

function withFixture(options, fn) {
  const instance = fixture(options);
  try {
    fn(instance);
  } finally {
    instance.cleanup();
  }
}

test("accepts a valid v0.0.3 Slim package", () => {
  withFixture({}, (instance) => {
    const result = validate(instance);
    assert.equal(result.valid, true);
    assert.deepEqual(result.violations, []);
    assert.equal(result.stats.referenceFiles, 42);
    assert.equal(result.stats.baselineReferenceFiles, 42);
  });
});

for (const testCase of [
  {
    name: "wrong frontmatter identity",
    mutate(instance) {
      const path = join(instance.candidateDir, "SKILL.md");
      writeFileSync(path, readFileSync(path, "utf8").replace("name: alva", "name: other"));
    },
    expected: "FRONTMATTER_NAME",
  },
  {
    name: "wrong frontmatter author identity",
    mutate(instance) {
      const path = join(instance.candidateDir, "SKILL.md");
      writeFileSync(path, readFileSync(path, "utf8").replace("author: alva", "author: other"));
    },
    expected: "FRONTMATTER_AUTHOR",
  },
  {
    name: "wrong package identity",
    mutate(instance) {
      const path = join(instance.candidateDir, "package.json");
      writeFileSync(path, `${JSON.stringify(packageJson({ name: "@alva/alva" }), null, 2)}\n`);
    },
    expected: "PACKAGE_NAME",
  },
  {
    name: "wrong package version",
    mutate(instance) {
      const path = join(instance.candidateDir, "package.json");
      writeFileSync(path, `${JSON.stringify(packageJson({ version: "0.0.2" }), null, 2)}\n`);
    },
    expected: "PACKAGE_VERSION",
  },
  {
    name: "wrong frontmatter version",
    mutate(instance) {
      const path = join(instance.candidateDir, "SKILL.md");
      writeFileSync(path, readFileSync(path, "utf8").replace("version: v0.0.3", "version: v0.0.2"));
    },
    expected: "FRONTMATTER_VERSION",
  },
  {
    name: "v1 package version is forbidden",
    mutate(instance) {
      const path = join(instance.candidateDir, "package.json");
      writeFileSync(path, `${JSON.stringify(packageJson({ version: "1.0.0" }), null, 2)}\n`);
    },
    expected: "VERSION_MAJOR_DISALLOWED",
  },
  {
    name: "v1 frontmatter version is forbidden",
    mutate(instance) {
      const path = join(instance.candidateDir, "SKILL.md");
      writeFileSync(path, readFileSync(path, "utf8").replace("version: v0.0.3", "version: v1.0.0"));
    },
    expected: "VERSION_MAJOR_DISALLOWED",
  },
  {
    name: "package files allowlist is exact",
    mutate(instance) {
      const path = join(instance.candidateDir, "package.json");
      writeFileSync(path, `${JSON.stringify(packageJson({ files: ["SKILL.md", "references"] }), null, 2)}\n`);
    },
    expected: "PACKAGE_FILES",
  },
]) {
  test(testCase.name, () => {
    withFixture({}, (instance) => {
      testCase.mutate(instance);
      assert.ok(codes(validate(instance)).includes(testCase.expected));
    });
  });
}

test("reports missing, extra, and changed references independently", () => {
  for (const [name, mutate, expected] of [
    ["missing", (dir) => rmSync(join(dir, "references", "preflight.md")), "REFERENCE_MISSING"],
    ["extra", (dir) => writeFileSync(join(dir, "references", "extra.md"), "extra\n"), "REFERENCE_EXTRA"],
    ["changed", (dir) => writeFileSync(join(dir, "references", "preflight.md"), "changed\n"), "REFERENCE_CHANGED"],
  ]) {
    withFixture({}, (instance) => {
      mutate(instance.candidateDir);
      const result = validate(instance);
      assert.ok(codes(result).includes(expected), name);
      if (name === "changed") {
        const changed = result.violations.find((item) => item.code === "REFERENCE_CHANGED");
        assert.equal(
          changed.expectedSha256,
          createHash("sha256").update("Run scripts/version_check.sh.\n").digest("hex"),
        );
        assert.equal(
          changed.actualSha256,
          createHash("sha256").update("changed\n").digest("hex"),
        );
      }
    });
  }
});

test("rejects a baseline with the wrong locked reference count", () => {
  withFixture({}, (instance) => {
    const filler = readdirSync(join(instance.baselineDir, "references")).find((name) =>
      name.startsWith("fixture-"),
    );
    assert.ok(filler, "fixture must contain a filler reference");
    rmSync(join(instance.baselineDir, "references", filler));
    const result = validate(instance);
    assert.ok(codes(result).includes("BASELINE_REFERENCE_COUNT"));
  });
});

test("rejects a baseline with the wrong locked reference fingerprint", () => {
  withFixture({}, (instance) => {
    const filler = readdirSync(join(instance.baselineDir, "references")).find((name) =>
      name.startsWith("fixture-"),
    );
    assert.ok(filler, "fixture must contain a filler reference");
    writeFileSync(join(instance.baselineDir, "references", filler), "tampered\n");
    const result = validate(instance);
    assert.ok(codes(result).includes("BASELINE_REFERENCE_FINGERPRINT"));
  });
});

test("rejects a contract descriptor for another Slim release", () => {
  withFixture({}, (instance) => {
    const result = validate(instance, 45_000, { ...instance.topLevelContract, releaseVersion: "v0.0.2" });
    assert.ok(codes(result).includes("CONTRACT_RELEASE_VERSION"));
  });
});

test("requires an executable Slim-scoped updater at the preflight path", () => {
  withFixture({}, (instance) => {
    rmSync(join(instance.candidateDir, "scripts", "version_check.sh"));
    assert.ok(codes(validate(instance)).includes("SLIM_UPDATER_MISSING"));
  });

  withFixture({}, (instance) => {
    const path = join(instance.candidateDir, "scripts", "version_check.sh");
    chmodSync(path, 0o644);
    assert.ok(codes(validate(instance)).includes("SLIM_UPDATER_NOT_EXECUTABLE"));
  });

  withFixture({}, (instance) => {
    const path = join(instance.candidateDir, "scripts", "version_check.sh");
    writeFileSync(path, `${validSlimUpdater}\nREPO="alva-ai/skills"\n`);
    chmodSync(path, 0o755);
    assert.ok(codes(validate(instance)).includes("SLIM_UPDATER_SCOPE"));
  });
});

test("allows an updater mention inherited byte-for-byte from baseline references", () => {
  const inherited = { references: { "preflight.md": "Run scripts/version_check.sh.\n" } };
  withFixture({ baseline: inherited, candidate: inherited }, (instance) => {
    assert.equal(validate(instance).valid, true);
  });
});

test("accepts valid relative links and reports broken relative links", () => {
  withFixture({}, (instance) => {
    assert.equal(validate(instance).valid, true);

    const skillPath = join(instance.candidateDir, "SKILL.md");
    writeFileSync(skillPath, `${readFileSync(skillPath, "utf8")}See [missing](references/does-not-exist.md).\n`);
    assert.ok(codes(validate(instance)).includes("RELATIVE_LINK_BROKEN"));
  });
});

test("allows broken runtime-path links inherited in byte-identical references", () => {
  const inherited = {
    references: { "preflight.md": "Run scripts/version_check.sh.\nSee runtime [user](user.md).\n" },
  };
  withFixture({ baseline: inherited, candidate: inherited }, (instance) => {
    assert.equal(validate(instance).valid, true);
  });
});

for (const row of contract.rows) {
  for (const [textIndex, requiredText] of row.requiredText.entries()) {
    test(`contract guardrail is mandatory: ${row.id} text ${textIndex + 1}`, () => {
      withFixture({}, (instance) => {
        const path = join(instance.candidateDir, "SKILL.md");
        const original = readFileSync(path, "utf8");
        writeFileSync(path, original.replace(requiredText, ""));
        const violations = validate(instance).violations;
        assert.ok(
          violations.some(
            (violation) => violation.code === "TOP_LEVEL_CONTRACT" && violation.rowId === row.id,
          ),
        );
      });
    });
  }
}

test("SKILL.md size boundary accepts 45,000 bytes and rejects 45,001", () => {
  withFixture({}, (instance) => {
    const path = join(instance.candidateDir, "SKILL.md");
    const original = readFileSync(path, "utf8");
    writeFileSync(path, `${original}${" ".repeat(45_000 - Buffer.byteLength(original))}`);
    assert.equal(validate(instance).valid, true);

    writeFileSync(path, `${readFileSync(path, "utf8")} `);
    const result = validate(instance);
    assert.ok(codes(result).includes("SKILL_SIZE"));
    assert.equal(result.stats.skillBytes, 45_001);
  });
});
