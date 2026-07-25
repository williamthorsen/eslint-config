#!/usr/bin/env node
try {
  // eslint-disable-next-line n/no-missing-import -- dist/ exists only after a build; the catch reports its absence.
  await import('../dist/esm/bin/strict-lint.js');
} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    process.stderr.write('strict-lint: build output not found — run `pnpm run build` first\n');
  } else {
    process.stderr.write(`strict-lint: failed to load: ${error.message}\n`);
  }
  process.exit(1);
}
