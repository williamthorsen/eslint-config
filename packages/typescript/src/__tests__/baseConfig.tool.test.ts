import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { createTempTree, pointCwdAt } from '@williamthorsen/toolbelt.testing/candidate';
import { ESLint } from 'eslint';
import type { Config } from 'eslint/config';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
});

// region | Helpers

/** Evaluates `baseConfig.ts` afresh, so that its git-ignores block reflects the current `process.cwd()`. */
async function importBaseConfig(): Promise<Config[]> {
  vi.resetModules();
  const { baseConfig } = await import('../baseConfig.ts');
  return baseConfig;
}

// endregion | Helpers
