import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import { type ConfigArray } from 'typescript-eslint';

// Modifications of rules that are not in the "recommended" config.
const modifiedStrictRules: Linter.RulesRecord = {
  'vitest/max-expects': 'off', // 🟠⚫
  'vitest/no-hooks': 'off', // 🔴⚫
  'vitest/padding-around-all': 'off', // 🟠⚫
  'vitest/padding-around-expect-groups': 'off', // 🟠⚫
  'vitest/prefer-called-once': 'off', // conflicts with `vitest/prefer-called-times`
  'vitest/prefer-expect-assertions': 'off', // 🟠⚫
  'vitest/prefer-importing-vitest-globals': 'off', // 🟠⚫ falsely flags imported functions
  'vitest/prefer-lowercase-title': 'off', // 🟠⚫
};

async function createConfig(): Promise<ConfigArray> {
  const { default: vitestPlugin } = await import('@vitest/eslint-plugin');

  return defineConfig({
    extends: [vitestPlugin.configs.all],
    rules: {
      ...modifiedStrictRules,
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
  });
}

export default createConfig;
