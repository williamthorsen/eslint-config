import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

import { commonIgnores } from './packages/typescript/src/ignores/index.ts';
import baseConfig from './packages/typescript/src/index.ts';

const javaScriptFiles = ['**/*.{cjs,js,jsx,mjs}'];
const typeScriptFiles = ['**/*.{cts,mts,ts,tsx}'];

const codeFiles = [...javaScriptFiles, ...typeScriptFiles];

const config = defineConfig([
  ...baseConfig,
  globalIgnores([
    // Completely ignore these files.
    ...commonIgnores,
    '**/__tests__/fixtures/**',
  ]),
  // Anchor the project service at the repo root for type-aware rules.
  // `projectService` itself is enabled by the base config; the consumer supplies only the root directory.
  {
    files: typeScriptFiles,
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: codeFiles,
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
      },
    },
    rules: {
      // `bin` names the compiled path; mapping the source to it makes the shebang here read as a bin's.
      // Keep on this rule: via `settings.n` it makes `n/no-unpublished-import` reject the opt-in plugins.
      'n/hashbang': ['error', { convertPath: { 'src/bin/**/*.ts': [String.raw`^src/(.+)\.ts$`, 'dist/esm/$1.js'] } }],
      'n/no-extraneous-import': ['error', { allowModules: ['vitest'] }],
      'n/no-unsupported-features/es-syntax': 'error',
    },
  },
  {
    files: ['**/scripts/**/*'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Build and config files legitimately trip rules meant for published source:
    // They use TypeScript `.js` import specifiers that resolve at runtime (tsc still reports missing imports) and
    // compose config objects at module top level.
    files: ['*.config.{cjs,js,mjs,ts}', 'config/**'],
    rules: {
      'n/no-missing-import': 'off',
      'unicorn/no-top-level-side-effects': 'off',
    },
  },
]);

export default config;
