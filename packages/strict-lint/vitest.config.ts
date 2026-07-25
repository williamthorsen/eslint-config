import { defineConfig, mergeConfig } from 'vitest/config';

import { baseConfig } from '../../config/vitest.config.ts';

const config = defineConfig({
  // prettier-ignore
  test: {
    include: [
      'src/**/__tests__/*.test.ts',
    ],
  },
});

export default mergeConfig(baseConfig, config);
