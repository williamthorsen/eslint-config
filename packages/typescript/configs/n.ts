import type { Linter } from 'eslint';
import nPlugin from 'eslint-plugin-n';
import tseslint from 'typescript-eslint';

const modifiedRules: Linter.RulesRecord = {
  'n/no-callback-literal': 'off', // Enforces Node.js-style callback pattern
  'n/no-extraneous-import': 'warn',
  'n/no-missing-import': 'warn',
  'n/no-unpublished-import': 'warn',
  // TODO: Enable this rule only in Node.js environments. See TOOLCHAIN-5.
  'n/no-unsupported-features/node-builtins': 'off',
};

const config = tseslint.config({
  extends: [nPlugin.configs['flat/recommended']],
  rules: modifiedRules,
});

export default config;
