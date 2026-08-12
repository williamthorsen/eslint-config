import { describe, expect, it } from 'vitest';

import { describeRootSource } from '../describeRootSource.ts';

describe(describeRootSource, () => {
  it('names the marker that chose the root', () => {
    expect(describeRootSource({ marker: 'pnpm-lock.yaml', rootDir: '/project', source: 'marker' })).toBe(
      'marker: pnpm-lock.yaml',
    );
  });

  it.each([
    ['package-json', 'nearest package.json'],
    ['start-dir', 'no project marker; using the start directory'],
  ] as const)('names the %s fallback, which no marker chose', (source, expected) => {
    expect(describeRootSource({ marker: null, rootDir: '/project', source })).toBe(expected);
  });
});
