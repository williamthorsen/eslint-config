import eslint from '@eslint/js';
import tseslint, { type Config } from 'typescript-eslint';

import configs from './configs/index.js';

const jsxFiles = ['**/*.jsx'];
const javaScriptFiles = ['**/*.{cjs,js,mjs}', ...jsxFiles];

const tsxFiles = ['**/*.{cts,mts,ts}'];
const typeScriptFiles = ['**/*.{cts,mts,ts}', ...tsxFiles];

const codeFiles = [...javaScriptFiles, ...typeScriptFiles];

// const pluginRules = {
//   ...unicornRules,
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
  ...tseslint.config({
    files: codeFiles,
    extends: [
      configs.eslintComments,
      configs.simpleImportSort,
    ],
  }),
];

export default config;
