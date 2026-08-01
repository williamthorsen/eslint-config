import { describe, expect, it } from 'vitest';

import { createConfig } from '../../index.ts';
import { fixtureWiring, lintFixture } from './helpers.ts';

// Loading the plugin and building the TS program on a cold module cache runs past Vitest's 5s default.
const COLD_START_TIMEOUT_MS = 20_000;

// The config silences two rules that report on valid Vitest code. Assert the lint outcome rather than the config's
// shape: a shape assertion restates the source and passes forever, while this fails when a plugin upgrade renames an
// option or changes a default.
describe('createConfig.vitest rule corrections', () => {
  it(
    'reports nothing on the patterns the corrections permit',
    async () => {
      const composed = [fixtureWiring, ...(await createConfig.vitest())];

      const results = await lintFixture(composed, 'vitest-tuned.test.ts');

      // Map to rule ids so a regression names the rule that fired instead of reporting a length mismatch.
      expect(results[0]?.messages.map((message) => message.ruleId)).toStrictEqual([]);
    },
    COLD_START_TIMEOUT_MS,
  );
});
