import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import unicornPlugin from 'eslint-plugin-unicorn';

// see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/readme.md
const rules: Linter.RulesRecord = {
  // Downgrade or disable overly prescriptive rules
  'unicorn/catch-error-name': 'warn', // 🔴🟠
  'unicorn/consistent-boolean-name': 'off', // 🔴⚫ Prescriptive predicate naming; false-positives on predicate functions
  'unicorn/consistent-class-member-order': 'off', // 🔴⚫ Conflicts with `@typescript-eslint/member-ordering` and most style guides
  'unicorn/consistent-function-scoping': 'warn', // 🔴🟠 Legitimate to co-locate helpers
  'unicorn/error-message': 'warn',
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
  'unicorn/no-null': 'off', // 🔴⚫
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
  'unicorn/prefer-dom-node-text-content': 'warn', // 🔴🟠
  'unicorn/prefer-includes': 'warn', // 🔴🟠
  'unicorn/prefer-math-min-max': 'off', // 🔴⚫ Ternary is often more readable than Math.min/Math.max
  'unicorn/prefer-node-protocol': 'warn', // 🔴🟠
  'unicorn/prefer-number-coercion': 'off', // 🔴⚫ Number() and parseInt() differ; the auto-fix can change behavior
  'unicorn/prefer-number-properties': 'warn', // 🔴🟠
  'unicorn/prefer-query-selector': 'warn', // 🔴🟠
  'unicorn/prefer-simple-condition-first': 'off', // 🔴⚫ Reorders conditions away from reading order; its unsafe report includes no fix
  'unicorn/prefer-simplified-conditions': 'off', // 🔴⚫ Rewrites guard clauses in ways that can reduce readability
  'unicorn/prefer-spread': 'off', // 🔴⚫
  'unicorn/prefer-string-raw': 'warn', // 🔴🟠
  'unicorn/prefer-string-replace-all': 'off', // 🔴⚫ Its auto-fixes are not yet trusted
  'unicorn/prefer-string-slice': 'warn', // 🔴🟠
  'unicorn/prefer-string-starts-ends-with': 'warn', // 🔴🟠
  'unicorn/prefer-ternary': 'warn', // 🔴🟠
  'unicorn/prefer-top-level-await': 'warn', // 🔴🟠
  'unicorn/prefer-type-error': 'warn', // 🔴🟠
  'unicorn/prevent-abbreviations': 'off', // 🔴⚫
  'unicorn/require-array-sort-compare': 'off', // 🔴⚫ Disallows cases when the default sort is desired
  'unicorn/single-line-block-comment-style': 'off', // 🔴⚫ Stylistic
  'unicorn/switch-case-braces': ['error', 'avoid'],
  'unicorn/text-encoding-identifier-case': 'warn', // 🔴🟠
};

const config = defineConfig({
  extends: [unicornPlugin.configs.recommended],
  rules,
});

export default config;
