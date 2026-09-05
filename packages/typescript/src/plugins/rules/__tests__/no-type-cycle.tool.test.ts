import type { ESLint } from 'eslint';
import type { Config } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { fixtureWiring, lintFixture } from '../../../configs/test-utils/lintFixture.ts';
import { ensurePluginRules } from '../../../utils/ensurePluginRules.ts';
import noTypeCycleRule from '../no-type-cycle.ts';

const ruleId = 'sky-pilot/no-type-cycle';

// Only the rule under test is enabled, so a message from a neighbouring rule cannot be mistaken for one of its own.
const ruleConfig: Config = {
  plugins: {
    'sky-pilot': { rules: ensurePluginRules({ 'no-type-cycle': noTypeCycleRule }) },
  },
  rules: {
    [ruleId]: 'error',
  },
};

describe('sky-pilot/no-type-cycle', () => {
  it.each([
    ['a top-level type import', 'cycle-type-top-a.ts', './cycle-type-top-b.ts → ./cycle-type-top-a.ts'],
    ['an inline type import', 'cycle-type-inline-a.ts', './cycle-type-inline-b.ts → ./cycle-type-inline-a.ts'],
    ['a type import closing a value edge', 'cycle-mixed-a.ts', './cycle-mixed-b.ts → ./cycle-mixed-a.ts'],
    ['a top-level type re-export', 'cycle-reexport-a.ts', './cycle-reexport-b.ts → ./cycle-reexport-a.ts'],
    [
      'an inline type re-export',
      'cycle-reexport-inline-a.ts',
      './cycle-reexport-inline-b.ts → ./cycle-reexport-inline-a.ts',
    ],
    ['a type query', 'cycle-query-a.ts', './cycle-query-b.ts → ./cycle-query-a.ts'],
    ['three modules', 'cycle-triple-a.ts', './cycle-triple-b.ts → ./cycle-triple-c.ts → ./cycle-triple-a.ts'],
  ])('reports a cycle through %s, naming its chain', async (_edge, fixture, chain) => {
    const results = await lintFixture([fixtureWiring, ruleConfig], fixture);

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listCycleMessages(results)).toStrictEqual([`Dependency cycle through a type-only import: ${chain}`]);
  });

  it.each([
    [
      'a specifier ending in `.js` that names a `.ts` file',
      'cycle-jsext-a.ts',
      './cycle-jsext-b.ts → ./cycle-jsext-a.ts',
    ],
    ['a tsconfig `paths` alias', 'cycle-alias-a.ts', './cycle-alias-b.ts → ./cycle-alias-a.ts'],
  ])('follows %s, which the bundled import-x resolver does not reach', async (_specifier, fixture, chain) => {
    const results = await lintFixture([fixtureWiring, ruleConfig], fixture);

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listCycleMessages(results)).toStrictEqual([`Dependency cycle through a type-only import: ${chain}`]);
  });

  it.each([
    ['the import statement', 'cycle-triple-a.ts', 1],
    ['the type query', 'cycle-query-a.ts', 2],
  ])('reports on %s that begins the cycle', async (_site, fixture, line) => {
    const results = await lintFixture([fixtureWiring, ruleConfig], fixture);

    expect(results[0]?.messages.map((message) => [message.ruleId, message.line])).toStrictEqual([[ruleId, line]]);
  });

  it.each([
    ['an acyclic type graph', 'acyclic-type-a.ts'],
    ['a cycle whose every edge is a value edge, which import-x/no-cycle reports', 'cycle-value-a.ts'],
  ])('reports nothing for %s', async (_subject, fixture) => {
    const results = await lintFixture([fixtureWiring, ruleConfig], fixture);

    // A fixture that failed to parse reports no rule at all, which would satisfy the assertion below.
    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listCycleMessages(results)).toStrictEqual([]);
  });
});

// region | Helpers

/** Collects the messages the rule reported against the first linted file. */
function listCycleMessages(results: readonly ESLint.LintResult[]): string[] {
  const messages = results[0]?.messages ?? [];

  return messages.filter((message) => message.ruleId === ruleId).map((message) => message.message);
}

// endregion | Helpers
