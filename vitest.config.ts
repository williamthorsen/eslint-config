import { defineVitestConfig } from '@williamthorsen/nmr/vitest';

export default defineVitestConfig({
  root: {
    test: {
      // Bins are reachable only by subprocess, which V8 coverage cannot instrument.
      coverage: { exclude: ['**/bin/**'] },
    },
  },
});
