import type { CheckOutcome } from 'readyup';
import type { TsconfigChain } from 'readyup/check-utils';

/** Why a tsconfig whose entry could not be read has no chain. */
export const UNPARSEABLE_REASON = 'it does not parse';

/** A tsconfig whose chain could not be read in full, and why. */
export interface UnreadChain {
  path: string;
  reason: string;
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
 * Explains why a chain was not read in full, or returns `undefined` when it was. A chain with an
 * unresolved `extends` counts as unread, because a verdict on it would ignore the configs that it
 * could not reach.
 */
export function describeUnreadReason(chain: TsconfigChain | undefined): string | undefined {
  if (chain === undefined) return UNPARSEABLE_REASON;
  if (chain.unresolvedExtends.length === 0) return undefined;
  return chain.unresolvedExtends
    .map(({ from, specifier }) => `extends "${specifier}" in ${from} does not resolve or does not parse`)
    .join(', ');
}

/**
 * Names the unread chains on a check's outcome, so that a pass covers only what was read. The
 * verdict and the progress stay as the outcome states them.
 */
export function noteUnreadChains(outcome: true | CheckOutcome, unread: readonly UnreadChain[]): true | CheckOutcome {
  if (unread.length === 0) return outcome;
  if (outcome === true) return { ok: true, detail: describeUnreadChains(unread) };

  const detail = outcome.detail === undefined ? describeUnreadChains(unread) : appendUnreadNote(outcome.detail, unread);
  return { ...outcome, detail };
}

/** Skips a check when it needed chains and could read none of them. */
export function skipUnlessChainRead(readCount: number, unread: readonly UnreadChain[]): false | string {
  return readCount === 0 && unread.length > 0 && describeUnreadChains(unread);
}
