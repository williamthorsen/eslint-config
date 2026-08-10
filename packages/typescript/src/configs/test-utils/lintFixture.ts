import fs from 'node:fs';
import path from 'node:path';

import { ESLint, type Linter } from 'eslint';
import { type Config } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { assert } from 'vitest';

// Fixtures live outside `src` so the build neither compiles nor publishes them, and Vitest never collects
// the two that are deliberately named `*.test.*`.
export const fixturesDir = path.join(import.meta.dirname, '../../../__fixtures__/configs');

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

// Lint one fixture with the composed config and return the per-file results.
export async function lintFixture(composed: readonly Config[], fixture: string): Promise<ESLint.LintResult[]> {
  const eslint = new ESLint({
    cwd: fixturesDir,
    overrideConfigFile: true,
    overrideConfig: toLinterConfigs(composed),
  });

  const filePath = path.join(fixturesDir, fixture);

  // ESLint skips a file that no config's `files` glob matches, reporting a single notice in place of
  // any rule output. Results from a skipped file satisfy assertions without exercising the config.
  assert.isFalse(await eslint.isPathIgnored(filePath), `no composed config matches ${fixture}`);

  return eslint.lintText(fs.readFileSync(filePath, 'utf8'), { filePath });
}

// The base config enables `projectService` but leaves `tsconfigRootDir` to the consumer. Pointing it at the
// fixtures dir is what lets a composition with the base resolve the fixture tsconfig, so every type-aware
// rule runs for real.
export const typedParserSettings: Config = {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: fixturesDir,
    },
  },
};

// region | Helpers

// `new ESLint({ overrideConfig })` accepts `Linter.Config[]`, which models `languageOptions` with a
// nominally-incompatible index signature. Bridge only at that constructor — never on the factory
// results, whose assignability to `Config[]` is what the composability suite proves.
function toLinterConfigs(configs: readonly Config[]): Linter.Config[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- see comment above
  return configs as Linter.Config[];
}

// endregion | Helpers
