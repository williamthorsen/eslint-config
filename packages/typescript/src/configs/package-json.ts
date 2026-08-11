import type { Config } from 'eslint/config';
import packageJsonPlugin from 'eslint-plugin-package-json';

const config: Config[] = [
  packageJsonPlugin.configs.recommended,
  packageJsonPlugin.configs.stylistic,
  {
    files: ['**/package.json'],
    rules: {
      // Each rule below takes its default options, which is what sorts them into two tiers: `require-author` and
      // `require-engines` bind every package, while the rest exempt private ones through `ignorePrivate`.
      'package-json/no-local-dependencies': 'error',
      'package-json/require-author': 'error',
      'package-json/require-bugs': 'error',
      'package-json/require-engines': 'error',
      'package-json/require-homepage': 'error',
      'package-json/require-keywords': 'error',
      // Peers hoisted to a workspace root are not duplicated in the consuming package's devDependencies
      'package-json/specify-peers-locally': 'off',
    },
  },
];

export default config;
