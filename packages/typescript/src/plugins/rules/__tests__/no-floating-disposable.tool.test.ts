import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { ensurePluginRules } from '../../../utils/ensurePluginRules.ts';
import rule from '../no-floating-disposable.ts';

// The rule-tester conformance tables live in `no-floating-disposable.rules.tool.test.ts`. This file holds the case no
// tester can produce: `Linter` runs its default parser (espree), which supplies no parser services at all.
describe('no-floating-disposable under a non-TypeScript parser', () => {
  it('reports nothing, having no type information to read', () => {
    const linter = new Linter();
    const messages = linter.verify('acquire();', {
      plugins: { 'sky-pilot': { rules: ensurePluginRules({ 'no-floating-disposable': rule }) } },
      rules: { 'sky-pilot/no-floating-disposable': 'error' },
    });

    expect(messages).toHaveLength(0);
  });
});
