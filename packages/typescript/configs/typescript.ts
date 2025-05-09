import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

import skyPilot from '../plugins/eslint-plugin-sky-pilot.js';

const rules: Linter.RulesRecord = {
  // Strict: Modified
  '@typescript-eslint/no-confusing-void-expression': [
    'warn', // 🔴🟠
    {
      ignoreArrowShorthand: true,
      ignoreVoidOperator: true,
      ignoreVoidReturningFunctions: true,
    },
  ],
  // '@typescript-eslint/no-namespace': 'off',
  '@typescript-eslint/unbound-method': 'warn', // 🔴🟠
  '@typescript-eslint/no-unnecessary-type-arguments': 'warn', // 🔴🟠
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
  '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }], // ⚫🔴
  '@typescript-eslint/consistent-type-imports': [
    'warn', // ⚫🟠
    {
      prefer: 'type-imports',
      disallowTypeAnnotations: false,
    },
  ],
  '@typescript-eslint/explicit-module-boundary-types': 'warn', // ⚫🟠
  '@typescript-eslint/no-redeclare': [
    'error', // ⚫🔴
    { builtinGlobals: true }, // modification
  ],

  // Stylistic: Enabled
  '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'], // ⚫🟠
  '@typescript-eslint/no-inferrable-types': 'warn', // ⚫🟠
};

const config = tseslint.config({
  extends: [
    ...tseslint.configs.strictTypeChecked, //
    skyPilot.configs.recommended,
  ],
  rules,
});

export default config;
