import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The root config extends `@williamthorsen/tsconfig/tsconfig.base.json` by package name, so parsing it resolves the
// base the way a published consumer does.
const options = parseRootConfig();

const consumerOwnedKeys = new Set(['jsx', 'paths', 'types']);

// Keys that the base adds to the inlined `@tsconfig/strictest` settings. Every other key that it declares
// must come from upstream; a leftover is drift. A key listed here that upstream also starts setting
// fails both drift assertions, which is the intent: the collision is a decision, not a merge.
const nodeLayerKeys = [
  'allowImportingTsExtensions',
  'lib',
  'module',
  'moduleDetection',
  'noEmit',
  'removeComments',
  'rewriteRelativeImportExtensions',
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
    // A `--lib` name is an alias: TypeScript resolves a superseded one to its numbered successor with no
    // diagnostic, so this array names the file actually loaded. A numbered successor appearing here is the
    // signal to swap the declared entry for it.
    expect(options.lib).toStrictEqual([lib('ES2025'), lib('ESNext.Disposable')]);
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
    // A resolver that does not realpath pnpm's symlinks walks up to a top-level `node_modules/@tsconfig`
    // that pnpm never creates, so the base must be reachable in one hop.
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
    // Catches the direction that the mirror test can't: a setting that upstream has dropped survives here as an
    // unexplained key rather than as a missing one.
    const upstreamKeys = new Set(Object.keys(readUpstreamCompilerOptions()));
    const beyondUpstream = Object.keys(readBaseCompilerOptions()).filter((key) => !upstreamKeys.has(key));

    expect(beyondUpstream.toSorted()).toStrictEqual(nodeLayerKeys.toSorted());
  });
});

/** Parses the repo-root tsconfig with its `extends` chain resolved, throwing on any error diagnostic. */
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

/** Reads the `@williamthorsen/tsconfig` base as declared. */
function readBaseConfig(): z.infer<typeof configSchema> {
  return readConfig(path.join(repoRoot, 'packages', 'tsconfig', 'tsconfig.base.json'));
}

/** Reads the compiler options that the base declares. */
function readBaseCompilerOptions(): Record<string, unknown> {
  return readBaseConfig().compilerOptions ?? {};
}

/**
 * Reads the compiler options of the `@tsconfig/strictest` version pinned by the tsconfig package. The repo root
 * declares no `@tsconfig/strictest` of its own.
 */
function readUpstreamCompilerOptions(): Record<string, unknown> {
  const requireFromPackage = createRequire(path.join(repoRoot, 'packages', 'tsconfig', 'package.json'));

  return readConfig(requireFromPackage.resolve('@tsconfig/strictest/tsconfig.json')).compilerOptions ?? {};
}

/** Reads a tsconfig file's own JSON, without resolving `extends`. */
function readConfig(configPath: string): z.infer<typeof configSchema> {
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile.bind(ts.sys));

  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));

  return configSchema.parse(config);
}

/** Converts a `lib` name to the `lib.*.d.ts` filename to which TypeScript normalizes it. */
function lib(name: string): string {
  return `lib.${name.toLowerCase()}.d.ts`;
}
