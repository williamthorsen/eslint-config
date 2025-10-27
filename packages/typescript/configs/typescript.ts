import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import promisePlugin from 'eslint-plugin-promise';
import tseslint from 'typescript-eslint';

import skyPilotPlugin from '../plugins/eslint-plugin-sky-pilot.ts';
import { ensureExtendsElement } from '../utils/ensureExtendsElement.ts';

const rules: Linter.RulesRecord = {
  // Disable rules inappropriate for TypeScript
  'consistent-return': 'off',
  'no-redeclare': 'off',
  'no-unused-vars': 'off',

  // Strict: Modified
  '@typescript-eslint/no-confusing-void-expression': [
    'warn', // 🔴🟠
    {
      ignoreArrowShorthand: true,
      ignoreVoidOperator: true,
      ignoreVoidReturningFunctions: true,
    },
  ],
  '@typescript-eslint/no-invalid-void-type': [
    'error',
    // Allow `fn(this: void)`, the canonical way to express that a function doesn't use `this`.
    { allowAsThisParameter: true },
  ],
  // '@typescript-eslint/no-namespace': 'off',
  '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: false }],
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
  '@typescript-eslint/unbound-method': 'warn', // 🔴🟠

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

  // Stylistic: Enabled
  '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'], // ⚫🟠
  '@typescript-eslint/no-inferrable-types': 'warn', // ⚫🟠
};

const config = defineConfig({
  extends: [
    ...tseslint.configs.strictTypeChecked, //
    promisePlugin.configs['flat/recommended'],
    ensureExtendsElement(skyPilotPlugin.configs.recommended),
  ],
  rules,
});

export default config;
