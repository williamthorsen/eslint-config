import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

/**
 * Returns the path from the current working directory to the target directory.
 * For use in defining globs that work in both the root of a monorepo and its packages.
 */
export function relativePathToDir(targetDir: string, currentDir = __dirname): string {
  const resolvedTargetDir = join(currentDir, targetDir);
  return relative(process.cwd(), resolvedTargetDir);
}
