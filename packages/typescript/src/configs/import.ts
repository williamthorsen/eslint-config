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
  // `import-x/no-duplicates` is deliberately absent: with `prefer-inline` its fixer writes unparseable text for
  // a default pair and folds a side-effect import into a type statement; without it a merge can flip a specifier
  // between type and value. `sky-pilot/no-split-imports` merges the shapes it can and leaves the rest.
};

const config = defineConfig({
  plugins: {
    'import-x': importXPlugin,
  },
  rules,
});

export default config;
