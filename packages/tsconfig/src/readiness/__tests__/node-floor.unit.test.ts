import { describe, expect, it } from 'vitest';

import { lowestNodeMajor, readNodeMajor } from '../node-floor.ts';

describe(lowestNodeMajor, () => {
  it('takes the lowest major any floor names', () => {
    expect(lowestNodeMajor(['24', '22.11.0', '24.5'])).toBe(22);
  });

  it('ignores a floor naming no major', () => {
    expect(lowestNodeMajor(['lts/*', '24'])).toBe(24);
  });

  it('returns undefined when no floor names a major', () => {
    expect(lowestNodeMajor([])).toBeUndefined();
    expect(lowestNodeMajor(['system', 'lts/*'])).toBeUndefined();
  });
});

describe(readNodeMajor, () => {
  it('reads the major from every version shape a floor takes', () => {
    expect(readNodeMajor('24')).toBe(24);
    expect(readNodeMajor('24.5')).toBe(24);
    expect(readNodeMajor('v22.11.0')).toBe(22);
    expect(readNodeMajor('  20.1.0  ')).toBe(20);
  });

  // A comparator or an alias names a range, not a version, so no single major follows.
  it('returns undefined for anything that is not a bare version', () => {
    expect(readNodeMajor('>=24')).toBeUndefined();
    expect(readNodeMajor('^24.0.0')).toBeUndefined();
    expect(readNodeMajor('lts/*')).toBeUndefined();
    expect(readNodeMajor('system')).toBeUndefined();
    expect(readNodeMajor('')).toBeUndefined();
  });
});
