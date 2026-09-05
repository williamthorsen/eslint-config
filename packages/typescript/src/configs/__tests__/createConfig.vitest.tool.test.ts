import type { Config } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { baseConfig } from '../../baseConfig.ts';
import { configs } from '../configs.ts';
import { createConfig } from '../createConfig.ts';
import { fixtureWiring, lintFixture } from '../test-utils/lintFixture.ts';

// No parser override, so the fixture is parsed by espree and carries no parser services.
const untypedWiring: Config = { files: ['**/*.mjs'] };

// The config silences two rules that report on valid Vitest code. Assert the lint outcome rather than the config's
// shape: a shape assertion restates the source and passes forever, while this fails when a plugin upgrade renames an
// option or changes a default. Each fixture also carries one expected report, so the absence of the silenced rules is
// distinguishable from a config that stopped matching the fixture, which would report nothing either way.
describe('createConfig.vitest rule corrections', () => {
  it('reports only the untouched rule on the patterns the corrections permit', async () => {
    const composed = [fixtureWiring, ...(await createConfig.vitest())];

    const results = await lintFixture(composed, 'vitest-tuned.test.ts');

    // Map to rule ids so a regression names the rule that fired instead of reporting a length mismatch.
    expect(results[0]?.messages.map((message) => message.ruleId)).toStrictEqual(['vitest/prefer-to-be']);
  });

  // The type-aware rules abort the run rather than degrading, so a carve-out regression surfaces here as a thrown
  // "requires type information" error out of `lintFixture`. The expected report is what separates that from a config
  // that stopped matching the fixture, which would also produce no throw and no messages.
  it('lints a JavaScript test file that no type-aware parser handles', async () => {
    const composed = [untypedWiring, ...(await createConfig.vitest())];

    const results = await lintFixture(composed, 'vitest-untyped.test.mjs');

    expect(results[0]?.messages.map((message) => message.ruleId)).toStrictEqual(['vitest/prefer-to-be']);
  });
});

// The shipped configs previously set vitest severities in two places, which drifted. Iterate the config set rather
// than naming the offender, so a preset that reintroduces the split is caught without a test edit. The default export
// carries a test-scoped rule block, which makes it the nearest config to a report on a test file.
describe('vitest rule ownership', () => {
  it('sets vitest rule severities in no shipped config but its own', async () => {
    const lazy = Object.entries(createConfig).filter(([name]) => name !== 'vitest');
    const loaded = await Promise.all(lazy.map(async ([name, load]) => [name, await load()] as const));

    const shipped: (readonly [string, readonly Config[]])[] = [
      ['baseConfig', baseConfig],
      ...Object.entries(configs),
      ...loaded,
    ];

    const offenders = shipped.flatMap(([name, blocks]) =>
      blocks.flatMap((block) =>
        Object.keys(block.rules ?? {})
          .filter((rule) => rule.startsWith('vitest/'))
          .map((rule) => `${name}: ${rule}`),
      ),
    );

    expect(offenders).toStrictEqual([]);
  });
});
