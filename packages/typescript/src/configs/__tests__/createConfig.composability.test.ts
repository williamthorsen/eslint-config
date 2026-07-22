import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import { ESLint, type Linter } from 'eslint';
import { type Config, defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import { createConfig } from '../../index.ts';
import { skyPilot } from '../../plugins/index.ts';

const fixturesDir = path.join(import.meta.dirname, 'fixtures');

// The base config enables `projectService` but leaves `tsconfigRootDir` to the consumer.
// Point it at the fixtures dir so the composed config resolves the fixture tsconfig.
const typedParserSettings: Config = {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: fixturesDir,
    },
  },
};

// `new ESLint({ overrideConfig })` accepts `Linter.Config[]`, which models `languageOptions` with a
// nominally-incompatible index signature. Bridge only at that constructor — never on the factory
// results themselves, whose assignability to `Config[]` is what this suite exists to prove.
function toLinterConfigs(configs: readonly Config[]): Linter.Config[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- see comment above
  return configs as Linter.Config[];
}

async function lintFixture(composed: readonly Config[], fixture: string): Promise<ESLint.LintResult[]> {
  const eslint = new ESLint({
    cwd: fixturesDir,
    overrideConfigFile: true,
    overrideConfig: toLinterConfigs(composed),
  });

  const filePath = path.join(fixturesDir, fixture);

  return eslint.lintText(fs.readFileSync(filePath, 'utf8'), { filePath });
}

const cases: { name: string; load: () => Promise<Config[]>; fixture: string }[] = [
  { name: 'jsxA11y', load: createConfig.jsxA11y, fixture: 'component.tsx' },
  { name: 'next', load: createConfig.next, fixture: 'component.tsx' },
  { name: 'react', load: createConfig.react, fixture: 'component.tsx' },
  { name: 'reactTestingLibrary', load: createConfig.reactTestingLibrary, fixture: 'Component.test.tsx' },
  { name: 'vitest', load: createConfig.vitest, fixture: 'example.test.ts' },
];

// Every composition below passes a factory result to `defineConfig()` with no type assertion. A
// factory that regressed to a typescript-eslint-typed return would fail to compile here, which is
// the type-level half of the contract; the runtime lint is the other half.
describe('createConfig composability with defineConfig', () => {
  for (const { name, load, fixture } of cases) {
    it(`${name}: composes as a direct defineConfig() argument and lints the fixture`, async () => {
      const composed = defineConfig(...(await load()), typedParserSettings);

      const results = await lintFixture(composed, fixture);

      expect(results[0]?.fatalErrorCount).toBe(0);
    });

    it(`${name}: composes through defineConfig()'s extends and lints the fixture`, async () => {
      const composed = defineConfig({ extends: await load() }, typedParserSettings);

      const results = await lintFixture(composed, fixture);

      expect(results[0]?.fatalErrorCount).toBe(0);
    });
  }
});

// `skyPilot.configs.recommended` includes a type-aware rule, so exercising it at runtime needs the
// typescript-eslint parser and a resolvable project — the same wiring a consumer already has.
const typeAwareFixtureSettings: Config = {
  files: ['**/*.ts'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: fixturesDir,
    },
  },
};

describe('plugins subpath composability with defineConfig', () => {
  it('composes the exported plugin config through extends and applies its rules', async () => {
    const composed = defineConfig(typeAwareFixtureSettings, { extends: [skyPilot.default.configs.recommended] });

    const results = await lintFixture(composed, 'unused-map.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(results[0]?.messages.map((message) => message.ruleId)).toContain('sky-pilot/no-unused-map');
  });

  it('composes the exported plugin under a plugins key and applies its rules', async () => {
    // `Config['plugins']` is optional, so narrow rather than assert — the repo forbids assertions.
    const skyPilotPlugin = skyPilot.default.configs.recommended.plugins?.['sky-pilot'];
    assert.ok(skyPilotPlugin, 'the recommended config must register the sky-pilot plugin');

    const composed = defineConfig(typeAwareFixtureSettings, {
      plugins: { 'sky-pilot': skyPilotPlugin },
      rules: { 'sky-pilot/no-unused-map': 'warn' },
    });

    const results = await lintFixture(composed, 'unused-map.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(results[0]?.messages.map((message) => message.ruleId)).toContain('sky-pilot/no-unused-map');
  });
});
