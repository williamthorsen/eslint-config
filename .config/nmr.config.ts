import { defineConfig } from '@williamthorsen/nmr';

/**
 * Repo-level nmr overrides.
 *
 * `ci` drops the `audit` step from nmr's default composite; `audit.yaml` runs it separately.
 *
 * `devBin` bypasses the linked `strict-lint` bin, whose committed shim resolves `dist/` and so
 * fails until the package is built. Plain `node` runs the source directly, exercising the same
 * native type stripping the published CLI relies on.
 */
export default defineConfig({
  rootScripts: {
    ci: ['build', 'check:strict'],
  },
  devBin: {
    'strict-lint': 'node packages/strict-lint/src/bin/strict-lint.ts',
  },
});
