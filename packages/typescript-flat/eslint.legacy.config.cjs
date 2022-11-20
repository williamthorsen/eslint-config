const rules = require('./eslint.rules.cjs');

module.exports = {
  root: true,
  // Recognize global vars for these environments
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    module: 'es2022',
    parser: '@typescript-eslint/parser',
    project: ['./tsconfig.json'],
    sourceType: 'module',
  },
  rules,
};
