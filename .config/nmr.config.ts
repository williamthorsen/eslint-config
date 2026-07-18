import { defineConfig } from '@williamthorsen/nmr';

/**
 * Repo-level nmr overrides.
 *
 * `ci` reverses the default order: build first because the root eslint config
 * imports the typescript package's `dist/`.
 *
 * `devBin` runs `strict-lint` from source: it is a source package here, so its
 * binary is not linked into `node_modules/.bin/` until built.
 */
export default defineConfig({
  rootScripts: {
    ci: ['build', 'check:strict'],
  },
  devBin: {
    'strict-lint': 'tsx packages/strict-lint/src/bin/strict-lint.ts',
  },
});
