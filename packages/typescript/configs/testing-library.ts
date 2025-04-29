import tseslint, { type ConfigArray } from 'typescript-eslint';

export async function createReactTestingLibraryConfig(): Promise<ConfigArray> {
  const { default: jestDomPlugin } = await import('eslint-plugin-jest-dom');
  const { default: testingLibraryPlugin } = await import('eslint-plugin-testing-library');

  return tseslint.config({
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
