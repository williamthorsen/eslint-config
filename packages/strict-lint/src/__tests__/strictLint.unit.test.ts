import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockedConvertWarnToError, mockedFindNearestFile, mockedLoadStrictLintConfig, mockFormat, mockLintFiles } =
  vi.hoisted(() => ({
    mockedConvertWarnToError: vi.fn((config: Record<string, unknown>) => config),
    mockedFindNearestFile: vi.fn<(fileName: string) => string | undefined>(),
    mockedLoadStrictLintConfig: vi.fn(),
    mockFormat: vi.fn().mockResolvedValue(''),
    mockLintFiles: vi.fn().mockResolvedValue([]),
  }));

vi.mock('../convertWarnToError.ts', () => ({
  convertWarnToError: mockedConvertWarnToError,
}));

vi.mock('../common/findNearestFile.ts', () => ({
  findNearestFile: mockedFindNearestFile,
}));

vi.mock('../loadStrictLintConfig.ts', () => ({
  loadStrictLintConfig: mockedLoadStrictLintConfig,
}));

vi.mock('eslint', () => {
  const mockLoadFormatter = vi.fn().mockResolvedValue({ format: mockFormat });
  const mockOutputFixes = vi.fn().mockResolvedValue(undefined);
  return {
    ESLint: class {
      lintFiles = mockLintFiles;
      loadFormatter = mockLoadFormatter;
      static outputFixes = mockOutputFixes;
    },
    type: {},
  };
});

// Import after mocks are set up

const { strictLint } = await import('../strictLint.ts');

describe('strictLint() maxSeverity merge precedence', () => {
  // Prevent process.exit from terminating tests
  const originalExit = process.exit;
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.clearAllMocks();
    process.exit = vi.fn<(code?: string | number | null) => never>();
    process.argv = ['node', 'strict-lint'];
  });

  afterEach(() => {
    process.exit = originalExit;
    process.argv = originalArgv;
  });

  it('applies only built-in defaults when no config file or programmatic overrides exist', async () => {
    mockedFindNearestFile.mockReturnValue('/project/eslint.config.js');
    vi.doMock('/project/eslint.config.js', () => ({ default: [{ rules: {} }] }));
    mockedLoadStrictLintConfig.mockResolvedValue(undefined);

    await strictLint();

    expect(mockedConvertWarnToError).toHaveBeenCalledWith(
      { rules: {} },
      expect.objectContaining({ '@typescript-eslint/no-deprecated': 'warn' }),
    );
  });

  it('config file overrides built-in defaults', async () => {
    mockedFindNearestFile.mockReturnValue('/project/eslint.config.js');
    vi.doMock('/project/eslint.config.js', () => ({ default: [{ rules: {} }] }));
    mockedLoadStrictLintConfig.mockResolvedValue({
      maxSeverity: { '@typescript-eslint/no-deprecated': 'error' },
    });

    await strictLint();

    expect(mockedConvertWarnToError).toHaveBeenCalledWith(
      { rules: {} },
      expect.objectContaining({ '@typescript-eslint/no-deprecated': 'error' }),
    );
  });

  it('programmatic overrides take precedence over config file', async () => {
    mockedFindNearestFile.mockReturnValue('/project/eslint.config.js');
    vi.doMock('/project/eslint.config.js', () => ({ default: [{ rules: {} }] }));
    mockedLoadStrictLintConfig.mockResolvedValue({
      maxSeverity: { 'some-rule': 'error' },
    });

    await strictLint({
      maxSeverity: { 'some-rule': 'warn' },
    });

    expect(mockedConvertWarnToError).toHaveBeenCalledWith(
      { rules: {} },
      expect.objectContaining({
        '@typescript-eslint/no-deprecated': 'warn',
        'some-rule': 'warn',
      }),
    );
  });

  it('uses process.cwd() as config dir when baseConfig is provided', async () => {
    mockedLoadStrictLintConfig.mockResolvedValue(undefined);

    await strictLint({ baseConfig: [{ rules: {} }] });

    expect(mockedLoadStrictLintConfig).toHaveBeenCalledWith(process.cwd());
  });

  it('merges all three layers with correct precedence', async () => {
    mockedFindNearestFile.mockReturnValue('/project/eslint.config.js');
    vi.doMock('/project/eslint.config.js', () => ({ default: [{ rules: {} }] }));
    mockedLoadStrictLintConfig.mockResolvedValue({
      maxSeverity: {
        '@typescript-eslint/no-deprecated': 'error',
        'config-only-rule': 'warn',
      },
    });

    await strictLint({
      maxSeverity: {
        '@typescript-eslint/no-deprecated': 'warn',
        'programmatic-only-rule': 'warn',
      },
    });

    expect(mockedConvertWarnToError).toHaveBeenCalledWith(
      { rules: {} },
      expect.objectContaining({
        '@typescript-eslint/no-deprecated': 'warn',
        'config-only-rule': 'warn',
        'programmatic-only-rule': 'warn',
      }),
    );
  });
});

describe('strictLint() exit code', () => {
  const originalExit = process.exit;
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.clearAllMocks();
    process.exit = vi.fn<(code?: string | number | null) => never>();
    process.argv = ['node', 'strict-lint'];
    mockedLoadStrictLintConfig.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.exit = originalExit;
    process.argv = originalArgv;
  });

  it('exits 0 when no problems are reported', async () => {
    mockLintFiles.mockResolvedValueOnce([{ errorCount: 0, warningCount: 0 }]);
    mockFormat.mockResolvedValueOnce('');

    await strictLint({ baseConfig: [{ rules: {} }] });

    expect(process.exit).not.toHaveBeenCalled();
  });

  it('exits 0 when only warnings are reported', async () => {
    mockLintFiles.mockResolvedValueOnce([{ errorCount: 0, warningCount: 3 }]);
    mockFormat.mockResolvedValueOnce('\n\u2716 3 problems (0 errors, 3 warnings)\n');

    await strictLint({ baseConfig: [{ rules: {} }] });

    expect(process.exit).not.toHaveBeenCalled();
  });

  it('exits 1 when errors are reported', async () => {
    mockLintFiles.mockResolvedValueOnce([
      { errorCount: 2, warningCount: 1 },
      { errorCount: 1, warningCount: 0 },
    ]);
    mockFormat.mockResolvedValueOnce('\n\u2716 4 problems (3 errors, 1 warning)\n');

    await strictLint({ baseConfig: [{ rules: {} }] });

    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
