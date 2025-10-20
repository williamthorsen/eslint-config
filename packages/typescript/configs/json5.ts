import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import rawJsoncPlugin from 'eslint-plugin-jsonc';
import jsonParser from 'jsonc-eslint-parser';

import { getSafeLinterPlugin } from '../utils/isLinterPlugin.ts';

const jsoncPlugin = getSafeLinterPlugin(rawJsoncPlugin);

const rules: Linter.RulesRecord = {
  // These are disabled because Prettier handles formatting.
  'jsonc/array-element-newline': 'off',
  'jsonc/comma-dangle': 'off',
  'jsonc/no-missing-comma': 'off',
  'jsonc/object-curly-newline': 'off',
  'jsonc/quote-props': 'off',
  'jsonc/quotes': 'off',
};

// Use this config after the `json` config, because it overwrites some rules

const config = defineConfig({
  files: ['**/*.json5'],
  languageOptions: {
    parser: jsonParser,
  },
  plugins: {
    jsonc: jsoncPlugin,
  },
  rules: rules,
});

export default config;
