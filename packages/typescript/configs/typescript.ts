import type { Linter } from 'eslint';

const rules: Linter.RulesRecord = {
  // Strict: Modified
  // '@typescript-eslint/no-namespace': 'off',
  '@typescript-eslint/no-unused-vars': ['error', {
    args: 'all',
    argsIgnorePattern: '^_',
    ignoreRestSiblings: true,
    varsIgnorePattern: '^_',
  }],

  // Optional: Enabled
  '@typescript-eslint/consistent-type-imports': ['warn', {
    prefer: 'type-imports',
    disallowTypeAnnotations: false,
  }],
  '@typescript-eslint/explicit-module-boundary-types': 'warn', // all
  '@typescript-eslint/no-redeclare': ['error', { builtinGlobals: true }],

  // Stylistic: Enabled
  '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
  '@typescript-eslint/no-inferrable-types': 'warn',
};

export default {
  rules,
};
