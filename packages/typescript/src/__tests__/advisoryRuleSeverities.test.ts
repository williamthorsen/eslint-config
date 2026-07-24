import { describe, expect, it } from 'vitest';

import { advisoryRuleSeverities } from '../advisoryRuleSeverities.ts';
import baseConfig from '../index.ts';

// A key naming a rule this config does not set exempts nothing and reports nothing, so a rule renamed by a
// plugin major would otherwise hollow out the export silently.

describe('advisoryRuleSeverities', () => {
  it('names only rules the base config sets', () => {
    const configured = new Set(baseConfig.flatMap((block) => Object.keys(block.rules ?? {})));

    const unconfigured = Object.keys(advisoryRuleSeverities).filter((rule) => !configured.has(rule));

    expect(unconfigured).toEqual([]);
  });
});
