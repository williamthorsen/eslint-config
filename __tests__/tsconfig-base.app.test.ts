import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The root config extends `@williamthorsen/tsconfig/tsconfig.base.json` by package name, so resolving it
// exercises the same path a published consumer takes rather than a relative-path shortcut.
const options = parseRootConfig();

describe('@williamthorsen/tsconfig base config', () => {
  it('pulls in @tsconfig/strictest through the extends chain', () => {
    expect(options.strict).toBe(true);
    expect(options.exactOptionalPropertyTypes).toBe(true);
    expect(options.noPropertyAccessFromIndexSignature).toBe(true);
    expect(options.noUncheckedIndexedAccess).toBe(true);
    expect(options.esModuleInterop).toBe(true);
  });

  it('supplies the Node and build options strictest omits', () => {
    expect(options.allowImportingTsExtensions).toBe(true);
    expect(options.lib).toEqual([lib('ES2025')]);
    expect(options.module).toBe(ts.ModuleKind.NodeNext);
    expect(options.moduleDetection).toBe(ts.ModuleDetectionKind.Force);
    expect(options.noEmit).toBe(true);
    expect(options.removeComments).toBe(true);
    expect(options.target).toBe(ts.ScriptTarget.ES2025);
  });

  it('leaves types, paths, and jsx to the consumer', () => {
    // The root declares all three itself; the assertion guards against them migrating into the base,
    // where `paths` in particular would resolve relative to the base and break aliases.
    expect(options.types).toEqual(['node']);
    expect(options.paths).toEqual({ '~/*': ['./*'] });
    expect(options.jsx).toBe(ts.JsxEmit.ReactJSX);
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

// TypeScript normalizes `lib` entries to their `lib.*.d.ts` filenames.
function lib(name: string): string {
  return `lib.${name.toLowerCase()}.d.ts`;
}
