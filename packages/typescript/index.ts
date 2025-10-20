import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import configs from './configs/index.js';

const javaScriptExtensions = ['{js,cjs,mjs,jsx}'];
const typeScriptExtensions = ['{ts,cts,mts,tsx}'];
const codeExtensions = [...javaScriptExtensions, ...typeScriptExtensions];

const javaScriptFiles = javaScriptExtensions.map((ext) => `**/*.${ext}`);
const typeScriptFiles = typeScriptExtensions.map((ext) => `**/*.${ext}`);
const codeFiles = codeExtensions.map((ext) => `**/*.${ext}`);

const config = [
  ...defineConfig({
    files: typeScriptFiles,
    extends: [
      configs.javaScript, //
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
    extends: [
      configs.javaScript, //
    ],
  }),
  ...tseslint.config({
    files: codeFiles,
    extends: [
      configs.eslintComments, //
      configs.import,
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
  // Test files
  {
    files: codeExtensions.map((ext) => `**/*.{spec,test}.${ext}`),
    rules: {
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'sky-pilot/prefer-function-declaration': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-thenable': 'off',
      'unicorn/no-useless-undefined': 'off',
    },
  },
  configs.json,
  configs.json5, // Apply this after the `json` config, because it replaces some general JSON rules with JSON5 rules!
  configs.packageJson,
  configs.yaml,
];

const patterns = {
  codeExtensions,
  codeFiles,
  javaScriptExtensions,
  javaScriptFiles,
  typeScriptExtensions,
  typeScriptFiles,
};

export { default as configs, createConfig } from './configs/index.js';
export { patterns };
export default config;
