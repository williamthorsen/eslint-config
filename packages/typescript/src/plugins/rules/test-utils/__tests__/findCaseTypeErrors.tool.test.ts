import { describe, expect, it } from 'vitest';

import { findCaseTypeErrors } from '../findCaseTypeErrors.ts';

describe(findCaseTypeErrors, () => {
  it('reports nothing for a case using only the shapes the fixture declares', () => {
    const errors = findCaseTypeErrors([
      {
        code: 'declare function acquire(): Disposable; function run() { using resource = acquire(); }',
        label: 'valid[0]',
      },
    ]);

    expect(errors).toStrictEqual([]);
  });

  it('reports a case referencing an ambient the fixture does not declare', () => {
    const errors = findCaseTypeErrors([{ code: '[1, 2, 3].map((n) => console.log(n));', label: 'invalid[0]' }]);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.label).toBe('invalid[0]');
    expect(errors[0]?.code).toBe('[1, 2, 3].map((n) => console.log(n));');
    expect(errors[0]?.messages.join('\n')).toContain("TS2584: Cannot find name 'console'.");
  });

  it('reports a case that does not parse', () => {
    const errors = findCaseTypeErrors([{ code: 'const value = ;', label: 'valid[0]' }]);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.label).toBe('valid[0]');
  });

  it('typechecks each case in isolation from the others', () => {
    const errors = findCaseTypeErrors([
      {
        code: 'declare function acquire(): Disposable; function run() { using resource = acquire(); }',
        label: 'valid[0]',
      },
      { code: 'declare function acquire(): Disposable; function run() { void acquire(); }', label: 'valid[1]' },
    ]);

    expect(errors).toStrictEqual([]);
  });

  it('reports every offending case rather than stopping at the first', () => {
    const errors = findCaseTypeErrors([
      { code: 'console.log(1);', label: 'valid[0]' },
      { code: 'declare function acquire(): Disposable; void acquire();', label: 'valid[1]' },
      { code: 'console.log(2);', label: 'valid[2]' },
    ]);

    expect(errors.map((error) => error.label)).toStrictEqual(['valid[0]', 'valid[2]']);
  });

  it('reports nothing when handed no cases', () => {
    expect(findCaseTypeErrors([])).toStrictEqual([]);
  });
});
