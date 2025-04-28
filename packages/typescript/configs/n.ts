import type { Linter } from 'eslint';
import nPlugin from 'eslint-plugin-n';

const rules: Linter.RulesRecord = {
  'n/no-callback-literal': 'off',
  'n/no-extraneous-import': 'warn',
  'n/no-missing-import': 'off',
  'n/no-unpublished-import': 'off',
  // TODO: Enable this rule only in Node.js environments. See TOOLCHAIN-5.
  'n/no-unsupported-features/node-builtins': 'off',
};

const config = {
  ...nPlugin.configs['flat/recommended-module'],
  plugins: {
    n: nPlugin,
  },
  rules: {
    ...nPlugin.configs['flat/recommended-module'].rules,
    ...rules,
  },
};

export default config;
