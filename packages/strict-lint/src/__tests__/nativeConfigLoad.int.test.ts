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
const UNUSED_VAR_AND_CONSOLE_FILE = "const unused = 1;\nconsole.log('hi');\n";
const ROOT_MARKER = 'pnpm-workspace.yaml';

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

  it('applies a package-level strict-lint config when the ESLint config lives at the root', () => {
    const dir = makePackageAllowlistFixture();

    const { status, stdout } = runCli(path.join(dir, 'packages/pkg'), ['a.js']);

    expect(status).toBe(0);
    expect(stdout).toContain('0 errors, 1 warning');
  }, 30_000);

  it('ignores a strict-lint config below the directory the run starts in', () => {
    const dir = makePackageAllowlistFixture();

    const { status, stdout } = runCli(dir, ['packages/pkg/a.js']);

    // Config selection follows the working directory, so linting the package's own file does not reach its allowlist.
    expect(status).toBe(1);
    expect(stdout).toContain('1 error, 0 warnings');
  }, 30_000);

  it('merges a package config over the root config, dropping only the entry it overrides', () => {
    const dir = makeFixture({
      '.config/strict-lint.config.ts':
        "export default { maxSeverity: { 'no-console': 'warn', 'no-unused-vars': 'warn' } };\n",
      'eslint.config.ts': "export default [{ rules: { 'no-console': 'warn', 'no-unused-vars': 'warn' } }];\n",
      'packages/pkg/.config/strict-lint.config.ts': "export default { maxSeverity: { 'no-unused-vars': 'error' } };\n",
      'packages/pkg/a.js': UNUSED_VAR_AND_CONSOLE_FILE,
    });

    const { status, stdout } = runCli(path.join(dir, 'packages/pkg'), ['a.js']);

    // The package drops the inherited `no-unused-vars` entry by promoting it; the root's `no-console` entry survives.
    expect(status).toBe(1);
    expect(stdout).toContain('1 error, 1 warning');
  }, 30_000);

  it('ignores a strict-lint config above the project root', () => {
    const dir = makeFixture({
      '.config/strict-lint.config.ts': "export default { maxSeverity: { 'no-unused-vars': 'warn' } };\n",
      [`project/${ROOT_MARKER}`]: '',
      'project/eslint.config.ts': "export default [{ rules: { 'no-unused-vars': 'warn' } }];\n",
      'project/a.js': UNUSED_VAR_FILE,
    });

    const { status, stdout } = runCli(path.join(dir, 'project'), ['a.js']);

    expect(status).toBe(1);
    expect(stdout).toContain('1 error, 0 warnings');
  }, 30_000);

  it('stops the ascent at a config declaring shouldIgnoreAncestors', () => {
    const dir = makeFixture({
      '.config/strict-lint.config.ts': "export default { maxSeverity: { 'no-console': 'warn' } };\n",
      'eslint.config.ts': "export default [{ rules: { 'no-console': 'warn', 'no-unused-vars': 'warn' } }];\n",
      'packages/pkg/.config/strict-lint.config.ts':
        "export default { maxSeverity: { 'no-unused-vars': 'warn' }, shouldIgnoreAncestors: true };\n",
      'packages/pkg/a.js': UNUSED_VAR_AND_CONSOLE_FILE,
    });

    const { status, stdout } = runCli(path.join(dir, 'packages/pkg'), ['a.js']);

    // Only the package's entry applies, so `no-console` is promoted while `no-unused-vars` stays a warning.
    expect(status).toBe(1);
    expect(stdout).toContain('1 error, 1 warning');
  }, 30_000);

  it('leaves a config above shouldIgnoreAncestors unimported', () => {
    const dir = makeFixture({
      '.config/strict-lint.config.ts': "throw new Error('ancestor config was imported');\n",
      'eslint.config.ts': "export default [{ rules: { 'no-unused-vars': 'warn' } }];\n",
      'packages/pkg/.config/strict-lint.config.ts': 'export default { shouldIgnoreAncestors: true };\n',
      'packages/pkg/a.js': UNUSED_VAR_FILE,
    });

    const { status, stdout, stderr } = runCli(path.join(dir, 'packages/pkg'), ['a.js']);

    // A run that reached the ancestor would die on its throw instead of reporting the promoted rule.
    expect(status).toBe(1);
    expect(stdout).toContain('1 error, 0 warnings');
    expect(stderr).not.toContain('ancestor config was imported');
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

/** A monorepo tree whose only ESLint config sits at the root and whose only allowlist sits inside the package. */
function makePackageAllowlistFixture(): string {
  return makeFixture({
    'eslint.config.ts': "export default [{ rules: { 'no-unused-vars': 'warn' } }];\n",
    'packages/pkg/.config/strict-lint.config.ts': "export default { maxSeverity: { 'no-unused-vars': 'warn' } };\n",
    'packages/pkg/a.js': UNUSED_VAR_FILE,
  });
}

/**
 * Write the given files into a fresh temp directory and return its path. The directory gets a project-root marker,
 * so config discovery is bounded by the fixture rather than by whatever happens to sit above the system temp
 * directory on the machine running the suite.
 */
function makeFixture(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strict-lint-int-'));
  createdDirs.push(dir);
  const contents = { [ROOT_MARKER]: '', ...files };
  for (const [name, content] of Object.entries(contents)) {
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
