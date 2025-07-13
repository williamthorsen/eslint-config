import type { Linter } from 'eslint';
import unicornPlugin from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

// see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/readme.md
const rules: Linter.RulesRecord = {
  /**
   * These are enabled as part of the `recommended` set.
   * If the set isn't used, enable these explicitly.
  'unicorn/escape-case': 'error', // Uppercase regex escapes
  'unicorn/no-new-buffer': 'error', // Prevent deprecated `new Buffer()`
  'unicorn/number-literal-case': 'error', // Lowercase number formatting for octal, hex, binary (0x1'error' instead of 0X1'error')
  'unicorn/prefer-module': 'error', // Prefer the JavaScript module format over the legacy CommonJS module format
  'unicorn/throw-new-error': 'error', // Use `new` when throwing an error
   */

  // Downgrade or disable overly prescriptive rules
  'unicorn/catch-error-name': 'warn', // 🔴🟠
  'unicorn/error-message': 'warn', // Pass an error message when throwing errors
  'unicorn/explicit-length-check': 'warn', // 🔴🟠
  'unicorn/filename-case': 'off', // 🔴⚫
  'unicorn/import-style': ['warn', { extendDefaultStyles: false }],
  'unicorn/no-array-callback-reference': 'off', // 🔴⚫
  'unicorn/no-array-for-each': 'off', // 🔴⚫
  'unicorn/no-array-reduce': 'warn', // 🔴🟠
  'unicorn/no-await-expression-member': 'off', // 🔴⚫
  'unicorn/no-lonely-if': 'warn', // 🔴🟠
  'unicorn/no-negated-condition': 'warn', // 🔴🟠
  'unicorn/no-nested-ternary': 'warn', // 🔴🟠
  'unicorn/no-null': 'off', // 🔴⚫ Prefer `undefined` over `null`
  'unicorn/no-useless-undefined': 'warn', // 🔴🟠
  'unicorn/number-literal-case': ['warn', { hexadecimalValue: 'lowercase' }], // to align with Prettier
  'unicorn/numeric-separators-style': 'warn', // 🔴🟠
  'unicorn/prefer-global-this': 'warn', // 🔴🟠
  'unicorn/prefer-dom-node-text-content': 'warn', // 🔴🟠 Prefer `textContent` over `innerText`
  'unicorn/prefer-includes': 'warn', // 🔴🟠 Prefer `includes` over `indexOf` when checking for existence
  'unicorn/prefer-node-protocol': 'warn', // 🔴🟠 Prefer `node:`-prefixed modules
  'unicorn/prefer-number-properties': 'warn', // 🔴🟠
  'unicorn/prefer-query-selector': 'warn', // 🔴🟠
  'unicorn/prefer-string-raw': 'warn', // 🔴🟠
  'unicorn/prefer-string-replace-all': 'warn', // 🔴🟠
  'unicorn/prefer-string-slice': 'warn', // 🔴🟠
  'unicorn/prefer-string-starts-ends-with': 'warn', // 🔴🟠 Prefer `String#startsWith` & `String#endsWith` over more complex alternatives
  'unicorn/prefer-ternary': 'warn', // 🔴🟠
  'unicorn/prefer-top-level-await': 'warn', // 🔴🟠
  'unicorn/prefer-type-error': 'warn', // 🔴🟠 Prefer a TypeError when an error is thrown while checking `typeof`
  'unicorn/prevent-abbreviations': 'off', // 🔴⚫
  'unicorn/switch-case-braces': ['error', 'avoid'], // Avoid braces in switch cases unless scope is needed.
  'unicorn/text-encoding-identifier-case': 'warn', // 🔴🟠
};

const config = tseslint.config({
  extends: [unicornPlugin.configs.recommended],
  rules,
});

export default config;
