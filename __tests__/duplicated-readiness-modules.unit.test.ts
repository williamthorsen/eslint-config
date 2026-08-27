import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Readiness modules both kit-shipping packages carry a copy of. The packages share no internal module, so
// each copy is maintained by hand, and each package's tests exercise only its own copy: a fix applied to one
// alone passes both suites and leaves the other wrong. Dropping an entry is how a deliberate divergence is
// recorded, since the copies are locked together only while this list names them.
const DUPLICATED_READINESS_MODULES = ['listSearchDirs.ts'];

describe('duplicated readiness modules', () => {
  it.each(DUPLICATED_READINESS_MODULES)('%s is identical in both packages', (basename) => {
    expect(readReadinessModule('tsconfig', basename)).toBe(readReadinessModule('typescript', basename));
  });
});

// region | Helpers

/** Reads one package's copy of a readiness module as text. */
function readReadinessModule(packageName: string, basename: string): string {
  return readFileSync(path.join(repoRoot, 'packages', packageName, 'src', 'readiness', basename), 'utf8');
}

// endregion | Helpers
