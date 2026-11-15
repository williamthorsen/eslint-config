import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import yamlPlugin from 'eslint-plugin-yml';

const rules: Linter.RulesRecord = {
  'yml/quotes': ['error', { prefer: 'single', avoidEscape: true }],
  'yml/no-empty-document': 'off',
  // GitHub Actions declares a trigger without options as a key with an empty value (`workflow_dispatch:`).
  'yml/no-empty-mapping-value': 'off',
  'spaced-comment': 'off',
};

export const yamlConfig = defineConfig({
  files: ['**/*.{yaml,yml}'],
  extends: [yamlPlugin.configs.recommended],
  rules,
});
