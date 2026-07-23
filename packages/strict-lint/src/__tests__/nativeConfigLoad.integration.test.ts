import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

// Exercises the real production path: a plain `node` subprocess runs the CLI source with native type stripping.
// Vitest transforms TypeScript through its own pipeline, so it cannot reproduce Node's native loading,
// native-syntax failures, or the absence of jiti in-process.

const CLI_PATH = fileURLToPath(new URL('../bin/strict-lint.ts', import.meta.url));
const UNUSED_VAR_FILE = 'const unused = 1;\n';

const createdDirs: string[] = [];

describe('native config loading (subprocess)', () => {
  afterAll(() => {
    for (const dir of createdDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('discovers and natively loads an eslint.config.ts, promoting warn to error', () => {
    const dir = makeFixture({
      'eslint.config.ts': "export default [{ rules: { 'no-unused-vars': 'warn' } }];\n",
      'a.js': UNUSED_VAR_FILE,
    });

    const { status, stdout } = runCli(dir, ['a.js']);

    expect(status).toBe(1);
    expect(stdout).toContain('no-unused-vars');
    expect(stdout).toContain('error');
  }, 30_000);

  it('prefers eslint.config.js over eslint.config.ts in the same directory', () => {
    const dir = makeFixture({
      'eslint.config.js': "export default [{ rules: { 'no-unused-vars': 'off' } }];\n",
      'eslint.config.ts': "export default [{ rules: { 'no-unused-vars': 'warn' } }];\n",
      'a.js': UNUSED_VAR_FILE,
    });

    const { status } = runCli(dir, ['a.js']);

    // `.js` wins and turns the rule off, so there is nothing to promote.
    expect(status).toBe(0);
  }, 30_000);

  it('applies an ancestor strict-lint config when none sits beside the ESLint config', () => {
    const dir = makeFixture({
      '.config/strict-lint.config.ts': "export default { maxSeverity: { 'no-unused-vars': 'warn' } };\n",
      'packages/pkg/eslint.config.ts': "export default [{ rules: { 'no-unused-vars': 'warn' } }];\n",
      'packages/pkg/a.js': UNUSED_VAR_FILE,
    });

    const { status, stdout } = runCli(path.join(dir, 'packages/pkg'), ['a.js']);

    expect(status).toBe(0);
    // The root config allowlists the rule, so the violation stays a warning instead of being promoted.
    expect(stdout).toMatch(/warning\s+.*no-unused-vars/);
    expect(stdout).toContain('0 errors, 1 warning');
  }, 30_000);

  it('fails a config with non-erasable syntax with an actionable message', () => {
    const dir = makeFixture({
      'eslint.config.ts': 'enum Severity { Warn }\nexport default [{ rules: {}, name: Severity.Warn }];\n',
      'a.js': UNUSED_VAR_FILE,
    });

    const { status, stderr } = runCli(dir, ['a.js']);

    expect(status).toBe(1);
    expect(stderr).toContain('native type stripping');
    expect(stderr).toContain('eslint.config.ts');
  }, 30_000);
});

/** Write the given files into a fresh temp directory and return its path. */
function makeFixture(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strict-lint-int-'));
  createdDirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return dir;
}

/** Run the CLI source under a plain `node` subprocess against the fixture directory. */
function runCli(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], { cwd, encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}
