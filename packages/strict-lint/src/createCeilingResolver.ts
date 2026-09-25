import path from 'node:path';

import type { ConfigEntry } from '@williamthorsen/toolbelt.filesystem';

import { loadStrictLintConfigs, type StrictLintCascade } from './loadStrictLintConfigs.ts';
import type { MaxSeverityMap, StrictLintConfig } from './types.ts';

/** A resolver of the ceilings governing each linted file; it retains every cascade that it walked, for `--debug`. */
export interface CeilingResolver {
  getCascades: () => ReadonlyMap<string, StrictLintCascade>;
  resolveFor: (filePath: string) => Promise<MaxSeverityMap>;
}

/**
 * Builds a resolver that anchors the ceiling walk at each linted file, as ESLint anchors its own config lookup. One
 * walk runs per directory: files sharing a directory share a cascade, and the memo holds the in-flight promise, so
 * concurrent lookups never start a second walk.
 */
export function createCeilingResolver(overrides: MaxSeverityMap = {}): CeilingResolver {
  const cascadesByDir = new Map<string, StrictLintCascade>();
  const ceilingsByDir = new Map<string, Promise<MaxSeverityMap>>();

  /** Returns every cascade walked so far, keyed by the directory from which the walk started. */
  function getCascades(): ReadonlyMap<string, StrictLintCascade> {
    return cascadesByDir;
  }

  /** Returns the ceilings for the directory of `filePath`, starting its walk on the first lookup. */
  function resolveFor(filePath: string): Promise<MaxSeverityMap> {
    const dir = path.dirname(path.resolve(filePath));
    const memoized = ceilingsByDir.get(dir);
    if (memoized) {
      return memoized;
    }
    const ceilings = loadCeilings(dir);
    ceilingsByDir.set(dir, ceilings);
    return ceilings;
  }

  /** Walks the cascade from `dir`, records it, and returns its ceilings with the programmatic overrides on top. */
  async function loadCeilings(dir: string): Promise<MaxSeverityMap> {
    const cascade = await loadStrictLintConfigs(dir);
    cascadesByDir.set(dir, cascade);
    return { ...mergeMaxSeverity(cascade.entries), ...overrides };
  }

  return { getCascades, resolveFor };
}

// region | Helpers

/** Merges the collected ceilings farthest level first, so a nearer config wins per rule. */
function mergeMaxSeverity(entries: ReadonlyArray<ConfigEntry<StrictLintConfig>>): MaxSeverityMap {
  const merged: MaxSeverityMap = {};
  for (const entry of entries.toReversed()) {
    Object.assign(merged, entry.config.maxSeverity);
  }
  return merged;
}

// endregion | Helpers
