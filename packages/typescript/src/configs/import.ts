import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';

const rules: Linter.RulesRecord = {
  'import/extensions': [
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
  'import/no-duplicates': ['warn', { 'prefer-inline': true }],
};

const config = defineConfig({
  plugins: {
    import: importPlugin,
  },
  rules,
});

export default config;
