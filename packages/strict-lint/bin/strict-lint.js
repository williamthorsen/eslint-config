#!/usr/bin/env node

// Import only node builtins: A top-level import resolves before the gate below runs, so an
// unresolvable dependency would replace this file's build-first message with ERR_MODULE_NOT_FOUND.
import { existsSync } from 'node:fs';

// Thin wrapper so that pnpm can symlink the bin at install time, before `dist/` exists.
// It loads the TypeScript source when `src/` is present, which only a source checkout has,
// because `files` leaves `src/` out of the published package. Otherwise it loads the build output.
const sourceEntryPoint = new URL('../src/bin/strict-lint.ts', import.meta.url);
const buildEntryPoint = new URL('../dist/esm/bin/strict-lint.js', import.meta.url);
const entryPoint = [sourceEntryPoint, buildEntryPoint].find((url) => existsSync(url));

// Gate on the entry file itself. Because Node raises ERR_MODULE_NOT_FOUND for any
// unresolved module in the graph, keying the build-first message off the error code would
// also fire when the build is present and one of its imports is missing.
if (entryPoint === undefined) {
  process.stderr.write('strict-lint: build output not found. Reinstall the package.\n');
  process.exit(1);
}

try {
  await import(entryPoint.href);
} catch (error) {
  // eslint-disable-next-line no-restricted-syntax -- this file imports only node builtins; see the top comment.
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`strict-lint: failed to load: ${message}\n`);
  process.exit(1);
}
