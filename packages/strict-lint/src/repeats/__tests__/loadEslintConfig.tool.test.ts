import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { loadEslintConfig } from '../loadEslintConfig.ts';

const REPO_ROOT = fileURLToPath(new URL('../../../../..', import.meta.url));

describe(loadEslintConfig, () => {
  it("discovers and reads the config governing this repository's own run", async () => {
    const load = await loadEslintConfig(REPO_ROOT);

    expect(load.status).toBe('loaded');
    assertLoaded(load);
    expect(load.filePath).toBe(path.join(REPO_ROOT, 'eslint.config.ts'));
    expect(load.elements.length).toBeGreaterThan(0);
  }, 30_000);

  it('reads the config at an explicitly given path rather than discovering one', async () => {
    const filePath = path.join(REPO_ROOT, 'eslint.config.ts');

    const load = await loadEslintConfig(os.tmpdir(), filePath);

    expect(load.status).toBe('loaded');
  }, 30_000);

  it('reports a config Node cannot import rather than throwing', async () => {
    const load = await loadEslintConfig(REPO_ROOT, path.join(REPO_ROOT, 'no-such.config.ts'));

    expect(load).toStrictEqual({
      filePath: path.join(REPO_ROOT, 'no-such.config.ts'),
      problem: expect.stringContaining('no-such.config.ts'),
      status: 'unreadable',
    });
  });

  it('reports a module whose default export is not a config array', async () => {
    const filePath = path.join(REPO_ROOT, 'packages/strict-lint/src/defineConfig.ts');

    const load = await loadEslintConfig(REPO_ROOT, filePath);

    expect(load).toStrictEqual({
      filePath,
      problem: 'its default export is not an array of config objects',
      status: 'unreadable',
    });
  });

  it('reads a lone config object, which ESLint takes as a one-element array', async () => {
    await withTempConfig("export default { rules: { 'no-eval': 'error' } };", async (filePath) => {
      const load = await loadEslintConfig(REPO_ROOT, filePath);

      expect(load).toStrictEqual({ elements: [{ rules: { 'no-eval': 'error' } }], filePath, status: 'loaded' });
    });
  }, 30_000);

  it('reports a function default export, which ESLint rejects before any lint runs', async () => {
    await withTempConfig('export default () => [{ rules: {} }];', async (filePath) => {
      const load = await loadEslintConfig(REPO_ROOT, filePath);

      expect(load.status).toBe('unreadable');
    });
  }, 30_000);

  it('reports no config when the search finds none', async () => {
    const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'strict-lint-'));

    try {
      await expect(loadEslintConfig(dir)).resolves.toStrictEqual({ status: 'missing' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});

// region | Helpers

/** Narrows a load to its loaded form, so a case can read the fields only that form carries. */
function assertLoaded(
  load: Awaited<ReturnType<typeof loadEslintConfig>>,
): asserts load is Extract<Awaited<ReturnType<typeof loadEslintConfig>>, { status: 'loaded' }> {
  if (load.status !== 'loaded') {
    throw new Error(`Expected a loaded config, got "${load.status}"`);
  }
}

/** Runs the body against a config module written outside the repository, so no fixture config is authored in it. */
async function withTempConfig(source: string, body: (filePath: string) => Promise<void>): Promise<void> {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'strict-lint-'));
  const filePath = path.join(dir, 'eslint.config.mjs');
  fs.writeFileSync(filePath, source, 'utf8');
  try {
    await body(filePath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// endregion | Helpers
