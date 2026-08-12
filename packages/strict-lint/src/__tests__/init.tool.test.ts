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

describe('strict-lint init (subprocess)', () => {
  afterAll(() => {
    for (const dir of createdDirs) {
      fs.rmSync(dir, { force: true, recursive: true });
    }
  });

  it('writes the config into the working directory and reports the path', () => {
    const dir = makeTree();

    const { status, stdout } = runCli(dir, ['init']);

    expect(status).toBe(0);
    expect(stdout).toContain(`Created ${path.join(dir, STRICT_LINT_CONFIG_NAME)}`);
    expect(readConfig(dir)).toBe(CONFIG_TEMPLATE);
  });

  it('reports the project root the ceilings merge down from', () => {
    const dir = makeTree();

    const { stdout } = runCli(dir, ['init']);

    expect(stdout).toContain(`project root at ${dir} (found by ${ROOT_MARKER})`);
  });

  it('prints an install step when the package cannot be imported from the target', () => {
    const dir = makeTree();

    const { status, stdout } = runCli(dir, ['init']);

    expect(status).toBe(0);
    expect(stdout).toContain('pnpm add -D @williamthorsen/strict-lint eslint');
  });

  it('prints no install step when the package is installed', () => {
    const dir = makeTree();
    installStubPackage(dir);

    expect(runCli(dir, ['init']).stdout).not.toContain('pnpm add -D');
  });

  it('writes nothing under --dry-run', () => {
    const dir = makeTree();

    const { status, stdout } = runCli(dir, ['init', '--dry-run']);

    expect(status).toBe(0);
    expect(stdout).toContain('Would create');
    expect(fs.existsSync(path.join(dir, STRICT_LINT_CONFIG_NAME))).toBe(false);
  });

  it('keeps a diverged config and names the flag that would replace it', () => {
    const dir = makeTree();
    writeConfig(dir, 'export default {};\n');

    const { status, stdout } = runCli(dir, ['init']);

    expect(status).toBe(0);
    expect(stdout).toContain('Pass --force to overwrite it.');
    expect(readConfig(dir)).toBe('export default {};\n');
  });

  it('replaces a diverged config under --force', () => {
    const dir = makeTree();
    writeConfig(dir, 'export default {};\n');

    const { stdout } = runCli(dir, ['init', '--force']);

    expect(stdout).toContain('Overwrote');
    expect(readConfig(dir)).toBe(CONFIG_TEMPLATE);
  });

  // `reconcileFile` compares before it consults the conflict policy, so `--force` reports no write it did not make.
  it.each([[[]], [['--force']]])('reports an unchanged config as up to date, given %j', (extraArgs) => {
    const dir = makeTree();
    writeConfig(dir, CONFIG_TEMPLATE);

    expect(runCli(dir, ['init', ...extraArgs]).stdout).toContain('is already up to date');
  });

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

  // A file where the `.config` directory belongs makes the write fail at `mkdir`, which nothing else reaches.
  it('exits non-zero when the config cannot be written', () => {
    const dir = makeTree({ '.config': '' });

    const { status, stdout } = runCli(dir, ['init']);

    expect(status).toBe(1);
    expect(stdout).toContain('Failed to write');
  });

  it('exits non-zero on an unknown init flag', () => {
    const dir = makeTree();

    expect(runCli(dir, ['init', '--overwrite']).status).toBe(1);
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

function readConfig(dir: string): string {
  return fs.readFileSync(path.join(dir, STRICT_LINT_CONFIG_NAME), 'utf8');
}

/** Runs the CLI as it ships, from `cwd`, returning its exit status and combined output. */
function runCli(cwd: string, args: string[]): { status: number | null; stdout: string } {
  const { status, stdout, stderr } = spawnSync(process.execPath, [CLI_PATH, ...args], { cwd, encoding: 'utf8' });
  return { status, stdout: stdout + stderr };
}

function writeConfig(dir: string, content: string): void {
  writeFile(path.join(dir, STRICT_LINT_CONFIG_NAME), content);
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

// endregion | Helpers
