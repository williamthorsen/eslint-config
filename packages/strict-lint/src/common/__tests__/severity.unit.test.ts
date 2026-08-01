import { describe, expect, it } from 'vitest';

import { allowsPromotion, formatRuleSeverities, isRuleSeverity } from '../severity.ts';

describe(isRuleSeverity, () => {
  it.each(['off', 'warn', 'error', 0, 1, 2])('accepts the severity %o', (severity) => {
    expect(isRuleSeverity(severity)).toBe(true);
  });

  it.each([undefined, null, 3, -1, 'ERROR', 'Warn', '', 'none', ['warn'], { severity: 'warn' }])(
    'rejects %o',
    (value) => {
      expect(isRuleSeverity(value)).toBe(false);
    },
  );
});

describe(allowsPromotion, () => {
  it.each([undefined, 'error', 2] as const)('permits promotion under the ceiling %o', (ceiling) => {
    expect(allowsPromotion(ceiling)).toBe(true);
  });

  it.each(['off', 'warn', 0, 1] as const)('blocks promotion under the ceiling %o', (ceiling) => {
    expect(allowsPromotion(ceiling)).toBe(false);
  });
});

describe(formatRuleSeverities, () => {
  it('renders the accepted vocabulary as a prose list', () => {
    expect(formatRuleSeverities()).toBe('"off", "warn", "error", 0, 1, or 2');
  });
});
