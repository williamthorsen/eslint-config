import config from './packages/typescript/dist/index.js';

/**
 * @type {import('eslint').Linter.FlatConfig[]}
 */
export default [
  ...config,
  {
    files: [
      '**/*.mts',
      '**/*.ts',
      '**/*.md/*.ts',
      '!**/*.d.ts',
    ],
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
