import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { MaxSeverityMap, StrictLintConfig } from '../defineConfig.ts';
import { defineConfig } from '../defineConfig.ts';

const MODULE_PATH = fileURLToPath(new URL('../defineConfig.ts', import.meta.url));

describe(defineConfig, () => {
  it('returns the same config object it was given', () => {
    const maxSeverity: MaxSeverityMap = { 'no-console': 'warn' };
    const config: StrictLintConfig = { maxSeverity };

    expect(defineConfig(config)).toBe(config);
  });

  it('rejects a config carrying an unknown property', () => {
    // @ts-expect-error -- rejecting the unknown key is what this test asserts
    const config = defineConfig({ maxSeverity: {}, shouldIgnoreAncestor: true });

    expect(config).toBeDefined();
  });

  it('loads under native type stripping with no other module beside it', () => {
    // Config files import this module from their own directory, where nothing else of the package resolves. Copied
    // alone into an empty directory, any specifier it retains fails to load — including an inline `import { type … }`,
    // whose specifier Node keeps and tsc elides.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strict-lint-config-entry-'));
    try {
      const copy = path.join(dir, path.basename(MODULE_PATH));
      fs.copyFileSync(MODULE_PATH, copy);
      const script = `await import(${JSON.stringify(pathToFileURL(copy).href)});`;

      const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], { encoding: 'utf8' });

      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
