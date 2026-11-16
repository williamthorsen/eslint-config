import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { resolveSelfVersion } from '@williamthorsen/toolbelt.packaging/candidate';
import { ESLint, type Linter } from 'eslint';

import { UsageError } from './common/cliErrors.ts';
import { reportCliError } from './common/reportCliError.ts';
import { createCeilingResolver } from './createCeilingResolver.ts';
import { loadStrictLintConfigs, resolveSharedConfigs } from './loadStrictLintConfigs.ts';
import { parseCliArgs, type ParsedCliArgs } from './parseCliArgs.ts';
import { promoteSeverities } from './promoteSeverities.ts';
import { findRepeatedRules } from './repeats/findRepeatedRules.ts';
import { loadEslintConfig } from './repeats/loadEslintConfig.ts';
import { reportRepeatedRules } from './repeats/reportRepeatedRules.ts';
import { reportConfigProvenance } from './reportConfigProvenance.ts';
import type { StrictLintOptions } from './types.ts';
import { showUsage } from './usage.ts';

/** Runs strict-lint as a CLI entry point, parsing process.argv and exiting on errors. */
export async function strictLint(options?: StrictLintOptions): Promise<string> {
  const { text, errorCount } = await runLint(options);

  // Skip an empty formatter result, which `console.info` would print as a blank line. Test the text, not the problem
  // count, because `json` reports a clean run as `[]` and `html` reports it as a full document.
  if (text) {
    console.info(text);
  }
  if (errorCount > 0) {
    process.exit(1);
  }
  return text;
}

// region | Helpers

/**
 * Rejects concurrency alongside a programmatic `baseConfig`, whose plugin objects ESLint cannot clone to reach worker
 * threads. Left to ESLint, the failure names `overrideConfig`, an option that the programmatic caller never passed.
 */
function assertConcurrencyIsOff(concurrency: ESLint.Options['concurrency']): void {
  if (concurrency === undefined || concurrency === 'off') {
    return;
  }
  throw new UsageError(
    'Concurrency is unavailable with a programmatic `baseConfig`, whose plugin objects cannot cross a worker thread. Load the config from a file instead, or set concurrency to "off".',
  );
}

/** Rejects a `--config` path that names nothing, which ESLint would report as a config that it could not find. */
function assertConfigFileExists(configPath: string): void {
  if (!existsSync(path.resolve(process.cwd(), configPath))) {
    throw new UsageError(`--config ${configPath}: file not found`);
  }
}

/** Assembles the ESLint constructor options, leaving config discovery to ESLint unless the caller pinned a config. */
function buildEslintOptions(options: StrictLintOptions | undefined, parsed: ParsedCliArgs): ESLint.Options {
  const overrideConfig = buildOverrideConfig(options?.baseConfig, options?.ruleOverrides, parsed.ruleOverrides);
  const eslintOptions: ESLint.Options = { cwd: process.cwd(), ...parsed.eslintOptions, overrideConfig };

  if (options?.baseConfig) {
    assertConcurrencyIsOff(parsed.eslintOptions.concurrency);
    // Pin the run to the in-memory config, which has no file for ESLint to resolve.
    return { ...eslintOptions, overrideConfigFile: true };
  }

  if (parsed.configPath !== undefined) {
    assertConfigFileExists(parsed.configPath);
    return { ...eslintOptions, overrideConfigFile: parsed.configPath };
  }

  return eslintOptions;
}

/** Builds the override layers, lowest precedence first, that apply over whatever config ESLint resolves. */
function buildOverrideConfig(
  baseConfig: Linter.Config[] | undefined,
  programmaticOverrides: Record<string, Linter.RuleSeverity> | undefined,
  cliOverrides: Record<string, Linter.RuleSeverity>,
): Linter.Config[] {
  const configs: Linter.Config[] = baseConfig ? [...baseConfig] : [];

  if (programmaticOverrides && Object.keys(programmaticOverrides).length > 0) {
    configs.push({ rules: { ...programmaticOverrides } });
  }

  if (Object.keys(cliOverrides).length > 0) {
    configs.push({ rules: { ...cliOverrides } });
  }

  return configs;
}

/**
 * Compares the consumer's own config against the configs that it extends, when a strict-lint config names them.
 * It walks the cascade itself instead of reusing the ceiling resolver: Ceilings answer a per-file question and are
 * memoized by directory, while one run has one ESLint config to measure.
 */
async function checkForRepeatedRules(
  options: StrictLintOptions | undefined,
  parsed: ParsedCliArgs,
  results: ESLint.LintResult[],
): Promise<void> {
  const cwd = process.cwd();
  const sharedElements = resolveSharedConfigs(await loadStrictLintConfigs(cwd));
  if (sharedElements.length === 0) {
    return;
  }

  const consumer = await resolveConsumerConfig(options, parsed, cwd);
  if (consumer === undefined) {
    return;
  }

  const report = await findRepeatedRules({
    consumerElements: consumer.elements,
    cwd,
    filePaths: results.map((result) => result.filePath),
    sharedElements,
  });
  reportRepeatedRules(report, consumer.name);
}

/**
 * Runs ESLint with strict-lint promotion applied. ESLint resolves a config for each linted file, exactly as a plain
 * `eslint` run does; strict-lint raises severities in the results afterwards.
 */
async function doLint(
  options: StrictLintOptions | undefined,
  args: string[],
): Promise<{ text: string; errorCount: number }> {
  const parsed = parseCliArgs(args);

  if (parsed.shouldShowHelp) {
    showUsage();
    return { text: '', errorCount: 0 };
  }

  if (parsed.shouldShowVersion) {
    console.info(resolveSelfVersion(import.meta.url));
    return { text: '', errorCount: 0 };
  }

  const ceilings = createCeilingResolver(options?.maxSeverity);

  const eslint = new ESLint(buildEslintOptions(options, parsed));

  const results = await eslint.lintFiles(resolvePatterns(options, parsed.patterns));

  // Promote ahead of `--quiet`, whose severity filter would otherwise discard the warnings that strict-lint raises.
  const promotedResults = await promoteSeverities(results, ceilings);

  if (parsed.debug) {
    reportConfigProvenance(ceilings.getCascades());
  }

  await checkForRepeatedRules(options, parsed, promotedResults);

  if (!parsed.fixDryRun) {
    await ESLint.outputFixes(promotedResults);
  }

  const filteredResults = parsed.quiet ? ESLint.getErrorResults(promotedResults) : promotedResults;

  const errorCount = filteredResults.reduce((sum, r) => sum + r.errorCount, 0);
  // Count warnings in the unfiltered results, so that --max-warnings works with --quiet.
  const warningCount = promotedResults.reduce((sum, r) => sum + r.warningCount, 0);

  const formatter = await eslint.loadFormatter(parsed.format);
  let text = await formatter.format(filteredResults);

  if (parsed.outputFile) {
    await fs.writeFile(parsed.outputFile, text, 'utf8');
  }

  if (parsed.maxWarnings >= 0 && warningCount > parsed.maxWarnings) {
    const message = `ESLint found too many warnings (maximum: ${String(parsed.maxWarnings)}).`;
    // Separate the message from the report only when there is one; otherwise it would lead with a blank line.
    text = text ? `${text}\n${message}` : message;
    return { text, errorCount: Math.max(errorCount, 1) };
  }

  return { text, errorCount };
}

/** Resolves the config to measure against the shared one: the caller's own if it passed one, else the config file. */
async function resolveConsumerConfig(
  options: StrictLintOptions | undefined,
  parsed: ParsedCliArgs,
  cwd: string,
): Promise<{ elements: Linter.Config[]; name: string } | undefined> {
  if (options?.baseConfig) {
    return { elements: options.baseConfig, name: 'the base config passed programmatically' };
  }

  const load = await loadEslintConfig(cwd, parsed.configPath);
  if (load.status === 'loaded') {
    return { elements: load.elements, name: load.filePath };
  }
  if (load.status === 'unreadable') {
    console.error(`strict-lint: shared-config check skipped: cannot read ${load.filePath}, because ${load.problem}`);
  }
  return undefined;
}

/** Determines the lint targets: CLI positionals, then programmatic patterns, then the current directory. */
function resolvePatterns(options: StrictLintOptions | undefined, cliPatterns: string[]): string[] {
  if (cliPatterns.length > 0) {
    return cliPatterns;
  }
  if (options?.patterns?.length) {
    return options.patterns;
  }
  return ['.'];
}

/**
 * Runs the lint, reporting and exiting when it fails outright. The exit that ends a completed-but-failing run stays
 * with the caller, so it is not caught by the handler for the lint's own failures.
 */
async function runLint(options: StrictLintOptions | undefined): Promise<{ text: string; errorCount: number }> {
  try {
    return await doLint(options, process.argv.slice(2));
  } catch (error: unknown) {
    process.exit(reportCliError(error, 'strict-lint'));
  }
}

// endregion | Helpers
