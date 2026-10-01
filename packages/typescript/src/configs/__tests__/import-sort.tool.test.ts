import type { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { baseConfig } from '../../baseConfig.ts';
import { lintFixture, typedParserSettings } from '../test-utils/lintFixture.ts';

describe('the import-sort groups that the config sets', () => {
  // The fixture holds one import per group, in the configured order. A `#` import that no group claims falls
  // into the trailing catch-all after relative imports, and the rule reports the fixture as unsorted.
  it('sorts a `#` import after the alias groups and before relative imports', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'import-sort-groups.ts');

    expect(results[0]?.fatalErrorCount).toBe(0);
    expect(listSortMessages(results)).toStrictEqual([]);
  });
});

// region | Helpers

/** Collects the messages that `simple-import-sort/imports` reported against the first linted file. */
function listSortMessages(results: readonly ESLint.LintResult[]): string[] {
  const messages = results[0]?.messages ?? [];

  return messages
    .filter((message) => message.ruleId === 'simple-import-sort/imports')
    .map((message) => message.message);
}

// endregion | Helpers
