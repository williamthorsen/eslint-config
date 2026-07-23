import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { strictLint } from '../strictLint.ts';

const {
  mockedConvertWarnToError,
  mockedResolveEslintConfig,
  mockedLoadStrictLintConfig,
  mockedWriteFile,
  mockEslintConstructor,
  mockFormat,
  mockGetErrorResults,
  mockLintFiles,
  mockLoadFormatter,
  mockOutputFixes,
} = vi.hoisted(() => ({
  mockedConvertWarnToError: vi.fn((config: Record<string, unknown>) => config),
  mockedResolveEslintConfig: vi.fn(),
  mockedLoadStrictLintConfig: vi.fn(),
  mockedWriteFile: vi.fn().mockResolvedValue(undefined),
  mockEslintConstructor: vi.fn(),
  mockFormat: vi.fn().mockResolvedValue(''),
  mockGetErrorResults: vi.fn((results: unknown[]) => results),
  mockLintFiles: vi.fn().mockResolvedValue([]),
  mockLoadFormatter: vi.fn(),
  mockOutputFixes: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../convertWarnToError.ts', () => ({
  convertWarnToError: mockedConvertWarnToError,
}));

vi.mock('../resolveEslintConfig.ts', () => ({
  resolveEslintConfig: mockedResolveEslintConfig,
}));

vi.mock('../loadStrictLintConfig.ts', () => ({
  loadStrictLintConfig: mockedLoadStrictLintConfig,
}));

vi.mock('node:fs/promises', () => ({
  default: { writeFile: mockedWriteFile },
}));

vi.mock('eslint', () => {
  mockLoadFormatter.mockReturnValue(Promise.resolve({ format: mockFormat }));
  return {
    ESLint: class {
      static outputFixes = mockOutputFixes;
      static getErrorResults = mockGetErrorResults;
      lintFiles = mockLintFiles;
      loadFormatter = mockLoadFormatter;
      constructor(options: unknown) {
        mockEslintConstructor(options);
      }
    },
    type: {},
  };
});

describe(strictLint, () => {
  describe('maxSeverity merge precedence', () => {
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
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      mockedLoadStrictLintConfig.mockResolvedValue(undefined);

      await strictLint();

      expect(mockedConvertWarnToError).toHaveBeenCalledWith(
        { rules: {} },
        expect.objectContaining({ '@typescript-eslint/no-deprecated': 'warn' }),
      );
    });

    it('config file overrides built-in defaults', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
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
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
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

    it('starts the config walk at the cwd when baseConfig is provided', async () => {
      mockedLoadStrictLintConfig.mockResolvedValue(undefined);

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(mockedLoadStrictLintConfig).toHaveBeenCalledWith(process.cwd());
    });

    it('starts the config walk at the cwd when the ESLint config is discovered', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      mockedLoadStrictLintConfig.mockResolvedValue(undefined);

      await strictLint();

      expect(mockedLoadStrictLintConfig).toHaveBeenCalledWith(process.cwd());
    });

    it('merges all three layers with correct precedence', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
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

  describe('exit code', () => {
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

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(process.exit).not.toHaveBeenCalled();
    });

    it('exits 0 when only warnings are reported', async () => {
      mockLintFiles.mockResolvedValueOnce([{ errorCount: 0, warningCount: 3 }]);

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(process.exit).not.toHaveBeenCalled();
    });

    it('exits 1 when errors are reported', async () => {
      mockLintFiles.mockResolvedValueOnce([
        { errorCount: 2, warningCount: 1 },
        { errorCount: 1, warningCount: 0 },
      ]);

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('exits 1 when doLint throws an error', async () => {
      mockLintFiles.mockRejectedValueOnce(new Error('lint failure'));

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('CLI behavior', () => {
    const originalExit = process.exit;
    const originalArgv = process.argv;

    beforeEach(() => {
      vi.clearAllMocks();
      process.exit = vi.fn<(code?: string | number | null) => never>();
      process.argv = ['node', 'strict-lint'];
      mockedLoadStrictLintConfig.mockResolvedValue(undefined);
      mockFormat.mockResolvedValue('');
      mockLintFiles.mockResolvedValue([{ errorCount: 0, warningCount: 0 }]);
    });

    afterEach(() => {
      process.exit = originalExit;
      process.argv = originalArgv;
    });

    it('uses CLI positionals as lint patterns', async () => {
      process.argv = ['node', 'strict-lint', 'src/', 'lib/'];

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(mockLintFiles).toHaveBeenCalledWith(['src/', 'lib/']);
    });

    it('uses programmatic patterns when no CLI positionals are provided', async () => {
      await strictLint({ baseConfig: [{ rules: {} }], patterns: ['custom/'] });

      expect(mockLintFiles).toHaveBeenCalledWith(['custom/']);
    });

    it('prefers CLI positionals over programmatic patterns', async () => {
      process.argv = ['node', 'strict-lint', 'cli-path/'];

      await strictLint({ baseConfig: [{ rules: {} }], patterns: ['programmatic-path/'] });

      expect(mockLintFiles).toHaveBeenCalledWith(['cli-path/']);
    });

    it('defaults to ["."] when no patterns are specified', async () => {
      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(mockLintFiles).toHaveBeenCalledWith(['.']);
    });

    it('suppresses outputFixes when --fix-dry-run is specified', async () => {
      process.argv = ['node', 'strict-lint', '--fix-dry-run'];

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(mockOutputFixes).not.toHaveBeenCalled();
    });

    it('calls outputFixes when --fix is specified without --fix-dry-run', async () => {
      process.argv = ['node', 'strict-lint', '--fix'];

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(mockOutputFixes).toHaveBeenCalled();
    });

    it('filters warnings through getErrorResults when --quiet is specified', async () => {
      process.argv = ['node', 'strict-lint', '--quiet'];
      const results = [{ errorCount: 1, warningCount: 3 }];
      mockLintFiles.mockResolvedValueOnce(results);
      mockGetErrorResults.mockReturnValueOnce([{ errorCount: 1, warningCount: 0 }]);

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(mockGetErrorResults).toHaveBeenCalledWith(results);
    });

    it('evaluates --max-warnings against unfiltered results even when --quiet is active', async () => {
      process.argv = ['node', 'strict-lint', '--quiet', '--max-warnings', '2'];
      const results = [{ errorCount: 0, warningCount: 5 }];
      mockLintFiles.mockResolvedValueOnce(results);
      // getErrorResults strips warnings, so filtered warningCount would be 0
      mockGetErrorResults.mockReturnValueOnce([{ errorCount: 0, warningCount: 0 }]);

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('does not filter through getErrorResults when --quiet is not specified', async () => {
      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(mockGetErrorResults).not.toHaveBeenCalled();
    });

    it('exits 1 when warnings exceed --max-warnings threshold', async () => {
      process.argv = ['node', 'strict-lint', '--max-warnings', '2'];
      mockLintFiles.mockResolvedValueOnce([{ errorCount: 0, warningCount: 3 }]);

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('does not exit when warnings are within --max-warnings threshold', async () => {
      process.argv = ['node', 'strict-lint', '--max-warnings', '5'];
      mockLintFiles.mockResolvedValueOnce([{ errorCount: 0, warningCount: 3 }]);

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(process.exit).not.toHaveBeenCalled();
    });

    it('loads the specified formatter when --format is provided', async () => {
      process.argv = ['node', 'strict-lint', '--format', 'json'];

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(mockLoadFormatter).toHaveBeenCalledWith('json');
    });

    it('writes formatted output to file when --output-file is specified', async () => {
      process.argv = ['node', 'strict-lint', '--output-file', 'results.txt'];
      mockFormat.mockResolvedValueOnce('formatted output');

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(mockedWriteFile).toHaveBeenCalledWith('results.txt', 'formatted output', 'utf8');
    });

    it('exits 1 when --rule specifies an invalid severity', async () => {
      process.argv = ['node', 'strict-lint', '--rule', 'no-console: typo'];

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('constructs ESLint with overrideConfigFile: true so it does not re-load the config', async () => {
      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(mockEslintConstructor).toHaveBeenCalledWith(expect.objectContaining({ overrideConfigFile: true }));
    });
  });
});
