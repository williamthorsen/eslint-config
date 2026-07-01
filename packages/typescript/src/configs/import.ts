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
};

const config = defineConfig({
  plugins: {
    import: importPlugin,
  },
  rules,
});

export default config;
