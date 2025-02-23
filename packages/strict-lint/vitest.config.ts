import assert from 'node:assert';

import { defineConfig, mergeConfig } from 'vitest/config';

import { baseConfig } from '../../vitest.config.js';

const config = defineConfig({
  // prettier-ignore
  test: {
    include: [
      'src/**/__tests__/*.test.ts',
    ],
  },
});

// Narrow `UserConfigExport` to exclude `UserConfigFn`, which is not accepted by `mergeConfig()`.
assert.ok(typeof baseConfig !== 'function');
assert.ok(typeof config !== 'function');
export default mergeConfig(baseConfig, config);
