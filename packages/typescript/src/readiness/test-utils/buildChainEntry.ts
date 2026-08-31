import type { TsconfigChainEntry } from 'readyup/check-utils';

/** Builds a tsconfig chain entry, defaulting every field the case under test does not care about. */
export function buildChainEntry(overrides: Partial<TsconfigChainEntry> = {}): TsconfigChainEntry {
  return { compilerOptions: {}, config: {}, path: 'tsconfig.json', specifier: undefined, ...overrides };
}
