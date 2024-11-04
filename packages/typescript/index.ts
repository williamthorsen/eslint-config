import eslint from '@eslint/js';
import tseslint, { type Config } from 'typescript-eslint';

import configs from './configs/index.js';

const jsxFiles = ['**/*.jsx'];
const javaScriptFiles = ['**/*.{cjs,js,mjs}', ...jsxFiles];

const tsxFiles = ['**/*.{cts,mts,ts}'];
const typeScriptFiles = ['**/*.{cts,mts,ts}', ...tsxFiles];

const codeFiles = [...javaScriptFiles, ...typeScriptFiles];

const config: Config = [
  ...tseslint.config({
    files: typeScriptFiles,
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
    ],
    ...configs.typeScript,
  }),
  {
    files: javaScriptFiles,
    ...configs.javaScript,
  },
  ...tseslint.config({
    files: codeFiles,
    extends: [
      configs.eslintComments,
      configs.n,
      configs.simpleImportSort,
      configs.unicorn,
    ],
  }),
  configs.packageJson,
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
];

export default config;
