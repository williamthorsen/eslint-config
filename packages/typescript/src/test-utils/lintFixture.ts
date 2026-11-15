import fs from 'node:fs';
import path from 'node:path';

import { ESLint } from 'eslint';
import type { Config } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { assert } from 'vitest';

import { toLinterConfigs } from './toLinterConfigs.ts';

/** Fails when ESLint could not parse `name`, whose results would otherwise report no rule and pass vacuously. */
export function assertParsed(results: readonly ESLint.LintResult[], name: string): void {
  for (const result of results) {
    const fatal = result.messages.find((message) => message.fatal === true);
    assert.strictEqual(result.fatalErrorCount, 0, `${name} failed to parse: ${fatal?.message ?? 'unknown error'}`);
  }
}

export const fixturesDir = path.join(import.meta.dirname, '../../__fixtures__/configs');

// Opts the fixture extensions into linting and wires the typescript-eslint parser with a project, so that a
// composed config runs against the fixture instead of skipping it as matched by no `files` glob.
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

/** Lints one fixture with the composed config and returns the per-file results. */
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

  const results = await eslint.lintText(fs.readFileSync(filePath, 'utf8'), { filePath });
  assertParsed(results, fixture);

  return results;
}

/** Collects the messages that the rule reported against the linted files. */
export function listRuleMessages(results: readonly ESLint.LintResult[], ruleId: string): string[] {
  return results.flatMap((result) =>
    result.messages.filter((message) => message.ruleId === ruleId).map((message) => message.message),
  );
}

// The base config enables `projectService` but leaves `tsconfigRootDir` to the consumer. Pointing it at the
// fixtures dir lets a composition with the base resolve the fixture tsconfig, so every type-aware rule runs
// for real.
export const typedParserSettings: Config = {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: fixturesDir,
    },
  },
};
