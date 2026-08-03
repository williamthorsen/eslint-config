import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The root config extends `@williamthorsen/tsconfig/tsconfig.base.json` by package name, so resolving it
// exercises the same path a published consumer takes rather than a relative-path shortcut.
const options = parseRootConfig();

const consumerOwnedKeys = new Set(['jsx', 'paths', 'types']);

// What the base adds on top of the inlined `@tsconfig/strictest` settings. Every other key it declares
// must come from upstream; a leftover is drift. A key listed here that upstream also starts setting
// fails both drift assertions, which is the intent: the collision is a decision, not a merge.
const nodeLayerKeys = [
  'allowImportingTsExtensions',
  'lib',
  'module',
  'moduleDetection',
  'noEmit',
  'removeComments',
  'target',
];

const configSchema = z.object({
  extends: z.unknown().optional(),
  compilerOptions: z.record(z.string(), z.unknown()).optional(),
});

describe('@williamthorsen/tsconfig base config', () => {
  it('applies @tsconfig/strictest settings', () => {
    expect(options.strict).toBe(true);
    expect(options.exactOptionalPropertyTypes).toBe(true);
    expect(options.noPropertyAccessFromIndexSignature).toBe(true);
    expect(options.noUncheckedIndexedAccess).toBe(true);
    expect(options.esModuleInterop).toBe(true);
  });

  it('supplies the Node and build options strictest omits', () => {
    expect(options.allowImportingTsExtensions).toBe(true);
    expect(options.lib).toStrictEqual([lib('ES2025')]);
    expect(options.module).toBe(ts.ModuleKind.NodeNext);
    expect(options.moduleDetection).toBe(ts.ModuleDetectionKind.Force);
    expect(options.noEmit).toBe(true);
    expect(options.removeComments).toBe(true);
    expect(options.target).toBe(ts.ScriptTarget.ES2025);
  });

  it('resolves the consumer-owned keys the root declares', () => {
    expect(options.types).toStrictEqual(['node']);
    expect(options.paths).toStrictEqual({ '~/*': ['./*'] });
    expect(options.jsx).toBe(ts.JsxEmit.ReactJSX);
  });

  it('declares no consumer-owned key itself', () => {
    // Merged options can't show which config declared a key, so read the base directly.
    const declared = Object.keys(readBaseCompilerOptions());

    expect(declared.filter((key) => consumerOwnedKeys.has(key))).toStrictEqual([]);
  });

  it('anchors path aliases to the consumer, not to itself', () => {
    // `paths` moving into the base would leave `options.paths` byte-identical and silently
    // re-anchor every alias to the base's own directory inside node_modules.
    expect(options['pathsBasePath']).toBe(repoRoot);
  });

  it('extends no package', () => {
    // An `extends` is what broke under pnpm: resolvers that don't realpath the symlink walk up to a
    // top-level `node_modules/@tsconfig` that pnpm never creates. Its absence is the fix, so the base
    // must stay reachable in one hop no matter what it would be convenient to inherit.
    expect(readBaseConfig().extends).toBeUndefined();
  });

  it('mirrors every setting of the installed @tsconfig/strictest', () => {
    const declared = readBaseCompilerOptions();

    const mismatched = Object.entries(readUpstreamCompilerOptions())
      .filter(([key, value]) => JSON.stringify(declared[key]) !== JSON.stringify(value))
      .map(([key, value]) => `${key}: expected ${JSON.stringify(value)}, found ${JSON.stringify(declared[key])}`);

    expect(mismatched).toStrictEqual([]);
  });

  it('declares nothing beyond @tsconfig/strictest but the Node layer', () => {
    // Catches the direction the mirror test can't: a setting upstream has dropped survives here as an
    // unexplained key rather than as a missing one.
    const upstreamKeys = new Set(Object.keys(readUpstreamCompilerOptions()));
    const beyondUpstream = Object.keys(readBaseCompilerOptions()).filter((key) => !upstreamKeys.has(key));

    expect(beyondUpstream.toSorted()).toStrictEqual(nodeLayerKeys.toSorted());
  });
});

function parseRootConfig(): ts.CompilerOptions {
  const configPath = path.join(repoRoot, 'tsconfig.json');
  const host: ts.ParseConfigFileHost = {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    },
  };
  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, {}, host);

  if (!parsed) throw new Error(`Failed to parse ${configPath}`);

  const errors = parsed.errors.filter((error) => error.category === ts.DiagnosticCategory.Error);
  if (errors.length > 0) {
    throw new Error(errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n'));
  }

  return parsed.options;
}

function readBaseConfig(): z.infer<typeof configSchema> {
  return readConfig(path.join(repoRoot, 'packages', 'tsconfig', 'tsconfig.base.json'));
}

function readBaseCompilerOptions(): Record<string, unknown> {
  return readBaseConfig().compilerOptions ?? {};
}

// Resolve upstream from the tsconfig package rather than the repo root, which declares no
// `@tsconfig/strictest` of its own, so the comparison is against the version that package pins.
function readUpstreamCompilerOptions(): Record<string, unknown> {
  const requireFromPackage = createRequire(path.join(repoRoot, 'packages', 'tsconfig', 'package.json'));

  return readConfig(requireFromPackage.resolve('@tsconfig/strictest/tsconfig.json')).compilerOptions ?? {};
}

function readConfig(configPath: string): z.infer<typeof configSchema> {
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile.bind(ts.sys));

  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));

  return configSchema.parse(config);
}

// TypeScript normalizes `lib` entries to their `lib.*.d.ts` filenames.
function lib(name: string): string {
  return `lib.${name.toLowerCase()}.d.ts`;
}
