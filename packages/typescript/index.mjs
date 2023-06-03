/* eslint-disable object-property-newline */

// This configuration file uses the new flat syntax.
// See https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new

import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
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
import eslintCommentsRules from './rules/eslint-comments.js';
import jsRules from './rules/javascript.js';
import nRules from './rules/n.js';
import simpleImportSortRules from './rules/simple-import-sort.js';
import tsRules from './rules/typescript.js';
import unicornRules from './rules/unicorn.js';

const javaScriptFiles = ['**/*.cjs', '**/*.mjs', '**/*.js', '**/*.jsx'];
const typeScriptFiles = ['**/*.cts', '**/*.mts', '**/*.ts', '**/*.tsx'];

const pluginRules = {
  ...eslintCommentsPlugin.configs.recommended.rules,
  ...nRules,
  ...simpleImportSortRules,
  ...unicornRules,
  'sort-imports': 'off',
  ...eslintCommentsRules,
};

export default [
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
    rules: jsRules,
  },
  // endregion

  // region JavaScript & TypeScript files
  {
    files: [...javaScriptFiles, ...typeScriptFiles],
    plugins: {
      'eslint-comments': eslintCommentsPlugin,
      'n': nPlugin,
      'promise': promisePlugin,
      'simple-import-sort': simpleImportSortPlugin,
      'unicorn': unicornPlugin,
    },
    rules: pluginRules,
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

  // region package.json
  {
    files: ['package.json'],
    languageOptions: {
      parser: jsonParser,
    },
    plugins: {
      jsonc: jsoncPlugin,
    },
    rules: {
      'jsonc/sort-keys': [
        'warn',
        {
          pathPattern: '^$',
          // Standard sort order from https://www.npmjs.com/package/format-package
          order: [
            'name',
            'version',
            'private',
            'description',
            'keywords',

            'engines',
            'os',
            'cpu',

            'homepage',
            'bugs',
            'repository',
            'funding', // Unlisted
            'license',

            'author',
            'contributors',
            'publisher', // Unlisted

            'type',
            'bin',
            'main',
            'exports',
            'types',
            'typesVersions',
            'module',
            'browser',
            'files',
            'directories',
            'workspaces',
            'config',
            'scripts',

            // Extension manifest; see https://code.visualstudio.com/api/references/extension-manifest
            'activationEvents',
            'badges',
            'categories',
            'contributes',
            'displayName',
            'extensionDependencies',
            'extensionKind',
            'extensionPack',
            'galleryBanner',
            'icon',
            'markdown',
            'qna',
            'preview',
            'sideEffects',

            // Dependencies
            'dependencies',
            'devDependencies',
            'optionalDependencies',
            'peerDependencies',
            'peerDependenciesMeta',
            'overrides',
            'resolutions',

            // Configurations
            'eslintConfig',
            'husky',
            'jsdelivr',
            'lint-staged',
            'man',
            'packageManager',
            'pnpm',
            'publishConfig',
            'simple-git-hooks',
            'unpkg',
          ],
        },
        {
          pathPattern: '^(?:dev|peer|optional|bundled)?[Dd]ependencies$',
          order: { type: 'asc' },
        },
        {
          pathPattern: '^exports.*$',
          order: [
            'types',
            'require',
            'import',
          ],
        },
      ],
    },
  },
  // endregion

  {
    files: ['**/*.d.ts'],
    rules: {
      'import/no-duplicates': 'off',
    },
  },

  // region TypeScript files
  {
    files: typeScriptFiles,
    languageOptions: {
      globals: {
        console: 'readonly',
        process: true,
      },
      parser: tsParser,
      parserOptions: {
        module: 'es2022',
        parser: '@typescript-eslint/parser',
        project: ['./tsconfig.json'],
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...jsRules,
      ...tsPlugin.configs.recommended.rules,
      ...tsRules,
      'sort-imports': 'off',
    },
  },
  // endregion

  // region Scripts
  {
    files: ['scripts/**/*.*'],
    rules: {
      'no-console': 'off',
    },
  },
  // endregion

  // region Test files
  {
    files: ['**/*.test.js'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  // endregion

  // region Common ignores
  {
    ignores: [
      ...commonIgnores,
      // Hidden files and directories are ignored by default, so they need to be explicitly unignored to be linted
      '!.github/',
      '!.*.cjs',
      '!.*.mjs',
      '!.vscode',
    ],
  },
  // endregion
];
