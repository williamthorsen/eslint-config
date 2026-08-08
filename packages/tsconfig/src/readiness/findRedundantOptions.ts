import { isDeepStrictEqual } from 'node:util';

import type { TsconfigChainEntry } from 'readyup/check-utils';

import { isConsumerOwnedConfig } from './base-chain.ts';

export interface RedundantOption {
  key: string;
  path: string;
}

/**
 * Lists the options that a config nearer the entry than the base declares with the base's own value.
 * Only a config the consumer owns is reported, since only that one can be edited. Comparison is
 * structural, so an array such as `lib` restated verbatim reads as the redundancy it is. A key that
 * a config shipped by a dependency also declares is exempt: restating it is how a consumer wins
 * against that dependency's base.
 */
export function findRedundantOptions(entries: readonly TsconfigChainEntry[], baseIndex: number): RedundantOption[] {
  const baseOptions = entries[baseIndex]?.compilerOptions;
  if (baseOptions === undefined) return [];

  const exempt = dependencyDeclaredKeys(entries, baseIndex);
  const redundant: RedundantOption[] = [];
  for (const entry of entries.slice(0, baseIndex)) {
    if (!isConsumerOwnedConfig(entry.path)) continue;
    for (const [key, value] of Object.entries(entry.compilerOptions)) {
      if (exempt.has(key) || !Object.hasOwn(baseOptions, key)) continue;
      if (isDeepStrictEqual(value, baseOptions[key])) redundant.push({ key, path: entry.path });
    }
  }
  return redundant;
}

// region | Helpers

/** Collects every option key a config shipped by a dependency declares, this package's base aside. */
function dependencyDeclaredKeys(entries: readonly TsconfigChainEntry[], baseIndex: number): Set<string> {
  const keys = new Set<string>();
  for (const [index, entry] of entries.entries()) {
    if (index === baseIndex || isConsumerOwnedConfig(entry.path)) continue;
    for (const key of Object.keys(entry.compilerOptions)) keys.add(key);
  }
  return keys;
}

// endregion | Helpers
