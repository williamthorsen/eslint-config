import rawTsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import type { Linter } from 'eslint';
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';
import rawJsoncPlugin from 'eslint-plugin-jsonc';
import markdownPlugin from 'eslint-plugin-markdown';
import nPlugin from 'eslint-plugin-n';
import promisePlugin from 'eslint-plugin-promise';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import unicornPlugin from 'eslint-plugin-unicorn';
import rawYamlPlugin from 'eslint-plugin-yml';
import jsonParser from 'jsonc-eslint-parser';
import yamlParser from 'yaml-eslint-parser';

import { commonIgnores } from './ignores/index.js';
import {
  eslintCommentsRules,
  javaScriptRules,
  nRules,
  packageJsonRules,
  simpleImportSortRules,
  typeScriptRules,
  unicornRules,
} from './rules/index.js';
import { getSafeLinterPlugin } from './utils/isLinterPlugin.js';

const javaScriptFiles = ['**/*.cjs', '**/*.mjs', '**/*.js', '**/*.jsx'];
const typeScriptFiles = ['**/*.cts', '**/*.mts', '**/*.ts', '**/*.tsx'];

const jsoncPlugin = getSafeLinterPlugin(rawJsoncPlugin);
const tsPlugin = getSafeLinterPlugin(rawTsPlugin);
const yamlPlugin = getSafeLinterPlugin(rawYamlPlugin);

const pluginRules = {
  ...eslintCommentsPlugin.configs.recommended.rules,
  ...nRules,
  ...simpleImportSortRules,
  ...unicornRules,
  'sort-imports': 'off',
  ...eslintCommentsRules,
};

const config: Linter.Config[] = [
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
    rules: javaScriptRules,
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
      ...jsoncPlugin.configs['recommended-with-jsonc']?.rules,
      'jsonc/array-bracket-spacing': ['warn', 'never'],
      'jsonc/indent': ['warn', 2],
      'jsonc/key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'jsonc/no-octal-escape': 'error',
      'jsonc/object-curly-newline': ['error', {
        multiline: true,
        consistent: true,
      }],
      'jsonc/object-curly-spacing': ['error', 'always'],
      'jsonc/object-property-newline': ['error', {
        allowMultiplePropertiesPerLine: true,
      }],
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
      ...yamlPlugin.configs.recommended?.rules,
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
    rules: packageJsonRules,
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
      ...javaScriptRules,
      ...tsPlugin.configs.recommended?.rules,
      ...typeScriptRules,
      'sort-imports': 'off',
    },
  },
  // endregion

  // region Scripts
  {
    files: ['**/scripts/**/*.*'],
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

  // region --- All files ---
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
  {
    ignores: commonIgnores,
  },
  // endregion
];

export default config;

export { relativePathToDir } from './utils/relativePathToDir.js';
