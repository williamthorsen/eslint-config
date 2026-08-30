import { type Config, defineConfig } from 'eslint/config';
import globals from 'globals';

import { configs } from './configs/configs.ts';
import { codeFiles, javaScriptFiles, testFiles, typeScriptFiles } from './patterns.ts';

export const baseConfig: Config[] = [
  ...defineConfig({
    files: typeScriptFiles,
    extends: [
      configs.javaScript, //
      configs.typeScript,
    ],
  }),
  ...defineConfig({
    files: javaScriptFiles,
    extends: [
      configs.javaScript, //
    ],
  }),
  ...defineConfig({
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
    files: testFiles,
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
  ...configs.json,
  ...configs.json5, // Apply this after the `json` config, because it replaces some general JSON rules with JSON5 rules!
  ...configs.packageJson,
  ...configs.yaml,
];
