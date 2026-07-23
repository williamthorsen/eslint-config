import fs from 'node:fs';
import path from 'node:path';

import { ESLint, type Linter } from 'eslint';
import { type Config } from 'eslint/config';
import tseslint from 'typescript-eslint';

import { createConfig } from '../../index.ts';

export const fixturesDir = path.join(import.meta.dirname, 'fixtures');

// Opt the fixture extensions into linting and wire the typescript-eslint parser with a project, so a
// composed config runs against the fixture instead of being skipped as unmatched by any `files` glob.
export const fixtureWiring: Config = {
  files: ['**/*.ts', '**/*.tsx'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: fixturesDir,
    },
  },
};

// `new ESLint({ overrideConfig })` accepts `Linter.Config[]`, which models `languageOptions` with a
// nominally-incompatible index signature. Bridge only at that constructor — never on the factory
// results, whose assignability to `Config[]` is what the composability suite proves.
export function toLinterConfigs(configs: readonly Config[]): Linter.Config[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- see comment above
  return configs as Linter.Config[];
}

// Lint one fixture with the composed config and return the per-file results.
export async function lintFixture(composed: readonly Config[], fixture: string): Promise<ESLint.LintResult[]> {
  const eslint = new ESLint({
    cwd: fixturesDir,
    overrideConfigFile: true,
    overrideConfig: toLinterConfigs(composed),
  });

  const filePath = path.join(fixturesDir, fixture);

  return eslint.lintText(fs.readFileSync(filePath, 'utf8'), { filePath });
}

export const factoryCases: { name: string; load: () => Promise<Config[]>; fixture: string }[] = [
  { name: 'jsxA11y', load: createConfig.jsxA11y, fixture: 'component.tsx' },
  { name: 'next', load: createConfig.next, fixture: 'component.tsx' },
  { name: 'react', load: createConfig.react, fixture: 'component.tsx' },
  { name: 'reactTestingLibrary', load: createConfig.reactTestingLibrary, fixture: 'Component.test.tsx' },
  { name: 'vitest', load: createConfig.vitest, fixture: 'example.test.ts' },
];
