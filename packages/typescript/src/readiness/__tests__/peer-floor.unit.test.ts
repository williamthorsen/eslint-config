import { describe, expect, it } from 'vitest';

import { comparePeer, judgePeerFloor, pickLowestVersion } from '../peer-floor.ts';

const owner = '@scope/owner';

describe(comparePeer, () => {
  it('pairs the floor of the range with the installed version', () => {
    expect(comparePeer({ installed: '10.2.0', name: 'eslint', owner, range: '>=10' })).toStrictEqual({
      floor: '10.0.0',
      installed: '10.2.0',
      kind: 'comparable',
      range: '>=10',
    });
  });

  it('reports a missing peer declaration', () => {
    expect(comparePeer({ installed: '10.2.0', name: 'eslint', owner, range: undefined })).toStrictEqual({
      kind: 'unknown',
      reason: '@scope/owner declares no eslint peer',
    });
  });

  it('reports a range that names no single floor', () => {
    expect(comparePeer({ installed: '10.2.0', name: 'eslint', owner, range: '^9 || ^10' })).toStrictEqual({
      kind: 'unknown',
      reason: 'peer range "^9 || ^10" names no single floor',
    });
  });

  it('reports a peer that is not installed', () => {
    expect(comparePeer({ installed: undefined, name: 'eslint', owner, range: '>=10' })).toStrictEqual({
      kind: 'unknown',
      reason: 'eslint is not installed',
    });
  });
});

describe(judgePeerFloor, () => {
  it('passes a version at or above the floor', () => {
    expect(judgePeerFloor({ floor: '10.0.0', installed: '10.0.0', kind: 'comparable', range: '>=10' })).toStrictEqual({
      ok: true,
      detail: '10.0.0 satisfies the >=10 peer range',
    });
  });

  it('fails a version below the floor', () => {
    expect(judgePeerFloor({ floor: '10.0.0', installed: '9.39.1', kind: 'comparable', range: '>=10' })).toStrictEqual({
      ok: false,
      detail: '9.39.1 is below the >=10 peer range',
    });
  });
});

describe(pickLowestVersion, () => {
  it('returns the lowest version by semver order, not string order', () => {
    expect(pickLowestVersion(['10.1.0', '9.2.0', '10.0.5'])).toBe('9.2.0');
  });

  it('returns undefined for no versions', () => {
    expect(pickLowestVersion([])).toBeUndefined();
  });
});
