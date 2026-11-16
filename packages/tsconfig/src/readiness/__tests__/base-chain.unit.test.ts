import { makeTsconfigChainEntry } from 'readyup/testing';
import { describe, expect, it } from 'vitest';

import { findBaseIndex, hasExternalBase, isBaseSpecifier, isConsumerOwnedConfig } from '../base-chain.ts';

describe(findBaseIndex, () => {
  it('locates the base wherever it is in the chain', () => {
    const entries = [
      makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' }),
      makeTsconfigChainEntry({ path: 'tsconfig.json', specifier: '../../tsconfig.json' }),
      makeTsconfigChainEntry({
        path: 'node_modules/.pnpm/@williamthorsen+tsconfig@0.3.0/node_modules/@williamthorsen/tsconfig/tsconfig.base.json',
        specifier: '@williamthorsen/tsconfig/tsconfig.base.json',
      }),
    ];

    expect(findBaseIndex(entries)).toBe(2);
  });

  // Under a workspace link the base's real path is inside the repo, so it does not name the package.
  it('locates the base whose path is a workspace directory', () => {
    const entries = [
      makeTsconfigChainEntry({ path: 'tsconfig.json' }),
      makeTsconfigChainEntry({
        path: 'packages/tsconfig/tsconfig.base.json',
        specifier: '@williamthorsen/tsconfig/tsconfig.base.json',
      }),
    ];

    expect(findBaseIndex(entries)).toBe(1);
  });

  it('returns undefined when no entry was reached by this package', () => {
    const entries = [
      makeTsconfigChainEntry({ path: 'packages/web/tsconfig.json' }),
      makeTsconfigChainEntry({ path: 'node_modules/astro/tsconfigs/base.json', specifier: 'astro/tsconfigs/base' }),
    ];

    expect(findBaseIndex(entries)).toBeUndefined();
  });
});

describe(hasExternalBase, () => {
  it('is true when an entry was reached by a package specifier naming another package', () => {
    const entries = [
      makeTsconfigChainEntry({ path: 'packages/web/tsconfig.json' }),
      makeTsconfigChainEntry({ path: 'tsconfig.json', specifier: '../../tsconfig.json' }),
      makeTsconfigChainEntry({
        path: 'packages/tsconfig/tsconfig.base.json',
        specifier: '@williamthorsen/tsconfig/tsconfig.base.json',
      }),
      makeTsconfigChainEntry({ path: 'node_modules/astro/tsconfigs/base.json', specifier: 'astro/tsconfigs/base' }),
    ];

    expect(hasExternalBase(entries)).toBe(true);
  });

  it('is false for a chain of path specifiers and this package alone', () => {
    const entries = [
      makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' }),
      makeTsconfigChainEntry({ path: 'tsconfig.json', specifier: '../../tsconfig.json' }),
      makeTsconfigChainEntry({
        path: 'packages/tsconfig/tsconfig.base.json',
        specifier: '@williamthorsen/tsconfig/tsconfig.base.json',
      }),
    ];

    expect(hasExternalBase(entries)).toBe(false);
  });
});

describe(isConsumerOwnedConfig, () => {
  it('is true for a config inside the run root', () => {
    expect(isConsumerOwnedConfig('tsconfig.json')).toBe(true);
    expect(isConsumerOwnedConfig('packages/api/tsconfig.json')).toBe(true);
  });

  it('is false for a config shipped by a dependency', () => {
    expect(isConsumerOwnedConfig('node_modules/astro/tsconfigs/base.json')).toBe(false);
    expect(
      isConsumerOwnedConfig('packages/astro/node_modules/.pnpm/astro@7.1.6/node_modules/astro/tsconfigs/strict.json'),
    ).toBe(false);
  });

  it('is false for a config outside the run root', () => {
    expect(isConsumerOwnedConfig('../shared/tsconfig.json')).toBe(false);
  });
});

describe(isBaseSpecifier, () => {
  it('is true for the package and for any subpath of it', () => {
    expect(isBaseSpecifier('@williamthorsen/tsconfig')).toBe(true);
    expect(isBaseSpecifier('@williamthorsen/tsconfig/tsconfig.base.json')).toBe(true);
  });

  it('is false for a package whose name merely starts with this one', () => {
    expect(isBaseSpecifier('@williamthorsen/tsconfig-react')).toBe(false);
  });

  it('is false for another package and for a path specifier', () => {
    expect(isBaseSpecifier('@tsconfig/strictest')).toBe(false);
    expect(isBaseSpecifier('../../tsconfig.json')).toBe(false);
  });
});
