import globals from 'globals';

import tsConfig from './packages/typescript/dist/esm/index.mjs';

const javaScriptFiles = ['**/*.{cjs,js,jsx,mjs}'];
const typeScriptFiles = ['**/*.{cts,mts,ts,tsx}'];

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...tsConfig,
  {
    files: [...javaScriptFiles, ...typeScriptFiles],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.eslint.json',
          './packages/*/tsconfig.eslint.json',
        ],
      },
    },
  },
];
