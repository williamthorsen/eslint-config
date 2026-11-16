import fs from 'node:fs';

import { captureError, pointArgvAt } from '@williamthorsen/toolbelt.testing/candidate';
import {
  disposeOnTestFinished,
  listConsoleLines,
  type MockedProcessExit,
  ProcessExitError,
  silenceConsole,
  throwOnProcessExit,
} from '@williamthorsen/toolbelt.vitest/candidate';
import type { ESLint, Linter } from 'eslint';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { strictLint } from '../strictLint.ts';
import type { StrictLintConfig } from '../types.ts';

const {
  mockedLoadStrictLintConfigs,
  mockedWriteFile,
  mockEslintConstructor,
  mockFindConfigFile,
  mockFormat,
  mockGetErrorResults,
  mockLintFiles,
  mockLoadFormatter,
  mockOutputFixes,
} = vi.hoisted(() => ({
  mockedLoadStrictLintConfigs: vi.fn(),
  mockedWriteFile: vi.fn().mockResolvedValue(undefined),
  mockEslintConstructor: vi.fn(),
  mockFindConfigFile: vi.fn().mockResolvedValue(undefined),
  mockFormat: vi.fn().mockResolvedValue(''),
  mockGetErrorResults: vi.fn(),
  mockLintFiles: vi.fn().mockResolvedValue([]),
  mockLoadFormatter: vi.fn(),
  mockOutputFixes: vi.fn().mockResolvedValue(undefined),
}));

vi.mock(import('../loadStrictLintConfigs.ts'), async (importOriginal) => ({
  ...(await importOriginal()),
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
      findConfigFile = mockFindConfigFile;
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
  let exitMock: MockedProcessExit;

  beforeEach(() => {
    vi.clearAllMocks();
    exitMock = disposeOnTestFinished(throwOnProcessExit());
    // Without a pointed argv the parser reads Vitest's own, whose arguments it takes for lint patterns.
    disposeOnTestFinished(pointArgvAt([]));
    mockStrictLintConfigs();
    mockFormat.mockResolvedValue('');
    mockLintFiles.mockResolvedValue([]);
    // Mirror ESLint's own filter closely enough that `--quiet` ordering is testable: errors survive, warnings do not.
    mockGetErrorResults.mockImplementation((results: ESLint.LintResult[]) =>
      results
        .map((result) => ({ ...result, messages: result.messages.filter((message) => message.severity === 2) }))
        .filter((result) => result.messages.length > 0)
        .map((result) => ({ ...result, errorCount: result.messages.length, warningCount: 0 })),
    );
  });

  describe('config resolution', () => {
    it('leaves config discovery to ESLint, so each linted file resolves its own', async () => {
      await strictLint();

      expect(readConstructorOptions()).not.toHaveProperty('overrideConfigFile');
    });

    it('pins ESLint to the config named by --config', async () => {
      // Name a file that exists, which the --config check requires; ESLint itself is mocked.
      using _argv = pointArgvAt(['--config', import.meta.filename]);

      await strictLint();

      expect(readConstructorOptions()).toMatchObject({ overrideConfigFile: import.meta.filename });
    });

    it('rejects a --config path that names nothing as a usage error', async () => {
      using _argv = pointArgvAt(['--config', '/nonexistent/custom.config.ts']);
      using silenced = silenceConsole(['error']);

      const error = await captureError(ProcessExitError, () => strictLint());

      expect(listConsoleLines(silenced.error)).toStrictEqual([
        'strict-lint: --config /nonexistent/custom.config.ts: file not found',
      ]);
      expect(error.code).toBe(2);
      expect(mockEslintConstructor).not.toHaveBeenCalled();
    });

    it('pins ESLint to a programmatic baseConfig, which has no file to resolve from', async () => {
      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(readConstructorOptions()).toMatchObject({ overrideConfig: [{ rules: {} }], overrideConfigFile: true });
    });

    it('includes no plugin-bearing config when none was passed, keeping the options cloneable', async () => {
      await strictLint();

      expect(readConstructorOptions()).toMatchObject({ overrideConfig: [] });
    });

    it('layers programmatic rule overrides below CLI ones', async () => {
      using _argv = pointArgvAt(['--rule', 'cli-rule: error']);

      await strictLint({ ruleOverrides: { 'programmatic-rule': 'warn' } });

      expect(readConstructorOptions()).toMatchObject({
        overrideConfig: [{ rules: { 'programmatic-rule': 'warn' } }, { rules: { 'cli-rule': 'error' } }],
      });
    });
  });

  describe('ceiling resolution', () => {
    it('walks from the directory of each linted file rather than the working directory', async () => {
      mockLintFiles.mockResolvedValue([buildResult({ filePath: '/project/packages/pkg/src/a.ts' })]);

      await strictLint();

      expect(mockedLoadStrictLintConfigs).toHaveBeenCalledWith('/project/packages/pkg/src');
    });

    it('promotes a warning that no ceiling caps', async () => {
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage(1)] })]);

      await captureError(ProcessExitError, () => strictLint());

      expect(readReportedSeverities()).toStrictEqual([2]);
    });

    it('leaves a warning that a config ceiling caps below error', async () => {
      mockStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage(1)] })]);

      await strictLint();

      expect(readReportedSeverities()).toStrictEqual([1]);
    });

    it('lets programmatic ceilings outrank the config files', async () => {
      mockStrictLintConfigs({ maxSeverity: { 'some-rule': 'error' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage(1)] })]);

      await strictLint({ maxSeverity: { 'some-rule': 'warn' } });

      expect(readReportedSeverities()).toStrictEqual([1]);
    });

    it('applies the ceilings of each file when two files resolve different configs', async () => {
      mockedLoadStrictLintConfigs.mockImplementation((dir: string) =>
        Promise.resolve(buildCascade(dir === '/capped' ? [{ maxSeverity: { 'some-rule': 'warn' } }] : [])),
      );
      mockLintFiles.mockResolvedValue([
        buildResult({ filePath: '/capped/a.ts', messages: [buildMessage(1)] }),
        buildResult({ filePath: '/open/a.ts', messages: [buildMessage(1)] }),
      ]);

      await captureError(ProcessExitError, () => strictLint());

      expect(readReportedSeverities()).toStrictEqual([1, 2]);
    });
  });

  describe('promotion ordering', () => {
    it('promotes before --quiet filters, so a promoted problem survives the filter', async () => {
      using _argv = pointArgvAt(['--quiet']);
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage(1)] })]);

      const error = await captureError(ProcessExitError, () => strictLint());

      // Filtering first would drop the warning before it was ever promoted, and report nothing.
      expect(readReportedSeverities()).toStrictEqual([2]);
      expect(error.code).toBe(1);
    });

    it('counts a promoted problem as an error rather than a warning for --max-warnings', async () => {
      using _argv = pointArgvAt(['--max-warnings', '0']);
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage(1)] })]);

      await captureError(ProcessExitError, () => strictLint());

      // Because strict-lint promoted the rule, no warning remains to exceed the threshold; the error alone fails the
      // run.
      expect(readFormattedText()).not.toContain('too many warnings');
    });

    it('counts a capped problem as a warning for --max-warnings', async () => {
      using _argv = pointArgvAt(['--max-warnings', '0']);
      mockStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage(1)] })]);

      const error = await captureError(ProcessExitError, () => strictLint());

      expect(error.code).toBe(1);
    });

    it('promotes results served from cache identically, since it spans the whole returned array', async () => {
      // A cached run returns fully formed results, which nothing at this seam distinguishes from fresh ones.
      mockLintFiles.mockResolvedValue([
        buildResult({ filePath: '/project/cached.ts', messages: [buildMessage(1)] }),
        buildResult({ filePath: '/project/fresh.ts', messages: [buildMessage(1)] }),
      ]);

      await captureError(ProcessExitError, () => strictLint());

      expect(readReportedSeverities()).toStrictEqual([2, 2]);
    });
  });

  describe('concurrency', () => {
    it('leaves concurrency unset without the flag, so ESLint applies its own default of off', async () => {
      await strictLint();

      expect(readConstructorOptions()).not.toHaveProperty('concurrency');
    });

    it('accepts --concurrency when ESLint resolves the config itself', async () => {
      using _argv = pointArgvAt(['--concurrency', 'auto']);

      await strictLint();

      expect(readConstructorOptions()).toMatchObject({ concurrency: 'auto' });
      expect(exitMock.spy).not.toHaveBeenCalled();
    });

    it('rejects --concurrency alongside a programmatic baseConfig as a usage error, naming the option at fault', async () => {
      using _argv = pointArgvAt(['--concurrency', 'auto']);
      using silenced = silenceConsole(['error']);

      const error = await captureError(ProcessExitError, () => strictLint({ baseConfig: [{ rules: {} }] }));

      expect(listConsoleLines(silenced.error).join('\n')).toContain('baseConfig');
      expect(error.code).toBe(2);
    });

    it('allows a programmatic baseConfig when concurrency is off', async () => {
      using _argv = pointArgvAt(['--concurrency', 'off']);

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(exitMock.spy).not.toHaveBeenCalled();
    });
  });

  describe('repeated-rule check', () => {
    it('does no work when no strict-lint config names a shared config', async () => {
      mockStrictLintConfigs({ maxSeverity: {} });

      await strictLint();

      expect(mockFindConfigFile).not.toHaveBeenCalled();
    });

    it('reads the ESLint config once a strict-lint config names a shared config', async () => {
      mockStrictLintConfigs({ sharedConfigs: [[{ rules: { 'some-rule': 'error' } }]] });

      await strictLint();

      expect(mockFindConfigFile).toHaveBeenCalled();
    });
  });

  describe('--debug provenance', () => {
    let errorSpy: MockInstance;

    beforeEach(() => {
      disposeOnTestFinished(pointArgvAt(['--debug']));
      errorSpy = disposeOnTestFinished(silenceConsole(['error'])).error;
      mockLintFiles.mockResolvedValue([buildResult({ filePath: '/project/a.ts' })]);
    });

    it('reports the resolved config when --debug is present', async () => {
      await strictLint();

      expect(listConsoleLines(errorSpy)).toContain('strict-lint: project root /project (marker: pnpm-workspace.yaml)');
    });

    it('stays silent when --debug is absent', async () => {
      using _argv = pointArgvAt([]);

      await strictLint();

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('exit code', () => {
    it('exits 0 when no problems are reported', async () => {
      mockLintFiles.mockResolvedValue([buildResult()]);

      await strictLint();

      expect(exitMock.spy).not.toHaveBeenCalled();
    });

    it('exits 0 when only capped warnings are reported', async () => {
      mockStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage(1)] })]);

      await strictLint();

      expect(exitMock.spy).not.toHaveBeenCalled();
    });

    it('exits 1 when errors are reported', async () => {
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage(2)] })]);

      const error = await captureError(ProcessExitError, () => strictLint());

      expect(error.code).toBe(1);
      // A second call would mean the first was caught and re-raised by the handler for the lint's own failures.
      expect(exitMock.spy).toHaveBeenCalledTimes(1);
    });

    it('reports an unexpected error as an internal error with its stack, and exits 1', async () => {
      using silenced = silenceConsole(['error']);
      mockLintFiles.mockRejectedValueOnce(new Error('lint failure'));

      const error = await captureError(ProcessExitError, () => strictLint());

      const [report] = listConsoleLines(silenced.error);
      expect(report).toMatch(/^strict-lint: internal error: lint failure\n\s+at /);
      expect(error.code).toBe(1);
    });
  });

  describe('--version', () => {
    it.each([['--version'], ['-V']])('prints the version for %s without linting', async (flag) => {
      using _argv = pointArgvAt([flag]);
      using silenced = silenceConsole(['info']);

      await strictLint();

      expect(listConsoleLines(silenced.info)).toStrictEqual([readManifestVersion()]);
      expect(mockEslintConstructor).not.toHaveBeenCalled();
      expect(exitMock.spy).not.toHaveBeenCalled();
    });

    it('prints the usage instead when --help is also given', async () => {
      using _argv = pointArgvAt(['--help', '--version']);
      using silenced = silenceConsole(['info']);

      await strictLint();

      expect(listConsoleLines(silenced.info).join('\n')).toContain('Usage: strict-lint');
    });
  });

  describe('CLI behavior', () => {
    it('uses CLI positionals as lint patterns', async () => {
      using _argv = pointArgvAt(['src/', 'lib/']);

      await strictLint();

      expect(mockLintFiles).toHaveBeenCalledWith(['src/', 'lib/']);
    });

    it('uses programmatic patterns when no CLI positionals are provided', async () => {
      await strictLint({ patterns: ['custom/'] });

      expect(mockLintFiles).toHaveBeenCalledWith(['custom/']);
    });

    it('prefers CLI positionals over programmatic patterns', async () => {
      using _argv = pointArgvAt(['cli-path/']);

      await strictLint({ patterns: ['programmatic-path/'] });

      expect(mockLintFiles).toHaveBeenCalledWith(['cli-path/']);
    });

    it('defaults to ["."] when no patterns are specified', async () => {
      await strictLint();

      expect(mockLintFiles).toHaveBeenCalledWith(['.']);
    });

    it('suppresses outputFixes when --fix-dry-run is specified', async () => {
      using _argv = pointArgvAt(['--fix-dry-run']);

      await strictLint();

      expect(mockOutputFixes).not.toHaveBeenCalled();
    });

    it('calls outputFixes when --fix is specified without --fix-dry-run', async () => {
      using _argv = pointArgvAt(['--fix']);

      await strictLint();

      expect(mockOutputFixes).toHaveBeenCalled();
    });

    it('leaves the fix output intact for outputFixes to write', async () => {
      using _argv = pointArgvAt(['--fix']);
      mockLintFiles.mockResolvedValue([buildResult({ output: 'fixed source' })]);

      await strictLint();

      expect(mockOutputFixes).toHaveBeenCalledWith([expect.objectContaining({ output: 'fixed source' })]);
    });

    it('does not filter through getErrorResults when --quiet is not specified', async () => {
      await strictLint();

      expect(mockGetErrorResults).not.toHaveBeenCalled();
    });

    it('exits 1 when warnings exceed --max-warnings threshold', async () => {
      using _argv = pointArgvAt(['--max-warnings', '2']);
      mockStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: buildThreeWarnings() })]);

      const error = await captureError(ProcessExitError, () => strictLint());

      expect(error.code).toBe(1);
    });

    it('does not exit when warnings are within --max-warnings threshold', async () => {
      using _argv = pointArgvAt(['--max-warnings', '5']);
      mockStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: buildThreeWarnings() })]);

      await strictLint();

      expect(exitMock.spy).not.toHaveBeenCalled();
    });

    it('loads the specified formatter when --format is provided', async () => {
      using _argv = pointArgvAt(['--format', 'json']);

      await strictLint();

      expect(mockLoadFormatter).toHaveBeenCalledWith('json');
    });

    it('writes formatted output to file when --output-file is specified', async () => {
      using _argv = pointArgvAt(['--output-file', 'results.txt']);
      mockFormat.mockResolvedValueOnce('formatted output');

      await strictLint();

      expect(mockedWriteFile).toHaveBeenCalledWith('results.txt', 'formatted output', 'utf8');
    });

    it('exits 2 when --rule specifies an invalid severity, reporting one prefixed line', async () => {
      using _argv = pointArgvAt(['--rule', 'no-console: typo']);
      using silenced = silenceConsole(['error']);

      const error = await captureError(ProcessExitError, () => strictLint());

      const lines = listConsoleLines(silenced.error);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(/^strict-lint: Invalid --rule value "no-console: typo"\./);
      expect(error.code).toBe(2);
    });
  });

  describe('stdout output', () => {
    let infoSpy: MockInstance;

    beforeEach(() => {
      infoSpy = disposeOnTestFinished(silenceConsole(['info'])).info;
    });

    it('writes nothing when the formatter reports a clean run as an empty string', async () => {
      mockFormat.mockResolvedValue('');

      await strictLint();

      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('writes whatever the formatter produced, even when another formatter would produce nothing', async () => {
      // `json` reports a clean run as `[]`, which a count-based guard would wrongly discard.
      mockFormat.mockResolvedValue('[]');

      await strictLint();

      expect(infoSpy).toHaveBeenCalledWith('[]');
    });

    it('writes the --max-warnings message alone when the formatter produced no output', async () => {
      using _argv = pointArgvAt(['--quiet', '--max-warnings', '0']);
      mockStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: buildThreeWarnings() })]);
      mockFormat.mockResolvedValue('');

      await captureError(ProcessExitError, () => strictLint());

      expect(infoSpy).toHaveBeenCalledWith('ESLint found too many warnings (maximum: 0).');
    });

    it('separates the --max-warnings message from the report that the formatter produced', async () => {
      using _argv = pointArgvAt(['--max-warnings', '0']);
      mockStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: buildThreeWarnings() })]);
      mockFormat.mockResolvedValue('report\n');

      await captureError(ProcessExitError, () => strictLint());

      expect(infoSpy).toHaveBeenCalledWith('report\n\nESLint found too many warnings (maximum: 0).');
    });
  });
});

// region | Helpers

/** Builds a cascade with one entry per config, nearest first, bounded by a marker-identified project root. */
function buildCascade(configs: StrictLintConfig[]) {
  return {
    entries: configs.map((config, index) => ({
      config,
      dir: `/project/level-${String(index)}`,
      filePath: buildConfigPath(`/project/level-${String(index)}`),
    })),
    projectRoot: { marker: 'pnpm-workspace.yaml', rootDir: '/project', source: 'marker' },
    stopReason: 'stop-dir',
  };
}

/** Returns the strict-lint config path within a directory. */
function buildConfigPath(dir: string): string {
  return `${dir}/.config/strict-lint.config.ts`;
}

/** Builds a `some-rule` message with the fields that promotion reads, filling in the rest to satisfy ESLint's shape. */
function buildMessage(severity: Linter.LintMessage['severity']): Linter.LintMessage {
  return { column: 1, line: 1, message: 'a problem', ruleId: 'some-rule', severity };
}

/** Builds a lint result whose counts start at zero, since promotion restates them from the messages. */
function buildResult(overrides: Partial<ESLint.LintResult> = {}): ESLint.LintResult {
  return {
    errorCount: 0,
    fatalErrorCount: 0,
    filePath: '/project/a.ts',
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    messages: [],
    suppressedMessages: [],
    usedDeprecatedRules: [],
    warningCount: 0,
    ...overrides,
  };
}

/** Builds three warnings for `some-rule`, so that a threshold test states a count rather than a list. */
function buildThreeWarnings(): Linter.LintMessage[] {
  return Array.from({ length: 3 }, () => buildMessage(1));
}

/** Checks whether a value is a non-null object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Makes the mocked loader resolve with one cascade entry per config, given nearest first. */
function mockStrictLintConfigs(...configs: StrictLintConfig[]): void {
  mockedLoadStrictLintConfigs.mockResolvedValue(buildCascade(configs));
}

/** Returns the options that the run passed to the ESLint constructor. */
function readConstructorOptions(): Record<string, unknown> {
  const [options] = mockEslintConstructor.mock.calls[0] ?? [];
  return isRecord(options) ? options : {};
}

/** Returns the text that the formatter produced during the run. */
function readFormattedText(): string {
  return mockFormat.mock.results.map((result) => String(result.value)).join('');
}

/** Returns the version that strict-lint's own manifest declares. */
function readManifestVersion(): string {
  const manifest: unknown = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  const version = isRecord(manifest) ? manifest['version'] : undefined;
  if (typeof version !== 'string') {
    throw new TypeError('package.json declares no string version');
  }
  return version;
}

/** Returns the severities that the run passed to the formatter, which are the ones that it reports. */
function readReportedSeverities(): number[] {
  const [results] = mockFormat.mock.calls[0] ?? [];
  if (!Array.isArray(results)) {
    return [];
  }
  return results.flatMap((result: ESLint.LintResult) => result.messages.map((message) => message.severity));
}

// endregion | Helpers
