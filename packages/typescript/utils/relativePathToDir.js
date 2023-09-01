import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Returns the path from the current working directory to the target directory.
 * For use in defining globs that work in both the root of a monorepo and its packages.
 */
export function relativePathToDir(relativeTargetDir) {
  const targetDir = join(__dirname, relativeTargetDir);
  return relative(process.cwd(), targetDir);
}
