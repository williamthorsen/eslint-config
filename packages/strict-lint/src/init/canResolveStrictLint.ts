import { existsSync } from 'node:fs';
import path from 'node:path';

import { listDirectoryChain } from '@williamthorsen/toolbelt.filesystem';

/** Where an installed copy of this package sits, relative to a directory holding a `node_modules`. */
const INSTALLED_MANIFEST_PATH = 'node_modules/@williamthorsen/strict-lint/package.json';

/**
 * Whether a config written to `dir` could import `@williamthorsen/strict-lint`. The answer comes from walking for an
 * installed copy rather than from `require.resolve`, which rejects the `./config` subpath: that subpath declares
 * `import` and `types` alone, so a CommonJS resolver reports an installed package as missing. `import.meta.resolve`
 * is no substitute either, resolving against the calling module rather than against `dir`.
 */
export function canResolveStrictLint(dir: string): boolean {
  return listDirectoryChain(dir).some(holdsInstalledPackage);
}

// region | Helpers

/** Whether `dir` holds an installed copy. `existsSync` follows the symlink pnpm leaves in place of a real directory. */
function holdsInstalledPackage(dir: string): boolean {
  return existsSync(path.join(dir, INSTALLED_MANIFEST_PATH));
}

// endregion | Helpers
