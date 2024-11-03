import tsConfig from './packages/typescript/dist/index.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...tsConfig,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
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
