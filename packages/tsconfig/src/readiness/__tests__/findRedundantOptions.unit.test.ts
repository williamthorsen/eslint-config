import { makeTsconfigChainEntry } from 'readyup/testing';
import { describe, expect, it } from 'vitest';

import { findRedundantOptions } from '../findRedundantOptions.ts';

const BASE_ENTRY = makeTsconfigChainEntry({
  compilerOptions: { lib: ['ES2025', 'ESNext.Disposable'], strict: true, target: 'ES2025' },
  path: 'packages/tsconfig/tsconfig.base.json',
  specifier: '@williamthorsen/tsconfig/tsconfig.base.json',
});

describe(findRedundantOptions, () => {
  it('reports a key restated with the base value, naming the config that restates it', () => {
    const entries = [
      makeTsconfigChainEntry({ compilerOptions: { strict: true }, path: 'packages/api/tsconfig.json' }),
      BASE_ENTRY,
    ];

    expect(findRedundantOptions(entries, 1)).toStrictEqual([{ key: 'strict', path: 'packages/api/tsconfig.json' }]);
  });

  // A conflicting override is a deliberate departure from the base.
  it('leaves a key declared with a different value alone', () => {
    const entries = [
      makeTsconfigChainEntry({
        compilerOptions: { strict: false, target: 'ES2022' },
        path: 'packages/api/tsconfig.json',
      }),
      BASE_ENTRY,
    ];

    expect(findRedundantOptions(entries, 1)).toStrictEqual([]);
  });

  it('compares structurally, so an array restated verbatim reads as redundant', () => {
    const entries = [
      makeTsconfigChainEntry({
        compilerOptions: { lib: ['ES2025', 'ESNext.Disposable'] },
        path: 'packages/api/tsconfig.json',
      }),
      BASE_ENTRY,
    ];

    expect(findRedundantOptions(entries, 1)).toStrictEqual([{ key: 'lib', path: 'packages/api/tsconfig.json' }]);
  });

  it('reports a restatement made by an intermediate config, not only by the entry config', () => {
    const entries = [
      makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' }),
      makeTsconfigChainEntry({
        compilerOptions: { strict: true },
        path: 'tsconfig.json',
        specifier: '../../tsconfig.json',
      }),
      BASE_ENTRY,
    ];

    expect(findRedundantOptions(entries, 2)).toStrictEqual([{ key: 'strict', path: 'tsconfig.json' }]);
  });

  it('exempts a key that a config shipped by a dependency also declares', () => {
    const entries = [
      makeTsconfigChainEntry({
        compilerOptions: { strict: true, target: 'ES2025' },
        path: 'packages/web/tsconfig.json',
      }),
      BASE_ENTRY,
      makeTsconfigChainEntry({
        compilerOptions: { target: 'ES2022' },
        path: 'node_modules/astro/tsconfigs/base.json',
        specifier: 'astro/tsconfigs/base',
      }),
    ];

    expect(findRedundantOptions(entries, 1)).toStrictEqual([{ key: 'strict', path: 'packages/web/tsconfig.json' }]);
  });

  // A framework base's own files are nearer than this base once it reaches them by relative path.
  it('never reports a config shipped by a dependency, whatever it restates', () => {
    const entries = [
      makeTsconfigChainEntry({ path: 'packages/web/tsconfig.json' }),
      makeTsconfigChainEntry({
        compilerOptions: { strict: true, target: 'ES2025' },
        path: 'node_modules/astro/tsconfigs/base.json',
        specifier: './base.json',
      }),
      BASE_ENTRY,
    ];

    expect(findRedundantOptions(entries, 2)).toStrictEqual([]);
  });

  it('ignores a key that the base does not declare', () => {
    const entries = [
      makeTsconfigChainEntry({ compilerOptions: { types: ['node'] }, path: 'packages/api/tsconfig.json' }),
      BASE_ENTRY,
    ];

    expect(findRedundantOptions(entries, 1)).toStrictEqual([]);
  });

  it('ignores declarations farther along the chain than the base', () => {
    const entries = [
      makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' }),
      BASE_ENTRY,
      makeTsconfigChainEntry({
        compilerOptions: { strict: true },
        path: 'tsconfig.legacy.json',
        specifier: './tsconfig.legacy.json',
      }),
    ];

    expect(findRedundantOptions(entries, 1)).toStrictEqual([]);
  });

  it('returns nothing when the index names no entry', () => {
    expect(findRedundantOptions([makeTsconfigChainEntry({ compilerOptions: { strict: true } })], 3)).toStrictEqual([]);
  });
});
