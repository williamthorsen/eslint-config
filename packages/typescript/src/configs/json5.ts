import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import jsoncPlugin from 'eslint-plugin-jsonc';

const rules: Linter.RulesRecord = {
  // These are disabled because Prettier handles formatting.
  'jsonc/array-element-newline': 'off',
  'jsonc/comma-dangle': 'off',
  'jsonc/object-curly-newline': 'off',
  'jsonc/quote-props': 'off',
  'jsonc/quotes': 'off',
  // The `json` config's `recommended-with-jsonc` enables these, and they reject syntax that JSON5 permits.
  'jsonc/no-floating-decimal': 'off',
  'jsonc/no-hexadecimal-numeric-literals': 'off',
  'jsonc/no-infinity': 'off',
  'jsonc/no-multi-str': 'off',
  'jsonc/no-nan': 'off',
  'jsonc/no-plus-sign': 'off',
  'jsonc/valid-json-number': 'off',
};

// Composed after the `json` config, whose rules it overrides on JSON5 files.
export const json5Config = defineConfig({
  files: ['**/*.json5'],
  language: 'jsonc/x',
  plugins: {
    jsonc: jsoncPlugin,
  },
  rules: rules,
});
