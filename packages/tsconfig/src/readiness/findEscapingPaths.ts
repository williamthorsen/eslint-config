import { dirname, join, relative } from 'node:path/posix';

import type { TsconfigChainEntry } from 'readyup/check-utils';

const CONFIG_DIR_TEMPLATE = '${configDir}';
const FIELDS = ['exclude', 'files', 'include'] as const;

// A path anchored to a filesystem root: POSIX-absolute, UNC, or Windows drive-lettered.
const ROOTED_PATH = /^(?:\/|[A-Za-z]:)/;

export interface EscapingPath {
  /** The config that declared the field, which is where the fix belongs. */
  declaredIn: string;
  field: (typeof FIELDS)[number];
  /** The offending path, relative to the directory holding the config being judged. */
  path: string;
}

/**
 * Lists the paths a tsconfig's effective `exclude`, `files`, and `include` name outside the
 * directory holding it. The chain's entry config is the one judged; a field it inherits resolves
 * against the directory of the config that declared it, which is how an inherited path escapes.
 * Resolution is lexical, so a workspace reached through a symlink does not read as an escape.
 */
export function findEscapingPaths(entries: readonly TsconfigChainEntry[]): EscapingPath[] {
  const judged = entries[0];
  if (judged === undefined) return [];

  const judgedDir = dirname(judged.path);
  return FIELDS.flatMap((field) => findEscapingPathsInField(entries, field, judgedDir));
}

// region | Helpers

/**
 * Finds the config that decides a field for the whole chain. TypeScript honors the first
 * declaration and inherits nothing further for that field, an empty array included.
 */
function findDeclaringEntry(
  entries: readonly TsconfigChainEntry[],
  field: EscapingPath['field'],
): TsconfigChainEntry | undefined {
  for (const entry of entries) {
    const declared = entry.config[field];
    if (declared) return entry;
  }
  return undefined;
}

/** Lists the escaping paths of one field, resolved from whichever config in the chain declares it. */
function findEscapingPathsInField(
  entries: readonly TsconfigChainEntry[],
  field: EscapingPath['field'],
  judgedDir: string,
): EscapingPath[] {
  const declaring = findDeclaringEntry(entries, field);
  if (declaring === undefined) return [];

  const declared = declaring.config[field];
  if (!Array.isArray(declared)) return [];

  const declaredDir = dirname(declaring.path);
  return declared
    .filter((value: unknown): value is string => typeof value === 'string')
    .flatMap((value) => {
      const outward = findOutwardPath(value, declaredDir, judgedDir);
      return outward === undefined ? [] : [{ declaredIn: declaring.path, field, path: outward }];
    });
}

/**
 * Resolves one declared path and returns it relative to the judged config, or `undefined` where it
 * stays inside that config's directory. A glob needs no expansion, since an escape lives in the
 * literal segments leading it.
 */
function findOutwardPath(value: string, declaredDir: string, judgedDir: string): string | undefined {
  // TypeScript normalizes separators on every platform, so a backslash separates here too.
  const normalized = value.split('\\').join('/');

  // TypeScript leaves a rooted path un-rebased, and one naming a machine-specific location cannot
  // be shown to stay inside a directory named relative to the project root.
  if (ROOTED_PATH.test(normalized)) return normalized;

  const resolved = startsWithConfigDir(normalized)
    ? join(judgedDir, normalized.slice(CONFIG_DIR_TEMPLATE.length))
    : join(declaredDir, normalized);
  const fromJudged = relative(judgedDir, resolved);
  return fromJudged === '..' || fromJudged.startsWith('../') ? fromJudged : undefined;
}

/** Reports whether a path opts out of rebasing by naming the consuming config's own directory. */
function startsWithConfigDir(value: string): boolean {
  return value.slice(0, CONFIG_DIR_TEMPLATE.length).toLowerCase() === CONFIG_DIR_TEMPLATE.toLowerCase();
}

// endregion | Helpers
