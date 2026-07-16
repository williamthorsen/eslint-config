import assert from 'node:assert';

import { defineConfig, mergeConfig } from 'vitest/config';

import { baseConfig } from '../../config/vitest.config.ts';

const config = defineConfig({
  // prettier-ignore
  test: {
    include: [
      'src/**/__tests__/*.test.ts',
    ],
    // Fixtures are lint targets, not test files; keep them out of test collection.
    exclude: [
      '**/__tests__/fixtures/**',
    ],
  },
});

// Narrow `UserConfigExport` to exclude `UserConfigFn`, which is not accepted by `mergeConfig()`.
assert.ok(typeof baseConfig !== 'function');
assert.ok(typeof config !== 'function');
export default mergeConfig(baseConfig, config);
