import type { TsconfigChainEntry } from 'readyup/check-utils';

const BASE_PACKAGE = '@williamthorsen/tsconfig';

// A specifier reaching a sibling file rather than a package: relative, POSIX-absolute, or Windows-absolute.
const PATH_SPECIFIER = /^(?:\.{1,2}(?:[/\\]|$)|[/\\]|[A-Za-z]:)/;

/** Locates this package's base within a chain, by the `extends` specifier that reached it. */
export function findBaseIndex(entries: readonly TsconfigChainEntry[]): number | undefined {
  const index = entries.findIndex((entry) => entry.specifier !== undefined && isBaseSpecifier(entry.specifier));
  return index === -1 ? undefined : index;
}

/**
 * Reports whether a chain reaches a base belonging to another package. A config whose chain carries
 * one has opted out of this base rather than failed to adopt it.
 */
export function hasExternalBase(entries: readonly TsconfigChainEntry[]): boolean {
  return entries.some((entry) => isExternalBase(entry));
}

/**
 * Reports whether an `extends` specifier names this package. The specifier decides rather than the
 * resolved path, which differs between an install (under `.pnpm/@williamthorsen+tsconfig@...`) and a
 * workspace link (under the workspace directory) while the specifier stays the same.
 */
export function isBaseSpecifier(specifier: string): boolean {
  return specifier === BASE_PACKAGE || specifier.startsWith(`${BASE_PACKAGE}/`);
}

/**
 * Reports whether a config is the consumer's own rather than one a dependency ships. A base reached
 * by package specifier pulls in the configs it extends by relative path, and those are as
 * unreachable to the consumer as the base itself.
 */
export function isConsumerOwnedConfig(path: string): boolean {
  return !path.startsWith('../') && !path.split('/').includes('node_modules');
}

// region | Helpers

/** Reports whether a chain entry was reached by a package specifier naming some other package. */
function isExternalBase(entry: TsconfigChainEntry): boolean {
  const { specifier } = entry;
  if (specifier === undefined) return false;
  return !PATH_SPECIFIER.test(specifier) && !isBaseSpecifier(specifier);
}

// endregion | Helpers
