import { describe, expect, it } from 'vitest';

import { formatCaseTypeErrors } from '../ruleTester.ts';

describe(formatCaseTypeErrors, () => {
  it('names the rule, each offending case, and its diagnostics', () => {
    const message = formatCaseTypeErrors('no-unused-map', [
      {
        code: '[1, 2, 3].map((n) => console.log(n));',
        label: 'invalid[0]',
        messages: ["TS2584: Cannot find name 'console'."],
      },
    ]);

    expect(message).toContain('no-unused-map');
    expect(message).toContain('invalid[0]: [1, 2, 3].map((n) => console.log(n));');
    expect(message).toContain("TS2584: Cannot find name 'console'.");
  });

  it('reports every offending case rather than only the first', () => {
    const message = formatCaseTypeErrors('no-unused-map', [
      { code: 'console.log(1);', label: 'valid[0]', messages: ['TS2584'] },
      { code: 'console.log(2);', label: 'valid[2]', messages: ['TS2584'] },
    ]);

    expect(message).toContain('valid[0]: console.log(1);');
    expect(message).toContain('valid[2]: console.log(2);');
  });
});
