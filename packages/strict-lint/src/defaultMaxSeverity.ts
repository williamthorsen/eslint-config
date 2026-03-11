import type { MaxSeverityMap } from './types.ts';

export const defaultMaxSeverity = {
  '@typescript-eslint/no-deprecated': 'warn',
  'unicorn/consistent-function-scoping': 'warn',
  'unicorn/no-useless-undefined': 'warn',
  'unicorn/prefer-global-this': 'warn',
  'unicorn/prefer-ternary': 'warn',
} satisfies MaxSeverityMap;
