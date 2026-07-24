import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadStrictLintConfigs, STRICT_LINT_CONFIG_NAME } from '../loadStrictLintConfigs.ts';

interface CascadeOptions {
  fileNames: readonly string[];
  shouldStopAscent?: ((config: unknown) => boolean) | undefined;
  startDir: string;
}

const { mockedLoadConfigCascade } = vi.hoisted(() => ({
  mockedLoadConfigCascade: vi.fn<(options: CascadeOptions) => Promise<unknown>>(),
}));

vi.mock('@williamthorsen/toolbelt.filesystem', () => ({
  loadConfigCascade: mockedLoadConfigCascade,
}));

const PROJECT_ROOT = { marker: 'pnpm-workspace.yaml', rootDir: '/project', source: 'marker' };

describe(loadStrictLintConfigs, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches for the strict-lint config file from the given directory', async () => {
    withCascadeEntries([]);

    await loadStrictLintConfigs('/project/packages/pkg');

    expect(mockedLoadConfigCascade).toHaveBeenCalledWith(
      expect.objectContaining({ fileNames: [STRICT_LINT_CONFIG_NAME], startDir: '/project/packages/pkg' }),
    );
  });

  it('returns the config of every level the cascade collected, nearest first', async () => {
    withCascadeEntries([
      ['/project/packages/pkg', { maxSeverity: { 'nearer-rule': 'warn' } }],
      ['/project', { maxSeverity: { 'farther-rule': 'warn' } }],
    ]);

    const { entries } = await loadStrictLintConfigs('/project/packages/pkg');

    expect(entries).toEqual([
      {
        config: { maxSeverity: { 'nearer-rule': 'warn' } },
        dir: '/project/packages/pkg',
        filePath: configPathIn('/project/packages/pkg'),
      },
      { config: { maxSeverity: { 'farther-rule': 'warn' } }, dir: '/project', filePath: configPathIn('/project') },
    ]);
  });

  it('returns no entries when no config exists within the project', async () => {
    withCascadeEntries([]);

    const { entries } = await loadStrictLintConfigs('/project/packages/pkg');

    expect(entries).toEqual([]);
  });

  it('passes the cascade provenance through to the caller', async () => {
    withCascadeEntries([['/project', {}]], 'predicate');

    const { projectRoot, stopReason } = await loadStrictLintConfigs('/project');

    expect(projectRoot).toEqual(PROJECT_ROOT);
    expect(stopReason).toBe('predicate');
  });

  describe('stop-ascent predicate', () => {
    it.each([
      { name: 'the flag is true', config: { shouldIgnoreAncestors: true }, stops: true },
      { name: 'the flag is false', config: { shouldIgnoreAncestors: false }, stops: false },
      { name: 'the flag is absent', config: { maxSeverity: {} }, stops: false },
      { name: 'the flag is a truthy non-boolean', config: { shouldIgnoreAncestors: 'yes' }, stops: false },
      { name: 'the config is null', config: null, stops: false },
      { name: 'the config is not an object', config: 'not-an-object', stops: false },
    ])('reports $stops when $name', async ({ config, stops }) => {
      withCascadeEntries([]);
      await loadStrictLintConfigs('/project');

      expect(stopAscentPredicate()(config)).toBe(stops);
    });
  });

  describe('config validation', () => {
    it.each([
      {
        name: 'the default export is not an object',
        config: 'not-an-object',
        message: `Expected the default export of "${configPathIn('/project')}" to be an object`,
      },
      {
        name: 'the default export is an array',
        config: [{ rules: {} }],
        message: `Expected the default export of "${configPathIn('/project')}" to be an object`,
      },
      {
        name: 'maxSeverity is not an object',
        config: { maxSeverity: 'not-an-object' },
        message: `Expected maxSeverity in "${configPathIn('/project')}" to be an object`,
      },
      {
        name: 'maxSeverity is an array',
        config: { maxSeverity: ['some-rule'] },
        message: `Expected maxSeverity in "${configPathIn('/project')}" to be an object`,
      },
      {
        name: 'a maxSeverity value is neither "warn" nor "error"',
        config: { maxSeverity: { 'some-rule': 'invalid' } },
        message: `Expected maxSeverity["some-rule"] in "${configPathIn('/project')}" to be "warn" or "error", got "invalid"`,
      },
      {
        name: 'shouldIgnoreAncestors is not a boolean',
        config: { shouldIgnoreAncestors: 'yes' },
        message: `Expected shouldIgnoreAncestors in "${configPathIn('/project')}" to be a boolean`,
      },
    ])('rejects when $name', async ({ config, message }) => {
      withCascadeEntries([['/project', config]]);

      await expect(loadStrictLintConfigs('/project')).rejects.toThrow(message);
    });

    it('accepts a config with no maxSeverity key', async () => {
      withCascadeEntries([['/project', {}]]);

      const { entries } = await loadStrictLintConfigs('/project');

      expect(entries).toEqual([{ config: {}, dir: '/project', filePath: configPathIn('/project') }]);
    });

    it('rejects when a farther config is malformed and the nearest one is valid', async () => {
      withCascadeEntries([
        ['/project/packages/pkg', { maxSeverity: {} }],
        ['/project', { maxSeverity: { 'some-rule': 'invalid' } }],
      ]);

      await expect(loadStrictLintConfigs('/project/packages/pkg')).rejects.toThrow(configPathIn('/project'));
    });
  });

  describe('native TypeScript failures', () => {
    const originalTypescriptFeature = Object.getOwnPropertyDescriptor(process.features, 'typescript');

    afterEach(() => {
      if (originalTypescriptFeature) {
        Object.defineProperty(process.features, 'typescript', originalTypescriptFeature);
      }
    });

    it('maps unsupported TypeScript syntax to an actionable message naming the config file', async () => {
      mockedLoadConfigCascade.mockRejectedValue(
        Object.assign(new Error('TypeScript enum is not supported in strip-only mode'), {
          code: 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX',
        }),
      );

      await expect(loadStrictLintConfigs('/project')).rejects.toThrow(
        `Cannot load the TypeScript config "${STRICT_LINT_CONFIG_NAME}"`,
      );
      await expect(loadStrictLintConfigs('/project')).rejects.toThrow(/erasable TypeScript syntax/);
    });

    it('maps an unloadable TypeScript extension to the Node >=24 message when type stripping is off', async () => {
      Object.defineProperty(process.features, 'typescript', { value: false, configurable: true, enumerable: true });
      mockedLoadConfigCascade.mockRejectedValue(
        Object.assign(new Error('Unknown file extension ".ts"'), { code: 'ERR_UNKNOWN_FILE_EXTENSION' }),
      );

      await expect(loadStrictLintConfigs('/project')).rejects.toThrow(/Node >=24/);
    });

    it('rethrows an unrelated cascade failure unchanged', async () => {
      const failure = new Error('permission denied');
      mockedLoadConfigCascade.mockRejectedValue(failure);

      await expect(loadStrictLintConfigs('/project')).rejects.toBe(failure);
    });
  });
});

// region | Helpers

/** Make the mocked cascade resolve with an entry per directory, in the nearest-first order the real one produces. */
function withCascadeEntries(
  configsByDir: Array<[dir: string, config: unknown]>,
  stopReason: 'predicate' | 'project-root' = 'project-root',
): void {
  mockedLoadConfigCascade.mockResolvedValue({
    entries: configsByDir.map(([dir, config]) => ({ config, dir, filePath: configPathIn(dir) })),
    projectRoot: PROJECT_ROOT,
    stopReason,
  });
}

/** The stop predicate strict-lint handed to the cascade on its most recent call. */
function stopAscentPredicate(): (config: unknown) => boolean {
  const predicate = mockedLoadConfigCascade.mock.lastCall?.[0].shouldStopAscent;
  if (predicate === undefined) {
    throw new Error('loadConfigCascade was called without a stop predicate');
  }
  return predicate;
}

/** The strict-lint config path within the given directory. */
function configPathIn(dir: string): string {
  return `${dir}/${STRICT_LINT_CONFIG_NAME}`;
}

// endregion | Helpers
