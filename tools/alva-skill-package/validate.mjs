#!/usr/bin/env node

import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SKILL_DIR = resolve(HERE, "../../skills/alva");
const EXPECTED_NAME = "@alva/skill";
const EXPECTED_VERSION = "1.19.4";
const FORBIDDEN_ENTRYPOINT_FIELDS = Object.freeze([
  "main",
  "module",
  "types",
  "typings",
  "bin",
  "browser",
  "exports",
  "imports",
]);

export const ALLOWED_ROOTS = Object.freeze(["SKILL.md", "references", "scripts"]);
export const REGISTRY_LIMITS = Object.freeze({
  maxFiles: 64,
  maxTotalBytes: 32 * 1024 * 1024,
});

export async function validateSkillPackage({
  skillDir = DEFAULT_SKILL_DIR,
  packageJSONPath,
} = {}) {
  const resolvedSkillDir = resolve(skillDir);
  const resolvedPackagePath = resolve(
    packageJSONPath ?? join(resolvedSkillDir, "package.json"),
  );

  await requireDirectory(resolvedSkillDir, "Skill directory");
  const packageJSON = await readPackageJSON(resolvedPackagePath);
  validatePackageMetadata(packageJSON);

  for (const root of packageJSON.files) {
    assertCanonicalArtifactPath(root);
  }
  if (
    packageJSON.files.length !== ALLOWED_ROOTS.length ||
    packageJSON.files.some((root, index) => root !== ALLOWED_ROOTS[index])
  ) {
    throw new Error(
      `package.json files must be exactly ${ALLOWED_ROOTS.join(", ")}`,
    );
  }

  const state = {
    filesByPath: new Map(),
    totalBytes: 0,
  };
  for (const root of ALLOWED_ROOTS) {
    await collectArtifactPath(resolvedSkillDir, root, state);
  }

  const files = [...state.filesByPath.entries()]
    .map(([path, bytes]) => ({ path, bytes }))
    .sort((left, right) => compareArtifactPaths(left.path, right.path));
  const skillFile = files.find(({ path }) => path === "SKILL.md");
  if (!skillFile || skillFile.bytes === 0) {
    throw new Error("Skill package requires a non-empty root SKILL.md");
  }

  await validateSkillMetadataVersion(
    join(resolvedSkillDir, "SKILL.md"),
    `v${EXPECTED_VERSION}`,
  );

  return {
    canonicalPackage: EXPECTED_NAME,
    version: EXPECTED_VERSION,
    kind: "skill",
    roots: [...ALLOWED_ROOTS],
    fileCount: files.length,
    totalBytes: state.totalBytes,
    files,
  };
}

async function readPackageJSON(packagePath) {
  const fileStat = await lstatWithContext(packagePath, "package.json does not exist");
  if (fileStat.isSymbolicLink()) {
    throw new Error("package.json must not be a symbolic link");
  }
  if (!fileStat.isFile()) {
    throw new Error("package.json must be a regular file");
  }

  const text = await readFile(packagePath, "utf8");
  try {
    const value = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("root value is not an object");
    }
    return value;
  } catch (error) {
    throw new Error(`package.json is not valid JSON: ${error.message}`);
  }
}

function validatePackageMetadata(packageJSON) {
  if (packageJSON.name !== EXPECTED_NAME) {
    throw new Error(`package.json package name must be ${EXPECTED_NAME}`);
  }
  if (packageJSON.version !== EXPECTED_VERSION) {
    throw new Error(`package.json version must be ${EXPECTED_VERSION}`);
  }
  if (packageJSON.private === true) {
    throw new Error("package.json must be publishable to npm");
  }
  if (packageJSON.publishConfig?.access !== "public") {
    throw new Error("package.json publishConfig.access must be public");
  }
  if (
    packageJSON.alpkg === null ||
    typeof packageJSON.alpkg !== "object" ||
    Array.isArray(packageJSON.alpkg) ||
    packageJSON.alpkg.kind !== "skill"
  ) {
    throw new Error("package.json alpkg.kind must be skill");
  }
  for (const field of FORBIDDEN_ENTRYPOINT_FIELDS) {
    if (Object.hasOwn(packageJSON, field)) {
      throw new Error(`Skill package must not define ${field}`);
    }
  }
  if (Object.hasOwn(packageJSON.alpkg, "entrypoints")) {
    throw new Error("Skill package must not define alpkg.entrypoints");
  }
  if (!Array.isArray(packageJSON.files) || packageJSON.files.length === 0) {
    throw new Error("package.json files must be a non-empty array");
  }
}

async function requireDirectory(path, label) {
  const fileStat = await lstatWithContext(path, `${label} does not exist`);
  if (fileStat.isSymbolicLink()) {
    throw new Error(`${label} must not be a symbolic link`);
  }
  if (!fileStat.isDirectory()) {
    throw new Error(`${label} must be a directory`);
  }
}

async function collectArtifactPath(skillDir, artifactPath, state) {
  assertCanonicalArtifactPath(artifactPath);
  const localPath = join(skillDir, ...artifactPath.split("/"));
  const fileStat = await lstatWithContext(
    localPath,
    `package artifact path does not exist: ${artifactPath}`,
  );

  if (fileStat.isSymbolicLink()) {
    throw new Error(
      `package artifact must not traverse a symbolic link: ${artifactPath}`,
    );
  }
  if (fileStat.isFile()) {
    addArtifactFile(artifactPath, fileStat.size, state);
    return;
  }
  if (!fileStat.isDirectory()) {
    throw new Error(
      `package artifact path is not a regular file or directory: ${artifactPath}`,
    );
  }

  const entries = await readdir(localPath, { withFileTypes: true });
  entries.sort((left, right) => compareArtifactPaths(left.name, right.name));
  for (const entry of entries) {
    await collectArtifactPath(skillDir, `${artifactPath}/${entry.name}`, state);
  }
}

function addArtifactFile(artifactPath, bytes, state) {
  if (state.filesByPath.has(artifactPath)) return;
  if (state.filesByPath.size >= REGISTRY_LIMITS.maxFiles) {
    throw new Error(
      `package artifact contains more than ${REGISTRY_LIMITS.maxFiles} files`,
    );
  }
  if (state.totalBytes + bytes > REGISTRY_LIMITS.maxTotalBytes) {
    throw new Error("package artifact exceeds the 32 MiB artifact limit");
  }
  state.filesByPath.set(artifactPath, bytes);
  state.totalBytes += bytes;
}

function assertCanonicalArtifactPath(value) {
  const rendered = JSON.stringify(value);
  if (
    typeof value !== "string" ||
    value === "" ||
    value.trim() !== value ||
    value.startsWith("/")
  ) {
    throw new Error(`unsafe artifact path ${rendered}`);
  }
  if (value.includes("\\")) {
    throw new Error(`unsafe artifact path ${rendered}: backslash is not allowed`);
  }

  const segments = value.split("/");
  if (segments[0] === "manifest.json") {
    throw new Error(`reserved artifact path ${rendered}`);
  }
  for (const segment of segments) {
    if (segment === "" || segment === "." || segment === "..") {
      throw new Error(
        `unsafe artifact path ${rendered}: non-canonical segment ${JSON.stringify(segment)}`,
      );
    }
    if (segment.startsWith(".")) {
      throw new Error(`reserved artifact path ${rendered}`);
    }
  }
}

async function validateSkillMetadataVersion(skillPath, expectedVersion) {
  const content = await readFile(skillPath, "utf8");
  const skill = content.replace(/^\uFEFF/, "");
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(skill)?.[1];
  if (frontmatter === undefined) {
    throw new Error("SKILL.md must begin with YAML frontmatter");
  }

  const lines = frontmatter.split(/\r?\n/);
  let inMetadata = false;
  let version;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    if (/^metadata:\s*(?:#.*)?$/.test(line)) {
      inMetadata = true;
      continue;
    }
    if (!inMetadata) continue;
    if (/^[^\s#]/.test(line)) break;
    const match = /^\s+version:\s*["']?([^\s#'"]+)["']?\s*(?:#.*)?$/.exec(line);
    if (match) {
      version = match[1];
      break;
    }
  }
  if (version !== expectedVersion) {
    throw new Error(`SKILL.md metadata version must be ${expectedVersion}`);
  }
}

async function lstatWithContext(path, message) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ENOTDIR") {
      throw new Error(message);
    }
    throw error;
  }
}

function compareArtifactPaths(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function parseCLIArgs(argv) {
  let skillDir;
  let packageJSONPath;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--skill-dir") {
      skillDir = requiredOptionValue(argv, ++index, argument);
    } else if (argument === "--package-json") {
      packageJSONPath = requiredOptionValue(argv, ++index, argument);
    } else if (argument === "--help" || argument === "-h") {
      return { help: true };
    } else if (!argument.startsWith("-") && skillDir === undefined) {
      skillDir = argument;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return { skillDir, packageJSONPath };
}

function requiredOptionValue(argv, index, option) {
  const value = argv[index];
  if (value === undefined || value.startsWith("-")) {
    throw new Error(`${option} requires a path`);
  }
  return value;
}

async function main() {
  const options = parseCLIArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      "Usage: node tools/alva-skill-package/validate.mjs [--skill-dir PATH] [--package-json PATH]\n",
    );
    return;
  }
  const result = await validateSkillPackage(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const invokedURL = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;
if (invokedURL === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`alva-skill-package: ${error.message}\n`);
    process.exitCode = 1;
  });
}
