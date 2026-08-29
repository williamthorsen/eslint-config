import type { RunTests } from '@typescript-eslint/rule-tester';
import { describe, expect, it } from 'vitest';

import { assertCasesTypecheck } from '../ruleTester.ts';

const acquire = 'declare function acquire(): Disposable;';

describe(assertCasesTypecheck, () => {
  it('accepts a suite whose code uses only the shapes the fixture declares', () => {
    expect(() =>
      assertCasesTypecheck('no-floating-disposable', {
        invalid: [{ code: `${acquire} acquire();`, errors: [{ messageId: 'floatingDisposable' }] }],
        valid: [`${acquire} void acquire();`],
      }),
    ).not.toThrow();
  });

  it('names the rule, each offending position, and its diagnostics', () => {
    // Both list forms are exercised: `valid` accepts a bare string, `invalid` an object.
    const tests: RunTests<'floatingDisposable', []> = {
      invalid: [{ code: 'console.info(2);', errors: [{ messageId: 'floatingDisposable' }] }],
      valid: [`${acquire} void acquire();`, 'console.info(1);'],
    };

    expect(() => assertCasesTypecheck('no-floating-disposable', tests)).toThrow(
      /no-floating-disposable[\s\S]*valid\[1\]: console\.info\(1\);[\s\S]*TS2584[\s\S]*invalid\[0\]: console\.info\(2\);/,
    );
  });

  it('holds a fixer output to the program', () => {
    const tests: RunTests<'floatingDisposable', []> = {
      invalid: [{ code: `${acquire} acquire();`, errors: [{ messageId: 'floatingDisposable' }], output: 'missing();' }],
      valid: [],
    };

    expect(() => assertCasesTypecheck('no-floating-disposable', tests)).toThrow(/invalid\[0\]\.output: missing\(\);/);
  });

  it('holds each pass of a multi-pass fixer output to the program', () => {
    const tests: RunTests<'floatingDisposable', []> = {
      invalid: [
        {
          code: `${acquire} acquire();`,
          errors: [{ messageId: 'floatingDisposable' }],
          output: [`${acquire} void acquire();`, 'missing();'],
        },
      ],
      valid: [],
    };

    expect(() => assertCasesTypecheck('no-floating-disposable', tests)).toThrow(
      /invalid\[0\]\.output\[1\]: missing\(\);/,
    );
  });

  it('holds a suggestion output to the program', () => {
    const tests: RunTests<'floatingDisposable', []> = {
      invalid: [
        {
          code: `${acquire} acquire();`,
          errors: [
            {
              messageId: 'floatingDisposable',
              suggestions: [{ messageId: 'floatingDisposable', output: 'missing();' }],
            },
          ],
        },
      ],
      valid: [],
    };

    expect(() => assertCasesTypecheck('no-floating-disposable', tests)).toThrow(
      /invalid\[0\]\.errors\[0\]\.suggestions\[0\]\.output: missing\(\);/,
    );
  });
});
