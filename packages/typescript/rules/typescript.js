export default {
  // Best practices
  '@typescript-eslint/ban-ts-comment': ['error', {
    'ts-ignore': 'allow-with-description',
  }],
  '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
  '@typescript-eslint/consistent-type-imports': ['warn', {
    prefer: 'type-imports',
    disallowTypeAnnotations: false,
  }],
  '@typescript-eslint/explicit-module-boundary-types': 'warn',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-inferrable-types': 'warn',
  '@typescript-eslint/no-namespace': 'off',
  '@typescript-eslint/no-redeclare': ['error', { builtinGlobals: true }],
  'no-redeclare': 'off',
  '@typescript-eslint/no-unnecessary-condition': 'error',
  '@typescript-eslint/no-unused-vars': ['error', {
    args: 'all',
    argsIgnorePattern: '^_',
    ignoreRestSiblings: true,
    varsIgnorePattern: '^_',
  }],
  '@typescript-eslint/no-useless-constructor': 'warn',

  // Disable rules that are covered by TypeScript
  'no-dupe-class-members': 'off',
  'no-loss-of-precision': 'off',
  'no-undef': 'off',
  'no-use-before-define': 'off',
  'no-useless-constructor': 'off',

  'lines-between-class-members': 'off',
  '@typescript-eslint/no-empty-function': 'off',
  '@typescript-eslint/no-empty-interface': 'off',
  '@typescript-eslint/no-loss-of-precision': 'error',
};
