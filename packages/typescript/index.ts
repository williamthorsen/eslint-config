import eslint from '@eslint/js';
import tseslint, { type Config } from 'typescript-eslint';

import simpleImportSortConfig from './configs/simple-import-sort.js';

const jsxFiles = ['**/*.jsx'];
const javaScriptFiles = ['**/*.{cjs,js,mjs}', ...jsxFiles];

const tsxFiles = ['**/*.{cts,mts,ts}'];
const typeScriptFiles = ['**/*.{cts,mts,ts}', ...tsxFiles];

const codeFiles = [...javaScriptFiles, ...typeScriptFiles];

// const pluginRules = {
//   ...simpleImportSortRules,
//   ...unicornRules,
//   ...eslintCommentsRules,
// };

const config: Config = [
  ...tseslint.config({
    files: typeScriptFiles,
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
    ],
  }),
  {
    files: [...javaScriptFiles],
    rules: eslint.configs.recommended.rules,
  },
  {
    files: codeFiles,
    ...simpleImportSortConfig,
  },
];

export default config;
