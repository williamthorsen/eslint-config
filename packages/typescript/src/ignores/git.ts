import { spawnSync } from 'node:child_process';
import path from 'node:path';

import type { Config } from 'eslint/config';

export const gitIgnoresConfigName = '@williamthorsen/eslint-config-typescript/git-ignores';

/**
 * Builds a global-ignores block listing the untracked paths that git ignores in the repository containing `cwd`,
 * resolved against the repository root. Returns an empty array when git does not answer or ignores nothing.
 */
export function buildGitIgnores(cwd: string): Config[] {
  const root = findRepoRoot(cwd);
  if (root === undefined) return [];

  const ignoredPaths = listGitIgnoredPaths(root);
  if (ignoredPaths.length === 0) return [];

  return [
    {
      name: gitIgnoresConfigName,
      basePath: root,
      ignores: ignoredPaths.map((ignoredPath) => escapeGlob(ignoredPath)),
    },
  ];
}

// region | Helpers

/** Prefixes each character that minimatch or config-array treats as syntax with a backslash. */
function escapeGlob(literalPath: string): string {
  return literalPath.replaceAll(/[!#()*+?@[\\\]{}]/g, String.raw`\$&`);
}

/** Finds the root of the repository containing `cwd`, in the path form of `cwd` itself, or `undefined` outside one. */
function findRepoRoot(cwd: string): string | undefined {
  // `--show-toplevel` prints the realpath, under which a cwd reached through a symlink resolves nothing.
  const cdup = runGit(['rev-parse', '--show-cdup'], cwd);
  if (cdup === undefined) return undefined;

  return path.resolve(cwd, cdup.trim());
}

/**
 * Lists the untracked paths that git ignores under `root`, relative to it and `/`-separated, sorted. An ignored
 * directory is one entry ending in `/`; a tracked file never appears.
 */
function listGitIgnoredPaths(root: string): string[] {
  const result = runGit(
    ['ls-files', '-z', '--others', '--ignored', '--exclude-standard', '--directory', '--no-empty-directory'],
    root,
  );
  if (result === undefined) return [];

  return result
    .split('\0')
    .filter((entry) => entry !== '')
    .toSorted();
}

/** Runs git in `cwd` and returns its stdout, or `undefined` when git cannot be spawned or exits non-zero. */
function runGit(args: string[], cwd: string): string | undefined {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.error !== undefined || result.status !== 0) return undefined;
  return result.stdout;
}

// endregion | Helpers
