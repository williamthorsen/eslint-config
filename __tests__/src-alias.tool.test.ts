import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Compiled packages whose sources also run uncompiled: The root ESLint config loads `typescript` through jiti, and
// tests spawn `strict-lint`'s bin under Node. Those runtimes resolve `#src/` through `package.json` `imports`, while
// `tsc` and `nmr-compile` resolve it through tsconfig `paths`, so each package declares it in both.
const aliasedPackages = ['strict-lint', 'typescript'];

const manifestSchema = z.object({ imports: z.record(z.string(), z.string()).optional() });
const tsconfigSchema = z.object({
  compilerOptions: z.object({ paths: z.record(z.string(), z.array(z.string())).optional() }).optional(),
});

describe('#src/ alias', () => {
  it.each(aliasedPackages)('maps identically in the tsconfig and the manifest of packages/%s', (name) => {
    const packageDir = path.join(repoRoot, 'packages', name);

    expect(readTsconfigPaths(packageDir)).toStrictEqual({ '#src/*': ['./src/*'] });
    expect(readManifestImports(packageDir)).toStrictEqual({ '#src/*': './src/*' });
  });
});

// region | Helpers

/** Reads the `imports` map that a package's manifest declares. */
function readManifestImports(packageDir: string): Record<string, string> | undefined {
  return manifestSchema.parse(JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'))).imports;
}

/** Reads the `paths` that a package's own tsconfig declares, without resolving `extends`. */
function readTsconfigPaths(packageDir: string): Record<string, string[]> | undefined {
  const { config, error } = ts.readConfigFile(path.join(packageDir, 'tsconfig.json'), ts.sys.readFile.bind(ts.sys));
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));

  return tsconfigSchema.parse(config).compilerOptions?.paths;
}

// endregion | Helpers
