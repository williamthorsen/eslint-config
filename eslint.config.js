import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import nPlugin from 'eslint-plugin-n';
import globals from 'globals';

import { commonIgnores } from './packages/typescript/dist/esm/ignores/common.js';
import config from './packages/typescript/dist/esm/index.mjs';

const javaScriptFiles = ['**/*.{cjs,js,jsx,mjs}'];
const typeScriptFiles = ['**/*.{cts,mts,ts,tsx}'];

const codeFiles = [...javaScriptFiles, ...typeScriptFiles];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, './package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const devModules = Object.keys(packageJson.devDependencies);

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    files: codeFiles,
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: codeFiles,
    plugins: {
      n: nPlugin,
    },
    rules: {
      'n/no-extraneous-import': ['error', { allowModules: devModules }],
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
