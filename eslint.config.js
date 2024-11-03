import globals from 'globals';

import { commonIgnores } from './packages/typescript/dist/esm/ignores/common.js';
import config from './packages/typescript/dist/esm/index.mjs';

const javaScriptFiles = ['**/*.{cjs,js,jsx,mjs}'];
const typeScriptFiles = ['**/*.{cts,mts,ts,tsx}'];

console.dir(config, { depth: null });

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
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
  {
    ignores: commonIgnores,
  },
];
