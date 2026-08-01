import { describe, expect, it } from 'vitest';

import { helper } from './vitest-untyped-helper.mjs';

// A string title naming an imported binding, which is the shape that reaches
// `prefer-describe-function-title`'s type lookup.
describe('helper', () => {
  it('runs under a parser that supplies no type information', () => {
    expect(helper()).toBe(1);
  });
});

// A function used as a title, which is the shape that reaches `valid-title`'s type lookup.
describe(helper, () => {
  it('runs under a parser that supplies no type information', () => {
    expect(helper()).toBe(1);
  });
});
