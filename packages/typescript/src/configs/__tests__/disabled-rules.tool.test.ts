import type { Config } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { baseConfig } from '../../baseConfig.ts';
import { lintFixture, typedParserSettings } from '../test-utils/lintFixture.ts';

// Building the TS program on a cold module cache runs well past Vitest's 5s default.
const COLD_START_TIMEOUT_MS = 20_000;

const disabledRuleIds = ['unicorn/no-for-each', 'unicorn/prefer-simple-condition-first'];

const reEnabled: Config = {
  rules: Object.fromEntries(disabledRuleIds.map((ruleId) => [ruleId, 'error'])),
};

describe('rules the base config disables', () => {
  it(
    'report nothing against a fixture that would trip them',
    async () => {
      const results = await lintFixture([...baseConfig, typedParserSettings], 'disabled-rules.ts');

      // A fixture that failed to parse reports no rule at all, which would satisfy the assertion below.
      expect(results[0]?.fatalErrorCount).toBe(0);

      expect(reportedRuleIds(results).filter((ruleId) => disabledRuleIds.includes(ruleId))).toStrictEqual([]);
    },
    COLD_START_TIMEOUT_MS,
  );
});

describe('the fixture the disabled rules are measured against', () => {
  it(
    'trips every one of them once they are re-enabled',
    async () => {
      const results = await lintFixture([...baseConfig, typedParserSettings, reEnabled], 'disabled-rules.ts');

      const reported = reportedRuleIds(results);

      expect(disabledRuleIds.filter((ruleId) => !reported.includes(ruleId))).toStrictEqual([]);
    },
    COLD_START_TIMEOUT_MS,
  );
});

// region | Helpers

/** Collects the ids of the rules that reported against the first linted file. */
function reportedRuleIds(results: readonly { messages: { ruleId: string | null }[] }[]): string[] {
  const messages = results[0]?.messages ?? [];

  return messages.map((message) => message.ruleId).filter((ruleId) => ruleId !== null);
}

// endregion | Helpers
