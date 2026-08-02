import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { ensurePluginRules } from '../../../utils/ensurePluginRules.ts';
import rule from '../no-unused-map.ts';

// The rule-tester conformance tables live in `no-unused-map.rules.test.ts`. This file holds the case no tester can
// produce: `Linter` runs its default parser (espree), which supplies no parser services at all.
describe('no-unused-map under a non-TypeScript parser', () => {
  it('applies the syntactic check instead of crashing', () => {
    const linter = new Linter();
    const messages = linter.verify('[1, 2, 3].map((n) => console.log(n));', {
      plugins: { 'sky-pilot': { rules: ensurePluginRules({ 'no-unused-map': rule }) } },
      rules: { 'sky-pilot/no-unused-map': 'error' },
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('unusedMap');
  });
});
