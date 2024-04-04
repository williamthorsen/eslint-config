import fs from 'node:fs';
import path from 'node:path';

/**
 * Walks up the directory tree, starting at the current directory, until it finds the named file.
 * Returns the path to the file or null if the file was not found.
 * TODO: Allow use of a file pattern instead of a single file name.
 */
export async function findNearestFile(
  fileName: string,
  startDir = process.cwd(),
): Promise<string | null> {
  let currentDir = startDir;

  while (currentDir !== '/') {
    const filePath = path.join(currentDir, fileName);

    if (fs.existsSync(filePath)) {
      return filePath;
    }

    // Move one directory up
    currentDir = path.dirname(currentDir);
  }

  return null;
}
