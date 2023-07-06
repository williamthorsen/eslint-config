import config from './packages/typescript/index.mjs';

/**
 * @type {import('eslint').Linter.FlatConfig[]}
 */
export default [
  ...config,
  {
    files: ['**/*.mts', '**/*.ts', '**/*.md/*.ts'],
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.eslint.json',
          './packages/*/tsconfig.eslint.json',
        ],
      },
    },
  },
];
