import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import rawJsoncPlugin from 'eslint-plugin-jsonc';
import * as jsonParser from 'jsonc-eslint-parser';

import { getSafeLinterPlugin } from '../utils/isLinterPlugin.ts';

const jsoncPlugin = getSafeLinterPlugin(rawJsoncPlugin);

const rules: Linter.RulesRecord = {
  // These are disabled because Prettier handles formatting.
  'jsonc/array-element-newline': 'off',
  'jsonc/comma-dangle': 'off',
  'jsonc/object-curly-newline': 'off',
  'jsonc/quote-props': 'off',
  'jsonc/quotes': 'off',
};

// Composed after the `json` config, whose rules it overrides on JSON5 files.
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
