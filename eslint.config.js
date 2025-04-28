import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import nPlugin from 'eslint-plugin-n';
import globals from 'globals';

import { commonIgnores } from './packages/typescript/dist/esm/ignores/index.js';
import baseConfig from './packages/typescript/dist/esm/index.js';

const javaScriptFiles = ['**/*.{cjs,js,jsx,mjs}'];
const typeScriptFiles = ['**/*.{cts,mts,ts,tsx}'];

const codeFiles = [...javaScriptFiles, ...typeScriptFiles];

const thisDirPath = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(thisDirPath, './package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const devModules = Object.keys(packageJson.devDependencies);

/** @type {import('typescript-eslint').Config} */
const config = [
  ...baseConfig,
  // Provide type information for type-checking rules
  {
    files: typeScriptFiles,
    languageOptions: {
      parserOptions: {
        // prettier-ignore
        project: [
          './tsconfig.eslint.json',
          './packages/*/tsconfig.eslint.json',
        ],
      },
    },
  },
  {
    files: codeFiles,
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 2022,
      },
    },
    plugins: { n: nPlugin },
    rules: {
      'n/no-extraneous-import': ['error', { allowModules: devModules }],
      'n/no-unsupported-features/es-syntax': [
        'error',
        {
          version: '>=18.19.0',
          ignores: [],
        },
      ],
    },
  },
  {
    files: ['**/scripts/**/*'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: commonIgnores,
  },
];

export default config;
