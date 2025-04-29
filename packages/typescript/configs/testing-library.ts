import jestDomPlugin from 'eslint-plugin-jest-dom';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import tseslint from 'typescript-eslint';

export const reactTestingLibrary = tseslint.config({
  extends: [
    jestDomPlugin.configs['flat/all'], //
    testingLibraryPlugin.configs['flat/react'],
  ],
});

// Add other configs as needed.
const configs = {
  react: reactTestingLibrary,
};

export default configs;
