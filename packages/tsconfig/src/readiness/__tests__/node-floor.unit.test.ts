import { describe, expect, it } from 'vitest';

import { classifyNodeEsYear, findLowestNodeMajor, readNodeMajor } from '../node-floor.ts';

// Stands in for readyup's table, which covers even LTS majors from 18 upward.
const ES_YEAR_BY_MAJOR: Record<number, string | undefined> = { 18: 'es2022', 20: 'es2023', 22: 'es2024', 24: 'es2025' };

function esYearForMajor(major: number): string | undefined {
  return ES_YEAR_BY_MAJOR[major];
}

describe(classifyNodeEsYear, () => {
  it('reports the year for a major the table covers', () => {
    expect(classifyNodeEsYear(24, esYearForMajor)).toStrictEqual({ esYear: 'es2025', kind: 'exact' });
  });

  // A major below every entry implements less than the lowest year the table names.
  it('reports a major predating the table as under its lowest year', () => {
    expect(classifyNodeEsYear(16, esYearForMajor)).toStrictEqual({ esYear: 'es2022', kind: 'under' });
  });

  it('reports a major the table skips as unknown', () => {
    expect(classifyNodeEsYear(21, esYearForMajor)).toStrictEqual({ kind: 'unknown' });
  });

  it('reports a major postdating the table as unknown', () => {
    expect(classifyNodeEsYear(26, esYearForMajor)).toStrictEqual({ kind: 'unknown' });
  });

  it('reports every major as unknown when the table is empty', () => {
    expect(classifyNodeEsYear(16, () => undefined)).toStrictEqual({ kind: 'unknown' });
  });
});

describe(findLowestNodeMajor, () => {
  it('takes the lowest major any floor names', () => {
    expect(findLowestNodeMajor(['24', '22.11.0', '24.5'])).toBe(22);
  });

  it('ignores a floor naming no major', () => {
    expect(findLowestNodeMajor(['lts/*', '24'])).toBe(24);
  });

  it('returns undefined when no floor names a major', () => {
    expect(findLowestNodeMajor([])).toBeUndefined();
    expect(findLowestNodeMajor(['system', 'lts/*'])).toBeUndefined();
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
