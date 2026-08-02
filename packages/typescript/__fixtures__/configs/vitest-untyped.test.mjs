import { describe, expect, it } from 'vitest';

import { helper } from './vitest-untyped-helper.mjs';

// A string title naming an imported binding, the shape `prefer-describe-function-title` looks up a type for.
describe('helper', () => {
  it('runs under a parser that supplies no type information', () => {
    expect(helper()).toBe(1);
  });

  it('reports a rule that needs no type information', () => {
    // A deep-equality matcher on a primitive trips `prefer-to-be`, so the lint result proves the config reached
    // this file. `toStrictEqual` rather than `toEqual`, which would trip `prefer-strict-equal` as well.
    expect(helper()).toStrictEqual(1);
  });
});

// A function title, which `valid-title` reaches through the same lookup it runs for every title shape.
describe(helper, () => {
  it('runs under a parser that supplies no type information', () => {
    expect(helper()).toBe(1);
  });
});
