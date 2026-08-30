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
};

const config = defineConfig({
  plugins: {
    'import-x': importXPlugin,
  },
  rules,
});

export default config;
