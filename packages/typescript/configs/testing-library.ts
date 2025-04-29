import testingLibraryPlugin from 'eslint-plugin-testing-library';

import type { OptionalConfig } from '../utils/resolveOptionalConfigs.js';

const config = testingLibraryPlugin.configs['flat/react'];

const dependencies = ['eslint-plugin-testing-library'];

const reactTestingLibrary = {
  config,
  dependencies,
} satisfies OptionalConfig;

// Add other configs as needed.
export { reactTestingLibrary };
