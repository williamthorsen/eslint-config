import { describe, expect, it } from 'vitest';

import { baseConfig } from '../../baseConfig.ts';
import { factoryCases } from '../test-utils/factoryCases.ts';
import { lintFixture, typedParserSettings } from '../test-utils/lintFixture.ts';

describe('createConfig preset load smoke tests', () => {
  it.each(factoryCases)(
    `$name: composes with the base config and lints without a rule-load error`,
    async ({ load, fixture }) => {
      const results = await lintFixture([...baseConfig, ...(await load()), typedParserSettings], fixture);

      // A rule that fails to instantiate (e.g. a removed ESLint 10 API) throws out of
      // `lintText`; a parser failure produces a fatal message. Assert neither occurs.
      expect(results[0]?.fatalErrorCount).toBe(0);
    },
  );
});

/** Reports whether parser options enable `projectService`, reading them as `unknown` because `Config` types them as `{}`. */
function enablesProjectService(parserOptions: unknown): boolean {
  return (
    typeof parserOptions === 'object' &&
    parserOptions !== null &&
    'projectService' in parserOptions &&
    parserOptions.projectService === true
  );
}

describe('base config type-information wiring', () => {
  it('enables projectService so that type-aware rules work without a consumer-supplied project', () => {
    const enabled = baseConfig.some((entry) => enablesProjectService(entry.languageOptions?.['parserOptions']));

    expect(enabled).toBe(true);
  });
});
