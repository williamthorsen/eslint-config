import { describe, expect, it } from 'vitest';

import { declaresParserProject, setsTsconfigRootDir } from '../eslint-config-contents.ts';

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

describe(setsTsconfigRootDir, () => {
  it('is true when a config anchors the project service', () => {
    expect(setsTsconfigRootDir(`parserOptions: { tsconfigRootDir: import.meta.dirname }`)).toBe(true);
  });

  it('is false when no config key anchors it', () => {
    expect(setsTsconfigRootDir(`parserOptions: { ecmaVersion: 'latest' }`)).toBe(false);
  });
});
