import type { TsconfigChain } from 'readyup/check-utils';
import { describe, expect, it } from 'vitest';

import { classifyChain } from '../classifyChain.ts';
import { buildChainEntry } from '../test-utils/buildChainEntry.ts';

const BASE_ENTRY = buildChainEntry({
  path: 'packages/tsconfig/tsconfig.base.json',
  specifier: '@williamthorsen/tsconfig/tsconfig.base.json',
});

const EXTERNAL_BASE_ENTRY = buildChainEntry({
  path: 'node_modules/astro/tsconfigs/base.json',
  specifier: 'astro/tsconfigs/base',
});

describe(classifyChain, () => {
  it('reports a chain reaching the base as adopted, with the position it sits at', () => {
    const chain = buildChain([buildChainEntry({ path: 'packages/api/tsconfig.json' }), BASE_ENTRY]);

    expect(classifyChain(chain)).toStrictEqual({ baseIndex: 1, kind: 'adopted' });
  });

  it('reports a chain carrying only a base of another package as an opt-out', () => {
    const chain = buildChain([buildChainEntry({ path: 'packages/web/tsconfig.json' }), EXTERNAL_BASE_ENTRY]);

    expect(classifyChain(chain)).toStrictEqual({ kind: 'external-base' });
  });

  it('reports a chain reaching no base at all as unadopted', () => {
    const chain = buildChain([buildChainEntry({ path: 'packages/api/tsconfig.json' })]);

    expect(classifyChain(chain)).toStrictEqual({ kind: 'unadopted' });
  });

  it('reports a specifier naming the base but failing to resolve as uninstalled', () => {
    const chain = buildChain(
      [buildChainEntry({ path: 'packages/api/tsconfig.json' })],
      [{ from: 'packages/api/tsconfig.json', specifier: '@williamthorsen/tsconfig/tsconfig.base.json' }],
    );

    expect(classifyChain(chain)).toStrictEqual({ kind: 'uninstalled' });
  });

  // Reversing this precedence would excuse a missing install as a deliberate opt-out.
  it('reports uninstalled ahead of the opt-out carve-out', () => {
    const chain = buildChain(
      [buildChainEntry({ path: 'packages/web/tsconfig.json' }), EXTERNAL_BASE_ENTRY],
      [{ from: 'packages/web/tsconfig.json', specifier: '@williamthorsen/tsconfig/tsconfig.base.json' }],
    );

    expect(classifyChain(chain)).toStrictEqual({ kind: 'uninstalled' });
  });

  it('reports uninstalled ahead of a base that resolved elsewhere in the chain', () => {
    const chain = buildChain(
      [buildChainEntry({ path: 'packages/api/tsconfig.json' }), BASE_ENTRY],
      [{ from: 'packages/api/tsconfig.json', specifier: '@williamthorsen/tsconfig/tsconfig.legacy.json' }],
    );

    expect(classifyChain(chain)).toStrictEqual({ kind: 'uninstalled' });
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
