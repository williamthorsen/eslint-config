import type { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { baseConfig } from '../../baseConfig.ts';
import { lintFixture, typedParserSettings } from '../test-utils/lintFixture.ts';

describe('the import-sort groups that the config sets', () => {
  // The fixture holds imports for every group, in the configured order and separated by the blank lines that the rule
  // expects between groups, so an import that lands in another group makes the rule report the fixture as unsorted.
  // `import-meta-resolve` is a package whose name starts with `import`, and the side-effect imports are out of
  // alphabetical order to show that the rule keeps their source order.
  it('sorts built-ins, packages, aliases, `#` imports, other absolute imports, relative imports, then side-effect imports', async () => {
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
