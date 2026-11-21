import type { Config } from 'eslint/config';
import packageJsonPlugin from 'eslint-plugin-package-json';

export const packageJsonConfig: Config[] = [
  packageJsonPlugin.configs.recommended,
  packageJsonPlugin.configs.stylistic,
  {
    files: ['**/package.json'],
    rules: {
      // Each rule below takes its default options, which sorts them into two tiers: `require-author` and
      // `require-engines` bind every package, while the rest exempt private ones through `ignorePrivate`.
      'package-json/no-local-dependencies': 'error',
      'package-json/require-author': 'error',
      'package-json/require-bugs': 'error',
      'package-json/require-engines': 'error',
      'package-json/require-homepage': 'error',
      'package-json/require-keywords': 'error',
    },
  },
];

/**
 * Drops the link fields from the publishable tier, for a public package whose repository is private: each link would
 * point the package's readers at a page that they cannot open.
 */
export const packageJsonPrivateRepoConfig: Config[] = [
  {
    files: ['**/package.json'],
    // Reuse the preset's registration, so that the block loads wherever it is appended: ESLint rejects a rule setting,
    // even `off`, whose plugin is unregistered, and a second object registered under the same plugin name.
    plugins: packageJsonPlugin.configs.recommended.plugins,
    rules: {
      'package-json/require-bugs': 'off',
      'package-json/require-homepage': 'off',
      'package-json/require-repository': 'off',
    },
  },
];
