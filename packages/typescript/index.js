const basic = require('@williamthorsen/eslint-config-basic');
const basicMarkdownRules = basic.overrides.find(override => override.files === '**/*.md/*.*')?.rules || {};

module.exports = {
  extends: [
    'standard-with-typescript',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    '@williamthorsen/eslint-config-basic',
  ],
  overrides: [
    ...basic.overrides,
    {
      // Code blocks in Markdown files
      files: ['**/*.md/*.*'],
      rules: {
        ...basicMarkdownRules,
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
      files: ['*.mts', '*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/semi': ['error', 'always'],
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
    project: './tsconfig.json',
    sourceType: 'module',
  },
  rules: {},
  settings: {
    'import/resolver': {
      node: { extensions: ['.cjs', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx', '.d.ts'] },
    },
  },
};
