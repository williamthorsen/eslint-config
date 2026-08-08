/** Resolves a directory-relative path, treating the repo root ('.') as bare. */
export function dirPath(dir: string, basename: string): string {
  return dir === '.' ? basename : `${dir}/${basename}`;
}

/**
 * Every basename an ESLint loader resolves, in the order it resolves them. A JavaScript basename
 * precedes its TypeScript sibling, which is what makes a shadowed config silently inert.
 */
export const ESLINT_CONFIG_BASENAMES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
];

/** Lists every path an eslint config could occupy across the given directories. */
export function eslintConfigCandidates(dirs: readonly string[]): string[] {
  return dirs.flatMap((dir) => ESLINT_CONFIG_BASENAMES.map((basename) => dirPath(dir, basename)));
}

/** Reports whether an eslint config path names a TypeScript config. */
export function isTypeScriptEslintConfig(configPath: string): boolean {
  return /\.[cm]?ts$/.test(configPath);
}

/**
 * Lists the directories holding both a JavaScript and a TypeScript eslint config. The loader
 * resolves the JavaScript basename first, so the TypeScript sibling that extends this package
 * never runs.
 */
export function shadowedEslintConfigDirs(eslintConfigPaths: readonly string[]): string[] {
  const seen = new Map<string, { js: boolean; ts: boolean }>();
  for (const configPath of eslintConfigPaths) {
    const slash = configPath.lastIndexOf('/');
    const dir = slash === -1 ? '.' : configPath.slice(0, slash);
    const found = seen.get(dir) ?? { js: false, ts: false };
    if (isTypeScriptEslintConfig(configPath)) found.ts = true;
    else found.js = true;
    seen.set(dir, found);
  }
  return [...seen].filter(([, found]) => found.js && found.ts).map(([dir]) => dir);
}
