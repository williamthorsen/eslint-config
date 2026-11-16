import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createTempTree } from '@williamthorsen/toolbelt.testing/candidate';
import { describe, expect, it } from 'vitest';

import { defineConfig, type MaxSeverityMap, type StrictLintConfig } from '../defineConfig.ts';

const MANIFEST_PATH = fileURLToPath(new URL('../../package.json', import.meta.url));
const MODULE_PATH = fileURLToPath(new URL('../defineConfig.ts', import.meta.url));

describe(defineConfig, () => {
  it('returns the same config object that it was given', () => {
    const maxSeverity: MaxSeverityMap = { 'no-console': 'warn' };
    const config: StrictLintConfig = { maxSeverity };

    expect(defineConfig(config)).toBe(config);
  });

  it('rejects a config with an unknown property', () => {
    // @ts-expect-error -- this test asserts that the unknown key is rejected
    const config = defineConfig({ maxSeverity: {}, shouldIgnoreAncestor: true });

    expect(config).toBeDefined();
  });

  it('loads under native type stripping with no other module beside it', () => {
    // Config files import this module from their own directory, where nothing else of the package resolves. Copied
    // alone into an empty directory, the module fails to load if it retains any specifier (including an inline
    // `import { type … }`, whose specifier Node keeps and tsc elides).
    const moduleName = path.basename(MODULE_PATH);
    using tree = createTempTree(
      { [moduleName]: fs.readFileSync(MODULE_PATH) },
      { prefix: 'strict-lint-config-entry-' },
    );
    const script = `await import(${JSON.stringify(pathToFileURL(tree.resolve(moduleName)).href)});`;

    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], { encoding: 'utf8' });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('is the module named by the `./config` subpath entry', () => {
    const manifest: unknown = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const name = path.basename(MODULE_PATH, '.ts');

    expect(manifest).toMatchObject({
      exports: { './config': { import: `./dist/esm/${name}.js`, types: `./dist/esm/${name}.d.ts` } },
    });
  });
});
