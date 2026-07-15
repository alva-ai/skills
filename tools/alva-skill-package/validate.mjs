import { lstat, readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_FILES = 64;
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const EXPECTED_FILES = ['SKILL.md', 'references', 'scripts'];

const toolDir = dirname(fileURLToPath(import.meta.url));
const defaultSkillDir = resolve(toolDir, '../../skills/alva');

export async function validatePackage(skillDir = defaultSkillDir) {
  const packageJSON = JSON.parse(await readFile(join(skillDir, 'package.json'), 'utf8'));
  assert(packageJSON.name === '@alva/skill', 'package name must be @alva/skill');
  assert(packageJSON.private === true, 'package must remain private to prevent npm publication');
  assert(packageJSON.main === 'SKILL.md', 'package main must be SKILL.md');
  assert(
    JSON.stringify(packageJSON.files) === JSON.stringify(EXPECTED_FILES),
    `package files must be ${JSON.stringify(EXPECTED_FILES)}`,
  );

  const skillMD = await readFile(join(skillDir, 'SKILL.md'), 'utf8');
  const skillVersion = readSkillVersion(skillMD);
  assert(
    skillVersion === `v${packageJSON.version}`,
    `SKILL.md version ${skillVersion ?? '<missing>'} must match package version v${packageJSON.version}`,
  );

  const files = [];
  let totalBytes = 0;
  for (const root of packageJSON.files) {
    await collect(join(skillDir, root), root, files, (size) => {
      totalBytes += size;
    });
  }
  files.sort();

  assert(files.includes('SKILL.md'), 'package must include SKILL.md');
  assert(files.includes('scripts/version_check.sh'), 'package must include scripts/version_check.sh');
  assert(files.some((file) => file.startsWith('references/')), 'package must include references');
  assert(!files.includes('package.json'), 'package.json must not be included in the artifact');
  assert(!files.some(hasHiddenSegment), 'artifact must not include hidden paths');
  assert(files.length <= MAX_FILES, `artifact has ${files.length} files; maximum is ${MAX_FILES}`);
  assert(totalBytes <= MAX_TOTAL_BYTES, 'artifact exceeds the 32 MiB limit');

  return {
    package: packageJSON.name,
    version: skillVersion,
    main: packageJSON.main,
    files,
    file_count: files.length,
    total_bytes: totalBytes,
  };
}

function readSkillVersion(skillMD) {
  const normalized = skillMD.replaceAll('\r\n', '\n');
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(normalized);
  if (!match) return undefined;
  return /^\s*version:\s*(v\d+\.\d+\.\d+)\s*$/m.exec(match[1])?.[1];
}

async function collect(localPath, artifactPath, files, addBytes) {
  const stat = await lstat(localPath);
  assert(!stat.isSymbolicLink(), `artifact path must not be a symlink: ${artifactPath}`);
  assert(!hasHiddenSegment(artifactPath), `artifact path must not be hidden: ${artifactPath}`);
  if (stat.isFile()) {
    files.push(artifactPath);
    addBytes(stat.size);
    return;
  }
  assert(stat.isDirectory(), `artifact path must be a file or directory: ${artifactPath}`);
  const entries = await readdir(localPath, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    await collect(join(localPath, entry.name), `${artifactPath}/${entry.name}`, files, addBytes);
  }
}

function hasHiddenSegment(filePath) {
  return filePath.split('/').some((segment) => segment.startsWith('.'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await validatePackage(process.argv[2] ? resolve(process.argv[2]) : undefined);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`alva-skill-package: ${error.message}\n`);
    process.exitCode = 1;
  }
}
