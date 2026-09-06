import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = path.join(repoRoot, 'packages');

const manifestSchema = z.object({
  bin: z.record(z.string(), z.string()).optional(),
  files: z.array(z.string()).optional(),
});

// pnpm links a workspace package's bins during the install's link phase, which runs before anything is built. A
// target under `dist/` therefore does not exist when pnpm reaches for it, and pnpm never retries: the link stays
// missing for the life of the `node_modules` tree, and deleting `node_modules` is the only repair. Each `bin`
// entry points at a committed wrapper instead, which loads the build output at runtime.
describe('bin targets', () => {
  it('no bin target names a path under dist/', () => {
    const offenders = collectBinTargets().filter(({ target }) => readFirstSegment(target) === 'dist');

    expect(offenders.map(describeTarget)).toStrictEqual([]);
  });

  it('every bin target is present before a build', () => {
    const offenders = collectBinTargets().filter(
      ({ packageDir, target }) => !existsSync(path.join(packageDir, target)),
    );

    expect(offenders.map(describeTarget)).toStrictEqual([]);
  });

  it('every bin target is covered by files', () => {
    const offenders = collectBinTargets().filter(
      ({ files, target }) => !files.map(readFirstSegment).includes(readFirstSegment(target)),
    );

    expect(offenders.map(describeTarget)).toStrictEqual([]);
  });
});

// region | Helpers

interface BinTarget {
  command: string;
  files: string[];
  packageDir: string;
  packageName: string;
  target: string;
}

/**
 * Reads every workspace package's `bin` entries as one flat list. `packages/*` is the workspace manifest's only
 * pattern, and reading the directory rather than globbing keeps the package manifests under `__fixtures__` out.
 */
function collectBinTargets(): BinTarget[] {
  return readdirSync(packagesDir).flatMap((packageName) => {
    const packageDir = path.join(packagesDir, packageName);
    const manifestPath = path.join(packageDir, 'package.json');
    if (!existsSync(manifestPath)) return [];

    const manifest = manifestSchema.parse(JSON.parse(readFileSync(manifestPath, 'utf8')));

    return Object.entries(manifest.bin ?? {}).map(([command, target]) => ({
      command,
      files: manifest.files ?? [],
      packageDir,
      packageName,
      target,
    }));
  });
}

/** Renders one entry as `{package}:{command} -> {target}`, the form an offender is reported in. */
function describeTarget({ command, packageName, target }: BinTarget): string {
  return `${packageName}:${command} -> ${target}`;
}

/** Reads the leading path segment of a `bin` target or a `files` entry, which is the granularity `files` publishes at. */
function readFirstSegment(entry: string): string {
  return entry.replace(/^\.\//, '').split('/', 1).at(0) ?? '';
}

// endregion | Helpers
