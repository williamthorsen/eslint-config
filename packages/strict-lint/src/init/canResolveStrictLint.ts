import { existsSync } from 'node:fs';
import path from 'node:path';

import { listDirectoryChain } from '@williamthorsen/toolbelt.filesystem';

/** The manifest path of an installed copy of this package, relative to a directory that contains `node_modules`. */
const INSTALLED_MANIFEST_PATH = 'node_modules/@williamthorsen/strict-lint/package.json';

/**
 * Checks whether a config written to `dir` could import `@williamthorsen/strict-lint`, by walking up for an installed
 * copy. `require.resolve` cannot answer: the `./config` subpath declares `import` and `types` alone, so a CommonJS
 * resolver reports an installed package as missing. `import.meta.resolve` resolves against the calling module, not
 * against `dir`.
 */
export function canResolveStrictLint(dir: string): boolean {
  return listDirectoryChain(dir).some(holdsInstalledPackage);
}

// region | Helpers

/** Checks whether `dir` contains an installed copy. `existsSync` follows the symlink that pnpm installs as the copy. */
function holdsInstalledPackage(dir: string): boolean {
  return existsSync(path.join(dir, INSTALLED_MANIFEST_PATH));
}

// endregion | Helpers
