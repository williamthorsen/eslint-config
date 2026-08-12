import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { canResolveStrictLint } from '../canResolveStrictLint.ts';

const createdDirs: string[] = [];

describe(canResolveStrictLint, () => {
  afterAll(() => {
    for (const dir of createdDirs) {
      fs.rmSync(dir, { force: true, recursive: true });
    }
  });

  it('reports an installed package in the directory itself', () => {
    const dir = makeTree({ install: '.' });

    expect(canResolveStrictLint(dir)).toBe(true);
  });

  it('reports an installed package held by an ancestor', () => {
    const dir = makeTree({ install: '.' });

    expect(canResolveStrictLint(path.join(dir, 'packages/pkg/src'))).toBe(true);
  });

  it('reports no package when the tree holds no node_modules', () => {
    const dir = makeTree({});

    expect(canResolveStrictLint(path.join(dir, 'packages/pkg'))).toBe(false);
  });

  it('reports no package when node_modules holds a different package', () => {
    const dir = makeTree({});
    writeFile(path.join(dir, 'node_modules/@williamthorsen/tsconfig/package.json'), '{}');

    expect(canResolveStrictLint(dir)).toBe(false);
  });

  // A pnpm install links the package rather than copying it, so a walk that did not follow the link would miss it.
  it('follows a symlinked install', () => {
    const dir = makeTree({});
    const store = path.join(dir, 'store/strict-lint');
    writeFile(path.join(store, 'package.json'), '{}');
    const linkParent = path.join(dir, 'node_modules/@williamthorsen');
    fs.mkdirSync(linkParent, { recursive: true });
    fs.symlinkSync(store, path.join(linkParent, 'strict-lint'), 'dir');

    expect(canResolveStrictLint(dir)).toBe(true);
  });
});

// region | Helpers

/** A throwaway tree holding `packages/pkg/src`, optionally with the package installed at the named directory. */
function makeTree({ install }: { install?: string }): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'strict-lint-resolve-')));
  createdDirs.push(dir);
  fs.mkdirSync(path.join(dir, 'packages/pkg/src'), { recursive: true });
  if (install !== undefined) {
    writeFile(path.join(dir, install, 'node_modules/@williamthorsen/strict-lint/package.json'), '{}');
  }
  return dir;
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

// endregion | Helpers
