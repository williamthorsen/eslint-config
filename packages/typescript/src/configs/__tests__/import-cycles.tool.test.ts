import type { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { baseConfig } from '../../baseConfig.ts';
import { lintFixture, typedParserSettings } from '../test-utils/lintFixture.ts';

// `settings['import-x/extensions']` is what lets the rule's module graph open a TypeScript file at all, and
// the resolver alias is what lets a specifier written `./b.js` name one.

describe('the cycle rule the import config sets', () => {
  it.each([
    ['the TypeScript extension', 'cycle-value-a.ts'],
    ['a `.js` extension naming a TypeScript file', 'cycle-jsvalue-a.ts'],
  ])('reports a cycle among value imports spelled with %s', async (_spelling, fixture) => {
    const results = await lintFixture([...baseConfig, typedParserSettings], fixture);

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listCycleMessages(results)).toStrictEqual(['Dependency cycle detected']);
  });

  // `import-x/no-cycle` skips a statement whose specifiers are all types, through one code path for the
  // top-level spelling and another for the inline one, so a cycle reachable only through them goes
  // unreported. These cases pin the gap `sky-pilot/no-type-cycle` covers: if upstream ever starts reporting
  // a type edge, they fail, and the division of ground between the two rules is what needs revisiting.
  // The inline spelling survives here although `consistent-type-imports` rewrites it to the top-level one,
  // because the rule keeps a separate path for it and a consumer may have that rule off.
  it.each([
    ['top-level', 'cycle-type-top-a.ts'],
    ['inline', 'cycle-type-inline-a.ts'],
  ])('reports nothing for a cycle among %s type-only imports', async (_spelling, fixture) => {
    const results = await lintFixture([...baseConfig, typedParserSettings], fixture);

    // A fixture that failed to parse reports no rule at all, which would satisfy the assertion below.
    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listCycleMessages(results)).toStrictEqual([]);
  });
});

// region | Helpers

/** Collects the messages `import-x/no-cycle` reported against the first linted file. */
function listCycleMessages(results: readonly ESLint.LintResult[]): string[] {
  const messages = results[0]?.messages ?? [];

  return messages.filter((message) => message.ruleId === 'import-x/no-cycle').map((message) => message.message);
}

// endregion | Helpers
