import { defineConfig } from '@williamthorsen/nmr/config';

/** Repo-level nmr overrides. */
export default defineConfig({
  devBin: {
    // `strict-lint` belongs to this repo; so run it directly, not from an installed package
    'strict-lint': 'node packages/strict-lint/src/bin/strict-lint.ts',
  },
  rootScripts: {
    // Restates nmr's default list to append `verify:kits`.
    'check:strict': ['typecheck', 'fmt:check', 'lint:strict', 'test:coverage', 'verify:kits'],
    // Only the typescript workspace ships kits, and `rdy` resolves only there.
    'verify:kits': 'pnpm --filter @williamthorsen/eslint-config-typescript exec rdy verify',
  },
});
