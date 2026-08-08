import type { TsconfigChain } from 'readyup/check-utils';

import { findBaseIndex, hasExternalBase, isBaseSpecifier } from './base-chain.ts';

export type ChainClassification =
  { baseIndex: number; kind: 'adopted' } | { kind: 'external-base' } | { kind: 'unadopted' } | { kind: 'uninstalled' };

/**
 * Classifies how a tsconfig's `extends` chain reaches, or fails to reach, this package's base.
 *
 * An unresolvable specifier decides before the opt-out carve-out: a config naming the base has
 * adopted it and failed to install it, and a base belonging to another package in the same chain
 * must not excuse that.
 */
export function classifyChain(chain: TsconfigChain): ChainClassification {
  if (chain.unresolvedExtends.some((unresolved) => isBaseSpecifier(unresolved.specifier))) {
    return { kind: 'uninstalled' };
  }

  const baseIndex = findBaseIndex(chain.entries);
  if (baseIndex !== undefined) return { baseIndex, kind: 'adopted' };

  return hasExternalBase(chain.entries) ? { kind: 'external-base' } : { kind: 'unadopted' };
}
