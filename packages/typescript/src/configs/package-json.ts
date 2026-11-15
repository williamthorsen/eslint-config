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
