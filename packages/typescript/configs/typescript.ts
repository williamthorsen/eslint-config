import type { Linter } from 'eslint';

const rules: Linter.RulesRecord = {
  // Strict: Modified
  '@typescript-eslint/no-confusing-void-expression': [
    'warn',
    {
      ignoreArrowShorthand: true,
      ignoreVoidOperator: true,
      ignoreVoidReturningFunctions: true,
    },
  ],
  // '@typescript-eslint/no-namespace': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      args: 'all',
      argsIgnorePattern: '^_',
      ignoreRestSiblings: true,
      varsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/restrict-template-expressions': [
    'error',
    {
      allowBoolean: true,
      allowNumber: true,
    },
  ],

  // Optional: Enabled
  '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
  '@typescript-eslint/consistent-type-imports': [
    'warn',
    {
      prefer: 'type-imports',
      disallowTypeAnnotations: false,
    },
  ],
  '@typescript-eslint/explicit-module-boundary-types': 'warn', // all
  '@typescript-eslint/no-redeclare': ['error', { builtinGlobals: true }],

  // Stylistic: Enabled
  '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
  '@typescript-eslint/no-inferrable-types': 'warn',
  '@typescript-eslint/unbound-method': 'warn',
};

const config: Linter.Config = {
  rules,
};

export default config;
