import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { collectStaticExternalImports, parseExternalImports } from './support/collectStaticImports.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Published packages whose eager configs reach external consumers. `typescript` is the only one
// today; `basic` is private and `strict-lint` is a CLI with no eager plugin imports. Extend this
// list when a new published config package appears.
const packagesUnderGuard = ['typescript'];

// Framework plugins the package loads only through a dynamic `import()` in `createConfig`. They are
// consumer-installed devDependencies by design and must never surface in the static graph.
const optInPlugins = [
  '@next/eslint-plugin-next',
  '@vitest/eslint-plugin',
  'eslint-plugin-jest-dom',
  'eslint-plugin-jsx-a11y',
  'eslint-plugin-react',
  'eslint-plugin-react-hooks',
  'eslint-plugin-testing-library',
];

const manifestSchema = z.object({
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
  peerDependencies: z.record(z.string(), z.string()).optional(),
});
type Manifest = z.infer<typeof manifestSchema>;

interface Violation {
  packageName: string;
  status: 'absent' | 'devDependencies';
  importers: string[];
}

describe('eager-config dependency guard', () => {
  for (const pkg of packagesUnderGuard) {
    it(`every eager import in packages/${pkg} is declared as a dependency or peerDependency`, () => {
      const packageDir = path.join(repoRoot, 'packages', pkg);
      const collected = collectStaticExternalImports(path.join(packageDir, 'src', 'index.ts'), repoRoot);
      const violations = findUndeclared(collected, readManifest(packageDir));

      expect(violations, formatViolations(pkg, violations)).toEqual([]);
    });
  }

  it('excludes opt-in framework plugins reached only through a dynamic import', () => {
    const entry = path.join(repoRoot, 'packages', 'typescript', 'src', 'index.ts');
    const collected = collectStaticExternalImports(entry, repoRoot);

    for (const plugin of optInPlugins) {
      expect(collected.has(plugin), `${plugin} should not be reachable via a static import`).toBe(false);
    }
  });

  it('throws on an unresolvable edge rather than silently under-reporting the graph', () => {
    const missingEntry = path.join(repoRoot, 'packages', 'typescript', 'src', 'does-not-exist.ts');

    expect(() => collectStaticExternalImports(missingEntry, repoRoot)).toThrow(/Unresolved import/);
  });
});

describe('import-graph classification', () => {
  it('collects value and scoped-subpath imports but not type-only, dynamic, or builtin', () => {
    const source = [
      "import valuePlugin from 'eslint-plugin-value';",
      "import * as namespaced from '@scope/pkg/subpath';",
      "import type { Type } from 'type-only-pkg';",
      "import { type NamedType } from 'all-named-type-pkg';",
      "import fs from 'node:fs';",
      "async function load() { return import('dynamic-only-pkg'); }",
      'export const used = [valuePlugin, namespaced, load];',
    ].join('\n');

    expect(parseExternalImports(source)).toEqual(['@scope/pkg', 'eslint-plugin-value']);
  });
});

describe('dependency check', () => {
  it('reports a devDependency-only import and an absent one, and accepts deps and peers', () => {
    const importers = new Set(['packages/x/src/config.ts']);
    const collected = new Map([
      ['plugin-in-deps', importers],
      ['plugin-in-peers', importers],
      ['plugin-in-dev', importers],
      ['plugin-absent', importers],
    ]);
    const manifest: Manifest = {
      dependencies: { 'plugin-in-deps': '1.0.0' },
      devDependencies: { 'plugin-in-dev': '1.0.0' },
      peerDependencies: { 'plugin-in-peers': '1.0.0' },
    };

    expect(findUndeclared(collected, manifest)).toEqual([
      { packageName: 'plugin-absent', status: 'absent', importers: ['packages/x/src/config.ts'] },
      { packageName: 'plugin-in-dev', status: 'devDependencies', importers: ['packages/x/src/config.ts'] },
    ]);
  });
});

function readManifest(packageDir: string): Manifest {
  const parsed: unknown = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
  return manifestSchema.parse(parsed);
}

function findUndeclared(collected: Map<string, Set<string>>, manifest: Manifest): Violation[] {
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ]);
  const devOnly = new Set(Object.keys(manifest.devDependencies ?? {}));

  const violations: Violation[] = [];
  for (const [packageName, importers] of collected) {
    if (declared.has(packageName)) {
      continue;
    }
    violations.push({
      packageName,
      status: devOnly.has(packageName) ? 'devDependencies' : 'absent',
      importers: [...importers].toSorted((a, b) => a.localeCompare(b)),
    });
  }

  return violations.toSorted((a, b) => a.packageName.localeCompare(b.packageName));
}

function formatViolations(pkg: string, violations: Violation[]): string {
  if (violations.length === 0) {
    return '';
  }
  const lines = violations.map((violation) => {
    const remedy = violation.status === 'devDependencies' ? 'move it to dependencies' : 'add it to dependencies';
    return `  - ${violation.packageName} (${violation.status}), imported by ${violation.importers.join(', ')} — ${remedy}`;
  });
  return `packages/${pkg}: eager configs import modules not declared as a dependency or peerDependency:\n${lines.join('\n')}`;
}
