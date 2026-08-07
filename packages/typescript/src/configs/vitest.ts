import type { Linter } from 'eslint';
import { type Config, defineConfig } from 'eslint/config';

import { javaScriptFiles } from '../patterns.ts';

// Modifications of rules that are not in the "recommended" config.
const modifiedStrictRules: Linter.RulesRecord = {
  'vitest/max-expects': 'off', // 🟠⚫
  'vitest/no-hooks': 'off', // 🟠⚫
  'vitest/padding-around-all': 'off', // 🟠⚫
  'vitest/padding-around-expect-groups': 'off', // 🟠⚫
  'vitest/prefer-called-once': 'off', // conflicts with `vitest/prefer-called-times`
  'vitest/prefer-called-with': 'off', // fixer is defective
  'vitest/prefer-expect-assertions': 'off', // 🟠⚫
  'vitest/prefer-import-in-mock': 'off', // 🟠⚫ fixer is defective
  'vitest/prefer-importing-vitest-globals': 'off', // 🟠⚫ falsely flags imported functions
  'vitest/prefer-lowercase-title': 'off', // 🟠⚫
};
// Rules whose defaults report on valid Vitest code rather than on defects.
const correctedRules: Linter.RulesRecord = {
  // 🟠⚫ Demands `vi.fn<T>()` even when an implementation already types the mock, with no option to exempt that.
  'vitest/require-mock-type-parameters': 'off',
  // Vitest's `expect(actual, message)` is documented API, but the rule accepts a second argument only when it is a
  // string or template literal. Widening `maxArgs` admits a computed message; the severity restates the plugin's own.
  'vitest/valid-expect': ['warn', { maxArgs: 2 }],
};

// Rules that read type information. Each aborts the whole ESLint run instead of reporting when a file has no parser
// services, so none can reach a file the type-aware parser skips. The `settings.vitest.typecheck` this config sets is
// what opens the lookups in `valid-title` and `prefer-describe-function-title`.
const typeAwareRules: Linter.RulesRecord = {
  // Looks up a type when a string title names an imported binding.
  'vitest/prefer-describe-function-title': 'off',
  // Declares `requiresTypeChecking`, so it resolves parser services when the rule is created, before reading any code.
  'vitest/unbound-method': 'off',
  // Looks up the title's type on every `describe`, `test`, and `it`, whatever shape the title takes.
  'vitest/valid-title': 'off',
};

async function createConfig(): Promise<Config[]> {
  const { default: vitestPlugin } = await import('@vitest/eslint-plugin');

  return defineConfig(
    {
      extends: [vitestPlugin.configs.all],
      rules: { ...modifiedStrictRules, ...correctedRules },
      settings: {
        vitest: {
          typecheck: true,
        },
      },
    },
    {
      files: javaScriptFiles,
      rules: typeAwareRules,
    },
  );
}

export default createConfig;
