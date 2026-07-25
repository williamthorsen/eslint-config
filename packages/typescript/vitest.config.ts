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

export default mergeConfig(baseConfig, config);
