import { describe, expect, it } from 'vitest';

import {
  dirPath,
  ESLINT_CONFIG_BASENAMES,
  eslintConfigCandidates,
  isTypeScriptEslintConfig,
  shadowedEslintConfigDirs,
} from '../eslint-config-paths.ts';

describe(dirPath, () => {
  it('leaves a root-relative path bare', () => {
    expect(dirPath('.', 'eslint.config.ts')).toBe('eslint.config.ts');
  });

  it('joins a workspace directory to the basename', () => {
    expect(dirPath('packages/react', 'eslint.config.ts')).toBe('packages/react/eslint.config.ts');
  });
});

describe('ESLINT_CONFIG_BASENAMES', () => {
  // The order is the loader's resolution order, which is what makes a shadowed config inert.
  it('lists every JavaScript basename ahead of every TypeScript one', () => {
    const firstTypeScript = ESLINT_CONFIG_BASENAMES.findIndex(isTypeScriptEslintConfig);
    const lastJavaScript = ESLINT_CONFIG_BASENAMES.findLastIndex((basename) => !isTypeScriptEslintConfig(basename));

    expect(lastJavaScript).toBeLessThan(firstTypeScript);
  });
});

describe(eslintConfigCandidates, () => {
  it('pairs every basename with every directory', () => {
    const candidates = eslintConfigCandidates(['.', 'packages/react']);

    expect(candidates).toHaveLength(ESLINT_CONFIG_BASENAMES.length * 2);
    expect(candidates).toContain('eslint.config.ts');
    expect(candidates).toContain('packages/react/eslint.config.mjs');
  });

  it('returns nothing when there are no directories to search', () => {
    expect(eslintConfigCandidates([])).toStrictEqual([]);
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

describe(shadowedEslintConfigDirs, () => {
  it('names a directory holding both a JavaScript and a TypeScript config', () => {
    expect(shadowedEslintConfigDirs(['eslint.config.js', 'eslint.config.ts'])).toStrictEqual(['.']);
  });

  it('names a workspace directory by its path', () => {
    const paths = ['packages/react/eslint.config.js', 'packages/react/eslint.config.ts'];

    expect(shadowedEslintConfigDirs(paths)).toStrictEqual(['packages/react']);
  });

  // A JavaScript config in one directory does not shadow a TypeScript config in another.
  it('ignores configs of different kinds in different directories', () => {
    expect(shadowedEslintConfigDirs(['eslint.config.js', 'packages/react/eslint.config.ts'])).toStrictEqual([]);
  });

  it('returns nothing when every directory holds one kind', () => {
    expect(shadowedEslintConfigDirs(['eslint.config.ts', 'packages/react/eslint.config.mts'])).toStrictEqual([]);
  });
});
