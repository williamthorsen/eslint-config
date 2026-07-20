import { describe, expect, it, vi } from 'vitest';

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
  it('returns the config when the file exists and has a valid shape', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedImportConfigModule.mockResolvedValue({
      default: { maxSeverity: { 'some-rule': 'warn' } },
    });

    const result = await loadStrictLintConfig('/project');

    expect(result).toEqual({ maxSeverity: { 'some-rule': 'warn' } });
  });

  it('returns undefined when the config file does not exist', async () => {
    mockedExistsSync.mockReturnValue(false);

    const result = await loadStrictLintConfig('/project');

    expect(result).toBeUndefined();
  });

  it('throws when the config has an invalid shape', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedImportConfigModule.mockResolvedValue({
      default: { maxSeverity: { 'some-rule': 'invalid' } },
    });

    await expect(loadStrictLintConfig('/project')).rejects.toThrow(
      'Expected maxSeverity["some-rule"] to be "warn" or "error"',
    );
  });

  it('throws when the default export is not an object', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedImportConfigModule.mockResolvedValue({
      default: 'not-an-object',
    });

    await expect(loadStrictLintConfig('/project')).rejects.toThrow(
      'Expected strict-lint config default export to be an object',
    );
  });

  it('throws when the module is not an object', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedImportConfigModule.mockResolvedValue(null);

    await expect(loadStrictLintConfig('/project')).rejects.toThrow(
      'Expected strict-lint config module to be an object',
    );
  });

  it('throws when the module has no default export', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedImportConfigModule.mockResolvedValue({});

    await expect(loadStrictLintConfig('/project')).rejects.toThrow(
      'Expected strict-lint config module to have a default export',
    );
  });

  it('throws when maxSeverity is not an object', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedImportConfigModule.mockResolvedValue({
      default: { maxSeverity: 'not-an-object' },
    });

    await expect(loadStrictLintConfig('/project')).rejects.toThrow('Expected maxSeverity to be an object');
  });

  it('returns the config when the default export has no maxSeverity key', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedImportConfigModule.mockResolvedValue({
      default: {},
    });

    const result = await loadStrictLintConfig('/project');

    expect(result).toEqual({});
  });
});
