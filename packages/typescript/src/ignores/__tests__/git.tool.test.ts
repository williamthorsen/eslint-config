import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { createTempTree, type TempTree } from '@williamthorsen/toolbelt.testing/candidate';
import { ESLint } from 'eslint';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildGitIgnores, gitIgnoresConfigName } from '../git.ts';

// Because `isPathIgnored` reports true for any path that no config block matches, every positive assertion below
// is paired with a negative, and the `files` block claims each extension queried.

describe(buildGitIgnores, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ignores a path matched by the root .gitignore', async () => {
    using tree = createRepo({ '.gitignore': 'generated/\n', 'generated/out.ts': '', 'src/main.ts': '' });

    const linter = buildLinter(tree.dir);

    await expect(linter.isPathIgnored('generated/out.ts')).resolves.toBe(true);
    await expect(linter.isPathIgnored('src/main.ts')).resolves.toBe(false);
  });

  it('ignores a path matched by a nested .gitignore', async () => {
    using tree = createRepo({
      'supabase/.gitignore': '.temp\n',
      'supabase/.temp/linked-project.json': '{}',
      'supabase/config.json': '{}',
    });

    const linter = buildLinter(tree.dir);

    await expect(linter.isPathIgnored('supabase/.temp/linked-project.json')).resolves.toBe(true);
    await expect(linter.isPathIgnored('supabase/config.json')).resolves.toBe(false);
  });

  it('ignores a path matched by .git/info/exclude', async () => {
    using tree = createRepo({ 'scratch.ts': '', 'src/main.ts': '' }, (repo) => {
      repo.write('.git/info/exclude', 'scratch.ts\n');
    });

    const linter = buildLinter(tree.dir);

    await expect(linter.isPathIgnored('scratch.ts')).resolves.toBe(true);
    await expect(linter.isPathIgnored('src/main.ts')).resolves.toBe(false);
  });

  it('ignores a path matched by core.excludesFile', async () => {
    // The test setup pins `core.excludesFile` through `GIT_CONFIG_COUNT`, which outranks every config file.
    using tree = createRepo({ '.playwright-mcp/page.yml': '', 'config.yml': '' }, (repo) => {
      const excludesFile = repo.write('.git/global-excludes', '.playwright-mcp/\n');
      vi.stubEnv('GIT_CONFIG_COUNT', '0');
      vi.stubEnv('GIT_CONFIG_GLOBAL', repo.write('.git/global-config', `[core]\n\texcludesFile = ${excludesFile}\n`));
    });

    const linter = buildLinter(tree.dir);

    await expect(linter.isPathIgnored('.playwright-mcp/page.yml')).resolves.toBe(true);
    await expect(linter.isPathIgnored('config.yml')).resolves.toBe(false);
  });

  it('resolves the block against the repository root when run from a nested directory', async () => {
    using tree = createRepo({ '.gitignore': 'generated/\n', 'generated/out.ts': '', 'packages/app/main.ts': '' });
    const nestedDir = tree.resolve('packages/app');

    const [block] = buildGitIgnores(nestedDir);
    expect(block?.basePath).toBe(tree.dir);

    const linter = buildLinter(nestedDir);
    await expect(linter.isPathIgnored(tree.resolve('generated/out.ts'))).resolves.toBe(true);
    await expect(linter.isPathIgnored('main.ts')).resolves.toBe(false);
  });

  it('names the block', () => {
    using tree = createRepo({ '.gitignore': 'generated/\n', 'generated/out.ts': '' });

    expect(buildGitIgnores(tree.dir)).toStrictEqual([
      { name: gitIgnoresConfigName, basePath: tree.dir, ignores: ['generated/'] },
    ]);
  });

  it('lints a tracked file that an ignore pattern matches', async () => {
    using tree = createRepo({ '.gitignore': '*.gen.ts\n', 'kept.gen.ts': '', 'dropped.gen.ts': '' });
    git(tree.dir, 'add', '--force', 'kept.gen.ts');

    const linter = buildLinter(tree.dir);

    await expect(linter.isPathIgnored('dropped.gen.ts')).resolves.toBe(true);
    await expect(linter.isPathIgnored('kept.gen.ts')).resolves.toBe(false);
  });

  // Each sibling matches the unescaped name read as a glob, so it is linted only if the name is matched literally.
  it.each([
    ['[ab].ts', 'a.ts'],
    ['{a,b}.ts', 'a.ts'],
    ['*.ts', 'other.ts'],
    ['?.ts', 'x.ts'],
    ['@(a).ts', 'a.ts'],
    ['!(a).ts', 'b.ts'],
    ['+(a).ts', 'aa.ts'],
    [String.raw`back\slash.ts`, 'backslash.ts'],
  ])('ignores %s literally and lints %s', async (ignoredName, siblingName) => {
    using tree = createRepo({
      '.gitignore': `${escapeGitignore(ignoredName)}\n`,
      [ignoredName]: '',
      [siblingName]: '',
    });

    const linter = buildLinter(tree.dir);

    await expect(linter.isPathIgnored(ignoredName)).resolves.toBe(true);
    await expect(linter.isPathIgnored(siblingName)).resolves.toBe(false);
  });

  // A leading `#` would read as a comment and a leading `!` as a negation, each dropping the pattern.
  it.each([['#hash.ts'], ['!bang.ts']])('ignores %s, whose first character is pattern syntax', async (ignoredName) => {
    using tree = createRepo({
      '.gitignore': `${escapeGitignore(ignoredName)}\n`,
      [ignoredName]: '',
      'src/main.ts': '',
    });

    const linter = buildLinter(tree.dir);

    await expect(linter.isPathIgnored(ignoredName)).resolves.toBe(true);
    await expect(linter.isPathIgnored('src/main.ts')).resolves.toBe(false);
  });

  it('returns no block outside a repository', () => {
    using tree = createTempTree({ '.gitignore': 'generated/\n', 'generated/out.ts': '' });
    vi.stubEnv('GIT_CEILING_DIRECTORIES', path.dirname(tree.dir));

    expect(buildGitIgnores(tree.dir)).toStrictEqual([]);
  });

  it('returns no block when git cannot be spawned', () => {
    using tree = createRepo({ '.gitignore': 'generated/\n', 'generated/out.ts': '' });
    vi.stubEnv('PATH', tree.resolve('no-such-bin'));

    expect(buildGitIgnores(tree.dir)).toStrictEqual([]);
  });

  it('returns no block when git ignores nothing', () => {
    using tree = createRepo({ 'src/main.ts': '' });

    expect(buildGitIgnores(tree.dir)).toStrictEqual([]);
  });
});

// region | Helpers

/** Builds an ESLint whose only configuration is the git-ignores block for `cwd` and a block claiming every probed file. */
function buildLinter(cwd: string): ESLint {
  return new ESLint({
    cwd,
    overrideConfig: [...buildGitIgnores(cwd), { files: ['**/*.{json,ts,yml}'] }],
    overrideConfigFile: true,
  });
}

/**
 * Creates a temp tree, initializes a repository in it, applies `configure`, and stages every file that git then does
 * not ignore.
 */
function createRepo(entries: Record<string, string>, configure?: (tree: TempTree) => void): TempTree {
  const tree = createTempTree(entries);
  git(tree.dir, 'init', '--quiet');
  configure?.(tree);
  git(tree.dir, 'add', '--all');
  return tree;
}

/** Escapes a filename so that a .gitignore line matches it literally. */
function escapeGitignore(name: string): string {
  return name.replaceAll(/[!#*?[\\]/g, String.raw`\$&`);
}

/** Runs git in `dir`. */
function git(dir: string, ...args: string[]): void {
  execFileSync('git', ['-C', dir, ...args]);
}

// endregion | Helpers
