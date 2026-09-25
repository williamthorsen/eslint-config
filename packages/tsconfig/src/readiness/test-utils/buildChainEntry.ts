import type { TsconfigChainEntry } from 'readyup/check-utils';

/** Builds a tsconfig chain entry, defaulting every field that the case under test does not set. */
export function buildChainEntry(overrides: Partial<TsconfigChainEntry> = {}): TsconfigChainEntry {
  return { compilerOptions: {}, config: {}, path: 'tsconfig.json', specifier: undefined, ...overrides };
}
