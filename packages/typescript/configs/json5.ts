import type { Linter } from 'eslint';
import rawJsoncPlugin from 'eslint-plugin-jsonc';
import jsonParser from 'jsonc-eslint-parser';

import { getSafeLinterPlugin } from '../utils/isLinterPlugin.js';

const jsoncPlugin = getSafeLinterPlugin(rawJsoncPlugin);

const rules: Linter.RulesRecord = {
  'jsonc/comma-dangle': ['warn', 'always'],
  'jsonc/comma-style': ['error', 'last'],
  'jsonc/quote-props': 'off',
};

// Use this config after the `json` config, because it overwrites some rules

const config: Linter.Config = {
  files: ['**/*.json5'],
  languageOptions: {
    parser: jsonParser,
  },
  plugins: {
    jsonc: jsoncPlugin,
  },
  rules: rules,
};

export default config;
