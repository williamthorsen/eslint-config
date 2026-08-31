import { dirname, join, relative } from 'node:path/posix';

import type { TsconfigChainEntry } from 'readyup/check-utils';

const CONFIG_DIR_TEMPLATE = '${configDir}';

// Stands in for a `**` segment while a pattern is compiled, so the segment survives escaping intact.
const RECURSIVE_SEGMENT = '\u{0}';

// A path anchored to a filesystem root: POSIX-absolute, UNC, or Windows drive-lettered.
const ROOTED_PATH = /^(?:\/|[A-Za-z]:)/;

const TYPESCRIPT_FILE = /\.[cm]?ts$/;

/** A field naming a sibling TypeScript file by name, and the config that declared it. */
export interface EnumerationSite {
  declaredIn: string;
  field: 'files' | 'include';
}

export type InputCoverage =
  { kind: 'covered' } | { kind: 'enumerated-without'; sites: EnumerationSite[] } | { kind: 'not-enumerated' };

type DeclaredField = EnumerationSite['field'] | 'exclude';

interface DeclaredPaths<Field extends DeclaredField> {
  declaredIn: string;
  field: Field;
  paths: string[];
}

/**
 * Reports how a tsconfig's effective inputs treat one file: covered by `files` or `include`,
 * enumerated around by a field naming the file's siblings one by one, or not enumerated at all. The
 * two fields are additive, so their union decides the inputs, and `exclude` withdraws an `include`
 * match while having no power over a `files` one. Each field resolves to the nearest config in the
 * chain declaring it, TypeScript replacing rather than merging the three.
 *
 * A chain enumerating nothing is reported as such rather than as a failure: a root declaring
 * `files: []` alongside `references`, or a project reached through `allowDefaultProject`, covers the
 * file by a route the config alone does not show.
 */
export function judgeInputCoverage(entries: readonly TsconfigChainEntry[], filePath: string): InputCoverage {
  const judged = entries[0];
  if (judged === undefined) return { kind: 'not-enumerated' };

  const judgedDir = dirname(judged.path);
  const target = relative(judgedDir, filePath);
  const targetDir = dirname(target);

  const files = listDeclaredPaths(entries, 'files', judgedDir);
  const include = listDeclaredPaths(entries, 'include', judgedDir);
  const exclude = listDeclaredPaths(entries, 'exclude', judgedDir);

  const excluded = exclude?.paths.some((pattern) => matchesPattern(pattern, target)) === true;
  const covered =
    files?.paths.includes(target) === true ||
    (!excluded && include?.paths.some((pattern) => matchesPattern(pattern, target)) === true);
  if (covered) return { kind: 'covered' };

  const sites = [files, include]
    .filter((declared) => declared !== undefined)
    .filter((declared) => declared.paths.some((path) => isSiblingTypeScriptFile(path, targetDir)))
    .map((declared) => ({ declaredIn: declared.declaredIn, field: declared.field }));
  return sites.length > 0 ? { kind: 'enumerated-without', sites } : { kind: 'not-enumerated' };
}

// region | Helpers

/** Escapes one path segment into regular-expression source, keeping `*` and `?` as wildcards. */
function escapeSegment(segment: string): string {
  return segment.replaceAll(/[$()*+.?[\\\]^{|}]/g, (char) => {
    if (char === '*') return '[^/]*';
    if (char === '?') return '[^/]';
    return `\\${char}`;
  });
}

/**
 * Finds the config that decides a field for the whole chain. TypeScript honors the first
 * declaration and inherits nothing further for that field, an empty array included.
 */
function findDeclaringEntry(
  entries: readonly TsconfigChainEntry[],
  field: DeclaredField,
): TsconfigChainEntry | undefined {
  return entries.find((entry) => Array.isArray(entry.config[field]));
}

/** Reports whether a declared path names a TypeScript file sitting in the given directory. */
function isSiblingTypeScriptFile(path: string, targetDir: string): boolean {
  if (/[*?]/.test(path) || !TYPESCRIPT_FILE.test(path)) return false;
  return dirname(path) === targetDir;
}

/** Reads one field's declared paths, rebased onto the judged config's directory. */
function listDeclaredPaths<Field extends DeclaredField>(
  entries: readonly TsconfigChainEntry[],
  field: Field,
  judgedDir: string,
): DeclaredPaths<Field> | undefined {
  const declaring = findDeclaringEntry(entries, field);
  if (declaring === undefined) return undefined;

  const declared = declaring.config[field];
  if (!Array.isArray(declared)) return undefined;

  const declaredDir = dirname(declaring.path);
  const paths = declared
    .filter((value: unknown): value is string => typeof value === 'string')
    .map((value) => resolveDeclaredPath(value, declaredDir, judgedDir));
  return { declaredIn: declaring.path, field, paths };
}

/**
 * Reports whether one declared path covers the target. A path holding no wildcard covers the target
 * it names and, where it names a directory, everything beneath it; TypeScript reads an entry naming
 * neither a file nor a wildcard as a directory.
 */
function matchesPattern(pattern: string, target: string): boolean {
  if (pattern === '' || pattern === '.') return true;
  if (!/[*?]/.test(pattern)) return target === pattern || target.startsWith(`${pattern}/`);
  return toPatternRegExp(pattern).test(target);
}

/**
 * Resolves one declared path and returns it relative to the judged config. A path is relative to the
 * config that declared it unless it opts out with `${configDir}`, which names the consuming config's
 * own directory. A rooted path is left as it stands, TypeScript not rebasing one either.
 */
function resolveDeclaredPath(value: string, declaredDir: string, judgedDir: string): string {
  // TypeScript normalizes separators on every platform, so a backslash separates here too.
  const normalized = value.split('\\').join('/');
  if (ROOTED_PATH.test(normalized)) return normalized;

  const resolved = startsWithConfigDir(normalized)
    ? join(judgedDir, normalized.slice(CONFIG_DIR_TEMPLATE.length))
    : join(declaredDir, normalized);
  return relative(judgedDir, resolved);
}

/** Reports whether a path opts out of rebasing by naming the consuming config's own directory. */
function startsWithConfigDir(value: string): boolean {
  return value.slice(0, CONFIG_DIR_TEMPLATE.length).toLowerCase() === CONFIG_DIR_TEMPLATE.toLowerCase();
}

/**
 * Compiles a wildcard path into a regular expression. `*` and `?` match within one segment, and `**`
 * spans any number of them, which is the whole of the syntax TypeScript resolves in `include`.
 */
function toPatternRegExp(pattern: string): RegExp {
  const source = pattern
    .split('/')
    .map((segment) => (segment === '**' ? RECURSIVE_SEGMENT : escapeSegment(segment)))
    .join('/')
    .replaceAll(`${RECURSIVE_SEGMENT}/`, '(?:[^/]+/)*')
    .replaceAll(RECURSIVE_SEGMENT, '.*');
  return new RegExp(`^${source}$`);
}

// endregion | Helpers
