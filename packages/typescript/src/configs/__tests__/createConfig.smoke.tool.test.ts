import { type Config } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { baseConfig } from '../../baseConfig.ts';
import { factoryCases } from '../test-utils/factoryCases.ts';
import { fixturesDir, lintFixture } from '../test-utils/lintFixture.ts';

// The base config enables `projectService` but leaves `tsconfigRootDir` to the consumer.
// Point it at the fixtures dir so composing with the base resolves the fixture tsconfig and
// exercises every type-aware rule for real.
const typedParserSettings: Config = {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: fixturesDir,
    },
  },
};

// The first case absorbs the cost of loading its plugin and building the TS program, which on a cold
// module cache runs to ~9s — well past Vitest's 5s default.
const COLD_START_TIMEOUT_MS = 20_000;

describe('createConfig preset load smoke tests', () => {
  it.each(factoryCases)(
    `$name: composes with the base config and lints without a rule-load error`,
    async ({ load, fixture }) => {
      const results = await lintFixture([...baseConfig, ...(await load()), typedParserSettings], fixture);

      // A rule that fails to instantiate (e.g. a removed ESLint 10 API) throws out of
      // `lintText`; a parser failure surfaces as a fatal message. Assert neither occurs.
      expect(results[0]?.fatalErrorCount).toBe(0);
    },
    COLD_START_TIMEOUT_MS,
  );
});

// `Config`'s `parserOptions` is typed as `{}`, so read `projectService` through an
// `unknown`-typed guard rather than the type assertion the repo's rules forbid.
function enablesProjectService(parserOptions: unknown): boolean {
  return (
    typeof parserOptions === 'object' &&
    parserOptions !== null &&
    'projectService' in parserOptions &&
    parserOptions.projectService === true
  );
}

describe('base config type-information wiring', () => {
  it('enables projectService so type-aware rules work without a consumer-supplied project', () => {
    const enabled = baseConfig.some((entry) => enablesProjectService(entry.languageOptions?.['parserOptions']));

    expect(enabled).toBe(true);
  });
});
