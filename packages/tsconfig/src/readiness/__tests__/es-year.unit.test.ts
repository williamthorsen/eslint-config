import { describe, expect, it } from 'vitest';

import { isEsYearAtLeast, parseEsYear, readDeclaredEsYear } from '../es-year.ts';

describe(isEsYearAtLeast, () => {
  it('orders years by the year they name', () => {
    expect(isEsYearAtLeast('es2025', 'es2022')).toBe(true);
    expect(isEsYearAtLeast('es2022', 'es2025')).toBe(false);
  });

  it('admits a year equal to the floor', () => {
    expect(isEsYearAtLeast('es2025', 'es2025')).toBe(true);
  });
});

describe(parseEsYear, () => {
  it('normalizes a four-digit ES name, whatever its case', () => {
    expect(parseEsYear('ES2025')).toBe('es2025');
    expect(parseEsYear('es2022')).toBe('es2022');
  });

  // `esnext` names a moving level, and a suffixed lib names a feature group rather than a year.
  it('returns undefined for every name that carries no year', () => {
    expect(parseEsYear('esnext')).toBeUndefined();
    expect(parseEsYear('ESNext.Disposable')).toBeUndefined();
    expect(parseEsYear('ES2025.Iterator')).toBeUndefined();
    expect(parseEsYear('ES5')).toBeUndefined();
    expect(parseEsYear('DOM')).toBeUndefined();
  });
});

describe(readDeclaredEsYear, () => {
  it('reads the year from target', () => {
    expect(readDeclaredEsYear({ target: 'ES2025' })).toBe('es2025');
  });

  it('prefers target over lib', () => {
    expect(readDeclaredEsYear({ lib: ['ES2022'], target: 'ES2025' })).toBe('es2025');
  });

  it('falls back to lib when target names no year', () => {
    expect(readDeclaredEsYear({ lib: ['ES2025', 'ESNext.Disposable'], target: 'ESNext' })).toBe('es2025');
  });

  it('takes the highest year a lib list names', () => {
    expect(readDeclaredEsYear({ lib: ['ES2020', 'ES2024', 'DOM'] })).toBe('es2024');
  });

  it('returns undefined when neither option names a year', () => {
    expect(readDeclaredEsYear({})).toBeUndefined();
    expect(readDeclaredEsYear({ lib: ['ESNext.Disposable'], target: 'ESNext' })).toBeUndefined();
  });

  it('returns undefined for options of the wrong shape', () => {
    expect(readDeclaredEsYear({ lib: 'ES2025', target: ['ES2025'] })).toBeUndefined();
  });
});
