import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ESLINT_CONFIG_FILENAMES, resolveEslintConfig } from '../resolveEslintConfig.ts';

const { mockedFindNearestFile, mockedImportConfigModule } = vi.hoisted(() => ({
  mockedFindNearestFile: vi.fn(),
  mockedImportConfigModule: vi.fn(),
}));

vi.mock('../common/findNearestFile.ts', () => ({ findNearestFile: mockedFindNearestFile }));
vi.mock('../common/importConfigModule.ts', () => ({ importConfigModule: mockedImportConfigModule }));

describe('ESLINT_CONFIG_FILENAMES', () => {
  it("matches ESLint's flat-config priority order", () => {
    expect([...ESLINT_CONFIG_FILENAMES]).toEqual([
      'eslint.config.js',
      'eslint.config.mjs',
      'eslint.config.cjs',
      'eslint.config.ts',
      'eslint.config.mts',
      'eslint.config.cts',
    ]);
  });
});

describe(resolveEslintConfig, () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('discovers the config by walking up for any of the six filenames', async () => {
    mockedFindNearestFile.mockReturnValue('/proj/eslint.config.ts');
    mockedImportConfigModule.mockResolvedValue({ default: [{ rules: {} }] });

    const result = await resolveEslintConfig();

    expect(mockedFindNearestFile).toHaveBeenCalledWith(ESLINT_CONFIG_FILENAMES);
    expect(mockedImportConfigModule).toHaveBeenCalledWith('/proj/eslint.config.ts');
    expect(result).toEqual([{ rules: {} }]);
  });

  it('loads an explicit config path without discovery', async () => {
    mockedImportConfigModule.mockResolvedValue({ default: [] });
    const explicit = path.resolve('/custom/eslint.config.mts');

    const result = await resolveEslintConfig(explicit);

    expect(mockedFindNearestFile).not.toHaveBeenCalled();
    expect(mockedImportConfigModule).toHaveBeenCalledWith(explicit);
    expect(result).toEqual([]);
  });

  it('throws a not-found error naming all six filenames when no config exists', async () => {
    mockedFindNearestFile.mockReturnValue(undefined);

    await expect(resolveEslintConfig()).rejects.toThrow(/eslint\.config\.js.*eslint\.config\.cts/s);
  });

  it('rejects a module whose default export is not an array', async () => {
    mockedFindNearestFile.mockReturnValue('/proj/eslint.config.js');
    mockedImportConfigModule.mockResolvedValue({ default: { not: 'an array' } });

    await expect(resolveEslintConfig()).rejects.toThrow(/array/);
  });
});
