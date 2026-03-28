import path from 'node:path';

/**
 * Rewrite alias import paths to relative filesystem paths from the importing file.
 */
export function resolveAliasImports(code: string, fileDir: string, aliasMap: Record<string, string> = {}): string {
  for (const [alias, targetDir] of Object.entries(aliasMap)) {
    const escaped = alias.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`); // escape regex
    const regex = new RegExp(String.raw`(?<=(?:from|import\()\s*['"])${escaped}([^'"]+)(?=['"])`, 'g');

    code = code.replace(regex, (_, subpath: string) => {
      const absolute = path.resolve(targetDir, subpath);
      const relative = path.relative(fileDir, absolute);
      return relative.startsWith('.') ? relative : `./${relative}`;
    });
  }

  return code;
}

/**
 * Rewrite relative imports ending in `.ts` to `.js` to match compiled output.
 * Handles both static imports (`from '...'`) and dynamic imports (`import('...')`).
 */
export function rewriteTsImportExtensions(code: string): string {
  return code.replaceAll(/(?<=(?:from|import\()\s*['"])(\.{1,2}\/[^'"]+)\.ts(?=['"])/g, '$1.js');
}
