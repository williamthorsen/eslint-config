import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import unicornPlugin from 'eslint-plugin-unicorn';

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
  'unicorn/consistent-boolean-name': 'off', // 🔴⚫ Prescriptive predicate naming; false-positives on predicate functions
  'unicorn/consistent-class-member-order': 'off', // 🔴⚫ Conflicts with `@typescript-eslint/member-ordering` and most style guides
  'unicorn/consistent-function-scoping': 'warn', // 🔴🟠 Legitimate to co-locate helpers
  'unicorn/error-message': 'warn', // Pass an error message when throwing errors
  'unicorn/explicit-length-check': 'warn', // 🔴🟠
  'unicorn/filename-case': 'off', // 🔴⚫
  'unicorn/import-style': ['warn', { extendDefaultStyles: false }],
  'unicorn/max-nested-calls': 'off', // 🔴⚫ Overly prescriptive
  'unicorn/name-replacements': 'off', // 🔴⚫ Abbreviations are allowed
  'unicorn/no-array-callback-reference': 'off', // 🔴⚫ Overly prescriptive
  'unicorn/no-array-reduce': 'warn', // 🔴🟠
  'unicorn/no-await-expression-member': 'off', // 🔴⚫
  'unicorn/no-barrel-files': 'off', // ⚫⚫ Superseded by sky-pilot/no-unpublished-barrel, which exempts a published entry point
  'unicorn/no-break-in-nested-loop': 'off', // 🔴⚫ Break/continue in nested loops is idiomatic; extracting a function is overkill
  'unicorn/no-for-each': 'off', // 🔴⚫
  'unicorn/no-lonely-if': 'warn', // 🔴🟠
  'unicorn/no-named-default': 'off', // 🔴⚫ `{ default as x }` emits identically to `import x`; no defect content
  'unicorn/no-negated-condition': 'off', // 🔴⚫ Too prescriptive
  'unicorn/no-non-function-verb-prefix': 'off', // 🔴⚫ Flags verb-named holders like the `createConfig` factory map
  'unicorn/no-nested-ternary': 'warn', // 🔴🟠
  'unicorn/no-for-loop': 'off', // 🔴⚫ Traditional for loops are sometimes clearer
  'unicorn/no-null': 'off', // 🔴⚫ Prefer `undefined` over `null`
  'unicorn/no-process-exit': 'off', // 🔴⚫ Needed in CLI tools and scripts
  'unicorn/no-useless-undefined': 'warn', // 🔴🟠
  'unicorn/number-literal-case': ['warn', { hexadecimalValue: 'lowercase' }], // to align with Prettier
  'unicorn/numeric-separators-style': [
    'warn',
    {
      onlyIfContainsSeparator: false,
      hexadecimal: { minimumDigits: 0, groupLength: 4 },
      binary: { minimumDigits: 0, groupLength: 4 },
      octal: { minimumDigits: 0, groupLength: 4 },
      number: { minimumDigits: 4, groupLength: 3, fractionGroupLength: 3 },
    },
  ], // 🔴🟠
  'unicorn/prefer-global-this': 'warn', // 🔴🟠
  'unicorn/prefer-default-parameters': 'off', // 🔴⚫ Incorrectly handles `null`
  'unicorn/prefer-dom-node-text-content': 'warn', // 🔴🟠 Prefer `textContent` over `innerText`
  'unicorn/prefer-includes': 'warn', // 🔴🟠 Prefer `includes` over `indexOf` when checking for existence
  'unicorn/prefer-math-min-max': 'off', // 🔴⚫ Ternary is often more readable than Math.min/Math.max
  'unicorn/prefer-node-protocol': 'warn', // 🔴🟠 Prefer `node:`-prefixed modules
  'unicorn/prefer-number-coercion': 'off', // 🔴⚫ Number() and parseInt() differ; the auto-fix can change behavior
  'unicorn/prefer-number-properties': 'warn', // 🔴🟠
  'unicorn/prefer-query-selector': 'warn', // 🔴🟠
  'unicorn/prefer-simple-condition-first': 'off', // 🔴⚫ Reorders conditions away from reading order; its unsafe report ships no fix
  'unicorn/prefer-simplified-conditions': 'off', // 🔴⚫ Rewrites guard clauses in ways that can reduce readability
  'unicorn/prefer-spread': 'off', // 🔴⚫ Prefer spread operator over Array.from, Array#concat, Array#{slice,toSpliced} and String#split
  'unicorn/prefer-string-raw': 'warn', // 🔴🟠
  'unicorn/prefer-string-replace-all': 'off', // 🔴⚫ Not sure whether I can trust this rule's auto-fixes.
  'unicorn/prefer-string-slice': 'warn', // 🔴🟠
  'unicorn/prefer-string-starts-ends-with': 'warn', // 🔴🟠 Prefer `String#startsWith` & `String#endsWith` over more complex alternatives
  'unicorn/prefer-ternary': 'warn', // 🔴🟠
  'unicorn/prefer-top-level-await': 'warn', // 🔴🟠
  'unicorn/prefer-type-error': 'warn', // 🔴🟠 Prefer a TypeError when an error is thrown while checking `typeof`
  'unicorn/prevent-abbreviations': 'off', // 🔴⚫
  'unicorn/require-array-sort-compare': 'off', // 🔴⚫ Disallows cases when the default sort is desired
  'unicorn/single-line-block-comment-style': 'off', // 🔴⚫ Stylistic
  'unicorn/switch-case-braces': ['error', 'avoid'], // Avoid braces in switch cases unless scope is needed.
  'unicorn/text-encoding-identifier-case': 'warn', // 🔴🟠
};

const config = defineConfig({
  extends: [unicornPlugin.configs.recommended],
  rules,
});

export default config;
