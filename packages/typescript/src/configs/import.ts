import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import importXPlugin from 'eslint-plugin-import-x';

import { patterns } from '../patterns.ts';
import { importResolverOptions } from './importResolverOptions.ts';

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

const config = defineConfig(
  {
    plugins: {
      'import-x': importXPlugin,
    },
    settings,
    rules,
  },
  // Settings merge per linted file, so the alias reaches a TypeScript source alone. A JavaScript source keeps
  // resolving `./b.js` to `b.js`, which is the file it loads at runtime.
  {
    files: patterns.typeScriptFiles,
    settings: {
      'import-x/resolver': { node: importResolverOptions },
    },
  },
);

export default config;
