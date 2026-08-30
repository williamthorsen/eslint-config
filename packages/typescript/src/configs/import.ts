import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import importXPlugin from 'eslint-plugin-import-x';

const rules: Linter.RulesRecord = {
  'import-x/extensions': [
    'error',
    'ignorePackages',
    {
      js: 'always',
      jsx: 'always',
      ts: 'always',
      tsx: 'always',
    },
  ],
  // `prefer-inline` merges a module's split type/value pair into one statement carrying an inline `type` specifier.
  'import-x/no-duplicates': ['warn', { 'prefer-inline': true }],
};

const config = defineConfig({
  plugins: {
    'import-x': importXPlugin,
  },
  rules,
});

export default config;
