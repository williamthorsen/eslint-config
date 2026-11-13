import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { createTempTree, pointCwdAt } from '@williamthorsen/toolbelt.testing/candidate';
import { ESLint } from 'eslint';
import type { Config } from 'eslint/config';
import { afterEach, assert, describe, expect, it, vi } from 'vitest';

import { fixText } from '#src/configs/test-utils/fixText.ts';

import { advisoryRuleSeverities } from '../advisoryRuleSeverities.ts';
import { baseConfig } from '../baseConfig.ts';
import { gitIgnoresConfigName } from '../ignores/git.ts';

describe('baseConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('skips a gitignored file and lints its tracked sibling in the repository of the working directory', async () => {
    using tree = createTempTree({ '.gitignore': 'generated/\n', 'generated/out.ts': '', 'src/main.ts': '' });
    execFileSync('git', ['-C', tree.dir, 'init', '--quiet']);
    execFileSync('git', ['-C', tree.dir, 'add', '--all']);
    using _cwd = pointCwdAt(tree.dir);

    const baseConfig = await importBaseConfig();

    expect(baseConfig.find((block) => block.name === gitIgnoresConfigName)?.basePath).toBe(tree.dir);

    const linter = new ESLint({ cwd: tree.dir, overrideConfig: baseConfig, overrideConfigFile: true });
    await expect(linter.isPathIgnored('generated/out.ts')).resolves.toBe(true);
    await expect(linter.isPathIgnored('src/main.ts')).resolves.toBe(false);
  });

  it('omits the git-ignores block outside a repository', async () => {
    using tree = createTempTree({ 'src/main.ts': '' });
    vi.stubEnv('GIT_CEILING_DIRECTORIES', path.dirname(tree.dir));
    using _cwd = pointCwdAt(tree.dir);

    const baseConfig = await importBaseConfig();

    expect(baseConfig.map((block) => block.name)).not.toContain(gitIgnoresConfigName);
  });

  it.each([
    ['src/main.ts', 300],
    ['src/main.js', 300],
    ['src/__tests__/main.unit.test.ts', 500],
    ['src/__tests__/main.test.js', 500],
  ])('caps %s at %i counted lines', async (filePath, max) => {
    const linter = new ESLint({ overrideConfig: baseConfig, overrideConfigFile: true });

    const config: unknown = await linter.calculateConfigForFile(filePath);

    expect(config).toHaveProperty(['rules', 'max-lines'], [1, { max, skipBlankLines: true, skipComments: true }]);
  });

  it.each([
    ['src/main.ts', 2],
    ['src/main.js', 2],
    ['src/__tests__/main.unit.test.ts', 0],
    ['src/__tests__/main.test.js', 0],
  ])('sets unicorn/no-unnecessary-parameters in %s to severity %i', async (filePath, severity) => {
    const linter = new ESLint({ overrideConfig: baseConfig, overrideConfigFile: true });

    const config: unknown = await linter.calculateConfigForFile(filePath);

    expect(config).toHaveProperty(['rules', 'unicorn/no-unnecessary-parameters', 0], severity);
  });

  it.each(['src/__tests__/main.unit.test.ts', 'src/__tests__/main.test.js'])(
    'warns on sky-pilot/no-real-time-sleep in %s and keeps no-restricted-syntax',
    async (filePath) => {
      const linter = new ESLint({ overrideConfig: baseConfig, overrideConfigFile: true });

      const config: unknown = await linter.calculateConfigForFile(filePath);

      expect(config).toHaveProperty(['rules', 'sky-pilot/no-real-time-sleep', 0], 1);
      expect(config).toHaveProperty(
        ['rules', 'no-restricted-syntax'],
        [
          2,
          'DebuggerStatement',
          'LabeledStatement',
          'WithStatement',
          expect.objectContaining({ selector: expect.stringContaining('ConditionalExpression') }),
        ],
      );
    },
  );

  it.each([
    ['main.ts', 'const message = error instanceof Error ? error.message : String(error);\n'],
    ['main.js', 'const message = error instanceof Error ? error.message : String(error);\n'],
    ['main.ts', 'const message =\n  error instanceof Error\n    ? error.message\n    : String(error);\n'],
  ])('reports the inline error-message ternary in %s', async (fileName, code) => {
    await expect(listRuleIds(fileName, code)).resolves.toContain('no-restricted-syntax');
  });

  it.each([
    "const message = error instanceof Error ? error.message : 'Request failed';\n",
    'const cause = error instanceof Error ? error : new Error(String(error));\n',
  ])('allows an error ternary with another fallback: %s', async (code) => {
    await expect(listRuleIds('main.ts', code)).resolves.not.toContain('no-restricted-syntax');
  });

  it.each(['src/main.ts', 'src/main.js'])('leaves sky-pilot/no-real-time-sleep unset in %s', async (filePath) => {
    const linter = new ESLint({ overrideConfig: baseConfig, overrideConfigFile: true });

    const config: unknown = await linter.calculateConfigForFile(filePath);

    expect(config).not.toHaveProperty(['rules', 'sky-pilot/no-real-time-sleep']);
  });

  it('reports a real-time sleep in a JavaScript test file', async () => {
    const linter = new ESLint({ overrideConfig: baseConfig, overrideConfigFile: true });

    const [result] = await linter.lintText('await new Promise((resolve) => setTimeout(resolve, 100));\n', {
      filePath: 'src/__tests__/main.test.js',
    });

    expect(result?.messages.map((message) => message.ruleId)).toContain('sky-pilot/no-real-time-sleep');
  });

  it('keeps the ceiling when advisoryRuleSeverities sets the severity', async () => {
    const linter = new ESLint({
      overrideConfig: [...baseConfig, { rules: { ...advisoryRuleSeverities } }],
      overrideConfigFile: true,
    });

    const config: unknown = await linter.calculateConfigForFile('src/main.ts');

    expect(config).toHaveProperty(['rules', 'max-lines'], [1, { max: 300, skipBlankLines: true, skipComments: true }]);
  });
});

// region | Helpers

/** Evaluates `baseConfig.ts` afresh, so that its git-ignores block reflects the current `process.cwd()`. */
async function importBaseConfig(): Promise<Config[]> {
  vi.resetModules();
  const { baseConfig } = await import('../baseConfig.ts');
  return baseConfig;
}

/** Lints `code` under the base config as `fileName` in the fixtures directory and lists the rule ID of each message. */
async function listRuleIds(fileName: string, code: string): Promise<Array<string | null>> {
  const { messages } = await fixText(baseConfig, fileName, code);
  // A parse failure reports nothing else, which would let a case that expects no report pass without linting.
  assert.isFalse(
    messages.some((message) => message.fatal),
    `${fileName} failed to parse`,
  );
  return messages.map((message) => message.ruleId);
}

// endregion | Helpers
