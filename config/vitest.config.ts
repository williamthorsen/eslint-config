import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFilePath = fileURLToPath(import.meta.url);
const thisDirPath = path.dirname(thisFilePath);

import { defineConfig, mergeConfig } from 'vitest/config';

export const baseConfig = defineConfig({
  resolve: {
    alias: {
      '@monorepo/api': path.resolve(thisDirPath, 'packages/api/src'),
    },
  },
  test: {
    coverage: {
      all: true, // include untested files in the report
      enabled: false, // don't check coverage unless the `--coverage` flag is passed
      exclude: ['**/__tests__/*', '**/index.ts', '**/*.d.ts', '**/*.types.ts'],
      include: ['**/src/**/*.{ts,tsx}'],
      provider: 'v8',
    },
    exclude: ['**/node_modules/**'],
    watch: false, // don't enter watch mode unless the `--watch` flag is passed
  },
});

const config = defineConfig({
  test: {
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
  },
});

export default mergeConfig(baseConfig, config);
