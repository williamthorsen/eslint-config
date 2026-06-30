import type { Config } from 'eslint/config';
import packageJsonPlugin from 'eslint-plugin-package-json';

const config: Config[] = [
  packageJsonPlugin.configs.recommended,
  packageJsonPlugin.configs.stylistic,
  {
    files: ['**/package.json'],
    rules: {
      // Empty `keywords` arrays are used as intentional placeholders
      'package-json/no-empty-fields': 'off',
      // Not all packages in the monorepo require a repository field
      'package-json/require-repository': 'off',
      // sideEffects is not needed for ESLint config packages
      'package-json/require-sideEffects': 'off',
      // Peer dependencies need not be duplicated in devDependencies
      'package-json/specify-peers-locally': 'off',
    },
  },
];

export default config;
