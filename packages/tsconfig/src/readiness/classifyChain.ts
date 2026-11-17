import type { TsconfigChain } from 'readyup/check-utils';

import { findBaseIndex, hasExternalBase, isBaseSpecifier } from './base-chain.ts';
import { describeUnreadReason, UNPARSEABLE_REASON } from './tsconfig-chain-reads.ts';

export type ChainClassification =
  | { baseIndex: number; chain: TsconfigChain; kind: 'adopted' }
  | { kind: 'external-base' }
  | { kind: 'unadopted' }
  | { kind: 'uninstalled' }
  | { kind: 'unread'; reason: string };

/**
 * Classifies how a tsconfig's `extends` chain reaches, or fails to reach, this package's base.
 *
 * An unresolvable base specifier decides first: A config naming the base has adopted it and failed
 * to install it, and neither another unresolved `extends` nor a base belonging to another package in
 * the same chain must hide that. Any other unresolved `extends` leaves the chain unread, since the
 * configs that it could not reach may be the ones that decide.
 */
export function classifyChain(chain: TsconfigChain | undefined): ChainClassification {
  if (chain === undefined) return { kind: 'unread', reason: UNPARSEABLE_REASON };
  if (chain.unresolvedExtends.some((unresolved) => isBaseSpecifier(unresolved.specifier))) {
    return { kind: 'uninstalled' };
  }

  const unreadReason = describeUnreadReason(chain);
  if (unreadReason !== undefined) return { kind: 'unread', reason: unreadReason };

  const baseIndex = findBaseIndex(chain.entries);
  if (baseIndex !== undefined) return { baseIndex, chain, kind: 'adopted' };

  return { kind: hasExternalBase(chain.entries) ? 'external-base' : 'unadopted' };
}
