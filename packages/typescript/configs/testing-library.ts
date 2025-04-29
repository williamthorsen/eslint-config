import testingLibraryPlugin from 'eslint-plugin-testing-library';

export const reactTestingLibrary = testingLibraryPlugin.configs['flat/react'];

// Add other configs as needed.
const configs = {
  react: reactTestingLibrary,
};

export default configs;
