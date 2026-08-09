import { describe, expect, it } from 'vitest';

import { findBaseIndex, hasExternalBase, isBaseSpecifier, isConsumerOwnedConfig } from '../base-chain.ts';
import { buildChainEntry } from '../test-utils/buildChainEntry.ts';

describe(findBaseIndex, () => {
  it('locates the base wherever it sits in the chain', () => {
    const entries = [
      buildChainEntry({ path: 'packages/api/tsconfig.json' }),
      buildChainEntry({ path: 'tsconfig.json', specifier: '../../tsconfig.json' }),
      buildChainEntry({
        path: 'node_modules/.pnpm/@williamthorsen+tsconfig@0.3.0/node_modules/@williamthorsen/tsconfig/tsconfig.base.json',
        specifier: '@williamthorsen/tsconfig/tsconfig.base.json',
      }),
    ];

    expect(findBaseIndex(entries)).toBe(2);
  });

  // Under a workspace link the base realpaths inside the repo, so its path carries no package identity.
  it('locates the base whose path is a workspace directory', () => {
    const entries = [
      buildChainEntry({ path: 'tsconfig.json' }),
      buildChainEntry({
        path: 'packages/tsconfig/tsconfig.base.json',
        specifier: '@williamthorsen/tsconfig/tsconfig.base.json',
      }),
    ];

    expect(findBaseIndex(entries)).toBe(1);
  });

  it('returns undefined when no entry was reached by this package', () => {
    const entries = [
      buildChainEntry({ path: 'packages/web/tsconfig.json' }),
      buildChainEntry({ path: 'node_modules/astro/tsconfigs/base.json', specifier: 'astro/tsconfigs/base' }),
    ];

    expect(findBaseIndex(entries)).toBeUndefined();
  });
});

describe(hasExternalBase, () => {
  it('is true when an entry was reached by a package specifier naming another package', () => {
    const entries = [
      buildChainEntry({ path: 'packages/web/tsconfig.json' }),
      buildChainEntry({ path: 'tsconfig.json', specifier: '../../tsconfig.json' }),
      buildChainEntry({
        path: 'packages/tsconfig/tsconfig.base.json',
        specifier: '@williamthorsen/tsconfig/tsconfig.base.json',
      }),
      buildChainEntry({ path: 'node_modules/astro/tsconfigs/base.json', specifier: 'astro/tsconfigs/base' }),
    ];

    expect(hasExternalBase(entries)).toBe(true);
  });

  it('is false for a chain of path specifiers and this package alone', () => {
    const entries = [
      buildChainEntry({ path: 'packages/api/tsconfig.json' }),
      buildChainEntry({ path: 'tsconfig.json', specifier: '../../tsconfig.json' }),
      buildChainEntry({
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

  // A framework base pulls in the configs it extends by relative path, which land beside it.
  it('is false for a config a dependency ships', () => {
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
