import type { Linter } from 'eslint';
import tseslint, { type ConfigArray } from 'typescript-eslint';

// Modifications of rules that are not in the "recommended" config.
const modifiedStrictRules: Linter.RulesRecord = {
  'vitest/no-hooks': 'off', // default: 'error'
  'vitest/prefer-expect-assertions': 'off', // default: 'error'
};

async function createConfig(): Promise<ConfigArray> {
  const { default: vitestPlugin } = await import('@vitest/eslint-plugin');

  return tseslint.config({
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
