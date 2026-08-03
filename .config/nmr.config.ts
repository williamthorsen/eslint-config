import { defineConfig } from '@williamthorsen/nmr/config';

/** Repo-level nmr overrides. */
export default defineConfig({
  devBin: {
    // `strict-lint` belongs to this repo; so run it directly, not from an installed package
    'strict-lint': 'node packages/strict-lint/src/bin/strict-lint.ts',
  },
});
