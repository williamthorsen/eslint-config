import type { TsconfigChain } from 'readyup/check-utils';

import { judgeOffenders } from './judgeOffenders.ts';

/** A tsconfig whose chain was read in full. */
export interface ReadChain {
  chain: TsconfigChain;
  path: string;
}

/** A tsconfig whose chain could not be read in full, and why. */
export interface UnreadChain {
  path: string;
  reason: string;
}

export interface ChainReads {
  read: ReadChain[];
  unread: UnreadChain[];
}

/** Follows a sentence with one naming the unread chains, when there are any. */
export function appendUnreadNote(sentence: string, unread: readonly UnreadChain[]): string {
  return unread.length === 0 ? sentence : `${sentence}. ${describeUnreadChains(unread)}`;
}

/** Describes the unread chains as a sentence naming each tsconfig and why its chain was not read. */
export function describeUnreadChains(unread: readonly UnreadChain[]): string {
  return `Could not read the tsconfig chain of ${unread.map(({ path, reason }) => `${path} (${reason})`).join('; ')}`;
}

/**
 * Judges the offenders found among the chains that were read, and names the unread chains in the
 * detail, so that a pass covers only what was read.
 */
export function judgeReadOffenders(
  offenders: readonly string[],
  label: string,
  unread: readonly UnreadChain[],
  separator = ', ',
): true | { detail: string; ok: boolean } {
  const judgement = judgeOffenders(offenders, label, separator);
  if (unread.length === 0) return judgement;
  if (judgement === true) return { ok: true, detail: describeUnreadChains(unread) };
  return { ok: false, detail: appendUnreadNote(judgement.detail, unread) };
}

/** Skips a check when it needed chains and could read none of them. */
export function skipUnlessChainRead(reads: ChainReads): false | string {
  return reads.read.length === 0 && reads.unread.length > 0 && describeUnreadChains(reads.unread);
}

/**
 * Sorts each distinct tsconfig into one whose chain was read and one whose chain was not. A chain
 * with an unresolved `extends` counts as unread, because a verdict on it would ignore the configs
 * that it could not reach.
 */
export function sortChainReads(
  paths: readonly string[],
  readChain: (path: string) => TsconfigChain | undefined,
): ChainReads {
  const reads: ChainReads = { read: [], unread: [] };
  const distinctPaths = new Set(paths);
  for (const path of distinctPaths) {
    const chain = readChain(path);
    if (chain === undefined) {
      reads.unread.push({ path, reason: 'it does not parse' });
    } else if (chain.unresolvedExtends.length > 0) {
      reads.unread.push({ path, reason: describeUnresolvedExtends(chain) });
    } else {
      reads.read.push({ path, chain });
    }
  }
  return reads;
}

// region | Helpers

/** Names each `extends` reference that the chain could not follow and the config declaring it. */
function describeUnresolvedExtends(chain: TsconfigChain): string {
  return chain.unresolvedExtends
    .map(({ from, specifier }) => `extends "${specifier}" in ${from} does not resolve or does not parse`)
    .join(', ');
}

// endregion | Helpers
