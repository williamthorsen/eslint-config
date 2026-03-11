import type { MaxSeverityMap } from './types.ts';

export const defaultMaxSeverity = {
  '@typescript-eslint/no-deprecated': 'warn',
} satisfies MaxSeverityMap;
