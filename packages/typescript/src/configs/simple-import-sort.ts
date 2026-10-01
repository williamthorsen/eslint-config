import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';

const rules: Linter.RulesRecord = {
  'sort-imports': 'off',
  'simple-import-sort/exports': 'warn',
  'simple-import-sort/imports': [
    'warn',
    {
      groups: [
        ['^node:'], // built-ins
        [String.raw`^@?\w`], // packages

        // absolute internal imports
        // Common aliases
        ['^@/'],
        ['^~'],
        ['^#'], // Node subpath imports
        // TODO: Inject package aliases via `config.settings`
        // [`^(${packageAliases.join('|')})(/.*|$)`],
        ['^'], // any other absolute import; a group that matches more characters takes precedence

        // relative internal imports
        [String.raw`^\.`],

        // Side-effect imports, which the plugin prefixes with a NUL character. They sort last and keep their source
        // order, so a stylesheet follows the modules whose styles it overrides.
        [String.raw`^\u0000`],
      ],
    },
  ],
};

const config = defineConfig({
  plugins: {
    'simple-import-sort': simpleImportSortPlugin,
  },
  rules,
});

export default config;
