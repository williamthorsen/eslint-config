import type { TsconfigChain } from 'readyup/check-utils';
import { describe, expect, it } from 'vitest';

import { buildChainEntry } from '../test-utils/buildChainEntry.ts';
import {
  appendUnreadNote,
  describeUnreadChains,
  judgeReadOffenders,
  skipUnlessChainRead,
  sortChainReads,
} from '../tsconfig-chain-reads.ts';

const READABLE: TsconfigChain = { entries: [buildChainEntry()], unresolvedExtends: [] };

const UNRESOLVED: TsconfigChain = {
  entries: [buildChainEntry({ path: 'packages/a/tsconfig.json' })],
  unresolvedExtends: [{ from: 'packages/a/tsconfig.json', specifier: '@acme/tsconfig' }],
};

describe(appendUnreadNote, () => {
  it('returns the sentence alone when every chain was read', () => {
    expect(appendUnreadNote('Nothing enumerates', [])).toBe('Nothing enumerates');
  });

  it('follows the sentence with the unread chains', () => {
    expect(appendUnreadNote('Nothing enumerates', [{ path: 'tsconfig.json', reason: 'it does not parse' }])).toBe(
      'Nothing enumerates. Could not read the tsconfig chain of tsconfig.json (it does not parse)',
    );
  });
});

describe(describeUnreadChains, () => {
  it('names each unread tsconfig with its reason', () => {
    const unread = [
      { path: 'tsconfig.json', reason: 'it does not parse' },
      { path: 'packages/a/tsconfig.json', reason: 'extends "x" in packages/a/tsconfig.json does not resolve' },
    ];

    expect(describeUnreadChains(unread)).toBe(
      'Could not read the tsconfig chain of tsconfig.json (it does not parse); packages/a/tsconfig.json (extends "x" in packages/a/tsconfig.json does not resolve)',
    );
  });
});

describe(judgeReadOffenders, () => {
  const unread = [{ path: 'b/tsconfig.json', reason: 'it does not parse' }];

  it('passes without a detail when every chain was read and nothing offends', () => {
    expect(judgeReadOffenders([], 'found:', [])).toBe(true);
  });

  it('passes with a detail naming the unread chains when nothing read offends', () => {
    expect(judgeReadOffenders([], 'found:', unread)).toStrictEqual({
      ok: true,
      detail: 'Could not read the tsconfig chain of b/tsconfig.json (it does not parse)',
    });
  });

  it('fails on the offenders alone when every chain was read', () => {
    expect(judgeReadOffenders(['a', 'c'], 'found:', [])).toStrictEqual({ ok: false, detail: 'found: a, c' });
  });

  it('fails on the offenders and names the unread chains', () => {
    expect(judgeReadOffenders(['a (x)', 'c (y)'], 'found:', unread, '; ')).toStrictEqual({
      ok: false,
      detail: 'found: a (x); c (y). Could not read the tsconfig chain of b/tsconfig.json (it does not parse)',
    });
  });
});

describe(skipUnlessChainRead, () => {
  it('skips, naming the unread chains, when no chain was read', () => {
    const reads = sortChainReads(['tsconfig.json'], () => undefined);

    expect(skipUnlessChainRead(reads)).toBe('Could not read the tsconfig chain of tsconfig.json (it does not parse)');
  });

  it('runs when some chain was read', () => {
    const reads = sortChainReads(['tsconfig.json', 'b/tsconfig.json'], (path) =>
      path === 'tsconfig.json' ? READABLE : undefined,
    );

    expect(skipUnlessChainRead(reads)).toBe(false);
  });

  it('runs when no chain was needed', () => {
    expect(skipUnlessChainRead(sortChainReads([], () => READABLE))).toBe(false);
  });
});

describe(sortChainReads, () => {
  it('sorts each tsconfig by whether its chain was read in full', () => {
    const chains: Record<string, TsconfigChain | undefined> = {
      'tsconfig.json': READABLE,
      'packages/a/tsconfig.json': UNRESOLVED,
      'packages/b/tsconfig.json': undefined,
    };

    expect(sortChainReads(Object.keys(chains), (path) => chains[path])).toStrictEqual({
      read: [{ path: 'tsconfig.json', chain: READABLE }],
      unread: [
        {
          path: 'packages/a/tsconfig.json',
          reason: 'extends "@acme/tsconfig" in packages/a/tsconfig.json does not resolve',
        },
        { path: 'packages/b/tsconfig.json', reason: 'it does not parse' },
      ],
    });
  });

  it('names every unresolved extends of a chain', () => {
    const chain: TsconfigChain = {
      entries: [buildChainEntry()],
      unresolvedExtends: [
        { from: 'tsconfig.json', specifier: './missing.json' },
        { from: 'tsconfig.base.json', specifier: '@acme/tsconfig' },
      ],
    };

    expect(sortChainReads(['tsconfig.json'], () => chain).unread).toStrictEqual([
      {
        path: 'tsconfig.json',
        reason:
          'extends "./missing.json" in tsconfig.json does not resolve, extends "@acme/tsconfig" in tsconfig.base.json does not resolve',
      },
    ]);
  });

  it('reads a tsconfig named more than once only once', () => {
    let reads = 0;
    const result = sortChainReads(['tsconfig.json', 'tsconfig.json'], () => {
      reads += 1;
      return READABLE;
    });

    expect(reads).toBe(1);
    expect(result.read).toHaveLength(1);
  });
});
