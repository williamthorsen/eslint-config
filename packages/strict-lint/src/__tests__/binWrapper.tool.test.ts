import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

const WRAPPER_PATH = fileURLToPath(new URL('../../bin/strict-lint.js', import.meta.url));
const ENTRY_RELATIVE_PATH = path.join('dist', 'esm', 'bin', 'strict-lint.js');

const createdDirs: string[] = [];

// The wrapper resolves its entry point relative to its own location, so a copy in a temp tree decides for itself
// whether the build output is there. That keeps these cases independent of whether this checkout has been built.
describe('bin wrapper', () => {
  afterAll(() => {
    for (const dir of createdDirs) {
      fs.rmSync(dir, { force: true, recursive: true });
    }
  });

  it('reports the missing build output and names the command that produces it', () => {
    const wrapper = installWrapper();

    const { status, stderr } = runWrapper(wrapper);

    expect(status).toBe(1);
    expect(stderr).toContain('build output not found');
    expect(stderr).toContain('nmr build');
  });

  it('runs the entry point when the build output is there', () => {
    const wrapper = installWrapper('process.stdout.write("entry reached\\n");\n');

    const { status, stdout } = runWrapper(wrapper);

    expect(status).toBe(0);
    expect(stdout).toContain('entry reached');
  });
});

// region | Helpers

/** Copies the wrapper into a temp tree, optionally alongside an entry point with the given body, and returns its path. */
function installWrapper(entryPointBody?: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strict-lint-bin-'));
  createdDirs.push(dir);

  // Node reads the module type from the nearest `package.json`; without one, a `.js` file is CommonJS and the
  // wrapper's import statement is a syntax error.
  fs.writeFileSync(path.join(dir, 'package.json'), '{ "type": "module" }\n');

  const wrapper = path.join(dir, 'bin', 'strict-lint.js');
  fs.mkdirSync(path.dirname(wrapper), { recursive: true });
  fs.copyFileSync(WRAPPER_PATH, wrapper);

  if (entryPointBody !== undefined) {
    const entryPoint = path.join(dir, ENTRY_RELATIVE_PATH);
    fs.mkdirSync(path.dirname(entryPoint), { recursive: true });
    fs.writeFileSync(entryPoint, entryPointBody);
  }

  return wrapper;
}

/** Runs a wrapper copy as its own process. */
function runWrapper(wrapper: string): { status: number | null; stderr: string; stdout: string } {
  const result = spawnSync(process.execPath, [wrapper], { encoding: 'utf8' });
  return { status: result.status, stderr: result.stderr, stdout: result.stdout };
}

// endregion | Helpers
