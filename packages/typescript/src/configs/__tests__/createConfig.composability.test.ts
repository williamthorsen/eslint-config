import assert from 'node:assert';

import { defineConfig } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { createConfig } from '../../index.ts';
import { skyPilot } from '../../plugins/index.ts';
import { factoryCases, fixtureWiring, lintFixture } from './helpers.ts';

// Every composition below passes a factory result to `defineConfig()` with no type assertion. A
// factory that regressed to a typescript-eslint-typed return would fail to compile here, which is
// the type-level half of the contract; the runtime lint is the other half.
describe('createConfig composability with defineConfig', () => {
  for (const { name, load, fixture } of factoryCases) {
    it(`${name}: composes as a direct defineConfig() argument and lints the fixture`, async () => {
      const composed = defineConfig(fixtureWiring, ...(await load()));

      const results = await lintFixture(composed, fixture);

      expect(results[0]?.fatalErrorCount).toBe(0);
    });

    it(`${name}: composes through defineConfig()'s extends and lints the fixture`, async () => {
      const composed = defineConfig(fixtureWiring, { extends: await load() });

      const results = await lintFixture(composed, fixture);

      expect(results[0]?.fatalErrorCount).toBe(0);
    });
  }
});

// Pin that the plugin's rules actually reach the linter through both composition forms — the
// fatal-error check above passes even for a composition that dropped them.
describe('createConfig.next carries the plugin rules', () => {
  for (const form of ['direct argument', 'extends'] as const) {
    it(`applies a @next/next rule when composed via ${form}`, async () => {
      const next = await createConfig.next();
      const composed =
        form === 'extends' ? defineConfig(fixtureWiring, { extends: next }) : defineConfig(fixtureWiring, ...next);

      const results = await lintFixture(composed, 'next-img.tsx');

      expect(results[0]?.messages.map((message) => message.ruleId)).toContain('@next/next/no-img-element');
    });
  }
});

describe('plugins subpath composability with defineConfig', () => {
  it('composes the exported plugin config through extends and applies its rules', async () => {
    const composed = defineConfig(fixtureWiring, { extends: [skyPilot.default.configs.recommended] });

    const results = await lintFixture(composed, 'unused-map.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(results[0]?.messages.map((message) => message.ruleId)).toContain('sky-pilot/no-unused-map');
  });

  it('composes the exported plugin under a plugins key and applies its rules', async () => {
    // `Config['plugins']` is optional, so narrow rather than assert — the repo forbids assertions.
    const skyPilotPlugin = skyPilot.default.configs.recommended.plugins?.['sky-pilot'];
    assert.ok(skyPilotPlugin, 'the recommended config must register the sky-pilot plugin');

    const composed = defineConfig(fixtureWiring, {
      plugins: { 'sky-pilot': skyPilotPlugin },
      rules: { 'sky-pilot/no-unused-map': 'warn' },
    });

    const results = await lintFixture(composed, 'unused-map.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(results[0]?.messages.map((message) => message.ruleId)).toContain('sky-pilot/no-unused-map');
  });
});
