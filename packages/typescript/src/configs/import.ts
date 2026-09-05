import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import importXPlugin from 'eslint-plugin-import-x';

// The plugin's `ExportMap` opens only a file whose extension appears here, and the key defaults to
// `['.js', '.mjs', '.cjs']`, so without it every rule that walks the module graph is inert on a TypeScript
// source. This is the `import-x/extensions` setting, unrelated to the rule of the same name below. The
// list mirrors `patterns.codeExtensions`.
const settings = {
  'import-x/extensions': ['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx'],
};

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

  // `ignoreExternal` keeps the traversal out of `node_modules`, which costs twenty times the rest of the
  // walk. It skips a bare or scoped specifier only, so it drops no relative edge of its own; a cycle running
  // through a workspace sibling imported by its package name goes unreported.
  'import-x/no-cycle': ['error', { ignoreExternal: true }],
};

const config = defineConfig({
  plugins: {
    'import-x': importXPlugin,
  },
  settings,
  rules,
});

export default config;
