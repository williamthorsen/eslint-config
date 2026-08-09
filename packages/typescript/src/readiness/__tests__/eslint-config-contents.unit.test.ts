import { describe, expect, it } from 'vitest';

import { declaresParserProject, importsFromDir, setsTsconfigRootDir } from '../eslint-config-contents.ts';

describe(declaresParserProject, () => {
  it('is true when parserOptions declares project', () => {
    const content = `export default [{ languageOptions: { parserOptions: { project: './tsconfig.json' } } }];`;

    expect(declaresParserProject(content)).toBe(true);
  });

  it('is true when project sits beside other parserOptions keys', () => {
    const content = `parserOptions: {
      tsconfigRootDir: import.meta.dirname,
      project: ['./tsconfig.json'],
    }`;

    expect(declaresParserProject(content)).toBe(true);
  });

  // An import resolver's `project` key is a different setting that the projectService form does not forbid.
  it('is false for a project key outside parserOptions', () => {
    const content = `settings: { 'import/resolver': { typescript: { project: './tsconfig.json' } } }`;

    expect(declaresParserProject(content)).toBe(false);
  });

  it('is false when parserOptions declares only the anchoring key', () => {
    const content = `parserOptions: { tsconfigRootDir: import.meta.dirname }`;

    expect(declaresParserProject(content)).toBe(false);
  });

  it('reads past a nested object to a later key in the same block', () => {
    const content = `parserOptions: { ecmaFeatures: { jsx: true }, project: './tsconfig.json' }`;

    expect(declaresParserProject(content)).toBe(true);
  });

  // The brace counter reads braces inside strings and comments as structure, so an unbalanced count
  // is reachable from a valid config; matching the rest of the file would report a project key that
  // is not in parserOptions at all.
  it('is false when the parserOptions block never closes', () => {
    const content = `parserOptions: { ecmaVersion: 'latest'
      settings: { 'import/resolver': { typescript: { project: './tsconfig.json' } } }`;

    expect(declaresParserProject(content)).toBe(false);
  });

  it('finds the declaration in a second parserOptions block', () => {
    const content = `parserOptions: { ecmaVersion: 'latest' }
      parserOptions: { project: './tsconfig.json' }`;

    expect(declaresParserProject(content)).toBe(true);
  });
});

describe(importsFromDir, () => {
  it('matches a default-with-named import reaching into the directory', () => {
    const content = `import baseConfig, { createConfig } from './packages/typescript/src/index.ts';`;

    expect(importsFromDir(content, 'packages/typescript')).toBe(true);
  });

  it('matches a named-only import reaching into the directory', () => {
    const content = `import { commonIgnores } from './packages/typescript/src/ignores/index.ts';`;

    expect(importsFromDir(content, 'packages/typescript')).toBe(true);
  });

  it('matches a side-effect import of the directory itself', () => {
    expect(importsFromDir(`import './packages/typescript';`, 'packages/typescript')).toBe(true);
  });

  it('matches a dynamic import', () => {
    expect(importsFromDir(`await import('./packages/typescript/src/index.ts');`, 'packages/typescript')).toBe(true);
  });

  it('matches a require call', () => {
    expect(importsFromDir(`require('./packages/typescript/src/index.ts');`, 'packages/typescript')).toBe(true);
  });

  // Without a separator, the shorter directory name is a prefix of the longer one.
  it('is false for a directory the specifier merely starts with', () => {
    const content = `import config from './packages/typescript-utils/src/index.ts';`;

    expect(importsFromDir(content, 'packages/typescript')).toBe(false);
  });

  // Specifiers resolve against the repo root, above which no workspace can sit.
  it('is false for a specifier reaching above the repo root', () => {
    const content = `import config from '../packages/typescript/src/index.ts';`;

    expect(importsFromDir(content, 'packages/typescript')).toBe(false);
  });

  it('is false for a bare package specifier', () => {
    const content = `import config from '@williamthorsen/eslint-config-typescript';`;

    expect(importsFromDir(content, 'packages/typescript')).toBe(false);
  });
});

describe(setsTsconfigRootDir, () => {
  it('is true when a config anchors the project service', () => {
    expect(setsTsconfigRootDir(`parserOptions: { tsconfigRootDir: import.meta.dirname }`)).toBe(true);
  });

  it('is false when no config key anchors it', () => {
    expect(setsTsconfigRootDir(`parserOptions: { ecmaVersion: 'latest' }`)).toBe(false);
  });
});
