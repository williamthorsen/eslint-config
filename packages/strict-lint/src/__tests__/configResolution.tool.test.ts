import { createTempTree, type TempTree } from '@williamthorsen/toolbelt.testing/candidate';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { readJsonReport, type ReportedResult, runCli } from '../test-utils/strictLintCli.ts';

// Each case runs `strict-lint` and `eslint` against one fixture and compares what they report, since the two must agree
// on which config governs a file. strict-lint runs as a subprocess, the way consumers run it; ESLint runs in process,
// and its own resolution is the reference that the CLI must match.

const ROOT_MARKER = 'pnpm-workspace.yaml';
const TARGET = 'packages/pkg/a.js';

describe('config resolution (subprocess)', () => {
  it('reports the rules eslint reports for a package with its own config', async () => {
    using tree = makeMonorepoFixture();

    const [reported, reference] = [collectStrictLintRuleIds(tree.dir), await collectEslintRuleIds(tree.dir)];

    expect(reported).toStrictEqual(reference);
  }, 30_000);

  it('applies the package config rather than the root config, run from the repo root', () => {
    using tree = makeMonorepoFixture();

    // The package turns `no-unused-vars` off and `no-console` on; the root config does neither.
    expect(collectStrictLintRuleIds(tree.dir)).toStrictEqual(['no-console']);
  }, 30_000);

  it('promotes the package config warning to an error', () => {
    using tree = makeMonorepoFixture();

    const [result] = collectStrictLintReport(tree.dir);

    expect(result?.messages[0]?.severity).toBe(2);
  }, 30_000);

  it('falls back to the root config for a file governed by no nearer config', () => {
    using tree = makeMonorepoFixture({ 'a.js': "const unused = 1;\nconsole.log('hi');\n" });

    const results = collectStrictLintReport(tree.dir, 'a.js');

    // No config is beside this file, so the root's `no-unused-vars` governs and `no-console` stays unset.
    expect(results[0]?.messages.map((message) => message.ruleId)).toStrictEqual(['no-unused-vars']);
  }, 30_000);
});

// region | Helpers

/** Returns the rule ids that ESLint itself reports, the reference that strict-lint must match. */
async function collectEslintRuleIds(cwd: string): Promise<Array<string | null>> {
  const results = await new ESLint({ cwd }).lintFiles([TARGET]);
  return results.flatMap((result) => result.messages.map((message) => message.ruleId));
}

/** Runs strict-lint on a target and returns the results from its JSON formatter output. */
function collectStrictLintReport(cwd: string, target: string = TARGET): ReportedResult[] {
  return readJsonReport(runCli(cwd, ['--format', 'json', target]));
}

/** Returns the rule ids that strict-lint reports, in the shape of the ESLint reference. */
function collectStrictLintRuleIds(cwd: string): Array<string | null> {
  return collectStrictLintReport(cwd).flatMap((result) => result.messages.map((message) => message.ruleId));
}

/** Writes the given files into a fresh temp tree with a project-root marker. */
function makeFixture(files: Record<string, string>): TempTree {
  return createTempTree({ [ROOT_MARKER]: '', ...files }, { prefix: 'strict-lint-cfg-' });
}

/** Writes a monorepo whose package config contradicts the root config, so that a divergence is observable. */
function makeMonorepoFixture(extraFiles: Record<string, string> = {}): TempTree {
  return makeFixture({
    'eslint.config.ts': "export default [{ rules: { 'no-unused-vars': 'warn' } }];\n",
    'packages/pkg/eslint.config.ts': "export default [{ rules: { 'no-unused-vars': 'off', 'no-console': 'warn' } }];\n",
    [TARGET]: "const unused = 1;\nconsole.log('hi');\n",
    ...extraFiles,
  });
}

// endregion | Helpers
