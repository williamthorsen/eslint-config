import eslint from '@eslint/js';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

const rules: Linter.RulesRecord = {
  // Best practices
  'consistent-return': 'error',
  complexity: ['warn', 11],
  eqeqeq: ['error', 'always'],
  'guard-for-in': 'error',
  'no-alert': 'error',
  'no-cond-assign': ['error', 'always'],
  'no-console': ['error', { allow: ['debug', 'error', 'info', 'warn'] }],
  'no-constant-condition': ['warn', { checkLoops: false }],
  'no-param-reassign': 'off',
  'no-redeclare': ['error', { builtinGlobals: true }],
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['node_modules/*'],
          message: 'Should not import from node_modules',
        },
      ],
    },
  ],
  // prettier-ignore
  'no-restricted-syntax': [
    'error',
    'DebuggerStatement',
    'LabeledStatement',
    'WithStatement',
  ],
  'no-return-assign': 'error',
  'no-return-await': 'off',
  'no-undef': 'error',
  'no-unused-expressions': [
    'warn',
    {
      allowShortCircuit: true,
      allowTernary: true,
      allowTaggedTemplates: true,
    },
  ],
  'no-unused-vars': [
    'error',
    {
      args: 'all',
      argsIgnorePattern: '^_',
      ignoreRestSiblings: true,
      varsIgnorePattern: '^_',
    },
  ],
  'no-var': 'off',
  'require-await': 'off',
  'prefer-const': [
    'error',
    {
      destructuring: 'any',
      ignoreReadBeforeAssign: true,
    },
  ],
  'prefer-exponentiation-operator': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',

  // Stylistic rules
  camelcase: 'off',
  'dot-notation': ['warn', { allowKeywords: true }],
  'eol-last': 'warn',
  'func-call-spacing': ['warn', 'never'],
  'quote-props': ['warn', 'as-needed', { unnecessary: false }],
  'sort-imports': [
    'warn',
    {
      allowSeparatedGroups: true,
      ignoreCase: true,
      ignoreDeclarationSort: true,
      ignoreMemberSort: false,
      // prettier-ignore
      memberSyntaxSortOrder: [
        'none',
        'all',
        'multiple',
        'single',
      ],
    },
  ],
};

const config = tseslint.config({
  extends: [eslint.configs.recommended],
  rules,
});

export default config;
