import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { strictLint } from '../strictLint.ts';
import type { StrictLintConfig } from '../types.ts';

const {
  mockedConvertWarnToError,
  mockedResolveEslintConfig,
  mockedLoadStrictLintConfigs,
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
  mockedLoadStrictLintConfigs: vi.fn(),
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

vi.mock('../loadStrictLintConfigs.ts', () => ({
  loadStrictLintConfigs: mockedLoadStrictLintConfigs,
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

    it('applies an empty allowlist when no config file or programmatic overrides exist', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      withStrictLintConfigs();

      await strictLint();

      expect(mockedConvertWarnToError).toHaveBeenCalledWith({ rules: {} }, {});
    });

    it('applies the allowlist of the only config file', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      withStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });

      await strictLint();

      expect(mockedConvertWarnToError).toHaveBeenCalledWith({ rules: {} }, { 'some-rule': 'warn' });
    });

    it('keeps the entries of a farther config that a nearer one does not mention', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      withStrictLintConfigs({ maxSeverity: { 'nearer-rule': 'warn' } }, { maxSeverity: { 'farther-rule': 'warn' } });

      await strictLint();

      expect(mockedConvertWarnToError).toHaveBeenCalledWith(
        { rules: {} },
        { 'farther-rule': 'warn', 'nearer-rule': 'warn' },
      );
    });

    it('lets a nearer config drop an inherited entry by promoting it to error', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      withStrictLintConfigs({ maxSeverity: { 'shared-rule': 'error' } }, { maxSeverity: { 'shared-rule': 'warn' } });

      await strictLint();

      expect(mockedConvertWarnToError).toHaveBeenCalledWith({ rules: {} }, { 'shared-rule': 'error' });
    });

    it('programmatic overrides take precedence over every config file', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      withStrictLintConfigs({ maxSeverity: { 'some-rule': 'error' } }, { maxSeverity: { 'some-rule': 'warn' } });

      await strictLint({ maxSeverity: { 'some-rule': 'warn' } });

      expect(mockedConvertWarnToError).toHaveBeenCalledWith({ rules: {} }, { 'some-rule': 'warn' });
    });

    it('starts the config walk at the cwd when baseConfig is provided', async () => {
      withStrictLintConfigs();

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(mockedLoadStrictLintConfigs).toHaveBeenCalledWith(process.cwd());
    });

    it('starts the config walk at the cwd when the ESLint config is discovered', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      withStrictLintConfigs();

      await strictLint();

      expect(mockedLoadStrictLintConfigs).toHaveBeenCalledWith(process.cwd());
    });

    it('merges every layer with correct precedence', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      withStrictLintConfigs(
        { maxSeverity: { 'nearer-rule': 'warn', 'shared-rule': 'error' } },
        { maxSeverity: { 'farther-rule': 'warn', 'shared-rule': 'warn' } },
      );

      await strictLint({ maxSeverity: { 'programmatic-only-rule': 'warn', 'shared-rule': 'warn' } });

      expect(mockedConvertWarnToError).toHaveBeenCalledWith(
        { rules: {} },
        {
          'farther-rule': 'warn',
          'nearer-rule': 'warn',
          'programmatic-only-rule': 'warn',
          'shared-rule': 'warn',
        },
      );
    });
  });

  describe('--debug provenance', () => {
    const originalExit = process.exit;
    const originalArgv = process.argv;
    let errorSpy: MockInstance<typeof console.error>;

    beforeEach(() => {
      vi.clearAllMocks();
      process.exit = vi.fn<(code?: string | number | null) => never>();
      process.argv = ['node', 'strict-lint', '--debug'];
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      errorSpy.mockRestore();
      process.exit = originalExit;
      process.argv = originalArgv;
    });

    it('names the project root and every contributing config file, lowest precedence first', async () => {
      withStrictLintConfigs({ maxSeverity: {} }, { maxSeverity: {} });

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(reportedLines()).toEqual([
        'strict-lint: project root /project (marker: pnpm-workspace.yaml)',
        'strict-lint: config files, lowest precedence first:',
        `strict-lint:   ${configPathIn('/project/level-1')}`,
        `strict-lint:   ${configPathIn('/project/level-0')}`,
      ]);
    });

    it('reports that no config file was found when the cascade collected none', async () => {
      withStrictLintConfigs();

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(reportedLines()).toContain('strict-lint: no config file found');
    });

    it('reports the stop when a config bounded the ascent', async () => {
      withStoppedAscent({ shouldIgnoreAncestors: true });

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(reportedLines()).toContain('strict-lint: ascent stopped by shouldIgnoreAncestors');
    });

    it('stays silent when --debug is absent', async () => {
      process.argv = ['node', 'strict-lint'];
      withStrictLintConfigs({ maxSeverity: {} });

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(errorSpy).not.toHaveBeenCalled();
    });

    /** The lines the run wrote to stderr. */
    function reportedLines(): string[] {
      return errorSpy.mock.calls.map(([line]) => String(line));
    }
  });

  describe('exit code', () => {
    const originalExit = process.exit;
    const originalArgv = process.argv;

    beforeEach(() => {
      vi.clearAllMocks();
      process.exit = vi.fn<(code?: string | number | null) => never>();
      process.argv = ['node', 'strict-lint'];
      withStrictLintConfigs();
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
      withStrictLintConfigs();
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

// region | Helpers

/** Make the mocked loader resolve with one cascade entry per config, given nearest first. */
function withStrictLintConfigs(...configs: StrictLintConfig[]): void {
  withCascade(configs, 'project-root');
}

/** The same, for a walk that a `shouldIgnoreAncestors` config cut short. */
function withStoppedAscent(...configs: StrictLintConfig[]): void {
  withCascade(configs, 'predicate');
}

function withCascade(configs: StrictLintConfig[], stopReason: 'predicate' | 'project-root'): void {
  mockedLoadStrictLintConfigs.mockResolvedValue({
    entries: configs.map((config, index) => ({
      config,
      dir: `/project/level-${String(index)}`,
      filePath: configPathIn(`/project/level-${String(index)}`),
    })),
    projectRoot: { marker: 'pnpm-workspace.yaml', rootDir: '/project', source: 'marker' },
    stopReason,
  });
}

/** The strict-lint config path within the given directory. */
function configPathIn(dir: string): string {
  return `${dir}/.config/strict-lint.config.ts`;
}

// endregion | Helpers
