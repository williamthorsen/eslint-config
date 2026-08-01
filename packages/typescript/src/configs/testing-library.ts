import { type Config, defineConfig } from 'eslint/config';

export async function createReactTestingLibraryConfig(): Promise<Config[]> {
  const { default: jestDomPlugin } = await import('eslint-plugin-jest-dom');
  const { default: testingLibraryPlugin } = await import('eslint-plugin-testing-library');

  // Vitest rule severities belong to `configs/vitest.ts`, which a consumer of this config composes alongside it.
  return defineConfig({
    extends: [
      jestDomPlugin.configs['flat/all'], //
      testingLibraryPlugin.configs['flat/react'],
    ],
  });
}

// Add other configs as needed.
const configs = {
  react: createReactTestingLibraryConfig,
};

export default configs;
