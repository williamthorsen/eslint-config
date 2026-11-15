import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

/**
 * Resolves `targetDir` against `currentDir` and returns the path from the current working directory to the result.
 * For use in defining globs that work in both the root of a monorepo and its packages. `currentDir` defaults to this
 * module's own directory inside the installed package, so a caller passes its own directory, such as
 * `import.meta.dirname`.
 */
export function relativePathToDir(targetDir: string, currentDir = __dirname): string {
  const resolvedTargetDir = join(currentDir, targetDir);
  return relative(process.cwd(), resolvedTargetDir);
}
