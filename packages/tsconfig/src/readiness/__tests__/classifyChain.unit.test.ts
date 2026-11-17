import type { TsconfigChain } from 'readyup/check-utils';
import { makeTsconfigChainEntry } from 'readyup/testing';
import { describe, expect, it } from 'vitest';

import { classifyChain } from '../classifyChain.ts';

const BASE_ENTRY = makeTsconfigChainEntry({
  path: 'packages/tsconfig/tsconfig.base.json',
  specifier: '@williamthorsen/tsconfig/tsconfig.base.json',
});

const EXTERNAL_BASE_ENTRY = makeTsconfigChainEntry({
  path: 'node_modules/astro/tsconfigs/base.json',
  specifier: 'astro/tsconfigs/base',
});

describe(classifyChain, () => {
  it('reports a chain reaching the base as adopted, with its position in the chain', () => {
    const chain = buildChain([makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' }), BASE_ENTRY]);

    expect(classifyChain(chain)).toStrictEqual({ baseIndex: 1, chain, kind: 'adopted' });
  });

  it('reports a chain containing only a base of another package as an opt-out', () => {
    const chain = buildChain([makeTsconfigChainEntry({ path: 'packages/web/tsconfig.json' }), EXTERNAL_BASE_ENTRY]);

    expect(classifyChain(chain)).toStrictEqual({ kind: 'external-base' });
  });

  it('reports a chain reaching no base at all as unadopted', () => {
    const chain = buildChain([makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' })]);

    expect(classifyChain(chain)).toStrictEqual({ kind: 'unadopted' });
  });

  it('reports a specifier naming the base but failing to resolve as uninstalled', () => {
    const chain = buildChain(
      [makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' })],
      [{ from: 'packages/api/tsconfig.json', specifier: '@williamthorsen/tsconfig/tsconfig.base.json' }],
    );

    expect(classifyChain(chain)).toStrictEqual({ kind: 'uninstalled' });
  });

  it('reports uninstalled ahead of the opt-out carve-out', () => {
    const chain = buildChain(
      [makeTsconfigChainEntry({ path: 'packages/web/tsconfig.json' }), EXTERNAL_BASE_ENTRY],
      [{ from: 'packages/web/tsconfig.json', specifier: '@williamthorsen/tsconfig/tsconfig.base.json' }],
    );

    expect(classifyChain(chain)).toStrictEqual({ kind: 'uninstalled' });
  });

  it('reports uninstalled ahead of a base that resolved elsewhere in the chain', () => {
    const chain = buildChain(
      [makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' }), BASE_ENTRY],
      [{ from: 'packages/api/tsconfig.json', specifier: '@williamthorsen/tsconfig/tsconfig.legacy.json' }],
    );

    expect(classifyChain(chain)).toStrictEqual({ kind: 'uninstalled' });
  });

  it('reports uninstalled ahead of another unresolved extends', () => {
    const chain = buildChain(
      [makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' })],
      [
        { from: 'packages/api/tsconfig.json', specifier: './tsconfig.shared.json' },
        { from: 'packages/api/tsconfig.json', specifier: '@williamthorsen/tsconfig/tsconfig.base.json' },
      ],
    );

    expect(classifyChain(chain)).toStrictEqual({ kind: 'uninstalled' });
  });

  it('reports an entry that does not parse as unread', () => {
    expect(classifyChain(undefined)).toStrictEqual({ kind: 'unread', reason: 'it does not parse' });
  });

  it('reports a chain stopped by a misspelt local parent as unread, naming the specifier and its config', () => {
    const chain = buildChain(
      [makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' })],
      [{ from: 'packages/api/tsconfig.json', specifier: '../tsconfg.json' }],
    );

    expect(classifyChain(chain)).toStrictEqual({
      kind: 'unread',
      reason: 'extends "../tsconfg.json" in packages/api/tsconfig.json does not resolve or does not parse',
    });
  });

  it('reports a chain whose base of another package does not resolve as unread', () => {
    const chain = buildChain(
      [makeTsconfigChainEntry({ path: 'packages/web/tsconfig.json' })],
      [{ from: 'packages/web/tsconfig.json', specifier: 'astro/tsconfigs/base' }],
    );

    expect(classifyChain(chain)).toMatchObject({ kind: 'unread' });
  });

  it('reports a chain reaching the base but stopped elsewhere as unread', () => {
    const chain = buildChain(
      [makeTsconfigChainEntry({ path: 'packages/api/tsconfig.json' }), BASE_ENTRY],
      [{ from: 'packages/api/tsconfig.json', specifier: './tsconfig.paths.json' }],
    );

    expect(classifyChain(chain)).toMatchObject({ kind: 'unread' });
  });
});

// region | Helpers

function buildChain(
  entries: TsconfigChain['entries'],
  unresolvedExtends: TsconfigChain['unresolvedExtends'] = [],
): TsconfigChain {
  return { entries, unresolvedExtends };
}

// endregion | Helpers
