import { describe, expect, it, vi } from 'vitest';

// Exercises the two corrections `configs/vitest.ts` declares: a mock typed by its implementation rather than by a
// type parameter, and an `expect` message built by a call rather than written as a literal. Both are valid Vitest,
// and both report under the plugin's own defaults.
describe('patterns the vitest config corrections permit', () => {
  it('accepts a mock typed by its implementation', () => {
    const double = vi.fn((value: number) => value * 2);

    expect(double(2)).toBe(4);
  });

  it('accepts an expect message built by a call', () => {
    const actual = 1;

    expect(actual, describeFailure(actual)).toBe(1);
  });
});

function describeFailure(value: number): string {
  return `expected 1, received ${value}`;
}
