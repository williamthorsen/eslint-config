// This configuration file uses the new flat syntax.
// See https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new

import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';
import jsoncPlugin from 'eslint-plugin-jsonc';
import markdownPlugin from 'eslint-plugin-markdown';
import nPlugin from 'eslint-plugin-n';
import promisePlugin from 'eslint-plugin-promise';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import unicornPlugin from 'eslint-plugin-unicorn';
import yamlPlugin from 'eslint-plugin-yml';
import jsonParser from 'jsonc-eslint-parser';
import yamlParser from 'yaml-eslint-parser';

import commonIgnores from './ignores/common.js';
import jsPlugins from './jsPlugins.mjs';
import eslintCommentsRules from './rules/eslint-comments.js';
import jsRules from './rules/javascript.js';
import nRules from './rules/n.js';
import packageJsonrules from './rules/packageJson.js';
import simpleImportSortRules from './rules/simple-import-sort.js';
import unicornRules from './rules/unicorn.js';

const javaScriptFiles = ['**/*.cjs', '**/*.mjs', '**/*.js', '**/*.jsx'];

const pluginRules = {
  ...eslintCommentsPlugin.configs.recommended.rules,
  ...eslintCommentsRules,
  ...nRules,
  ...simpleImportSortRules,
  ...unicornRules,
  'sort-imports': 'off',
};

/**
 * @type {import('eslint').Linter.FlatConfig[]}
 */
const config  = [
  // region JavaScript files
  {
    files: javaScriptFiles,
    ignores: [
      '!.*.cjs',
      '!.*.mjs',
    ],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: true,
      },
    },
    plugins: {
      'eslint-comments': eslintCommentsPlugin,
      'n': nPlugin,
      'promise': promisePlugin,
      'simple-import-sort': simpleImportSortPlugin,
      'unicorn': unicornPlugin,
    },
    rules: {
      ...jsRules,
      ...pluginRules,
    },
  },
  // endregion

  // region JSON files
  {
    files: ['**/*.json', '**/*.json5'],
    languageOptions: {
      parser: jsonParser,
    },
    plugins: {
      jsonc: jsoncPlugin,
    },
    rules: {
      ...jsoncPlugin.rules['recommended-with-jsonc'],
      'jsonc/array-bracket-spacing': ['warn', 'never'],
      'jsonc/indent': ['warn', 2],
      'jsonc/key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'jsonc/no-octal-escape': 'error',
      'jsonc/object-curly-newline': ['error', { multiline: true, consistent: true }],
      'jsonc/object-curly-spacing': ['error', 'always'],
      'jsonc/object-property-newline': ['error', { allowMultiplePropertiesPerLine: true }],
      'comma-dangle': 'off',
      'quotes': 'off',
      'quote-props': 'off',
    },
  },
  // endregion

  // region JSON5 files
  {
    files: ['**/*.json5'],
    languageOptions: {
      parser: jsonParser,
    },
    plugins: {
      jsonc: jsoncPlugin,
    },
    rules: {
      // TODO: Enable these rules
      // 'plugin:jsonc/recommended-with-jsonc',
      'jsonc/comma-dangle': ['warn', 'always'],
      'jsonc/comma-style': ['error', 'last'],
    },
  },
  // endregion

  // region YAML files
  {
    files: ['**/*.yaml', '**/*.yml'],
    ignores: [
      '!.github/**/*.yml',
    ],
    languageOptions: {
      parser: yamlParser,
    },
    plugins: {
      yml: yamlPlugin,
    },
    rules: {
      ...yamlPlugin.rules.recommended,
      'yml/quotes': ['error', { prefer: 'single', avoidEscape: true }],
      'yml/no-empty-document': 'off',
      'spaced-comment': 'off',
    },
  },
  // endregion

  // region Markdown files
  {
    files: ['**/*.md'],
    plugins: {
      markdown: markdownPlugin,
    },
    processor: 'markdown/markdown',
    rules: {
      'no-alert': 'error',
      'no-console': 'off',
      'no-restricted-imports': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',

      '@typescript-eslint/no-redeclare': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/comma-dangle': 'off',
    },
  },
  // endregion

  // region --- YAML files
  {
    files: ['**/*.yaml', '**/*.yml'],
    ignores: [
      '!.github/**/*.yml',
    ],
    languageOptions: {
      parser: yamlParser,
    },
    plugins: {
      yml: yamlPlugin,
    },
    rules: {
      ...yamlPlugin.rules.recommended,
      'yml/quotes': ['error', { prefer: 'single', avoidEscape: true }],
      'yml/no-empty-document': 'off',
      'spaced-comment': 'off',
    },
  },
  // endregion - YAML files

  // region package.json
  {
    files: ['package.json'],
    languageOptions: {
      parser: jsonParser,
    },
    plugins: {
      jsonc: jsoncPlugin,
    },
    rules: packageJsonrules,
  },
  // endregion

  // Disablements of rules must appear after the rules are enabled
  // region Scripts
  {
    files: ['**/scripts/**/*.*'],
    rules: {
      // This rule must appear after the JS rules, which enable the `no-console` rule.
      'no-console': 'off',
    },
  },
  // endregion

  // region --- Test files ---
  {
    files: ['**/*.test.js'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },
  // endregion - Test files

  // region --- All files ---
  {
    ignores: [
      ...commonIgnores,
      // Hidden files and directories are ignored by default, so they need to be explicitly unignored to be linted
      '!.github/',
      '!.*.cjs',
      '!.*.mjs',
      '!.vscode',
    ],
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
  // endregion - All files
];

export default config;
export { jsPlugins };
export { relativePathToDir } from './utils/relativePathToDir.js';
