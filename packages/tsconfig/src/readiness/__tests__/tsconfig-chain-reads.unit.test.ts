import type { Progress } from 'readyup';
import type { TsconfigChain } from 'readyup/check-utils';
import { makeTsconfigChainEntry } from 'readyup/testing';
import { describe, expect, it } from 'vitest';

import {
  appendUnreadNote,
  describeUnreadChains,
  describeUnreadReason,
  noteUnreadChains,
  skipUnlessChainRead,
} from '../tsconfig-chain-reads.ts';

const UNPARSEABLE = { path: 'b/tsconfig.json', reason: 'it does not parse' };

describe(appendUnreadNote, () => {
  it('returns the sentence alone when every chain was read', () => {
    expect(appendUnreadNote('Nothing escapes', [])).toBe('Nothing escapes');
  });

  it('follows the sentence with the unread chains', () => {
    expect(appendUnreadNote('Nothing escapes', [UNPARSEABLE])).toBe(
      'Nothing escapes. Could not read the tsconfig chain of b/tsconfig.json (it does not parse)',
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

describe(describeUnreadReason, () => {
  it('reports an entry that does not parse', () => {
    expect(describeUnreadReason(undefined)).toBe('it does not parse');
  });

  it('reports nothing for a chain read in full', () => {
    expect(describeUnreadReason(buildChain([]))).toBeUndefined();
  });

  it('names every unresolved extends and the config declaring it', () => {
    const chain = buildChain([
      { from: 'tsconfig.json', specifier: './missing.json' },
      { from: 'tsconfig.base.json', specifier: '@acme/tsconfig' },
    ]);

    expect(describeUnreadReason(chain)).toBe(
      'extends "./missing.json" in tsconfig.json does not resolve or does not parse, extends "@acme/tsconfig" in tsconfig.base.json does not resolve or does not parse',
    );
  });
});

describe(noteUnreadChains, () => {
  it('leaves the outcome alone when every chain was read', () => {
    expect(noteUnreadChains(true, [])).toBe(true);
  });

  it('gives a bare pass a detail naming the unread chains', () => {
    expect(noteUnreadChains(true, [UNPARSEABLE])).toStrictEqual({
      ok: true,
      detail: 'Could not read the tsconfig chain of b/tsconfig.json (it does not parse)',
    });
  });

  it('follows an existing detail with the unread chains, keeping the verdict and progress', () => {
    const progress: Progress = { type: 'fraction', passedCount: 1, count: 3 };

    expect(noteUnreadChains({ ok: false, detail: 'found: a', progress }, [UNPARSEABLE])).toStrictEqual({
      ok: false,
      detail: 'found: a. Could not read the tsconfig chain of b/tsconfig.json (it does not parse)',
      progress,
    });
  });

  it('gives an outcome without a detail one naming the unread chains', () => {
    const progress: Progress = { type: 'fraction', passedCount: 1, count: 2 };

    expect(noteUnreadChains({ ok: true, progress }, [UNPARSEABLE])).toStrictEqual({
      ok: true,
      detail: 'Could not read the tsconfig chain of b/tsconfig.json (it does not parse)',
      progress,
    });
  });
});

describe(skipUnlessChainRead, () => {
  it('skips, naming the unread chains, when no chain was read', () => {
    expect(skipUnlessChainRead(0, [UNPARSEABLE])).toBe(
      'Could not read the tsconfig chain of b/tsconfig.json (it does not parse)',
    );
  });

  it('runs when some chain was read', () => {
    expect(skipUnlessChainRead(1, [UNPARSEABLE])).toBe(false);
  });

  it('runs when no chain was needed', () => {
    expect(skipUnlessChainRead(0, [])).toBe(false);
  });
});

// region | Helpers

function buildChain(unresolvedExtends: TsconfigChain['unresolvedExtends']): TsconfigChain {
  return { entries: [makeTsconfigChainEntry()], unresolvedExtends };
}

// endregion | Helpers
