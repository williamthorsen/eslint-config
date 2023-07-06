import assert from 'node:assert';
import path from 'node:path';

import { defineConfig, mergeConfig } from 'vitest/config';

export const baseConfig = defineConfig({
  resolve: {
    alias: {
      '~api': path.resolve(__dirname, 'packages/api/src'),
    },
  },
  test: {
    coverage: {
      all: true, // include untested files in the report
      enabled: false, // don't check coverage unless the `--coverage` flag is passed
      exclude: [
        '**/__tests__/*',
        '**/index.ts',
        '**/*.d.ts',
        '**/*.types.ts',
      ],
      include: [
        '**/src/**/*.ts',
      ],
      provider: 'v8',
    },
    watch: false, // don't enter watch mode unless the `--watch` flag is passed
  },
});

// Narrow `UserConfigExport` to exclude `UserConfigFn`, which is not accepted by `mergeConfig()`.
assert.ok(typeof baseConfig !== 'function');
export default mergeConfig(baseConfig, {
  test: {
    include: [
      path.resolve(__dirname, 'packages/*/src/**/*.test.ts'),
    ],
  },
});
