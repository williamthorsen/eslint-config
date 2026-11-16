import { describe, expect, it } from 'vitest';

import { baseConfig } from '#src/baseConfig.ts';
import { lintFixture, typedParserSettings } from '#src/test-utils/lintFixture.ts';

import { factoryCases } from '../test-utils/factoryCases.ts';

describe('createConfig preset load smoke tests', () => {
  it.each(factoryCases)(
    `$name: composes with the base config and lints without a rule-load error`,
    async ({ load, fixture }) => {
      // A rule that fails to instantiate (e.g. a removed ESLint 10 API) throws out of `lintText`, and a parse
      // failure fails the guard in `lintFixture`.
      await expect(lintFixture([...baseConfig, ...(await load()), typedParserSettings], fixture)).resolves.toHaveLength(
        1,
      );
    },
  );
});

describe('base config type-information wiring', () => {
  it('enables projectService so that type-aware rules work without a consumer-supplied project', () => {
    const enabled = baseConfig.some((entry) => enablesProjectService(entry.languageOptions?.['parserOptions']));

    expect(enabled).toBe(true);
  });
});

// region | Helpers

/** Reports whether parser options enable `projectService`, reading them as `unknown` because `Config` types them as `{}`. */
function enablesProjectService(parserOptions: unknown): boolean {
  return (
    typeof parserOptions === 'object' &&
    parserOptions !== null &&
    'projectService' in parserOptions &&
    parserOptions.projectService === true
  );
}

// endregion | Helpers
