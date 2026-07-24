/**
 * Rules that report style and modernization advice rather than defects. Spread the map into a strict-lint
 * `maxSeverity` to exempt them from error promotion, or into a flat-config `rules` block to set them directly.
 */
export const advisoryRuleSeverities = {
  '@typescript-eslint/no-deprecated': 'warn',
  '@typescript-eslint/no-unnecessary-type-arguments': 'warn',
  'unicorn/consistent-function-scoping': 'warn',
  'unicorn/no-array-reduce': 'warn',
  'unicorn/no-lonely-if': 'warn',
  'unicorn/no-negated-condition': 'warn',
  'unicorn/no-nested-ternary': 'warn',
  'unicorn/no-useless-undefined': 'warn',
  'unicorn/numeric-separators-style': 'warn',
  'unicorn/prefer-dom-node-text-content': 'warn',
  'unicorn/prefer-global-this': 'warn',
  'unicorn/prefer-includes': 'warn',
  'unicorn/prefer-node-protocol': 'warn',
  'unicorn/prefer-number-properties': 'warn',
  'unicorn/prefer-query-selector': 'warn',
  'unicorn/prefer-string-raw': 'warn',
  'unicorn/prefer-string-slice': 'warn',
  'unicorn/prefer-string-starts-ends-with': 'warn',
  'unicorn/prefer-ternary': 'warn',
  'unicorn/prefer-top-level-await': 'warn',
  'unicorn/prefer-type-error': 'warn',
  'unicorn/text-encoding-identifier-case': 'warn',
} satisfies Record<string, 'error' | 'warn'>;
