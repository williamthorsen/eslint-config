import { globSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The projects nmr's shared Vitest config declares. Each name is also the filename infix that selects it.
const TIERS = new Set(['unit', 'tool', 'localhost', 'remote']);

// `unit` is a residual project: it collects whatever the named tiers don't claim, and the shared config sets
// `passWithNoTests`. A file whose infix is missing or misspelt therefore runs under `unit` and reports success, so a
// test run cannot distinguish it from a correctly named one.
describe('test-tier infixes', () => {
  it('every collected test file names one of the four tiers', () => {
    const misnamed = collectTestFiles().filter((file) => !TIERS.has(readTierInfix(file)));

    expect(misnamed).toStrictEqual([]);
  });
});

/** Returns the repo-relative path of every test file Vitest collects, in sorted order. */
function collectTestFiles(): string[] {
  return globSync('**/__tests__/**/*.test.{ts,tsx}', {
    cwd: repoRoot,
    exclude: ['**/node_modules/**', '**/dist/**'],
  }).toSorted();
}

/** Reads the dot-delimited segment immediately before `.test.`, which is the only one a project matches on. */
function readTierInfix(file: string): string {
  return path.basename(file).split('.').at(-3) ?? '';
}
