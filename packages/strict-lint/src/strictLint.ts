import fs from 'node:fs/promises';

import type { ProjectRoot } from '@williamthorsen/toolbelt.packaging';
import { ESLint, type Linter } from 'eslint';

import { describeRootSource } from './common/describeRootSource.ts';
import { createCeilingResolver } from './createCeilingResolver.ts';
import { loadStrictLintConfigs, resolveSharedConfigs, type StrictLintCascade } from './loadStrictLintConfigs.ts';
import { parseCliArgs, type ParsedCliArgs } from './parseCliArgs.ts';
import { promoteSeverities } from './promoteSeverities.ts';
import { findRepeatedRules } from './repeats/findRepeatedRules.ts';
import { loadEslintConfig } from './repeats/loadEslintConfig.ts';
import { reportRepeatedRules } from './repeats/reportRepeatedRules.ts';
import type { StrictLintOptions } from './types.ts';
import { showUsage } from './usage.ts';

/** Runs strict-lint as a CLI entry point, parsing process.argv and exiting on errors. */
export async function strictLint(options?: StrictLintOptions): Promise<string> {
  const { text, errorCount } = await runLint(options);

  // An empty formatter result means a clean run, which `console.info` would emit as a blank line. The guard keys
  // on the text, not the problem count, because a clean run is `[]` from `json` and a full document from `html`.
  if (text) {
    console.info(text);
  }
  if (errorCount > 0) {
    process.exit(1);
  }
  return text;
}

/**
 * Runs the lint, reporting and exiting where it failed outright. The exit that ends a completed-but-failing run stays
 * with the caller, so it is not caught by the handler for the lint's own failures.
 */
async function runLint(options: StrictLintOptions | undefined): Promise<{ text: string; errorCount: number }> {
  try {
    return await doLint(options, process.argv.slice(2));
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
}

/**
 * Runs ESLint with strict-lint promotion applied. ESLint resolves a config for each linted file, exactly as a plain
 * `eslint` run does; strict-lint raises severities afterwards rather than rewriting the config beforehand.
 * @link https://eslint.org/docs/latest/integrate/nodejs-api#eslint-class
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

  // The walk is anchored at each linted file, matching how ESLint resolves its own config.
  const ceilings = createCeilingResolver(options?.maxSeverity);

  const eslint = new ESLint(buildEslintOptions(options, parsed));

  const results = await eslint.lintFiles(resolvePatterns(options, parsed.patterns));

  // Promotion spans the whole array rather than each freshly linted file, so a result served from `--cache` is
  // promoted like one linted just now. It also runs ahead of `--quiet`, whose filter keys on severity and would
  // otherwise discard the very warnings strict-lint exists to raise.
  const promotedResults = await promoteSeverities(results, ceilings);

  if (parsed.debug) {
    reportConfigProvenance(ceilings.getCascades());
  }

  await checkForRepeatedRules(options, parsed, promotedResults);

  // Write fixes to files unless --fix-dry-run was specified
  if (!parsed.fixDryRun) {
    await ESLint.outputFixes(promotedResults);
  }

  // Filter warnings when --quiet is specified
  const filteredResults = parsed.quiet ? ESLint.getErrorResults(promotedResults) : promotedResults;

  const errorCount = filteredResults.reduce((sum, r) => sum + r.errorCount, 0);
  // Compute warning count from unfiltered results so --max-warnings works with --quiet
  const warningCount = promotedResults.reduce((sum, r) => sum + r.warningCount, 0);

  // Format results
  const formatter = await eslint.loadFormatter(parsed.format);
  let text = await formatter.format(filteredResults);

  // Write to output file if specified
  if (parsed.outputFile) {
    await fs.writeFile(parsed.outputFile, text, 'utf8');
  }

  // Check max-warnings threshold
  if (parsed.maxWarnings >= 0 && warningCount > parsed.maxWarnings) {
    const message = `ESLint found too many warnings (maximum: ${String(parsed.maxWarnings)}).`;
    // Separate the message from the report only when there is one; otherwise it would lead with a blank line.
    text = text ? `${text}\n${message}` : message;
    return { text, errorCount: Math.max(errorCount, 1) };
  }

  return { text, errorCount };
}

// region | Helpers

/** How many directories a provenance line names before it collapses the rest into a count. */
const MAX_REPORTED_DIRS = 3;

const SEVERITY_MAP: Record<string, Linter.RuleSeverity> = {
  off: 'off',
  warn: 'warn',
  error: 'error',
};

/**
 * Rejects the one combination no options shape can satisfy. An in-memory config holds plugin objects, and ESLint
 * clones its options to reach worker threads. Left to ESLint the failure names `overrideConfig`, an option the
 * programmatic caller never passed.
 */
function assertConcurrencyIsOff(concurrency: ESLint.Options['concurrency']): void {
  if (concurrency === undefined || concurrency === 'off') {
    return;
  }
  throw new Error(
    'Concurrency is unavailable with a programmatic `baseConfig`, whose plugin objects cannot cross a worker thread. Load the config from a file instead, or set concurrency to "off".',
  );
}

/** Assembles the ESLint constructor options, leaving config discovery to ESLint unless the caller pinned a config. */
function buildEslintOptions(options: StrictLintOptions | undefined, parsed: ParsedCliArgs): ESLint.Options {
  const overrideConfig = buildOverrideConfig(options?.baseConfig, options?.ruleOverrides, parsed.ruleOverrides);
  const eslintOptions: ESLint.Options = { cwd: process.cwd(), ...parsed.eslintOptions, overrideConfig };

  if (options?.baseConfig) {
    assertConcurrencyIsOff(parsed.eslintOptions.concurrency);
    // An in-memory config has no file for ESLint to resolve, so it rides along and pins the run to itself.
    return { ...eslintOptions, overrideConfigFile: true };
  }

  if (parsed.configPath !== undefined) {
    return { ...eslintOptions, overrideConfigFile: parsed.configPath };
  }

  // Nothing pinned: ESLint discovers a config for each linted file, as it does for a plain `eslint` run.
  return eslintOptions;
}

/** Builds the override layers, lowest precedence first, that ride on top of whatever config ESLint resolves. */
function buildOverrideConfig(
  baseConfig: Linter.Config[] | undefined,
  programmaticOverrides: Record<string, Linter.RuleSeverity> | undefined,
  cliOverrides: Record<string, string>,
): Linter.Config[] {
  const configs: Linter.Config[] = baseConfig ? [...baseConfig] : [];

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

/**
 * Compares the consumer's own config against the configs it extends, when a strict-lint config names them. The walk
 * is its own rather than the ceiling resolver's: ceilings answer a per-file question and are memoized by directory,
 * while one run has one ESLint config to measure.
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

/** Names the directories a cascade governs, collapsing a long tail into a count so one group stays one line. */
function describeDirs(dirs: readonly string[]): string {
  const shown = dirs.slice(0, MAX_REPORTED_DIRS).join(', ');
  const remaining = dirs.length - MAX_REPORTED_DIRS;
  return remaining > 0 ? `${shown} (and ${String(remaining)} more)` : shown;
}

/**
 * Collapses the per-directory walks into one entry per distinct outcome. A monorepo resolves one cascade per
 * directory holding linted files, but only a handful of distinct config sets, and the report names those.
 */
function groupByConfigFiles(cascades: ReadonlyMap<string, StrictLintCascade>): CascadeGroup[] {
  const groups = new Map<string, CascadeGroup>();
  for (const [dir, cascade] of cascades) {
    // Lowest precedence first, matching the order the report prints them in.
    const filePaths = cascade.entries.toReversed().map((entry) => entry.filePath);
    const key = `${cascade.stopReason}\n${filePaths.join('\n')}`;
    const group = groups.get(key);
    if (group) {
      group.dirs.push(dir);
    } else {
      groups.set(key, { dirs: [dir], filePaths, stoppedByPredicate: cascade.stopReason === 'predicate' });
    }
  }
  return groups.values().toArray();
}

/** The project roots the walks landed on, deduplicated: a run spanning one repository reports exactly one. */
function listDistinctProjectRoots(cascades: ReadonlyMap<string, StrictLintCascade>): ProjectRoot[] {
  const roots = new Map<string, ProjectRoot>();
  for (const cascade of cascades.values()) {
    roots.set(cascade.projectRoot.rootDir, cascade.projectRoot);
  }
  return roots.values().toArray();
}

/** Reports where the ceilings came from, on stderr, so it stays clear of the formatter output. */
function reportConfigProvenance(cascades: ReadonlyMap<string, StrictLintCascade>): void {
  if (cascades.size === 0) {
    console.error('strict-lint: no files were linted, so no config was resolved');
    return;
  }

  for (const projectRoot of listDistinctProjectRoots(cascades)) {
    console.error(`strict-lint: project root ${projectRoot.rootDir} (${describeRootSource(projectRoot)})`);
  }

  for (const group of groupByConfigFiles(cascades)) {
    if (group.filePaths.length === 0) {
      console.error(`strict-lint: no config file found for ${describeDirs(group.dirs)}`);
    } else {
      console.error(`strict-lint: config files for ${describeDirs(group.dirs)}, lowest precedence first:`);
      for (const filePath of group.filePaths) {
        console.error(`strict-lint:   ${filePath}`);
      }
    }
    if (group.stoppedByPredicate) {
      console.error('strict-lint: ascent stopped by shouldIgnoreAncestors');
    }
  }
}

/** The config to measure against the shared one: the caller's own when it passed one, otherwise the config file. */
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

/** Converts a CLI severity string to a typed `Linter.RuleSeverity`. */
function toRuleSeverity(value: string): Linter.RuleSeverity {
  const severity = SEVERITY_MAP[value];
  if (severity === undefined) {
    throw new Error(`Invalid rule severity "${value}". Expected "off", "warn", or "error".`);
  }
  return severity;
}

/** The directories sharing one resolved set of ceiling config files. */
interface CascadeGroup {
  dirs: string[];
  filePaths: string[];
  stoppedByPredicate: boolean;
}

// endregion | Helpers
