import { pathToFileURL } from 'node:url';

import { ESLint, type Linter } from 'eslint';

import { isRecord } from '../common/isRecord.ts';

/** The outcome of reading the ESLint config governing a run. */
export type EslintConfigLoad =
  | { elements: Linter.Config[]; filePath: string; status: 'loaded' }
  | { status: 'missing' }
  | { filePath: string; problem: string; status: 'unreadable' };

/**
 * Resolves the ESLint config governing a run and imports the elements it exports, reporting rather than throwing when
 * it cannot. ESLint reads the same file through jiti, which transpiles; strict-lint reads it through Node's type
 * stripping, which does not, so a config Node rejects has to skip the check rather than fail a run ESLint completed.
 */
export async function loadEslintConfig(cwd: string, configPath?: string): Promise<EslintConfigLoad> {
  const filePath = configPath ?? (await new ESLint({ cwd }).findConfigFile());
  if (filePath === undefined) {
    return { status: 'missing' };
  }

  let exported: unknown;
  try {
    exported = await readDefaultExport(filePath);
  } catch (error: unknown) {
    return { filePath, problem: describeError(error), status: 'unreadable' };
  }

  if (!isConfigElements(exported)) {
    return { filePath, problem: 'its default export is not an array of config objects', status: 'unreadable' };
  }
  return { elements: exported, filePath, status: 'loaded' };
}

// region | Helpers

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Whether a value is an array of config objects. It verifies only what the comparison depends on -- that each element
 * is an object whose identity and `rules` can be read -- and leaves the rest to ESLint, which has already loaded the
 * same file and would have rejected a malformed element.
 */
function isConfigElements(value: unknown): value is Linter.Config[] {
  return Array.isArray(value) && value.every((element) => isRecord(element));
}

/** Reads the default export, resolving the promise form ESLint accepts and normalizing the shapes it flattens. */
async function readDefaultExport(filePath: string): Promise<unknown> {
  const loaded: unknown = await import(pathToFileURL(filePath).href);
  if (!isRecord(loaded)) {
    return undefined;
  }
  const resolved: unknown = await loaded['default'];
  // ESLint takes a lone config object as a one-element array, and flattens a nested one.
  if (isRecord(resolved)) {
    return [resolved];
  }
  return Array.isArray(resolved) ? resolved.flat(Infinity) : resolved;
}

// endregion | Helpers
