import { describe, expect, it } from 'vitest';

import {
  ESLINT_CONFIG_BASENAMES,
  isTypeScriptEslintConfig,
  listAncestorDirs,
  listEslintConfigCandidates,
  listShadowedEslintConfigDirs,
  resolveDirPath,
} from '../eslint-config-paths.ts';

describe('ESLINT_CONFIG_BASENAMES', () => {
  // The order is the loader's resolution order, which is what makes a shadowed config inert.
  it('lists every JavaScript basename ahead of every TypeScript one', () => {
    const firstTypeScript = ESLINT_CONFIG_BASENAMES.findIndex(isTypeScriptEslintConfig);
    const lastJavaScript = ESLINT_CONFIG_BASENAMES.findLastIndex((basename) => !isTypeScriptEslintConfig(basename));

    expect(lastJavaScript).toBeLessThan(firstTypeScript);
  });
});

describe(isTypeScriptEslintConfig, () => {
  it('is true for every TypeScript basename the loader resolves', () => {
    expect(isTypeScriptEslintConfig('eslint.config.ts')).toBe(true);
    expect(isTypeScriptEslintConfig('eslint.config.mts')).toBe(true);
    expect(isTypeScriptEslintConfig('eslint.config.cts')).toBe(true);
  });

  it('is false for every JavaScript basename', () => {
    expect(isTypeScriptEslintConfig('eslint.config.js')).toBe(false);
    expect(isTypeScriptEslintConfig('eslint.config.mjs')).toBe(false);
    expect(isTypeScriptEslintConfig('eslint.config.cjs')).toBe(false);
  });

  it('classifies by the full path, so a directory name does not decide it', () => {
    expect(isTypeScriptEslintConfig('packages/ts/eslint.config.js')).toBe(false);
    expect(isTypeScriptEslintConfig('packages/js/eslint.config.ts')).toBe(true);
  });
});

describe(listAncestorDirs, () => {
  it('lists a nested directory and every ancestor, nearest first', () => {
    expect(listAncestorDirs('packages/a/b')).toStrictEqual(['packages/a/b', 'packages/a', 'packages', '.']);
  });

  it('lists the repo root alone', () => {
    expect(listAncestorDirs('.')).toStrictEqual(['.']);
  });

  it('lists a top-level directory and the root', () => {
    expect(listAncestorDirs('packages')).toStrictEqual(['packages', '.']);
  });
});

describe(listEslintConfigCandidates, () => {
  it('pairs every basename with every directory', () => {
    const candidates = listEslintConfigCandidates(['.', 'packages/react']);

    expect(candidates).toHaveLength(ESLINT_CONFIG_BASENAMES.length * 2);
    expect(candidates).toContain('eslint.config.ts');
    expect(candidates).toContain('packages/react/eslint.config.mjs');
  });

  it('returns nothing when there are no directories to search', () => {
    expect(listEslintConfigCandidates([])).toStrictEqual([]);
  });
});

describe(listShadowedEslintConfigDirs, () => {
  it('names a directory holding both a JavaScript and a TypeScript config', () => {
    expect(listShadowedEslintConfigDirs(['eslint.config.js', 'eslint.config.ts'])).toStrictEqual(['.']);
  });

  it('names a workspace directory by its path', () => {
    const paths = ['packages/react/eslint.config.js', 'packages/react/eslint.config.ts'];

    expect(listShadowedEslintConfigDirs(paths)).toStrictEqual(['packages/react']);
  });

  // A JavaScript config in one directory does not shadow a TypeScript config in another.
  it('ignores configs of different kinds in different directories', () => {
    expect(listShadowedEslintConfigDirs(['eslint.config.js', 'packages/react/eslint.config.ts'])).toStrictEqual([]);
  });

  it('returns nothing when every directory holds one kind', () => {
    expect(listShadowedEslintConfigDirs(['eslint.config.ts', 'packages/react/eslint.config.mts'])).toStrictEqual([]);
  });
});

describe(resolveDirPath, () => {
  it('leaves a root-relative path bare', () => {
    expect(resolveDirPath('.', 'eslint.config.ts')).toBe('eslint.config.ts');
  });

  it('joins a workspace directory to the basename', () => {
    expect(resolveDirPath('packages/react', 'eslint.config.ts')).toBe('packages/react/eslint.config.ts');
  });
});
