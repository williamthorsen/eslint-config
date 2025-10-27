import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import rawYamlPlugin from 'eslint-plugin-yml';
import yamlParser from 'yaml-eslint-parser';

import { getSafeLinterPlugin } from '../utils/isLinterPlugin.ts';

const yamlPlugin = getSafeLinterPlugin(rawYamlPlugin);

const rules: Linter.RulesRecord = {
  'yml/quotes': ['error', { prefer: 'single', avoidEscape: true }],
  'yml/no-empty-document': 'off',
  'spaced-comment': 'off',
};

const config = defineConfig({
  files: ['**/*.{yaml,yml}'],
  languageOptions: {
    parser: yamlParser,
  },
  plugins: {
    yml: yamlPlugin,
  },
  rules: {
    ...yamlPlugin.configs.recommended?.rules,
    ...rules,
  },
});

export default config;
