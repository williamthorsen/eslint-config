import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

const WRAPPER_PATH = fileURLToPath(new URL('../../bin/strict-lint.js', import.meta.url));
const BUILD_ENTRY_RELATIVE_PATH = path.join('dist', 'esm', 'bin', 'strict-lint.js');
const SOURCE_ENTRY_RELATIVE_PATH = path.join('src', 'bin', 'strict-lint.ts');

const createdDirs: string[] = [];

// The wrapper resolves its entry points relative to its own location, so a copy in a temp tree decides for itself
// which of them is there. That keeps these cases independent of whether this checkout has been built.
describe('bin wrapper', () => {
  afterAll(() => {
    for (const dir of createdDirs) {
      fs.rmSync(dir, { force: true, recursive: true });
    }
  });

  it('reports the missing build output when neither entry point is there', () => {
    const wrapper = installWrapper({});

    const { status, stderr } = runWrapper(wrapper);

    expect(status).toBe(1);
    expect(stderr).toContain('build output not found');
    expect(stderr).toContain('Reinstall the package');
  });

  it('runs the build output when the source is absent', () => {
    const wrapper = installWrapper({ build: 'process.stdout.write("build reached\\n");\n' });

    const { status, stdout } = runWrapper(wrapper);

    expect(status).toBe(0);
    expect(stdout).toContain('build reached');
  });

  it('runs the source when the build output is absent', () => {
    const wrapper = installWrapper({ source: 'process.stdout.write("source reached\\n");\n' });

    const { status, stdout } = runWrapper(wrapper);

    expect(status).toBe(0);
    expect(stdout).toContain('source reached');
  });

  it('prefers the source to the build output', () => {
    const wrapper = installWrapper({
      build: 'process.stdout.write("build reached\\n");\n',
      source: 'process.stdout.write("source reached\\n");\n',
    });

    const { status, stdout } = runWrapper(wrapper);

    expect(status).toBe(0);
    expect(stdout).toContain('source reached');
    expect(stdout).not.toContain('build reached');
  });

  it('reports an entry point that fails to load', () => {
    const wrapper = installWrapper({ build: 'throw new Error("boom");\n' });

    const { status, stderr } = runWrapper(wrapper);

    expect(status).toBe(1);
    expect(stderr).toContain('failed to load: boom');
  });
});

// region | Helpers

/** Copies the wrapper into a temp tree, alongside an entry point for each body given, and returns its path. */
function installWrapper(entryPointBodies: { build?: string; source?: string }): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strict-lint-bin-'));
  createdDirs.push(dir);

  // Node reads the module type from the nearest `package.json`; without one, a `.js` file is CommonJS and the
  // wrapper's import statement is a syntax error.
  fs.writeFileSync(path.join(dir, 'package.json'), '{ "type": "module" }\n');

  const wrapper = path.join(dir, 'bin', 'strict-lint.js');
  fs.mkdirSync(path.dirname(wrapper), { recursive: true });
  fs.copyFileSync(WRAPPER_PATH, wrapper);

  writeEntryPoint(path.join(dir, BUILD_ENTRY_RELATIVE_PATH), entryPointBodies.build);
  writeEntryPoint(path.join(dir, SOURCE_ENTRY_RELATIVE_PATH), entryPointBodies.source);

  return wrapper;
}

/** Runs a wrapper copy as its own process. */
function runWrapper(wrapper: string): { status: number | null; stderr: string; stdout: string } {
  const result = spawnSync(process.execPath, [wrapper], { encoding: 'utf8' });
  return { status: result.status, stderr: result.stderr, stdout: result.stdout };
}

/** Writes an entry point with the given body, or nothing when the body is absent. */
function writeEntryPoint(entryPoint: string, body: string | undefined): void {
  if (body === undefined) return;

  fs.mkdirSync(path.dirname(entryPoint), { recursive: true });
  fs.writeFileSync(entryPoint, body);
}

// endregion | Helpers
