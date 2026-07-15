import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { validatePackage } from './validate.mjs';

const repoSkillDir = fileURLToPath(new URL('../../skills/alva/', import.meta.url));

test('validates the repository package and its recursive artifact surface', async () => {
  const packageJSON = JSON.parse(await readFile(join(repoSkillDir, 'package.json'), 'utf8'));
  const result = await validatePackage(repoSkillDir);

  assert.equal(result.package, '@alva/skill');
  assert.equal(result.version, `v${packageJSON.version}`);
  assert.equal(result.main, 'SKILL.md');
  assert(result.files.includes('SKILL.md'));
  assert(result.files.includes('scripts/version_check.sh'));
  assert(result.files.includes('references/feed-sdk.md'));
  assert(!result.files.includes('package.json'));
  assert(!result.files.some((file) => file.startsWith('.env')));
  assert(result.file_count <= 64);
  assert(result.total_bytes < 32 * 1024 * 1024);
});

test('rejects a package version that differs from SKILL.md', async () => {
  const fixture = await makeFixture({ packageVersion: '1.16.1', skillVersion: 'v1.16.0' });
  try {
    await assert.rejects(() => validatePackage(fixture), /must match package version v1\.16\.1/);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test('rejects symlinks within recursively declared roots', async () => {
  const fixture = await makeFixture({ packageVersion: '1.16.1', skillVersion: 'v1.16.1' });
  try {
    await symlink(join(fixture, 'SKILL.md'), join(fixture, 'references', 'linked.md'));
    await assert.rejects(() => validatePackage(fixture), /must not be a symlink/);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

async function makeFixture({ packageVersion, skillVersion }) {
  const root = await mkdtemp(join(tmpdir(), 'alva-skill-package-'));
  await mkdir(join(root, 'references'));
  await mkdir(join(root, 'scripts'));
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({
      name: '@alva/skill',
      version: packageVersion,
      private: true,
      main: 'SKILL.md',
      files: ['SKILL.md', 'references', 'scripts'],
    }),
  );
  await writeFile(
    join(root, 'SKILL.md'),
    `---\nname: alva\nmetadata:\n  version: ${skillVersion}\n---\n\n# Alva\n`,
  );
  await writeFile(join(root, 'references', 'feed-sdk.md'), '# Feed SDK\n');
  await writeFile(join(root, 'scripts', 'version_check.sh'), '#!/bin/sh\n');
  return root;
}
