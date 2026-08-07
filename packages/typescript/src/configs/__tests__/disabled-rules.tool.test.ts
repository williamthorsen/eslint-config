import { type Config } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { baseConfig } from '../../baseConfig.ts';
import { fixturesDir, lintFixture } from '../test-utils/lintFixture.ts';

// The base config enables `projectService` but leaves `tsconfigRootDir` to the consumer.
const typedParserSettings: Config = {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: fixturesDir,
    },
  },
};

// Building the TS program on a cold module cache runs well past Vitest's 5s default.
const COLD_START_TIMEOUT_MS = 20_000;

const disabledRuleIds = new Set(['unicorn/no-for-each', 'unicorn/prefer-simple-condition-first']);

describe('rules the base config disables', () => {
  it(
    'report nothing against a fixture that would trip them',
    async () => {
      const results = await lintFixture([...baseConfig, typedParserSettings], 'disabled-rules.ts');

      // A fixture that failed to parse reports no rule at all, which would satisfy the assertion below.
      expect(results[0]?.fatalErrorCount).toBe(0);

      const reported = results[0]?.messages.map((message) => message.ruleId) ?? [];

      expect(reported.filter((ruleId) => ruleId !== null && disabledRuleIds.has(ruleId))).toStrictEqual([]);
    },
    COLD_START_TIMEOUT_MS,
  );
});
