import eslint from '@eslint/js';
import globals from 'globals';
import tseslint, { type Config } from 'typescript-eslint';

import configs from './configs/index.js';

const javaScriptFiles = ['**/*.{js,cjs,mjs,jsx}'];

const typeScriptFiles = ['**/*.{ts,cts,mts,tsx}'];

const codeFiles = [...javaScriptFiles, ...typeScriptFiles];

const config: Config = [
  ...tseslint.config({
    files: typeScriptFiles,
    // prettier-ignore
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      configs.typeScript,
    ],
  }),
  {
    files: ['**/*.d.ts'],
    rules: {
      'import/no-duplicates': 'off',
    },
  },
  ...tseslint.config({
    files: javaScriptFiles,
    // prettier-ignore
    extends: [
      configs.javaScript,
    ],
  }),
  ...tseslint.config({
    files: codeFiles,
    // prettier-ignore
    extends: [
      configs.eslintComments,
      configs.n,
      configs.simpleImportSort,
      configs.unicorn,
    ],
  }),
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: globals.commonjs,
    },
  },
  configs.json,
  configs.json5, // Apply this after the `json` config, because it replaces some general JSON rules with JSON5 rules!
  configs.packageJson,
  configs.yaml,
];

export default config;
