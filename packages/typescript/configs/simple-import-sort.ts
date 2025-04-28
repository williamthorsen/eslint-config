import type { Linter } from 'eslint';
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
        [String.raw`^\u0000"`], // side-effect imports

        // absolute internal imports
        // Common aliases
        ['^@/'],
        ['^~'],
        // TODO: Inject package aliases via `config.settings`
        // [`^(${packageAliases.join('|')})(/.*|$)`],

        // relative internal imports
        [String.raw`^\.`],
        [String.raw`^\u0020*(?:\u0020*import|\u0020*export)`],
        ['^[^.]'], // scss imports
      ],
    },
  ],
};

export default {
  plugins: {
    'simple-import-sort': simpleImportSortPlugin,
  },
  rules,
};
