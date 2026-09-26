import { describe, expect, it } from 'vitest';

import { advisoryRuleSeverities } from '../advisoryRuleSeverities.ts';
import { baseConfig } from '../baseConfig.ts';

// A key naming a rule that this config does not set exempts nothing and reports nothing, so a rule renamed by a
// plugin major would otherwise leave an entry in the export that silently does nothing.

describe('advisoryRuleSeverities', () => {
  it('names only rules that the base config sets', () => {
    const configured = new Set(baseConfig.flatMap((block) => Object.keys(block.rules ?? {})));

    const unconfigured = Object.keys(advisoryRuleSeverities).filter((rule) => !configured.has(rule));

    expect(unconfigured).toStrictEqual([]);
  });
});
