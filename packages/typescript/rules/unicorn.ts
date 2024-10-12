import type { Linter } from 'eslint';

// see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/readme.md
export const unicornRules: Linter.RulesRecord = {
  'unicorn/error-message': 'warn', // Pass an error message when throwing errors
  'unicorn/escape-case': 'error', // Uppercase regex escapes
  'unicorn/no-instanceof-array': 'error', // Prefer `Array.isArray` over `instanceof`
  'unicorn/no-new-buffer': 'error', // Prevent deprecated `new Buffer()`
  'unicorn/no-unsafe-regex': 'warn', // Keep regex literals safe
  'unicorn/number-literal-case': 'error', // Lowercase number formatting for octal, hex, binary (0x1'error' instead of 0X1'error')
  'unicorn/prefer-includes': 'warn', // Prefer `includes` over `indexOf` when checking for existence
  'unicorn/prefer-module': 'error', // Prefer the JavaScript module format over the legacy CommonJS module format
  'unicorn/prefer-node-protocol': 'warn', // Prefer `node:`-prefixed modules
  'unicorn/prefer-string-starts-ends-with': 'warn', // Prefer `String#startsWith` & `String#endsWith` over more complex alternatives
  'unicorn/prefer-text-content': 'warn', // Prefer `textContent` over `innerText`
  'unicorn/prefer-type-error': 'warn', // Prefer a TypeError when an error is thrown while checking `typeof`
  'unicorn/throw-new-error': 'error', // Use `new` when throwing an error
};
