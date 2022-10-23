const basic = require('@williamthorsen/eslint-config-basic');
const markdownRules = basic.overrides.find(override => override.files === '**/*.md/*.*')?.rules || {};

module.exports = {
  extends: [
    '@williamthorsen/eslint-config-basic',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
  ],
  overrides: [
    ...basic.overrides,
    {
      // Code blocks in Markdown files
      files: ['**/*.md/*.*'],
      rules: {
        ...markdownRules,
        '@typescript-eslint/no-redeclare': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/comma-dangle': 'off',
      },
    },
    {
      files: ['*.d.ts'],
      rules: {
        'import/no-duplicates': 'off',
      },
    },
    {
      files: ['*.cjs', '*.js', '*.mjs'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/indent': 'off',
        'indent': ['warn', 2, { SwitchCase: 1 }],
        'no-dupe-class-members': 'error',
      },
    },
    {
      files: ['*.cjs', '*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['*.test.ts'],
      rules: {
        'no-unused-expressions': 'off',
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    module: 'es2020',
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
  rules: {},
  settings: {
    'import/resolver': {
      node: { extensions: ['.cjs', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx', '.d.ts'] },
    },
  },
};
