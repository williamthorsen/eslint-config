import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import rawJsoncPlugin from 'eslint-plugin-jsonc';
import * as jsonParser from 'jsonc-eslint-parser';

import { getSafeLinterPlugin } from '../utils/isLinterPlugin.ts';

const jsoncPlugin = getSafeLinterPlugin(rawJsoncPlugin);

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

const config = defineConfig({
  files: ['**/*.{json,json5}'],
  languageOptions: {
    parser: jsonParser,
  },
  plugins: {
    jsonc: jsoncPlugin,
  },
  rules: {
    ...jsoncPlugin.configs['recommended-with-jsonc']?.rules,
    ...rules,
  },
});

export default config;
