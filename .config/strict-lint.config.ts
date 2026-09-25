import { defineConfig } from '../packages/strict-lint/src/defineConfig.ts';
import baseConfig, { createConfig } from '../packages/typescript/src/index.ts';

export default defineConfig({
  // Import from source, as `eslint.config.ts` does. The package specifiers resolve through `exports` to `dist/esm`,
  // whose elements are different objects and match nothing that the config array holds.
  sharedConfigs: [baseConfig, await createConfig.vitest()],
});
