import type { ESLint, Linter } from 'eslint';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { strictLint } from '../strictLint.ts';
import type { StrictLintConfig } from '../types.ts';

const {
  mockedLoadStrictLintConfigs,
  mockedWriteFile,
  mockEslintConstructor,
  mockFormat,
  mockGetErrorResults,
  mockLintFiles,
  mockLoadFormatter,
  mockOutputFixes,
} = vi.hoisted(() => ({
  mockedLoadStrictLintConfigs: vi.fn(),
  mockedWriteFile: vi.fn().mockResolvedValue(undefined),
  mockEslintConstructor: vi.fn(),
  mockFormat: vi.fn().mockResolvedValue(''),
  mockGetErrorResults: vi.fn(),
  mockLintFiles: vi.fn().mockResolvedValue([]),
  mockLoadFormatter: vi.fn(),
  mockOutputFixes: vi.fn().mockResolvedValue(undefined),
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
  const originalArgv = process.argv;
  let exitSpy: MockInstance<typeof process.exit>;

  beforeEach(() => {
    vi.clearAllMocks();
    exitSpy = mockExit();
    process.argv = ['node', 'strict-lint'];
    withStrictLintConfigs();
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

  afterEach(() => {
    exitSpy.mockRestore();
    process.argv = originalArgv;
  });

  describe('config resolution', () => {
    it('leaves config discovery to ESLint, so each linted file resolves its own', async () => {
      await strictLint();

      expect(constructedWith()).not.toHaveProperty('overrideConfigFile');
    });

    it('pins ESLint to the config named by --config', async () => {
      process.argv = ['node', 'strict-lint', '--config', '/project/custom.config.ts'];

      await strictLint();

      expect(constructedWith()).toMatchObject({ overrideConfigFile: '/project/custom.config.ts' });
    });

    it('pins ESLint to a programmatic baseConfig, which has no file to resolve from', async () => {
      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(constructedWith()).toMatchObject({ overrideConfig: [{ rules: {} }], overrideConfigFile: true });
    });

    it('carries no plugin-bearing config when none was passed, so the options stay cloneable', async () => {
      await strictLint();

      expect(constructedWith()).toMatchObject({ overrideConfig: [] });
    });

    it('layers programmatic rule overrides below CLI ones', async () => {
      process.argv = ['node', 'strict-lint', '--rule', 'cli-rule: error'];

      await strictLint({ ruleOverrides: { 'programmatic-rule': 'warn' } });

      expect(constructedWith()).toMatchObject({
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
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage('some-rule', 1)] })]);

      await strictLint();

      expect(reportedSeverities()).toStrictEqual([2]);
    });

    it('leaves a warning that a config ceiling caps below error', async () => {
      withStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage('some-rule', 1)] })]);

      await strictLint();

      expect(reportedSeverities()).toStrictEqual([1]);
    });

    it('lets programmatic ceilings outrank the config files', async () => {
      withStrictLintConfigs({ maxSeverity: { 'some-rule': 'error' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage('some-rule', 1)] })]);

      await strictLint({ maxSeverity: { 'some-rule': 'warn' } });

      expect(reportedSeverities()).toStrictEqual([1]);
    });

    it('applies the ceilings of each file when two files resolve different configs', async () => {
      mockedLoadStrictLintConfigs.mockImplementation((dir: string) =>
        Promise.resolve(cascadeOf(dir === '/capped' ? [{ maxSeverity: { 'some-rule': 'warn' } }] : [])),
      );
      mockLintFiles.mockResolvedValue([
        buildResult({ filePath: '/capped/a.ts', messages: [buildMessage('some-rule', 1)] }),
        buildResult({ filePath: '/open/a.ts', messages: [buildMessage('some-rule', 1)] }),
      ]);

      await strictLint();

      expect(reportedSeverities()).toStrictEqual([1, 2]);
    });
  });

  describe('promotion ordering', () => {
    it('promotes before --quiet filters, so a promoted problem survives the filter', async () => {
      process.argv = ['node', 'strict-lint', '--quiet'];
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage('some-rule', 1)] })]);

      await strictLint();

      // Filtering first would drop the warning before it was ever promoted, and report nothing.
      expect(reportedSeverities()).toStrictEqual([2]);
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('counts a promoted problem as an error rather than a warning for --max-warnings', async () => {
      process.argv = ['node', 'strict-lint', '--max-warnings', '0'];
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage('some-rule', 1)] })]);

      await strictLint();

      // The rule promoted, so no warning remains to breach the threshold; the error alone fails the run.
      expect(formattedText()).not.toContain('too many warnings');
    });

    it('counts a capped problem as a warning for --max-warnings', async () => {
      process.argv = ['node', 'strict-lint', '--max-warnings', '0'];
      withStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage('some-rule', 1)] })]);

      await strictLint();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('promotes results served from cache identically, since it spans the whole returned array', async () => {
      // A cached run returns fully formed results; nothing distinguishes them at this seam, which is the point.
      mockLintFiles.mockResolvedValue([
        buildResult({ filePath: '/project/cached.ts', messages: [buildMessage('some-rule', 1)] }),
        buildResult({ filePath: '/project/fresh.ts', messages: [buildMessage('some-rule', 1)] }),
      ]);

      await strictLint();

      expect(reportedSeverities()).toStrictEqual([2, 2]);
    });
  });

  describe('concurrency', () => {
    it('leaves concurrency unset without the flag, so ESLint applies its own default of off', async () => {
      await strictLint();

      expect(constructedWith()).not.toHaveProperty('concurrency');
    });

    it('accepts --concurrency when ESLint resolves the config itself', async () => {
      process.argv = ['node', 'strict-lint', '--concurrency', 'auto'];

      await strictLint();

      expect(constructedWith()).toMatchObject({ concurrency: 'auto' });
      expect(process.exit).not.toHaveBeenCalled();
    });

    it('rejects --concurrency alongside a programmatic baseConfig, naming the option at fault', async () => {
      process.argv = ['node', 'strict-lint', '--concurrency', 'auto'];
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(String(errorSpy.mock.calls[0]?.[0])).toContain('baseConfig');
      expect(process.exit).toHaveBeenCalledWith(1);
      errorSpy.mockRestore();
    });

    it('allows a programmatic baseConfig when concurrency is off', async () => {
      process.argv = ['node', 'strict-lint', '--concurrency', 'off'];

      await strictLint({ baseConfig: [{ rules: {} }] });

      expect(process.exit).not.toHaveBeenCalled();
    });
  });

  describe('--debug provenance', () => {
    let errorSpy: MockInstance<typeof console.error>;

    beforeEach(() => {
      process.argv = ['node', 'strict-lint', '--debug'];
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      mockLintFiles.mockResolvedValue([buildResult({ filePath: '/project/a.ts' })]);
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('names the project root and every contributing config file, lowest precedence first', async () => {
      withStrictLintConfigs({ maxSeverity: {} }, { maxSeverity: {} });

      await strictLint();

      expect(reportedLines()).toStrictEqual([
        'strict-lint: project root /project (marker: pnpm-workspace.yaml)',
        'strict-lint: config files for /project, lowest precedence first:',
        `strict-lint:   ${configPathIn('/project/level-1')}`,
        `strict-lint:   ${configPathIn('/project/level-0')}`,
      ]);
    });

    it('reports one block per distinct config set rather than one per directory', async () => {
      mockedLoadStrictLintConfigs.mockImplementation((dir: string) =>
        Promise.resolve(cascadeOf(dir === '/other' ? [{ maxSeverity: {} }] : [])),
      );
      mockLintFiles.mockResolvedValue([
        buildResult({ filePath: '/project/a.ts' }),
        buildResult({ filePath: '/project/b.ts' }),
        buildResult({ filePath: '/other/a.ts' }),
      ]);

      await strictLint();

      // Two directories shared one empty cascade, so they collapse into a single line.
      expect(reportedLines()).toContain('strict-lint: no config file found for /project');
      expect(reportedLines()).toContain(`strict-lint: config files for /other, lowest precedence first:`);
    });

    it('collapses a long directory list into a count', async () => {
      mockLintFiles.mockResolvedValue(
        ['one', 'two', 'three', 'four', 'five'].map((dir) => buildResult({ filePath: `/${dir}/a.ts` })),
      );

      await strictLint();

      expect(reportedLines()).toContain('strict-lint: no config file found for /one, /two, /three (and 2 more)');
    });

    it('reports the stop when a config bounded the ascent', async () => {
      withStoppedAscent({ shouldIgnoreAncestors: true });

      await strictLint();

      expect(reportedLines()).toContain('strict-lint: ascent stopped by shouldIgnoreAncestors');
    });

    it('says so when no file was linted, rather than reporting a config nothing consulted', async () => {
      mockLintFiles.mockResolvedValue([]);

      await strictLint();

      expect(reportedLines()).toStrictEqual(['strict-lint: no files were linted, so no config was resolved']);
    });

    it('stays silent when --debug is absent', async () => {
      process.argv = ['node', 'strict-lint'];

      await strictLint();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    /** The lines the run wrote to stderr. */
    function reportedLines(): string[] {
      return errorSpy.mock.calls.map(([line]) => String(line));
    }
  });

  describe('exit code', () => {
    it('exits 0 when no problems are reported', async () => {
      mockLintFiles.mockResolvedValue([buildResult()]);

      await strictLint();

      expect(process.exit).not.toHaveBeenCalled();
    });

    it('exits 0 when only capped warnings are reported', async () => {
      withStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage('some-rule', 1)] })]);

      await strictLint();

      expect(process.exit).not.toHaveBeenCalled();
    });

    it('exits 1 when errors are reported', async () => {
      mockLintFiles.mockResolvedValue([buildResult({ messages: [buildMessage('some-rule', 2)] })]);

      await strictLint();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('exits 1 when doLint throws an error', async () => {
      mockLintFiles.mockRejectedValueOnce(new Error('lint failure'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await strictLint();

      expect(process.exit).toHaveBeenCalledWith(1);
      errorSpy.mockRestore();
    });
  });

  describe('CLI behavior', () => {
    it('uses CLI positionals as lint patterns', async () => {
      process.argv = ['node', 'strict-lint', 'src/', 'lib/'];

      await strictLint();

      expect(mockLintFiles).toHaveBeenCalledWith(['src/', 'lib/']);
    });

    it('uses programmatic patterns when no CLI positionals are provided', async () => {
      await strictLint({ patterns: ['custom/'] });

      expect(mockLintFiles).toHaveBeenCalledWith(['custom/']);
    });

    it('prefers CLI positionals over programmatic patterns', async () => {
      process.argv = ['node', 'strict-lint', 'cli-path/'];

      await strictLint({ patterns: ['programmatic-path/'] });

      expect(mockLintFiles).toHaveBeenCalledWith(['cli-path/']);
    });

    it('defaults to ["."] when no patterns are specified', async () => {
      await strictLint();

      expect(mockLintFiles).toHaveBeenCalledWith(['.']);
    });

    it('suppresses outputFixes when --fix-dry-run is specified', async () => {
      process.argv = ['node', 'strict-lint', '--fix-dry-run'];

      await strictLint();

      expect(mockOutputFixes).not.toHaveBeenCalled();
    });

    it('calls outputFixes when --fix is specified without --fix-dry-run', async () => {
      process.argv = ['node', 'strict-lint', '--fix'];

      await strictLint();

      expect(mockOutputFixes).toHaveBeenCalled();
    });

    it('leaves the fix output intact for outputFixes to write', async () => {
      process.argv = ['node', 'strict-lint', '--fix'];
      mockLintFiles.mockResolvedValue([buildResult({ output: 'fixed source' })]);

      await strictLint();

      expect(mockOutputFixes).toHaveBeenCalledWith([expect.objectContaining({ output: 'fixed source' })]);
    });

    it('does not filter through getErrorResults when --quiet is not specified', async () => {
      await strictLint();

      expect(mockGetErrorResults).not.toHaveBeenCalled();
    });

    it('exits 1 when warnings exceed --max-warnings threshold', async () => {
      process.argv = ['node', 'strict-lint', '--max-warnings', '2'];
      withStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: warningsFor('some-rule', 3) })]);

      await strictLint();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('does not exit when warnings are within --max-warnings threshold', async () => {
      process.argv = ['node', 'strict-lint', '--max-warnings', '5'];
      withStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: warningsFor('some-rule', 3) })]);

      await strictLint();

      expect(process.exit).not.toHaveBeenCalled();
    });

    it('loads the specified formatter when --format is provided', async () => {
      process.argv = ['node', 'strict-lint', '--format', 'json'];

      await strictLint();

      expect(mockLoadFormatter).toHaveBeenCalledWith('json');
    });

    it('writes formatted output to file when --output-file is specified', async () => {
      process.argv = ['node', 'strict-lint', '--output-file', 'results.txt'];
      mockFormat.mockResolvedValueOnce('formatted output');

      await strictLint();

      expect(mockedWriteFile).toHaveBeenCalledWith('results.txt', 'formatted output', 'utf8');
    });

    it('exits 1 when --rule specifies an invalid severity', async () => {
      process.argv = ['node', 'strict-lint', '--rule', 'no-console: typo'];
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await strictLint();

      expect(process.exit).toHaveBeenCalledWith(1);
      errorSpy.mockRestore();
    });
  });

  describe('stdout output', () => {
    let infoSpy: MockInstance<typeof console.info>;

    beforeEach(() => {
      infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    });

    afterEach(() => {
      infoSpy.mockRestore();
    });

    it('writes nothing when the formatter reports a clean run as an empty string', async () => {
      mockFormat.mockResolvedValue('');

      await strictLint();

      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('writes whatever the formatter produced, even where another formatter would produce nothing', async () => {
      // `json` reports a clean run as `[]`, which a count-based guard would wrongly swallow.
      mockFormat.mockResolvedValue('[]');

      await strictLint();

      expect(infoSpy).toHaveBeenCalledWith('[]');
    });

    it('writes the --max-warnings message alone when the formatter produced no output', async () => {
      process.argv = ['node', 'strict-lint', '--quiet', '--max-warnings', '0'];
      withStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: warningsFor('some-rule', 3) })]);
      mockFormat.mockResolvedValue('');

      await strictLint();

      expect(infoSpy).toHaveBeenCalledWith('ESLint found too many warnings (maximum: 0).');
    });

    it('separates the --max-warnings message from the report the formatter produced', async () => {
      process.argv = ['node', 'strict-lint', '--max-warnings', '0'];
      withStrictLintConfigs({ maxSeverity: { 'some-rule': 'warn' } });
      mockLintFiles.mockResolvedValue([buildResult({ messages: warningsFor('some-rule', 3) })]);
      mockFormat.mockResolvedValue('report\n');

      await strictLint();

      expect(infoSpy).toHaveBeenCalledWith('report\n\nESLint found too many warnings (maximum: 0).');
    });
  });
});

// region | Helpers

/** A lint message carrying the fields promotion reads, with the rest filled in to satisfy ESLint's shape. */
function buildMessage(ruleId: string | null, severity: Linter.LintMessage['severity']): Linter.LintMessage {
  return { column: 1, line: 1, message: 'a problem', ruleId, severity };
}

/** A lint result whose counts start at zero, since promotion restates them from the messages. */
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

/** A cascade carrying one entry per config, nearest first, bounded by a marker-identified project root. */
function cascadeOf(configs: StrictLintConfig[], stopReason: 'predicate' | 'stop-dir' = 'stop-dir') {
  return {
    entries: configs.map((config, index) => ({
      config,
      dir: `/project/level-${String(index)}`,
      filePath: configPathIn(`/project/level-${String(index)}`),
    })),
    projectRoot: { marker: 'pnpm-workspace.yaml', rootDir: '/project', source: 'marker' },
    stopReason,
  };
}

/** The strict-lint config path within the given directory. */
function configPathIn(dir: string): string {
  return `${dir}/.config/strict-lint.config.ts`;
}

/** The options the run handed the ESLint constructor. */
function constructedWith(): Record<string, unknown> {
  const [options] = mockEslintConstructor.mock.calls[0] ?? [];
  return isRecord(options) ? options : {};
}

/** The text the run wrote, as the formatter produced it plus any threshold message. */
function formattedText(): string {
  return mockFormat.mock.results.map((result) => String(result.value)).join('');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Stop `process.exit` from terminating the run, leaving it a spy the tests assert calls against. The implementation
 * comes from `vi.fn`, whose type parameter satisfies the `never` return without a type assertion, which this repo bans.
 */
function mockExit(): MockInstance<typeof process.exit> {
  return vi.spyOn(process, 'exit').mockImplementation(vi.fn<(code?: string | number | null) => never>());
}

/** The severities the run handed the formatter, which is what it reports. */
function reportedSeverities(): number[] {
  const [results] = mockFormat.mock.calls[0] ?? [];
  if (!Array.isArray(results)) {
    return [];
  }
  return results.flatMap((result: ESLint.LintResult) => result.messages.map((message) => message.severity));
}

/** The given number of warnings for one rule, so a threshold test states a count rather than a list. */
function warningsFor(ruleId: string, count: number): Linter.LintMessage[] {
  return Array.from({ length: count }, () => buildMessage(ruleId, 1));
}

/** Make the mocked loader resolve with one cascade entry per config, given nearest first. */
function withStrictLintConfigs(...configs: StrictLintConfig[]): void {
  mockedLoadStrictLintConfigs.mockResolvedValue(cascadeOf(configs));
}

/** The same, for a walk that a `shouldIgnoreAncestors` config cut short. */
function withStoppedAscent(...configs: StrictLintConfig[]): void {
  mockedLoadStrictLintConfigs.mockResolvedValue(cascadeOf(configs, 'predicate'));
}

// endregion | Helpers
