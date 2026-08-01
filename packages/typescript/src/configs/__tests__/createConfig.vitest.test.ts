import type { Config } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { configs, createConfig } from '../../index.ts';
import { fixtureWiring, lintFixture } from './helpers.ts';

// No parser override, so the fixture is parsed by espree and carries no parser services.
const untypedWiring: Config = { files: ['**/*.mjs'] };

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

  // The type-aware rules abort the run rather than degrading, so a regression surfaces here as a thrown
  // "requires type information" error out of `lintFixture`, not as an assertion failure.
  it(
    'lints a JavaScript test file that no type-aware parser handles',
    async () => {
      const composed = [untypedWiring, ...(await createConfig.vitest())];

      const results = await lintFixture(composed, 'vitest-untyped.test.mjs');

      expect(results[0]?.messages.map((message) => message.ruleId)).toStrictEqual([]);
    },
    COLD_START_TIMEOUT_MS,
  );
});

// The shipped configs previously set vitest severities in two places, which drifted. Iterate the config set rather
// than naming the offender, so a preset that reintroduces the split is caught without a test edit.
describe('vitest rule ownership', () => {
  it(
    'sets vitest rule severities in no shipped config but its own',
    async () => {
      const lazy = Object.entries(createConfig).filter(([name]) => name !== 'vitest');
      const loaded = await Promise.all(lazy.map(async ([name, load]) => [name, await load()] as const));

      const offenders = [...Object.entries(configs), ...loaded].flatMap(([name, blocks]) =>
        blocks.flatMap((block) =>
          Object.keys(block.rules ?? {})
            .filter((rule) => rule.startsWith('vitest/'))
            .map((rule) => `${name}: ${rule}`),
        ),
      );

      expect(offenders).toStrictEqual([]);
    },
    COLD_START_TIMEOUT_MS,
  );
});
