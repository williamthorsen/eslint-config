import { defineConfig } from '@williamthorsen/nmr';

/**
 * Repo-level nmr overrides.
 *
 * `ci` reverses the default order: build first because the `strict-lint` binary
 * must exist before `lint:strict` can run.
 *
 * `root:lint:strict` invokes the local script via tsx because `strict-lint` is
 * a source package whose binary is not linked into `node_modules/.bin/`.
 */
export default defineConfig({
  rootScripts: {
    ci: ['build', 'check:strict'],
    'root:lint:strict': "tsx packages/strict-lint/scripts/strict-lint.ts --ignore-pattern 'packages/**' .",
  },
  workspaceScripts: {
    'lint:strict': 'tsx ../strict-lint/scripts/strict-lint.ts',
  },
});
