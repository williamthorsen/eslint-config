import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { createTempTree, type TempTree } from '@williamthorsen/toolbelt.testing/candidate';
import { describe, expect, it } from 'vitest';

import { CONFIG_TEMPLATE } from '../init/configTemplate.ts';
import { STRICT_LINT_CONFIG_NAME } from '../loadStrictLintConfigs.ts';
import { readJsonReport, runCli } from '../test-utils/strictLintCli.ts';

const ROOT_MARKER = 'pnpm-lock.yaml';

// The outcome matrix lives in `init/__tests__/initCommand.unit.test.ts`; these cases cover what only the published
// binary can show: the dispatch, the argv that it forwards, and the runtime that loads the scaffolded config.
describe('strict-lint init (subprocess)', () => {
  it('dispatches init and writes the config', () => {
    using tree = makeTree();

    const { status, stdout } = runCli(tree.dir, ['init']);

    expect(status).toBe(0);
    expect(stdout).toContain(`Created ${tree.resolve(STRICT_LINT_CONFIG_NAME)}`);
    expect(tree.read(STRICT_LINT_CONFIG_NAME)).toBe(CONFIG_TEMPLATE);
  });

  it('forwards the flags that follow the command', () => {
    using tree = makeTree();

    const { status, stdout } = runCli(tree.dir, ['init', '--dry-run']);

    expect(status).toBe(0);
    expect(stdout).toContain('Would create');
    expect(tree.exists(STRICT_LINT_CONFIG_NAME)).toBe(false);
  });

  it('lints a path named init rather than scaffolding', () => {
    using tree = makeTree({
      'eslint.config.ts': "export default [{ rules: { 'no-console': 'warn' } }];\n",
      'init/a.js': "console.log('hi');\n",
    });

    const report = readJsonReport(runCli(tree.dir, ['--format', 'json', './init']));

    expect(report).toHaveLength(1);
    expect(tree.exists(STRICT_LINT_CONFIG_NAME)).toBe(false);
  });

  // The cascade imports the config through Node's native type stripping, which accepts only erasable syntax.
  it('writes a config that loads under native type stripping', () => {
    using tree = makeTree();
    installStubPackage(tree);
    runCli(tree.dir, ['init']);

    const configUrl = pathToFileURL(tree.resolve(STRICT_LINT_CONFIG_NAME)).href;
    const { status, stdout } = spawnSync(
      process.execPath,
      ['-e', `import('${configUrl}').then((m) => process.stdout.write(JSON.stringify(m.default)))`],
      { cwd: tree.dir, encoding: 'utf8' },
    );

    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toStrictEqual({ maxSeverity: {} });
  });

  it.each([[['--help']], [['-h']]])('reports both modes for %j', (args) => {
    using tree = makeTree();

    const { status, stdout } = runCli(tree.dir, args);

    expect(status).toBe(0);
    expect(stdout).toContain('strict-lint init [options]');
  });

  it('reports the init flags for init --help', () => {
    using tree = makeTree();

    const { status, stdout } = runCli(tree.dir, ['init', '--help']);

    expect(status).toBe(0);
    expect(stdout).toContain('--dry-run');
    expect(tree.exists(STRICT_LINT_CONFIG_NAME)).toBe(false);
  });

  it('reports an unknown init flag as a usage error, exiting 2', () => {
    using tree = makeTree();

    const { status, stderr } = runCli(tree.dir, ['init', '--overwrite']);

    expect(status).toBe(2);
    expect(stderr).toMatch(/^strict-lint init: Unknown option '--overwrite'/);
  });

  it('reports a positional argument to init as a usage error, exiting 2', () => {
    using tree = makeTree();

    const { status, stderr } = runCli(tree.dir, ['init', 'extra']);

    expect(status).toBe(2);
    expect(stderr.trim()).toBe('strict-lint init: takes no positional arguments, got "extra"');
  });
});

// region | Helpers

/** Installs a stand-in for the published package, so that the scaffolded config's import resolves without a build. */
function installStubPackage(tree: TempTree): void {
  const packageDir = 'node_modules/@williamthorsen/strict-lint';
  const manifest = {
    exports: { './config': './defineConfig.js' },
    name: '@williamthorsen/strict-lint',
    type: 'module',
  };
  tree.writeAll({
    [`${packageDir}/defineConfig.js`]: 'export function defineConfig(config) {\n  return config;\n}\n',
    [`${packageDir}/package.json`]: JSON.stringify(manifest),
  });
}

/** Creates a fresh temp tree with a project-root marker and any given files. */
function makeTree(files: Record<string, string> = {}): TempTree {
  return createTempTree({ [ROOT_MARKER]: '', ...files }, { prefix: 'strict-lint-init-' });
}

// endregion | Helpers
