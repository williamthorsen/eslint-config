import { makeTsconfigChainEntry } from 'readyup/testing';
import { describe, expect, it } from 'vitest';

import { findEsYearMismatches, isEsYearAtLeast, parseEsYear, readDeclaredEsYear } from '../es-year.ts';

const BASE_ENTRY = makeTsconfigChainEntry({
  compilerOptions: { lib: ['ES2025', 'ESNext.Disposable'], target: 'ES2025' },
  path: 'packages/tsconfig/tsconfig.base.json',
  specifier: '@williamthorsen/tsconfig/tsconfig.base.json',
});

describe(findEsYearMismatches, () => {
  it('reports a config declaring another year, with its path and the year', () => {
    const entries = [
      makeTsconfigChainEntry({ compilerOptions: { target: 'ES2022' }, path: 'packages/api/tsconfig.json' }),
      BASE_ENTRY,
    ];

    expect(findEsYearMismatches(entries, 1, 'es2025')).toStrictEqual([
      { esYear: 'es2022', path: 'packages/api/tsconfig.json' },
    ]);
  });

  it('leaves a config declaring the base year alone', () => {
    const entries = [
      makeTsconfigChainEntry({ compilerOptions: { target: 'ES2025' }, path: 'packages/api/tsconfig.json' }),
      BASE_ENTRY,
    ];

    expect(findEsYearMismatches(entries, 1, 'es2025')).toStrictEqual([]);
  });

  it('leaves a config shipped by a dependency alone', () => {
    const entries = [
      makeTsconfigChainEntry({ path: 'packages/web/tsconfig.json' }),
      makeTsconfigChainEntry({
        compilerOptions: { target: 'ES2022' },
        path: 'node_modules/astro/tsconfigs/base.json',
        specifier: 'astro/tsconfigs/base',
      }),
      BASE_ENTRY,
    ];

    expect(findEsYearMismatches(entries, 2, 'es2025')).toStrictEqual([]);
  });

  it('leaves the base and every config beyond it alone', () => {
    const entries = [
      makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' }),
      makeTsconfigChainEntry({ ...BASE_ENTRY, compilerOptions: { target: 'ES2022' } }),
      makeTsconfigChainEntry({ compilerOptions: { target: 'ES2020' }, path: 'tsconfig.json' }),
    ];

    expect(findEsYearMismatches(entries, 1, 'es2025')).toStrictEqual([]);
  });

  it('leaves a config declaring no year alone', () => {
    const entries = [
      makeTsconfigChainEntry({ compilerOptions: { lib: ['ESNext', 'DOM'] }, path: 'packages/api/tsconfig.json' }),
      BASE_ENTRY,
    ];

    expect(findEsYearMismatches(entries, 1, 'es2025')).toStrictEqual([]);
  });
});

describe(isEsYearAtLeast, () => {
  it('orders years by the year that they name', () => {
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
  it('returns undefined for every name without a year', () => {
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

  it('takes the highest year named in a lib list', () => {
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
