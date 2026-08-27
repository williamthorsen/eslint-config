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

/**
 * Lists the string literals a `rootDir` key is assigned, across the bare and array forms. Requiring
 * the value to open with a quote or a bracket is what excludes an expression: a literal appearing
 * inside one, as in `path.join(import.meta.dirname, 'app')`, is an argument rather than the value.
 */
function listRootDirLiterals(block: string): string[] {
  const array = /\brootDir\s*:\s*\[[^\]]*\]/.exec(block);
  if (array !== null) return listStringLiterals(array[0]);

  const single = /\brootDir\s*:\s*(['"`])[^'"`]*\1/.exec(block);
  return single === null ? [] : listStringLiterals(single[0]);
}

/**
 * Lists the string literals in a snippet, discarding an interpolated template, whose text is not the
 * path it resolves to.
 */
function listStringLiterals(snippet: string): string[] {
  const values: string[] = [];
  for (const match of snippet.matchAll(/(['"`])([^'"`]*)\1/g)) {
    const [, quote, value] = match;
    if (value === undefined) continue;
    if (quote === '`' && value.includes('${')) continue;
    values.push(value);
  }
  return values;
}

// endregion | Helpers
