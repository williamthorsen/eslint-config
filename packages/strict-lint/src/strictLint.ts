import fs from 'node:fs/promises';
import path from 'node:path';

import { ESLint, type Linter } from 'eslint';

import { findNearestFile } from './common/findNearestFile.ts';
import { convertWarnToError } from './convertWarnToError.ts';
import { defaultMaxSeverity } from './defaultMaxSeverity.ts';
import { loadStrictLintConfig } from './loadStrictLintConfig.ts';
import { parseCliArgs } from './parseCliArgs.ts';
import type { MaxSeverityMap, StrictLintOptions } from './types.ts';

/** Run strict-lint as a CLI entry point, parsing process.argv and exiting on errors. */
export async function strictLint(options?: StrictLintOptions): Promise<string> {
  const args = process.argv.slice(2);
  try {
    const { text, errorCount } = await doLint(options, args);
    console.info(text);
    if (errorCount > 0) {
      process.exit(1);
    }
    return text;
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
}

/**
 * Run ESLint with strict-lint errorization applied.
 * @link https://eslint.org/docs/latest/integrate/nodejs-api#eslint-class
 */
async function doLint(
  options: StrictLintOptions | undefined,
  args: string[],
): Promise<{ text: string; errorCount: number }> {
  const parsed = parseCliArgs(args);

  const { config, configDir } = await resolveConfigAndDir(options, parsed.configPath);

  const strictLintConfig = configDir ? await loadStrictLintConfig(configDir) : undefined;

  const resolvedMaxSeverity: MaxSeverityMap = {
    ...defaultMaxSeverity,
    ...strictLintConfig?.maxSeverity,
    ...options?.maxSeverity,
  };

  const errorizedConfig = config.map((block) => convertWarnToError(block, resolvedMaxSeverity));

  // Build the overrideConfig array: errorized config first, then rule overrides
  const overrideConfig = buildOverrideConfig(errorizedConfig, options?.ruleOverrides, parsed.ruleOverrides);

  const eslint = new ESLint({
    cwd: process.cwd(),
    ...parsed.eslintOptions,
    overrideConfig,
  });

  // Determine file patterns: CLI positionals > programmatic patterns > default
  let patterns: string[];
  if (parsed.patterns.length > 0) {
    patterns = parsed.patterns;
  } else if (options?.patterns?.length) {
    patterns = options.patterns;
  } else {
    patterns = ['.'];
  }

  const results = await eslint.lintFiles(patterns);

  // Write fixes to files unless --fix-dry-run was specified
  if (!parsed.fixDryRun) {
    await ESLint.outputFixes(results);
  }

  // Filter warnings when --quiet is specified
  const filteredResults = parsed.quiet ? ESLint.getErrorResults(results) : results;

  const errorCount = filteredResults.reduce((sum, r) => sum + r.errorCount, 0);
  // Compute warning count from unfiltered results so --max-warnings works with --quiet
  const warningCount = results.reduce((sum, r) => sum + r.warningCount, 0);

  // Format results
  const formatter = await eslint.loadFormatter(parsed.format);
  let text = await formatter.format(filteredResults);

  // Write to output file if specified
  if (parsed.outputFile) {
    await fs.writeFile(parsed.outputFile, text, 'utf8');
  }

  // Check max-warnings threshold
  if (parsed.maxWarnings >= 0 && warningCount > parsed.maxWarnings) {
    text += `\nESLint found too many warnings (maximum: ${String(parsed.maxWarnings)}).`;
    return { text, errorCount: Math.max(errorCount, 1) };
  }

  return { text, errorCount };
}

/** Resolve the ESLint config array and config directory from programmatic options, --config flag, or file discovery. */
async function resolveConfigAndDir(
  options: StrictLintOptions | undefined,
  configPath: string | undefined,
): Promise<{ config: Linter.Config[]; configDir: string | undefined }> {
  if (options?.baseConfig) {
    return { config: options.baseConfig, configDir: process.cwd() };
  }

  const filePath = configPath ?? findNearestFile('eslint.config.js');
  if (!filePath) {
    throw new Error('Could not find eslint.config.js');
  }

  const resolvedPath = path.resolve(filePath);
  const mod: unknown = await import(resolvedPath);
  assertIsConfig(mod);
  return { config: mod.default, configDir: path.dirname(resolvedPath) };
}

/** Build the override config array from errorized config and rule overrides. */
function buildOverrideConfig(
  errorizedConfig: Linter.Config[],
  programmaticOverrides: Record<string, Linter.RuleSeverity> | undefined,
  cliOverrides: Record<string, string>,
): Linter.Config[] {
  const configs = [...errorizedConfig];

  // Programmatic rule overrides (applied first, lower precedence)
  if (programmaticOverrides && Object.keys(programmaticOverrides).length > 0) {
    configs.push({ rules: { ...programmaticOverrides } });
  }

  // CLI rule overrides (applied last, highest precedence)
  if (Object.keys(cliOverrides).length > 0) {
    configs.push({
      rules: Object.fromEntries(
        Object.entries(cliOverrides).map(([name, severity]) => [name, toRuleSeverity(severity)]),
      ),
    });
  }

  return configs;
}

const SEVERITY_MAP: Record<string, Linter.RuleSeverity> = {
  off: 'off',
  warn: 'warn',
  error: 'error',
};

/** Convert a CLI severity string to a typed `Linter.RuleSeverity`. */
function toRuleSeverity(value: string): Linter.RuleSeverity {
  const severity = SEVERITY_MAP[value];
  if (severity === undefined) {
    throw new Error(`Invalid rule severity "${value}". Expected "off", "warn", or "error".`);
  }
  return severity;
}

function assertIsConfig(mod: unknown): asserts mod is { default: Linter.Config[] } {
  if (typeof mod !== 'object' || mod === null) {
    throw new TypeError('Expected module to be an object');
  }
  if (!('default' in mod)) {
    throw new TypeError('Expected module to have a default export');
  }
  if (!Array.isArray(mod.default)) {
    throw new TypeError('Expected config to be an array');
  }
  for (const item of mod.default) {
    if (typeof item !== 'object') {
      throw new TypeError('Expected config item to be an object');
    }
  }
}
