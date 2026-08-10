import path from 'node:path';

import type { ConfigEntry } from '@williamthorsen/toolbelt.filesystem';

import { loadStrictLintConfigs, type StrictLintCascade } from './loadStrictLintConfigs.ts';
import type { MaxSeverityMap, StrictLintConfig } from './types.ts';

/** Resolves the ceilings governing a linted file, retaining every cascade it walked so `--debug` can report them. */
export interface CeilingResolver {
  getCascades: () => ReadonlyMap<string, StrictLintCascade>;
  resolveFor: (filePath: string) => Promise<MaxSeverityMap>;
}

/**
 * Builds a resolver that anchors the ceiling walk at each linted file rather than at the working directory, matching
 * how ESLint resolves its own config. One walk runs per directory: files sharing a directory share a cascade, and the
 * memo holds the in-flight promise rather than its result, so concurrent lookups never start a second walk.
 */
export function createCeilingResolver(overrides: MaxSeverityMap = {}): CeilingResolver {
  const cascadesByDir = new Map<string, StrictLintCascade>();
  const ceilingsByDir = new Map<string, Promise<MaxSeverityMap>>();

  function getCascades(): ReadonlyMap<string, StrictLintCascade> {
    return cascadesByDir;
  }

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

  async function loadCeilings(dir: string): Promise<MaxSeverityMap> {
    const cascade = await loadStrictLintConfigs(dir);
    cascadesByDir.set(dir, cascade);
    // Programmatic overrides land last, outranking every config file, exactly as they did under the cwd-anchored walk.
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
