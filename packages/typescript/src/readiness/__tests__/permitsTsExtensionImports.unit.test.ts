import { describe, expect, it } from 'vitest';

import { permitsTsExtensionImports } from '../permitsTsExtensionImports.ts';
import { buildChainEntry } from '../test-utils/buildChainEntry.ts';

describe(permitsTsExtensionImports, () => {
  it('is true when the entry config allows importing TypeScript extensions', () => {
    const entries = [buildChainEntry({ compilerOptions: { allowImportingTsExtensions: true } })];

    expect(permitsTsExtensionImports(entries)).toBe(true);
  });

  it('is true when the entry config rewrites relative import extensions', () => {
    const entries = [buildChainEntry({ compilerOptions: { rewriteRelativeImportExtensions: true } })];

    expect(permitsTsExtensionImports(entries)).toBe(true);
  });

  it('is true when a base config permits the import', () => {
    const entries = [
      buildChainEntry({ compilerOptions: { strict: true } }),
      buildChainEntry({ compilerOptions: { allowImportingTsExtensions: true }, path: 'tsconfig.base.json' }),
    ];

    expect(permitsTsExtensionImports(entries)).toBe(true);
  });

  it('is false when the nearest declaration withdraws what a base granted', () => {
    const entries = [
      buildChainEntry({ compilerOptions: { allowImportingTsExtensions: false } }),
      buildChainEntry({ compilerOptions: { allowImportingTsExtensions: true }, path: 'tsconfig.base.json' }),
    ];

    expect(permitsTsExtensionImports(entries)).toBe(false);
  });

  // TS5097 is raised whatever the module resolution, so `bundler` grants no permission of its own.
  it('is false for a bundler module resolution alone', () => {
    const entries = [buildChainEntry({ compilerOptions: { module: 'preserve', moduleResolution: 'bundler' } })];

    expect(permitsTsExtensionImports(entries)).toBe(false);
  });

  it('is false for an empty chain', () => {
    expect(permitsTsExtensionImports([])).toBe(false);
  });
});
