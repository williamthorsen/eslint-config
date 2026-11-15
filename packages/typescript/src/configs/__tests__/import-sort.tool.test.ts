import { describe, expect, it } from 'vitest';

import { baseConfig } from '#src/baseConfig.ts';

import { lintFixture, listRuleMessages, typedParserSettings } from '../test-utils/lintFixture.ts';

describe('the import-sort groups that the config sets', () => {
  // The fixture holds imports for every group, in the configured order and separated by the blank lines that the rule
  // expects between groups, so an import that lands in another group makes the rule report the fixture as unsorted.
  // `import-meta-resolve` is a package whose name starts with `import`, and the side-effect imports are out of
  // alphabetical order to show that the rule keeps their source order.
  it('sorts built-ins, packages, aliases, `#` imports, other absolute imports, relative imports, then side-effect imports', async () => {
    const results = await lintFixture([...baseConfig, typedParserSettings], 'import-sort-groups.ts');

    expect(listRuleMessages(results, 'simple-import-sort/imports')).toStrictEqual([]);
  });
});
