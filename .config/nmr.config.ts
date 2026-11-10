import { defineConfig } from '@williamthorsen/nmr/config';

/** Repo-level nmr overrides. */
export default defineConfig({
  rootScripts: {
    // Restates nmr's default list to append `verify:kits`.
    'check:strict': ['typecheck', 'fmt:check', 'lint:strict', 'test:coverage', 'verify:kits'],
    // `--rebuild` compiles each kit afresh and compares bytes. Without it the check reads only the hashes recorded in
    // the manifest, and a readyup upgrade changes the emitted bundle without changing those hashes.
    'verify:kits':
      'pnpm --filter @williamthorsen/eslint-config-typescript --filter @williamthorsen/tsconfig exec rdy verify --rebuild',
  },
});
