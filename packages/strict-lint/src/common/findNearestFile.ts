import fs from 'node:fs';
import path from 'node:path';

/**
 * Walks up the directory tree from `startDir`, returning the path to the first matching file.
 * When several names are given, all are checked at each directory level in list order before ascending, so a
 * nearer directory wins over a farther one and, within a level, an earlier name wins. This mirrors ESLint's own
 * `findUp` over its ordered config filenames. Returns undefined if no name is found before the filesystem root.
 */
export function findNearestFile(fileNames: string | readonly string[], startDir = process.cwd()): string | undefined {
  const names = typeof fileNames === 'string' ? [fileNames] : fileNames;
  let currentDir = startDir;

  while (currentDir !== '/') {
    for (const name of names) {
      const filePath = path.join(currentDir, name);

      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    // Move one directory up
    currentDir = path.dirname(currentDir);
  }

  return undefined;
}
