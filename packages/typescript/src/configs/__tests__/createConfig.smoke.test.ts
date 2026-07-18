import fs from 'node:fs';
import path from 'node:path';

import { ESLint, type Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import baseConfig, { createConfig } from '../../index.ts';

const fixturesDir = path.join(import.meta.dirname, 'fixtures');

// The base config enables `projectService` but leaves `tsconfigRootDir` to the consumer.
// Point it at the fixtures dir so composing with the base resolves the fixture tsconfig and
// exercises every type-aware rule for real.
const typedParserSettings: Linter.Config = {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: fixturesDir,
    },
  },
};

// typescript-eslint's `ConfigArray` and eslint's `Linter.Config` model `languageOptions` with
// structurally-equivalent but nominally-incompatible index signatures. typescript-eslint's
// guidance is to bridge the misalignment at the boundary (see utils/ensureExtendsElement.ts).
function toLinterConfigs(configs: readonly unknown[]): Linter.Config[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- see comment above
  return configs as Linter.Config[];
}

type ConfigLoader = () => Promise<unknown>;

const cases: { name: string; load: ConfigLoader; fixture: string }[] = [
  { name: 'react', load: createConfig.react, fixture: 'component.tsx' },
  { name: 'jsxA11y', load: createConfig.jsxA11y, fixture: 'component.tsx' },
  { name: 'next', load: createConfig.next, fixture: 'component.tsx' },
  { name: 'reactTestingLibrary', load: createConfig.reactTestingLibrary, fixture: 'Component.test.tsx' },
  { name: 'vitest', load: createConfig.vitest, fixture: 'example.test.ts' },
];

describe('createConfig preset load smoke tests', () => {
  for (const { name, load, fixture } of cases) {
    it(`${name}: composes with the base config and lints without a rule-load error`, async () => {
      const factoryConfig = await load();
      const factoryConfigs = Array.isArray(factoryConfig) ? factoryConfig : [factoryConfig];
      const composed = toLinterConfigs([...baseConfig, ...factoryConfigs, typedParserSettings]);

      const eslint = new ESLint({
        cwd: fixturesDir,
        overrideConfigFile: true,
        overrideConfig: composed,
      });

      const filePath = path.join(fixturesDir, fixture);
      const source = fs.readFileSync(filePath, 'utf8');

      // A rule that fails to instantiate (e.g. a removed ESLint 10 API) throws out of
      // `lintText`; a parser failure surfaces as a fatal message. Assert neither occurs.
      const results = await eslint.lintText(source, { filePath });

      expect(results[0]?.fatalErrorCount).toBe(0);
    });
  }
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
    const enabled = baseConfig.some((entry) => enablesProjectService(entry.languageOptions?.parserOptions));

    expect(enabled).toBe(true);
  });
});
