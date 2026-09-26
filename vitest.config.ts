import { defineVitestConfig } from '@williamthorsen/nmr/vitest';

// Vitest reaches this config by walking up from a package directory, since packages carry none of their own.
// Project roots default to the run root, which scopes these globs to the package that invoked Vitest.
// Root-level tests use `vitest.root.config.ts`.
export default defineVitestConfig({
  root: {
    test: {
      // Bins are reachable only by subprocess, which V8 coverage cannot instrument.
      coverage: { exclude: ['**/bin/**'] },
    },
  },
});
