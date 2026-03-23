import { describe, expect, it } from 'vitest';

import { parseCliArgs } from '../parseCliArgs.ts';

describe(parseCliArgs, () => {
  it('returns defaults when no arguments are provided', () => {
    const result = parseCliArgs([]);

    expect(result.patterns).toEqual([]);
    expect(result.eslintOptions).toEqual({});
    expect(result.ruleOverrides).toEqual({});
    expect(result.fixDryRun).toBe(false);
    expect(result.format).toBe('stylish');
    expect(result.quiet).toBe(false);
    expect(result.maxWarnings).toBe(-1);
    expect(result.outputFile).toBeUndefined();
    expect(result.configPath).toBeUndefined();
  });

  it('returns positional args as patterns', () => {
    const result = parseCliArgs(['src/', 'lib/']);

    expect(result.patterns).toEqual(['src/', 'lib/']);
  });

  it('maps --fix to eslintOptions.fix', () => {
    const result = parseCliArgs(['--fix']);

    expect(result.eslintOptions.fix).toBe(true);
    expect(result.fixDryRun).toBe(false);
  });

  it('maps --fix-dry-run to eslintOptions.fix and fixDryRun flag', () => {
    const result = parseCliArgs(['--fix-dry-run']);

    expect(result.eslintOptions.fix).toBe(true);
    expect(result.fixDryRun).toBe(true);
  });

  it('maps --fix-type to eslintOptions.fixTypes', () => {
    const result = parseCliArgs(['--fix-type', 'problem', '--fix-type', 'suggestion']);

    expect(result.eslintOptions.fixTypes).toEqual(['problem', 'suggestion']);
  });

  it('maps --ignore-pattern to eslintOptions.ignorePatterns', () => {
    const result = parseCliArgs(['--ignore-pattern', 'dist/**', '--ignore-pattern', 'build/**']);

    expect(result.eslintOptions.ignorePatterns).toEqual(['dist/**', 'build/**']);
  });

  it('maps --no-ignore to eslintOptions.ignore=false', () => {
    const result = parseCliArgs(['--no-ignore']);

    expect(result.eslintOptions.ignore).toBe(false);
  });

  it('maps --no-error-on-unmatched-pattern to eslintOptions.errorOnUnmatchedPattern=false', () => {
    const result = parseCliArgs(['--no-error-on-unmatched-pattern']);

    expect(result.eslintOptions.errorOnUnmatchedPattern).toBe(false);
  });

  it('maps --pass-on-no-patterns to eslintOptions.passOnNoPatterns=true', () => {
    const result = parseCliArgs(['--pass-on-no-patterns']);

    expect(result.eslintOptions.passOnNoPatterns).toBe(true);
  });

  it('maps --no-inline-config to eslintOptions.allowInlineConfig=false', () => {
    const result = parseCliArgs(['--no-inline-config']);

    expect(result.eslintOptions.allowInlineConfig).toBe(false);
  });

  it('maps --cache to eslintOptions.cache=true', () => {
    const result = parseCliArgs(['--cache']);

    expect(result.eslintOptions.cache).toBe(true);
  });

  it('maps --cache-location to eslintOptions.cacheLocation', () => {
    const result = parseCliArgs(['--cache-location', '/tmp/.eslintcache']);

    expect(result.eslintOptions.cacheLocation).toBe('/tmp/.eslintcache');
  });

  it('maps --cache-strategy to eslintOptions.cacheStrategy', () => {
    const result = parseCliArgs(['--cache-strategy', 'content']);

    expect(result.eslintOptions.cacheStrategy).toBe('content');
  });

  it('maps --warn-ignored to eslintOptions.warnIgnored=true', () => {
    const result = parseCliArgs(['--warn-ignored']);

    expect(result.eslintOptions.warnIgnored).toBe(true);
  });

  it('maps --no-warn-ignored to eslintOptions.warnIgnored=false', () => {
    const result = parseCliArgs(['--no-warn-ignored']);

    expect(result.eslintOptions.warnIgnored).toBe(false);
  });

  it('maps --stats to eslintOptions.stats=true', () => {
    const result = parseCliArgs(['--stats']);

    expect(result.eslintOptions.stats).toBe(true);
  });

  it('maps --flag to eslintOptions.flags', () => {
    const result = parseCliArgs(['--flag', 'unstable_ts_config']);

    expect(result.eslintOptions.flags).toEqual(['unstable_ts_config']);
  });

  it('maps numeric --concurrency to a number', () => {
    const result = parseCliArgs(['--concurrency', '4']);

    expect(result.eslintOptions.concurrency).toBe(4);
  });

  it.each(['auto', 'off'] as const)('passes --concurrency "%s" as a string', (value) => {
    const result = parseCliArgs(['--concurrency', value]);

    expect(result.eslintOptions.concurrency).toBe(value);
  });

  it('throws on invalid --concurrency value', () => {
    expect(() => parseCliArgs(['--concurrency', 'banana'])).toThrow('Invalid --concurrency value');
  });

  it('throws on non-integer --concurrency value', () => {
    expect(() => parseCliArgs(['--concurrency', '4.5'])).toThrow('Invalid --concurrency value');
  });

  it('parses --rule into ruleOverrides using colon-split', () => {
    const result = parseCliArgs(['--rule', 'no-console: error']);

    expect(result.ruleOverrides).toEqual({ 'no-console': 'error' });
  });

  it('parses multiple --rule flags', () => {
    const result = parseCliArgs(['--rule', 'no-console: error', '--rule', 'no-debugger: warn']);

    expect(result.ruleOverrides).toEqual({
      'no-console': 'error',
      'no-debugger': 'warn',
    });
  });

  it('throws on --rule without colon-space separator', () => {
    expect(() => parseCliArgs(['--rule', 'no-console'])).toThrow('Invalid --rule value');
  });

  it('returns --quiet flag', () => {
    const result = parseCliArgs(['--quiet']);

    expect(result.quiet).toBe(true);
  });

  it('returns --max-warnings as a number', () => {
    const result = parseCliArgs(['--max-warnings', '5']);

    expect(result.maxWarnings).toBe(5);
  });

  it('returns --format value', () => {
    const result = parseCliArgs(['--format', 'json']);

    expect(result.format).toBe('json');
  });

  it('returns -f as alias for --format', () => {
    const result = parseCliArgs(['-f', 'compact']);

    expect(result.format).toBe('compact');
  });

  it('throws on non-numeric --max-warnings value', () => {
    expect(() => parseCliArgs(['--max-warnings', 'banana'])).toThrow('Invalid --max-warnings value');
  });

  it('throws on non-integer --max-warnings value', () => {
    expect(() => parseCliArgs(['--max-warnings', '4.5'])).toThrow('Invalid --max-warnings value');
  });

  it('throws on --rule with empty severity after colon', () => {
    expect(() => parseCliArgs(['--rule', 'no-console: '])).toThrow('Missing severity after colon');
  });

  it('returns --output-file value', () => {
    const result = parseCliArgs(['--output-file', 'results.txt']);

    expect(result.outputFile).toBe('results.txt');
  });

  it('returns -o as alias for --output-file', () => {
    const result = parseCliArgs(['-o', 'results.txt']);

    expect(result.outputFile).toBe('results.txt');
  });

  it('returns --config value', () => {
    const result = parseCliArgs(['--config', 'custom-eslint.config.js']);

    expect(result.configPath).toBe('custom-eslint.config.js');
  });

  it('returns -c as alias for --config', () => {
    const result = parseCliArgs(['-c', 'custom-eslint.config.js']);

    expect(result.configPath).toBe('custom-eslint.config.js');
  });

  it('combines positional args with flags', () => {
    const result = parseCliArgs(['src/', '--fix', '--quiet', '--rule', 'no-console: error']);

    expect(result.patterns).toEqual(['src/']);
    expect(result.eslintOptions.fix).toBe(true);
    expect(result.quiet).toBe(true);
    expect(result.ruleOverrides).toEqual({ 'no-console': 'error' });
  });
});
