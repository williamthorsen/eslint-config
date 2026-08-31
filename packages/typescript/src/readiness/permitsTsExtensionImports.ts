import type { TsconfigChainEntry } from 'readyup/check-utils';

// Either option lets an import path end in a TypeScript extension, which TS5097 otherwise rejects.
const PERMITTING_OPTIONS = ['allowImportingTsExtensions', 'rewriteRelativeImportExtensions'];

/**
 * Reports whether a tsconfig's effective compiler options let an import path end in a TypeScript
 * extension. Each option is resolved to its nearest declaration in the chain, so a config setting one
 * to `false` over a base setting it to `true` withdraws the permission the base granted.
 */
export function permitsTsExtensionImports(entries: readonly TsconfigChainEntry[]): boolean {
  return PERMITTING_OPTIONS.some((option) => readNearestOption(entries, option) === true);
}

// region | Helpers

/** Reads a compiler option from the nearest config in the chain declaring it. */
function readNearestOption(entries: readonly TsconfigChainEntry[], option: string): unknown {
  for (const entry of entries) {
    if (Object.hasOwn(entry.compilerOptions, option)) return entry.compilerOptions[option];
  }
  return undefined;
}

// endregion | Helpers
