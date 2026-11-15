import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import jsoncPlugin from 'eslint-plugin-jsonc';

const rules: Linter.RulesRecord = {
  'jsonc/array-bracket-spacing': ['warn', 'never'],
  'jsonc/indent': ['warn', 2],
  'jsonc/key-spacing': ['error', { beforeColon: false, afterColon: true }],
  'jsonc/no-octal-escape': 'error',
  'jsonc/object-curly-newline': [
    'error',
    {
      multiline: true,
      consistent: true,
    },
  ],
  'jsonc/object-curly-spacing': ['error', 'always'],
  'jsonc/object-property-newline': [
    'error',
    {
      allowMultiplePropertiesPerLine: true,
    },
  ],
  'comma-dangle': 'off',
  quotes: 'off',
  'quote-props': 'off',
};

export const jsonConfig = defineConfig({
  files: ['**/*.{json,json5}'],
  ignores: ['**/package.json'],
  extends: [jsoncPlugin.configs['recommended-with-jsonc']],
  rules,
});
