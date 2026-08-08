const SINGLE_COMPARATOR = /^(?:>=|\^|~)?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;

/**
 * Reduces a semver range to the `x.y.z` version it floors at, or `undefined` where no single floor
 * follows. Only ranges with one lower-bound comparator reduce: a union, an exclusive bound, or a
 * wildcard yields `undefined` rather than an invented floor.
 */
export function readVersionFloor(range: string): string | undefined {
  const match = SINGLE_COMPARATOR.exec(range.trim());
  if (match === null) return undefined;
  const [, major, minor, patch] = match;
  return `${major}.${minor ?? '0'}.${patch ?? '0'}`;
}
