import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { createTempTree, type TempTree } from '@williamthorsen/toolbelt.testing/candidate';
import { describe, expect, it } from 'vitest';

const WRAPPER_PATH = fileURLToPath(new URL('../../bin/strict-lint.js', import.meta.url));
const BUILD_ENTRY_RELATIVE_PATH = 'dist/esm/bin/strict-lint.js';
const SOURCE_ENTRY_RELATIVE_PATH = 'src/bin/strict-lint.ts';
const WRAPPER_RELATIVE_PATH = 'bin/strict-lint.js';

// The wrapper resolves its entry points relative to its own location, so a copy in a temp tree decides for itself
// which of them is there. That keeps these cases independent of whether this checkout has been built.
describe('bin wrapper', () => {
  it('reports the missing build output when neither entry point is there', () => {
    using tree = installWrapper({});

    const { status, stderr } = runWrapper(tree);

    expect(status).toBe(1);
    expect(stderr).toContain('build output not found');
    expect(stderr).toContain('Reinstall the package');
  });

  it('runs the build output when the source is absent', () => {
    using tree = installWrapper({ build: 'process.stdout.write("build reached\\n");\n' });

    const { status, stdout } = runWrapper(tree);

    expect(status).toBe(0);
    expect(stdout).toContain('build reached');
  });

  it('runs the source when the build output is absent', () => {
    using tree = installWrapper({ source: 'process.stdout.write("source reached\\n");\n' });

    const { status, stdout } = runWrapper(tree);

    expect(status).toBe(0);
    expect(stdout).toContain('source reached');
  });

  it('prefers the source to the build output', () => {
    using tree = installWrapper({
      build: 'process.stdout.write("build reached\\n");\n',
      source: 'process.stdout.write("source reached\\n");\n',
    });

    const { status, stdout } = runWrapper(tree);

    expect(status).toBe(0);
    expect(stdout).toContain('source reached');
    expect(stdout).not.toContain('build reached');
  });

  it('reports an entry point that fails to load', () => {
    using tree = installWrapper({ build: 'throw new Error("boom");\n' });

    const { status, stderr } = runWrapper(tree);

    expect(status).toBe(1);
    expect(stderr).toContain('failed to load: boom');
  });
});

// region | Helpers

/** Copies the wrapper into a temp tree, alongside an entry point for each body given. */
function installWrapper(entryPointBodies: { build?: string; source?: string }): TempTree {
  return createTempTree(
    {
      // Node reads the module type from the nearest `package.json`; without one, a `.js` file is CommonJS and the
      // wrapper's import statement is a syntax error.
      'package.json': '{ "type": "module" }\n',
      [WRAPPER_RELATIVE_PATH]: fs.readFileSync(WRAPPER_PATH),
      ...(entryPointBodies.build !== undefined && { [BUILD_ENTRY_RELATIVE_PATH]: entryPointBodies.build }),
      ...(entryPointBodies.source !== undefined && { [SOURCE_ENTRY_RELATIVE_PATH]: entryPointBodies.source }),
    },
    { prefix: 'strict-lint-bin-' },
  );
}

/** Runs the tree's wrapper copy as its own process. */
function runWrapper(tree: TempTree): { status: number | null; stderr: string; stdout: string } {
  const result = spawnSync(process.execPath, [tree.resolve(WRAPPER_RELATIVE_PATH)], { encoding: 'utf8' });
  return { status: result.status, stderr: result.stderr, stdout: result.stdout };
}

// endregion | Helpers
