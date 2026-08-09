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
    // `--rebuild` compiles each kit afresh and compares bytes. Without it the check reads only the hashes
    // recorded in the manifest, which a readyup upgrade leaves untouched while changing the bundle it emits.
    'verify:kits':
      'pnpm --filter @williamthorsen/eslint-config-typescript --filter @williamthorsen/tsconfig exec rdy verify --rebuild',
  },
});
