import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CSS_PATH = path.resolve(here, '../references/css/design-system.css');

describe('design-contract-sync — CSS freshness check', () => {
  it('exits 0 when design-system.css matches build output', () => {
    const out = execSync('tsx design-contract-sync.ts', { cwd: here, encoding: 'utf8' });
    expect(out).toMatch(/in sync/);
  });

  it('exits 1 when design-system.css is stale', () => {
    const original = fs.readFileSync(CSS_PATH, 'utf8');
    try {
      fs.writeFileSync(CSS_PATH, original + '\n/* INTENTIONAL DRIFT */\n');
      let exitCode = 0;
      try {
        execSync('tsx design-contract-sync.ts', { cwd: here, encoding: 'utf8' });
      } catch (e: unknown) {
        exitCode = (e as { status: number }).status;
      }
      expect(exitCode).toBe(1);
    } finally {
      fs.writeFileSync(CSS_PATH, original);
    }
  });
});
