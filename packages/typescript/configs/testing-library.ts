import { defineConfig } from 'eslint/config';
import { type ConfigArray } from 'typescript-eslint';

export async function createReactTestingLibraryConfig(): Promise<ConfigArray> {
  const { default: jestDomPlugin } = await import('eslint-plugin-jest-dom');
  const { default: testingLibraryPlugin } = await import('eslint-plugin-testing-library');

  return defineConfig({
    extends: [
      jestDomPlugin.configs['flat/all'], //
      testingLibraryPlugin.configs['flat/react'],
    ],
    rules: ruleDowngrades,
  });
}

// Add other configs as needed.
const configs = {
  react: createReactTestingLibraryConfig,
};

const ruleDowngrades = {
  'vitest/max-expects': 'off', // 🔴⚫
  'vitest/no-hooks': 'off', // 🔴⚫ disallows hooks such as `beforeEach` and `afterEach`
  'vitest/padding-around-all': 'off', // 🔴⚫
  'vitest/padding-around-expect-groups': 'off', // 🔴⚫
  'vitest/prefer-expect-assertions': 'off', // 🔴⚫ requires `expect.assertions()` in every test
} as const;

export default configs;
