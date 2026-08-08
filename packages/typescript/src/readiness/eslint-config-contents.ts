/**
 * Reports whether an eslint config declares the superseded `parserOptions.project`. The search is
 * scoped to the `parserOptions` object so that an unrelated `project` key, such as an import
 * resolver's, is not misread as one.
 */
export function declaresParserProject(content: string): boolean {
  for (const match of content.matchAll(/parserOptions\s*:\s*\{/g)) {
    if (/\bproject\s*:/.test(braceBlock(content, match.index + match[0].length - 1))) return true;
  }
  return false;
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
function braceBlock(content: string, openIndex: number): string {
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

// endregion | Helpers
