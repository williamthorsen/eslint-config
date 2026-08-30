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
  // `import-x/no-duplicates` is deliberately absent: its fixer corrupts a default, side-effect, or type-only
  // statement in a same-module group. `sky-pilot/no-split-imports` merges the shapes it can and leaves the rest.
};

const config = defineConfig({
  plugins: {
    'import-x': importXPlugin,
  },
  rules,
});

export default config;
