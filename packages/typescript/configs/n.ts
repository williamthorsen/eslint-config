import type { Linter } from 'eslint';
import nPlugin from 'eslint-plugin-n';

const rules: Linter.RulesRecord = {
  'n/no-callback-literal': 'off',
};

const config = {
  ...nPlugin.configs['flat/recommended-module'],
  rules: {
    ...nPlugin.configs['flat/recommended-module'].rules,
    ...rules,
  },
};

export default config;
