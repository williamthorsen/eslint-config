import { isAbsolute } from 'node:path';

/**
 * Reports whether an eslint config declares the superseded `parserOptions.project`. The search is
 * scoped to the `parserOptions` object so that an unrelated `project` key, such as an import
 * resolver's, is not misread as one.
 */
export function declaresParserProject(content: string): boolean {
  for (const match of content.matchAll(/parserOptions\s*:\s*\{/g)) {
    if (/\bproject\s*:/.test(extractBraceBlock(content, match.index + match[0].length - 1))) return true;
  }
  return false;
}

/**
 * Reports whether an eslint config reaches `@next/eslint-plugin-next`, through this package's
 * factory or through the plugin's own specifier. A config reaching the factory by way of a local
 * re-export names neither, and so reads as not reaching the plugin.
 */
export function enablesNextPlugin(content: string): boolean {
  return /createConfig\s*\.\s*next\s*\(/.test(content) || content.includes('@next/eslint-plugin-next');
}

/**
 * Reports whether an eslint config imports from a path inside the given directory. A repo providing
 * the config package reaches it by source path rather than by package specifier, so the directory of
 * the workspace providing it stands in for the specifier. Specifiers resolve against the repo root,
 * where the only config this reads sits; one reaching above the root cannot name a workspace, so it
 * never matches.
 */
export function importsFromDir(content: string, dir: string): boolean {
  for (const match of content.matchAll(/\b(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g)) {
    const specifier = match[1]?.replace(/^\.\//, '');
    if (specifier === undefined || specifier.startsWith('..')) continue;
    if (specifier === dir || specifier.startsWith(`${dir}/`)) return true;
  }
  return false;
}

/**
 * Lists the relative `settings.next.rootDir` values an eslint config sets. The plugin globs the
 * value against the working directory, so a relative one anchors to wherever eslint was launched.
 * Only a value that is itself a string literal, or an array of them, can be read; an expression such
 * as `import.meta.dirname` yields nothing, which is what keeps the remedy from reporting itself.
 */
export function listRelativeNextRootDirs(content: string): string[] {
  return listNextSettingsBlocks(content)
    .flatMap((block) => listRootDirLiterals(block))
    .filter((value) => !isAbsolute(value));
}

/**
 * Lists the TypeScript-extension specifiers an eslint config imports, without repetition. A
 * type-only import is left out: TypeScript raises TS5097 on the value form alone, so
 * counting one would report a compiler option the consumer does not need. An inline `{ type X }`
 * specifier is a value import, its statement surviving erasure, and so counts.
 */
export function listTsExtensionImports(content: string): string[] {
  const specifiers: string[] = [];
  for (const match of content.matchAll(
    /\b(?:import|export)\b(?<clause>[^'"]*?)\bfrom\s*['"](?<specifier>[^'"]+)['"]/g,
  )) {
    const { clause = '', specifier } = match.groups ?? {};
    if (specifier !== undefined && !/^\s*type\b/.test(readClauseTail(clause))) specifiers.push(specifier);
  }
  for (const match of content.matchAll(/\b(?:import|require)\s*\(?\s*['"]([^'"]+)['"]/g)) {
    const specifier = match[1];
    if (specifier !== undefined) specifiers.push(specifier);
  }
  return [...new Set(specifiers.filter((specifier) => /\.[cm]?ts$/.test(specifier)))];
}

/** Reports whether an eslint config sets `settings.next.rootDir`. */
export function setsNextRootDir(content: string): boolean {
  return listNextSettingsBlocks(content).some((block) => /\brootDir\s*:/.test(block));
}

/** Reports whether an eslint config anchors the project service with `tsconfigRootDir`. */
export function setsTsconfigRootDir(content: string): boolean {
  return /tsconfigRootDir\s*:/.test(content);
}

// region | Helpers

/**
 * Extracts the body of the brace-delimited block opening at `openIndex`, respecting nesting, or an
 * empty string where the block never closes. The counter reads braces inside strings, comments, and
 * template literals as structure, so an unbalanced count is reachable from a valid config; yielding
 * nothing keeps an unreadable block from matching against the remainder of the file.
 */
function extractBraceBlock(content: string, openIndex: number): string {
  let depth = 0;
  for (let i = openIndex; i < content.length; i += 1) {
    if (content[i] === '{') depth += 1;
    else if (content[i] === '}') {
      depth -= 1;
      if (depth === 0) return content.slice(openIndex + 1, i);
    }
  }
  return '';
}

/**
 * Lists the body of every `next` block nested inside a `settings` block. Scoping to `settings.next`
 * keeps an unrelated `rootDir` key, such as a compiler's, from being misread as the plugin's.
 */
function listNextSettingsBlocks(content: string): string[] {
  const blocks: string[] = [];
  for (const settingsMatch of content.matchAll(/settings\s*:\s*\{/g)) {
    const settings = extractBraceBlock(content, settingsMatch.index + settingsMatch[0].length - 1);
    for (const nextMatch of settings.matchAll(/\bnext\s*:\s*\{/g)) {
      blocks.push(extractBraceBlock(settings, nextMatch.index + nextMatch[0].length - 1));
    }
  }
  return blocks;
}

/** Lists the string literals a `rootDir` key is assigned, discarding every value that is not one. */
function listRootDirLiterals(block: string): string[] {
  const literals: string[] = [];
  for (const value of listRootDirValues(block)) {
    const literal = readStringLiteral(value);
    if (literal !== undefined) literals.push(literal);
  }
  return literals;
}

/**
 * Lists the candidate `rootDir` values in a block: an array's bracket body split on commas, or a
 * bare value's text up to the next comma or brace. A comma inside an entry splits it, so the reader
 * below admits a candidate only where its whole extent is a string literal.
 */
function listRootDirValues(block: string): string[] {
  const array = /\brootDir\s*:\s*\[([^\]]*)\]/.exec(block);
  if (array !== null) return (array[1] ?? '').split(',');

  const bare = /\brootDir\s*:\s*([^,}]*)/.exec(block);
  return bare?.[1] === undefined ? [] : [bare[1]];
}

/**
 * Reads the part of an import clause belonging to the statement that owns the specifier, which is
 * everything after the last `import` or `export` keyword in it. A clause reaching back over an
 * earlier statement is possible where no quote separates the two, and reading the whole of one would
 * put that statement's `type` keyword in front of this statement's clause.
 */
function readClauseTail(clause: string): string {
  const keyword = clause
    .matchAll(/\b(?:import|export)\b/g)
    .toArray()
    .at(-1);
  return keyword === undefined ? clause : clause.slice(keyword.index + keyword[0].length);
}

/**
 * Reads a value that is wholly a string literal, or nothing where it is an expression such as
 * `path.join(import.meta.dirname, 'app')`, whose argument is not the value. An interpolated template
 * likewise reads as nothing, its text not being the path it resolves to.
 */
function readStringLiteral(value: string): string | undefined {
  const [, quote, literal] = /^\s*(['"`])([^'"`]*)\1\s*$/.exec(value) ?? [];
  if (literal === undefined) return undefined;
  return quote === '`' && literal.includes('${') ? undefined : literal;
}

// endregion | Helpers
