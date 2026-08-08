import { describe, expect, it } from 'vitest';

import { readVersionFloor } from '../readVersionFloor.ts';

describe(readVersionFloor, () => {
  it('pads a bare major or minor to a comparable three-part version', () => {
    expect(readVersionFloor('>=10')).toBe('10.0.0');
    expect(readVersionFloor('>=10.2')).toBe('10.2.0');
    expect(readVersionFloor('5')).toBe('5.0.0');
  });

  it('reads the floor through each comparator that sets a lower bound', () => {
    expect(readVersionFloor('^8.59.1')).toBe('8.59.1');
    expect(readVersionFloor('~4.2.0')).toBe('4.2.0');
    expect(readVersionFloor('>=10.8.0')).toBe('10.8.0');
    expect(readVersionFloor('10.8.0')).toBe('10.8.0');
  });

  it('tolerates surrounding whitespace', () => {
    expect(readVersionFloor('  >=10  ')).toBe('10.0.0');
  });

  // An invented floor would compare as though the consumer had declared something they did not.
  it('returns undefined for a range that names no single floor', () => {
    expect(readVersionFloor('*')).toBeUndefined();
    expect(readVersionFloor('')).toBeUndefined();
    expect(readVersionFloor('>=10 <12')).toBeUndefined();
    expect(readVersionFloor('^8 || ^9')).toBeUndefined();
    expect(readVersionFloor('workspace:*')).toBeUndefined();
  });

  // `>` and `<` exclude the version they name, so neither reduces to a floor the check can compare.
  it('returns undefined for an exclusive bound', () => {
    expect(readVersionFloor('>10')).toBeUndefined();
    expect(readVersionFloor('<12')).toBeUndefined();
  });
});
