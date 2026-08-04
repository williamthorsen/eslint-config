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
  mockLoadFormatter.mockResolvedValue({ format: mockFormat });
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
    const originalArgv = process.argv;
    let exitSpy: MockInstance<typeof process.exit>;

    beforeEach(() => {
      vi.clearAllMocks();
      exitSpy = mockExit();
      process.argv = ['node', 'strict-lint'];
    });

    afterEach(() => {
      exitSpy.mockRestore();
      process.argv = originalArgv;
    });

    it('applies no ceilings when no config file or programmatic overrides exist', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      withStrictLintConfigs();

      await strictLint();

      expect(mockedConvertWarnToError).toHaveBeenCalledWith({ rules: {} }, {});
    });

    it('applies the ceilings of the only config file', async () => {
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

    it('lets a nearer config drop an inherited ceiling by promoting it to error', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      withStrictLintConfigs({ maxSeverity: { 'shared-rule': 'error' } }, { maxSeverity: { 'shared-rule': 'warn' } });

      await strictLint();

      expect(mockedConvertWarnToError).toHaveBeenCalledWith({ rules: {} }, { 'shared-rule': 'error' });
    });

    it('lets a nearer config drop an inherited ceiling by setting it to undefined', async () => {
      mockedResolveEslintConfig.mockResolvedValue([{ rules: {} }]);
      withStrictLintConfigs(
        { maxSeverity: { 'shared-rule': undefined } },
        { maxSeverity: { 'kept-rule': 'warn', 'shared-rule': 'warn' } },
      );

      await strictLint();

      // `shared-rule` resolves to no ceiling, whether the merge drops the key or keeps it at `undefined`. The
      // untouched sibling proves the farther config was merged at all, so the drop is not a vacuous pass.
      expect(mockedConvertWarnToError).toHaveBeenCalledWith({ rules: {} }, { 'kept-rule': 'warn' });
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
    const originalArgv = process.argv;
    let errorSpy: MockInstance<typeof console.error>;
    let exitSpy: MockInstance<typeof process.exit>;

    beforeEach(() => {
      vi.clearAllMocks();
      exitSpy = mockExit();
      process.argv = ['node', 'strict-lint', '--debug'];
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      errorSpy.mockRestore();
      exitSpy.mockRestore();
      process.argv = originalArgv;
    });

    it('names the project root and every contributing config file, lowest precedence first', async () => {
      withStrictLintConfigs({ maxSeverity: {} }, { maxSeverity: {} });

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(reportedLines()).toStrictEqual([
        'strict-lint: project root /project (marker: pnpm-workspace.yaml)',
        'strict-lint: config files, lowest precedence first:',
        `strict-lint:   ${configPathIn('/project/level-1')}`,
        `strict-lint:   ${configPathIn('/project/level-0')}`,
      ]);
    });

    it.each([
      {
        name: 'a marker',
        projectRoot: { marker: '.git', rootDir: '/project', source: 'marker' },
        expected: 'strict-lint: project root /project (marker: .git)',
      },
      {
        name: 'the nearest package.json',
        projectRoot: { marker: null, rootDir: '/project', source: 'package-json' },
        expected: 'strict-lint: project root /project (nearest package.json)',
      },
      {
        name: 'the start directory',
        projectRoot: { marker: null, rootDir: '/project/packages/pkg', source: 'start-dir' },
        expected: 'strict-lint: project root /project/packages/pkg (no project marker; using the start directory)',
      },
    ] as const)('names the project root chosen by $name', async ({ projectRoot, expected }) => {
      withProjectRoot(projectRoot);

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(reportedLines()).toContain(expected);
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
    const originalArgv = process.argv;
    let exitSpy: MockInstance<typeof process.exit>;

    beforeEach(() => {
      vi.clearAllMocks();
      exitSpy = mockExit();
      process.argv = ['node', 'strict-lint'];
      withStrictLintConfigs();
    });

    afterEach(() => {
      exitSpy.mockRestore();
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
    const originalArgv = process.argv;
    let exitSpy: MockInstance<typeof process.exit>;

    beforeEach(() => {
      vi.clearAllMocks();
      exitSpy = mockExit();
      process.argv = ['node', 'strict-lint'];
      withStrictLintConfigs();
      mockFormat.mockResolvedValue('');
      mockLintFiles.mockResolvedValue([{ errorCount: 0, warningCount: 0 }]);
    });

    afterEach(() => {
      exitSpy.mockRestore();
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

  describe('stdout output', () => {
    const originalArgv = process.argv;
    let exitSpy: MockInstance<typeof process.exit>;
    let infoSpy: MockInstance<typeof console.info>;

    beforeEach(() => {
      vi.clearAllMocks();
      exitSpy = mockExit();
      infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
      process.argv = ['node', 'strict-lint'];
      withStrictLintConfigs();
      mockFormat.mockResolvedValue('');
      mockLintFiles.mockResolvedValue([{ errorCount: 0, warningCount: 0 }]);
    });

    afterEach(() => {
      infoSpy.mockRestore();
      exitSpy.mockRestore();
      process.argv = originalArgv;
    });

    it('writes nothing when the formatter reports a clean run as an empty string', async () => {
      mockFormat.mockResolvedValue('');

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('writes whatever the formatter produced, even where another formatter would produce nothing', async () => {
      // `json` reports a clean run as `[]`, which a count-based guard would wrongly swallow.
      mockFormat.mockResolvedValue('[]');

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(infoSpy).toHaveBeenCalledWith('[]');
    });

    it('writes the --max-warnings message alone when the formatter produced no output', async () => {
      // `--quiet` drops the warning-only results, which is what leaves the formatter with nothing to report.
      process.argv = ['node', 'strict-lint', '--quiet', '--max-warnings', '0'];
      mockLintFiles.mockResolvedValueOnce([{ errorCount: 0, warningCount: 3 }]);
      mockGetErrorResults.mockReturnValueOnce([]);
      mockFormat.mockResolvedValue('');

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(infoSpy).toHaveBeenCalledWith('ESLint found too many warnings (maximum: 0).');
    });

    it('separates the --max-warnings message from the report the formatter produced', async () => {
      process.argv = ['node', 'strict-lint', '--max-warnings', '0'];
      mockLintFiles.mockResolvedValueOnce([{ errorCount: 0, warningCount: 3 }]);
      mockFormat.mockResolvedValue('report\n');

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(infoSpy).toHaveBeenCalledWith('report\n\nESLint found too many warnings (maximum: 0).');
    });
  });
});

// region | Helpers

/**
 * Stop `process.exit` from terminating the run, leaving it a spy the tests assert calls against. The implementation
 * comes from `vi.fn`, whose type parameter satisfies the `never` return without a type assertion, which this repo bans.
 */
function mockExit(): MockInstance<typeof process.exit> {
  return vi.spyOn(process, 'exit').mockImplementation(vi.fn<(code?: string | number | null) => never>());
}

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

/** Make the mocked loader resolve with the given project root and no config files. */
function withProjectRoot(projectRoot: {
  marker: string | null;
  rootDir: string;
  source: 'marker' | 'package-json' | 'start-dir';
}): void {
  mockedLoadStrictLintConfigs.mockResolvedValue({ entries: [], projectRoot, stopReason: 'project-root' });
}

/** The strict-lint config path within the given directory. */
function configPathIn(dir: string): string {
  return `${dir}/.config/strict-lint.config.ts`;
}

// endregion | Helpers
