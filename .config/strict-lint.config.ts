import { defineConfig } from '../packages/strict-lint/src/defineConfig.ts';
import baseConfig, { createConfig } from '../packages/typescript/src/index.ts';

export default defineConfig({
  // Both imports name source paths, which is what `eslint.config.ts` imports too. The package specifiers resolve
  // through `exports` to `dist/esm`, whose elements are different objects and match nothing the config array holds.
  sharedConfigs: [baseConfig, await createConfig.vitest()],
});
