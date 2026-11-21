import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StrictLintError } from '../common/cliErrors.ts';
import { loadStrictLintConfigs, resolveSharedConfigs, STRICT_LINT_CONFIG_NAME } from '../loadStrictLintConfigs.ts';
import { buildConfigPath } from '../test-utils/strictLintCascades.ts';
import type { StrictLintConfig } from '../types.ts';

interface CascadeOptions {
  fileNames: readonly string[];
  parseConfig: (value: unknown, filePath: string) => StrictLintConfig;
  shouldStopAscent?: ((config: StrictLintConfig) => boolean) | undefined;
  startDir: string;
  stopAtDir: string;
}

const { mockedFindProjectRoot, mockedLoadConfigCascade } = vi.hoisted(() => ({
  mockedFindProjectRoot: vi.fn<(startDir: string) => unknown>(),
  mockedLoadConfigCascade: vi.fn<(options: CascadeOptions) => Promise<unknown>>(),
}));

vi.mock('@williamthorsen/toolbelt.filesystem/candidate', () => ({
  loadConfigCascade: mockedLoadConfigCascade,
}));

vi.mock('@williamthorsen/toolbelt.packaging/candidate', () => ({
  findProjectRoot: mockedFindProjectRoot,
}));

const PROJECT_ROOT = { marker: 'pnpm-workspace.yaml', rootDir: '/project', source: 'marker' };

describe(loadStrictLintConfigs, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFindProjectRoot.mockReturnValue(PROJECT_ROOT);
  });

  it('searches for the strict-lint config file from the given directory', async () => {
    mockCascadeEntries([]);

    await loadStrictLintConfigs('/project/packages/pkg');

    expect(mockedLoadConfigCascade).toHaveBeenCalledWith(
      expect.objectContaining({ fileNames: [STRICT_LINT_CONFIG_NAME], startDir: '/project/packages/pkg' }),
    );
  });

  it('returns the config of every level collected by the cascade, nearest first', async () => {
    mockCascadeEntries([
      ['/project/packages/pkg', { maxSeverity: { 'nearer-rule': 'warn' } }],
      ['/project', { maxSeverity: { 'farther-rule': 'warn' } }],
    ]);

    const { entries } = await loadStrictLintConfigs('/project/packages/pkg');

    expect(entries).toStrictEqual([
      {
        config: { maxSeverity: { 'nearer-rule': 'warn' } },
        dir: '/project/packages/pkg',
        filePath: buildConfigPath('/project/packages/pkg'),
      },
      { config: { maxSeverity: { 'farther-rule': 'warn' } }, dir: '/project', filePath: buildConfigPath('/project') },
    ]);
  });

  it('returns no entries when no config exists within the project', async () => {
    mockCascadeEntries([]);

    const { entries } = await loadStrictLintConfigs('/project/packages/pkg');

    expect(entries).toStrictEqual([]);
  });

  it('bounds the ascent at the project root of the starting directory', async () => {
    mockCascadeEntries([]);

    await loadStrictLintConfigs('/project/packages/pkg');

    expect(mockedFindProjectRoot).toHaveBeenCalledWith('/project/packages/pkg');
    expect(mockedLoadConfigCascade).toHaveBeenCalledWith(expect.objectContaining({ stopAtDir: '/project' }));
  });

  it('passes the cascade provenance through to the caller', async () => {
    mockCascadeEntries([['/project', {}]], 'predicate');

    const { projectRoot, stopReason } = await loadStrictLintConfigs('/project');

    expect(projectRoot).toStrictEqual(PROJECT_ROOT);
    expect(stopReason).toBe('predicate');
  });

  describe('stop-ascent predicate', () => {
    it.each([
      { name: 'the flag is true', config: { shouldIgnoreAncestors: true }, stops: true },
      { name: 'the flag is false', config: { shouldIgnoreAncestors: false }, stops: false },
      { name: 'the flag is absent', config: { maxSeverity: {} }, stops: false },
    ])('reports $stops when $name', async ({ config, stops }) => {
      mockCascadeEntries([]);
      await loadStrictLintConfigs('/project');

      expect(readStopAscentPredicate()(config)).toBe(stops);
    });
  });

  describe('config validation', () => {
    it.each([
      {
        name: 'the default export is not an object',
        config: 'not-an-object',
        message: `Expected the default export of "${buildConfigPath('/project')}" to be an object`,
      },
      {
        name: 'the default export is an array',
        config: [{ rules: {} }],
        message: `Expected the default export of "${buildConfigPath('/project')}" to be an object`,
      },
      {
        name: 'maxSeverity is not an object',
        config: { maxSeverity: 'not-an-object' },
        message: `Expected maxSeverity in "${buildConfigPath('/project')}" to be an object`,
      },
      {
        name: 'maxSeverity is an array',
        config: { maxSeverity: ['some-rule'] },
        message: `Expected maxSeverity in "${buildConfigPath('/project')}" to be an object`,
      },
      {
        name: 'a maxSeverity value is not a rule severity',
        config: { maxSeverity: { 'some-rule': 'invalid' } },
        message: `Expected maxSeverity["some-rule"] in "${buildConfigPath('/project')}" to be a rule severity ("off", "warn", "error", 0, 1, or 2), got "invalid"`,
      },
      {
        name: 'a maxSeverity value is a severity-adjacent number outside the vocabulary',
        config: { maxSeverity: { 'some-rule': 3 } },
        message: `Expected maxSeverity["some-rule"] in "${buildConfigPath('/project')}" to be a rule severity ("off", "warn", "error", 0, 1, or 2), got "3"`,
      },
      {
        name: 'a maxSeverity value is an object',
        config: { maxSeverity: { 'some-rule': { max: 'warn' } } },
        message: `Expected maxSeverity["some-rule"] in "${buildConfigPath('/project')}" to be a rule severity ("off", "warn", "error", 0, 1, or 2), got "{"max":"warn"}"`,
      },
      {
        name: 'shouldIgnoreAncestors is not a boolean',
        config: { shouldIgnoreAncestors: 'yes' },
        message: `Expected shouldIgnoreAncestors in "${buildConfigPath('/project')}" to be a boolean`,
      },
      {
        name: 'sharedConfigs is not an array',
        config: { sharedConfigs: { rules: {} } },
        message: `Expected sharedConfigs in "${buildConfigPath('/project')}" to be an array`,
      },
      {
        name: 'a sharedConfigs entry is a package name rather than a config value',
        config: { sharedConfigs: ['@some/shared-config'] },
        message: `Expected sharedConfigs[0] in "${buildConfigPath('/project')}" to be a config object or an array of them, got "@some/shared-config"`,
      },
      {
        name: 'a sharedConfigs entry contains a non-config among its elements',
        config: { sharedConfigs: [[{ rules: {} }, 'not-a-config']] },
        message: `Expected sharedConfigs[0] in "${buildConfigPath('/project')}" to be a config object or an array of them, got "not-a-config"`,
      },
    ])('rejects when $name', async ({ config, message }) => {
      mockCascadeEntries([['/project', config]]);

      await expect(loadStrictLintConfigs('/project')).rejects.toThrow(message);
      await expect(loadStrictLintConfigs('/project')).rejects.toThrow(StrictLintError);
    });

    it('accepts a config with no maxSeverity key', async () => {
      mockCascadeEntries([['/project', {}]]);

      const { entries } = await loadStrictLintConfigs('/project');

      expect(entries).toStrictEqual([{ config: {}, dir: '/project', filePath: buildConfigPath('/project') }]);
    });

    it.each(['off', 'warn', 'error', 0, 1, 2, undefined])('accepts the maxSeverity value %o', async (severity) => {
      const config = { maxSeverity: { 'some-rule': severity } };
      mockCascadeEntries([['/project', config]]);

      const { entries } = await loadStrictLintConfigs('/project');

      expect(entries).toStrictEqual([{ config, dir: '/project', filePath: buildConfigPath('/project') }]);
    });

    it('rejects when a farther config is malformed and the nearest one is valid', async () => {
      mockCascadeEntries([
        ['/project/packages/pkg', { maxSeverity: {} }],
        ['/project', { maxSeverity: { 'some-rule': 'invalid' } }],
      ]);

      await expect(loadStrictLintConfigs('/project/packages/pkg')).rejects.toThrow(buildConfigPath('/project'));
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

describe(resolveSharedConfigs, () => {
  const nearer = { rules: { 'nearer-rule': 'error' } };
  const farther = { rules: { 'farther-rule': 'error' } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFindProjectRoot.mockReturnValue(PROJECT_ROOT);
  });

  it('flattens config arrays and bare config objects into one element list', async () => {
    mockCascadeEntries([['/project', { sharedConfigs: [[nearer], farther] }]]);

    expect(resolveSharedConfigs(await loadStrictLintConfigs('/project'))).toStrictEqual([nearer, farther]);
  });

  it('takes the nearest declaration outright rather than merging it with a farther one', async () => {
    mockCascadeEntries([
      ['/project/packages/pkg', { sharedConfigs: [nearer] }],
      ['/project', { sharedConfigs: [farther] }],
    ]);

    expect(resolveSharedConfigs(await loadStrictLintConfigs('/project/packages/pkg'))).toStrictEqual([nearer]);
  });

  it('skips a level that declares none', async () => {
    mockCascadeEntries([
      ['/project/packages/pkg', { maxSeverity: {} }],
      ['/project', { sharedConfigs: [farther] }],
    ]);

    expect(resolveSharedConfigs(await loadStrictLintConfigs('/project/packages/pkg'))).toStrictEqual([farther]);
  });

  it('resolves to no elements when no level declares any', async () => {
    mockCascadeEntries([['/project', {}]]);

    expect(resolveSharedConfigs(await loadStrictLintConfigs('/project'))).toStrictEqual([]);
  });
});

// region | Helpers

/**
 * Makes the mocked cascade resolve with an entry per directory, in the nearest-first order of the real one, passing
 * each raw config through the parser that strict-lint supplied, as the real cascade does.
 */
function mockCascadeEntries(
  configsByDir: Array<[dir: string, config: unknown]>,
  stopReason: 'predicate' | 'stop-dir' = 'stop-dir',
): void {
  mockedLoadConfigCascade.mockImplementation(({ parseConfig }) =>
    Promise.try(() => ({
      entries: configsByDir.map(([dir, config]) => {
        const filePath = buildConfigPath(dir);
        return { config: parseConfig(config, filePath), dir, filePath };
      }),
      stopReason,
    })),
  );
}

/** Returns the stop predicate that strict-lint passed to the cascade on its most recent call. */
function readStopAscentPredicate(): (config: StrictLintConfig) => boolean {
  const predicate = mockedLoadConfigCascade.mock.lastCall?.[0].shouldStopAscent;
  if (predicate === undefined) {
    throw new Error('loadConfigCascade was called without a stop predicate');
  }
  return predicate;
}

// endregion | Helpers
