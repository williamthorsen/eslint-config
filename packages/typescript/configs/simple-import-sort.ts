import type { Linter } from 'eslint';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';

const rules: Linter.RulesRecord = {
  'simple-import-sort/exports': 'warn',
  'simple-import-sort/imports': ['warn', {
    groups: [
      ['^node:'], // built-ins
      ['^@?\\w'], // packages
      ['^\\u0000"'], // side-effect imports
      // absolute internal imports
      // TODO: Inject package aliases via `config.settings`
      // [`^(${packageAliases.join('|')})(/.*|$)`],
      // relative internal imports
      ['^\\.'],
      ['^\\u0020*(?:\\u0020*import|\\u0020*export)'],
      ['^[^.]'], // scss imports
    ],
  }],
};

export default {
  plugins: {
    'simple-import-sort': simpleImportSortPlugin,
  },
  rules,
};
