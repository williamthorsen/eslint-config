import { describe, expect, it } from 'vitest';

import {
  classifyNodeEsYear,
  findLowestNodeMajor,
  judgeNodeFloor,
  NO_BASE_ES_YEAR,
  readNodeMajor,
} from '../node-floor.ts';

// Stands in for readyup's table, which covers the even-numbered LTS majors from 18 upward.
const ES_YEAR_BY_MAJOR: Record<number, string | undefined> = { 18: 'es2022', 20: 'es2023', 22: 'es2024', 24: 'es2025' };

describe(classifyNodeEsYear, () => {
  it('reports the year for a major that the table covers', () => {
    expect(classifyNodeEsYear(24, esYearForMajor)).toStrictEqual({ esYear: 'es2025', kind: 'exact' });
  });

  it('reports a major predating the table as under its lowest year', () => {
    expect(classifyNodeEsYear(16, esYearForMajor)).toStrictEqual({ esYear: 'es2022', kind: 'under' });
  });

  it('reports a major that the table skips as unknown', () => {
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
  it('takes the lowest major named by any floor', () => {
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

describe(judgeNodeFloor, () => {
  it('skips when no base ES year is known', () => {
    expect(judgeNodeFloor(undefined, { esYear: 'es2025', kind: 'exact' })).toStrictEqual({
      kind: 'skip',
      reason: NO_BASE_ES_YEAR,
    });
  });

  it('skips when no declared Node floor names a major', () => {
    expect(judgeNodeFloor('es2025', undefined)).toStrictEqual({
      kind: 'skip',
      reason: 'no declared Node floor names a major',
    });
  });

  it('skips a major that the table does not cover', () => {
    expect(judgeNodeFloor('es2025', { kind: 'unknown' })).toStrictEqual({
      kind: 'skip',
      reason: 'no ES year is known for the declared Node floor',
    });
  });

  it('fails a major predating the table when the base year is at least the lowest known year', () => {
    expect(judgeNodeFloor('es2025', { esYear: 'es2022', kind: 'under' })).toStrictEqual({
      detail: "the declared Node floor implements less than es2022, below the base's es2025",
      kind: 'fail',
    });
  });

  // Such a major implements less than the lowest known year, which may still reach a base below it.
  it('skips a major predating the table when the base year is below the lowest known year', () => {
    expect(judgeNodeFloor('es2021', { esYear: 'es2022', kind: 'under' })).toStrictEqual({
      kind: 'skip',
      reason: 'no ES year is known for the declared Node floor',
    });
  });

  it('passes a major implementing the base year or later', () => {
    expect(judgeNodeFloor('es2025', { esYear: 'es2025', kind: 'exact' })).toStrictEqual({
      detail: 'the declared Node floor implements es2025',
      kind: 'pass',
    });
  });

  it('fails a major implementing a year below the base', () => {
    expect(judgeNodeFloor('es2025', { esYear: 'es2024', kind: 'exact' })).toStrictEqual({
      detail: "the declared Node floor implements only es2024, below the base's es2025",
      kind: 'fail',
    });
  });
});

describe(readNodeMajor, () => {
  it('reads the major from every version shape that a floor takes', () => {
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

// region | Helpers

function esYearForMajor(major: number): string | undefined {
  return ES_YEAR_BY_MAJOR[major];
}

// endregion | Helpers
