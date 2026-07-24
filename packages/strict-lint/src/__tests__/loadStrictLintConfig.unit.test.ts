import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadStrictLintConfig } from '../loadStrictLintConfig.ts';

const { mockedExistsSync, mockedImportConfigModule } = vi.hoisted(() => ({
  mockedExistsSync: vi.fn<(path: string) => boolean>(),
  mockedImportConfigModule: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: { existsSync: mockedExistsSync },
  existsSync: mockedExistsSync,
}));

vi.mock('../common/importConfigModule.ts', () => ({
  importConfigModule: mockedImportConfigModule,
}));

describe(loadStrictLintConfig, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the config when it exists in the start directory', async () => {
    withExistingPaths([configPathIn('/project/packages/pkg')]);
    mockedImportConfigModule.mockResolvedValue({
      default: { maxSeverity: { 'some-rule': 'warn' } },
    });

    const result = await loadStrictLintConfig('/project/packages/pkg');

    expect(result).toEqual({ maxSeverity: { 'some-rule': 'warn' } });
  });

  it('walks up to an ancestor directory when the start directory has no config', async () => {
    withExistingPaths([configPathIn('/project')]);
    mockedImportConfigModule.mockResolvedValue({
      default: { maxSeverity: { 'some-rule': 'warn' } },
    });

    const result = await loadStrictLintConfig('/project/packages/pkg');

    expect(mockedImportConfigModule).toHaveBeenCalledWith(configPathIn('/project'));
    expect(result).toEqual({ maxSeverity: { 'some-rule': 'warn' } });
  });

  it('loads only the nearest config when configs exist at several levels', async () => {
    withExistingPaths([configPathIn('/project'), configPathIn('/project/packages/pkg')]);
    mockedImportConfigModule.mockResolvedValue({ default: {} });

    await loadStrictLintConfig('/project/packages/pkg');

    expect(mockedImportConfigModule).toHaveBeenCalledExactlyOnceWith(configPathIn('/project/packages/pkg'));
  });

  it('returns undefined when no config exists up to the root', async () => {
    withExistingPaths([]);

    const result = await loadStrictLintConfig('/project/packages/pkg');

    expect(result).toBeUndefined();
    expect(mockedImportConfigModule).not.toHaveBeenCalled();
  });

  it('throws when the config has an invalid shape', async () => {
    withExistingPaths([configPathIn('/project')]);
    mockedImportConfigModule.mockResolvedValue({
      default: { maxSeverity: { 'some-rule': 'invalid' } },
    });

    await expect(loadStrictLintConfig('/project')).rejects.toThrow(
      'Expected maxSeverity["some-rule"] to be "warn" or "error"',
    );
  });

  it('throws when the default export is not an object', async () => {
    withExistingPaths([configPathIn('/project')]);
    mockedImportConfigModule.mockResolvedValue({
      default: 'not-an-object',
    });

    await expect(loadStrictLintConfig('/project')).rejects.toThrow(
      'Expected strict-lint config default export to be an object',
    );
  });

  it('throws when the module is not an object', async () => {
    withExistingPaths([configPathIn('/project')]);
    mockedImportConfigModule.mockResolvedValue(null);

    await expect(loadStrictLintConfig('/project')).rejects.toThrow(
      'Expected strict-lint config module to be an object',
    );
  });

  it('throws when the module has no default export', async () => {
    withExistingPaths([configPathIn('/project')]);
    mockedImportConfigModule.mockResolvedValue({});

    await expect(loadStrictLintConfig('/project')).rejects.toThrow(
      'Expected strict-lint config module to have a default export',
    );
  });

  it('throws when maxSeverity is not an object', async () => {
    withExistingPaths([configPathIn('/project')]);
    mockedImportConfigModule.mockResolvedValue({
      default: { maxSeverity: 'not-an-object' },
    });

    await expect(loadStrictLintConfig('/project')).rejects.toThrow('Expected maxSeverity to be an object');
  });

  it('returns the config when the default export has no maxSeverity key', async () => {
    withExistingPaths([configPathIn('/project')]);
    mockedImportConfigModule.mockResolvedValue({
      default: {},
    });

    const result = await loadStrictLintConfig('/project');

    expect(result).toEqual({});
  });
});

// region | Helpers

/** Make the mocked `fs.existsSync` report exactly the given absolute paths as present. */
function withExistingPaths(paths: string[]): void {
  const set = new Set(paths);
  mockedExistsSync.mockImplementation((candidate) => set.has(candidate));
}

/** The strict-lint config path within the given directory. */
function configPathIn(dir: string): string {
  return `${dir}/.config/strict-lint.config.ts`;
}

// endregion | Helpers
