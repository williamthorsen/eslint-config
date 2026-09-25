import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

import baseConfig, { commonIgnores, createConfig, patterns, toolIgnores } from './packages/typescript/src/index.ts';

const javaScriptFiles = ['**/*.{cjs,js,jsx,mjs}'];
const typeScriptFiles = ['**/*.{cts,mts,ts,tsx}'];

const codeFiles = [...javaScriptFiles, ...typeScriptFiles];

const config = defineConfig([
  ...baseConfig,
  globalIgnores([
    ...commonIgnores,
    ...toolIgnores,
    // Lint fixtures violate the rules that they exercise.
    '**/__fixtures__/**',
  ]),
  // Anchor the base config's project service at the repo root.
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
      'n/no-unsupported-features/es-syntax': 'error',
    },
  },
  defineConfig({
    files: patterns.testFiles,
    // A `*.rules.*test.ts` file declares its cases as a table handed to `RuleTester.run()`, which generates the
    // `describe`/`it` blocks internally. The plugin parses no test call there, so its rules have nothing to act on
    // and `vitest/require-hook` reports the table itself as unhooked setup. The single `*` can span zero characters,
    // which lets one pattern cover the bare `*.rules.test.ts` form alongside a tiered `*.rules.tool.test.ts`.
    ignores: ['**/*.rules.*test.ts'],
    extends: [await createConfig.vitest()],
  }),
  {
    files: ['**/scripts/**/*'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Config files trip two rules meant for published source: Their `.js` import specifiers resolve only at runtime
    // (tsc still reports a missing import), and they compose config objects at module top level.
    files: ['*.config.{cjs,js,mjs,ts}', 'config/**'],
    rules: {
      'n/no-missing-import': 'off',
      'unicorn/no-top-level-side-effects': 'off',
    },
  },
]);

export default config;
