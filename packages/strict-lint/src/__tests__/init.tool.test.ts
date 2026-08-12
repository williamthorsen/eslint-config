import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { CONFIG_TEMPLATE } from '../init/configTemplate.ts';
import { STRICT_LINT_CONFIG_NAME } from '../loadStrictLintConfigs.ts';

const CLI_PATH = fileURLToPath(new URL('../bin/strict-lint.ts', import.meta.url));
const ROOT_MARKER = 'pnpm-lock.yaml';

const createdDirs: string[] = [];

// The outcome matrix lives in `init/__tests__/initCommand.unit.test.ts`; these cases cover what only the shipped
// binary can show: the dispatch, the argv it forwards, and the runtime the scaffolded config is loaded by.
describe('strict-lint init (subprocess)', () => {
  afterAll(() => {
    for (const dir of createdDirs) {
      fs.rmSync(dir, { force: true, recursive: true });
    }
  });

  it('dispatches init and writes the config', () => {
    const dir = makeTree();

    const { status, stdout } = runCli(dir, ['init']);

    expect(status).toBe(0);
    expect(stdout).toContain(`Created ${path.join(dir, STRICT_LINT_CONFIG_NAME)}`);
    expect(fs.readFileSync(path.join(dir, STRICT_LINT_CONFIG_NAME), 'utf8')).toBe(CONFIG_TEMPLATE);
  });

  it('forwards the flags that follow the command', () => {
    const dir = makeTree();

    const { status, stdout } = runCli(dir, ['init', '--dry-run']);

    expect(status).toBe(0);
    expect(stdout).toContain('Would create');
    expect(fs.existsSync(path.join(dir, STRICT_LINT_CONFIG_NAME))).toBe(false);
  });

  it('lints a path named init rather than scaffolding', () => {
    const dir = makeTree({
      'eslint.config.ts': "export default [{ rules: { 'no-console': 'warn' } }];\n",
      'init/a.js': "console.log('hi');\n",
    });

    const { stdout } = runCli(dir, ['--format', 'json', './init']);

    const parsed: unknown = JSON.parse(stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(fs.existsSync(path.join(dir, STRICT_LINT_CONFIG_NAME))).toBe(false);
  }, 30_000);

  // The cascade imports the config through Node's native type stripping, which admits erasable syntax alone.
  it('writes a config that loads under native type stripping', () => {
    const dir = makeTree();
    installStubPackage(dir);
    runCli(dir, ['init']);

    const configUrl = pathToFileURL(path.join(dir, STRICT_LINT_CONFIG_NAME)).href;
    const { status, stdout } = spawnSync(
      process.execPath,
      ['-e', `import('${configUrl}').then((m) => process.stdout.write(JSON.stringify(m.default)))`],
      { cwd: dir, encoding: 'utf8' },
    );

    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toStrictEqual({ maxSeverity: {} });
  });

  it.each([[['--help']], [['-h']]])('reports both modes for %j', (args) => {
    const dir = makeTree();

    const { status, stdout } = runCli(dir, args);

    expect(status).toBe(0);
    expect(stdout).toContain('strict-lint init [options]');
  });

  it('reports the init flags for init --help', () => {
    const dir = makeTree();

    const { status, stdout } = runCli(dir, ['init', '--help']);

    expect(status).toBe(0);
    expect(stdout).toContain('--dry-run');
    expect(fs.existsSync(path.join(dir, STRICT_LINT_CONFIG_NAME))).toBe(false);
  });

  it('reports an unknown init flag on stderr and exits non-zero', () => {
    const dir = makeTree();

    const { status, stderr } = runCli(dir, ['init', '--overwrite']);

    expect(status).toBe(1);
    expect(stderr).toContain('Unknown option');
  });
});

// region | Helpers

/** Installs a stand-in for the published package, so the scaffolded config's import resolves without a build. */
function installStubPackage(dir: string): void {
  const packageDir = path.join(dir, 'node_modules/@williamthorsen/strict-lint');
  const manifest = {
    exports: { './config': './defineConfig.js' },
    name: '@williamthorsen/strict-lint',
    type: 'module',
  };
  writeFile(path.join(packageDir, 'package.json'), JSON.stringify(manifest));
  writeFile(path.join(packageDir, 'defineConfig.js'), 'export function defineConfig(config) {\n  return config;\n}\n');
}

/** A fresh temp directory carrying a project-root marker, plus any given files. */
function makeTree(files: Record<string, string> = {}): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'strict-lint-init-')));
  createdDirs.push(dir);
  const entries = Object.entries({ [ROOT_MARKER]: '', ...files });
  for (const [name, content] of entries) {
    writeFile(path.join(dir, name), content);
  }
  return dir;
}

/** Runs the CLI as it ships, from `cwd`. */
function runCli(cwd: string, args: string[]): { status: number | null; stderr: string; stdout: string } {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], { cwd, encoding: 'utf8' });
  return { status: result.status, stderr: result.stderr, stdout: result.stdout };
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

// endregion | Helpers
