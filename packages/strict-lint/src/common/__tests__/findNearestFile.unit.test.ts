import fs from 'node:fs';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { findNearestFile } from '../findNearestFile.ts';

describe(findNearestFile, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds a single named file in the start directory', () => {
    withExistingPaths(['/a/b/eslint.config.js']);

    expect(findNearestFile('eslint.config.js', '/a/b')).toBe('/a/b/eslint.config.js');
  });

  it('walks up to a parent directory to find the file', () => {
    withExistingPaths(['/a/eslint.config.js']);

    expect(findNearestFile('eslint.config.js', '/a/b/c')).toBe('/a/eslint.config.js');
  });

  it('returns undefined when no candidate exists before the root', () => {
    withExistingPaths([]);

    expect(findNearestFile('eslint.config.js', '/a/b')).toBeUndefined();
  });

  it('prefers a nearer directory over an earlier name higher up', () => {
    // `.js` is earlier in the list but only exists in the parent; `.ts` exists in the start dir.
    withExistingPaths(['/a/b/eslint.config.ts', '/a/eslint.config.js']);

    expect(findNearestFile(['eslint.config.js', 'eslint.config.ts'], '/a/b')).toBe('/a/b/eslint.config.ts');
  });

  it('honors list order when several names exist in the same directory', () => {
    withExistingPaths(['/a/b/eslint.config.js', '/a/b/eslint.config.ts']);

    expect(findNearestFile(['eslint.config.js', 'eslint.config.ts'], '/a/b')).toBe('/a/b/eslint.config.js');
  });
});

// region | Helpers

/** Make `fs.existsSync` report exactly the given absolute paths as present. */
function withExistingPaths(paths: string[]): void {
  const set = new Set(paths);
  vi.spyOn(fs, 'existsSync').mockImplementation((candidate) => set.has(String(candidate)));
}

// endregion | Helpers
