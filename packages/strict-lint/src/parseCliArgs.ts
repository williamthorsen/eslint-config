import { parseArgs } from 'node:util';

import type { ESLint } from 'eslint';

/** Result of parsing ESLint CLI arguments into structured fields. */
export interface ParsedCliArgs {
  patterns: string[];
  eslintOptions: Partial<ESLint.Options>;
  ruleOverrides: Record<string, string>;
  fixDryRun: boolean;
  format: string;
  quiet: boolean;
  maxWarnings: number;
  outputFile: string | undefined;
  configPath: string | undefined;
}

/** Parse process.argv-style arguments into ESLint constructor options and metadata. */
export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    allowNegative: true,
    options: {
      fix: { type: 'boolean', default: false },
      'fix-dry-run': { type: 'boolean', default: false },
      'fix-type': { type: 'string', multiple: true },
      'ignore-pattern': { type: 'string', multiple: true },
      ignore: { type: 'boolean' },
      'error-on-unmatched-pattern': { type: 'boolean' },
      'pass-on-no-patterns': { type: 'boolean', default: false },
      'inline-config': { type: 'boolean' },
      cache: { type: 'boolean', default: false },
      'cache-location': { type: 'string' },
      'cache-strategy': { type: 'string' },
      'warn-ignored': { type: 'boolean' },
      config: { type: 'string', short: 'c' },
      stats: { type: 'boolean', default: false },
      flag: { type: 'string', multiple: true },
      concurrency: { type: 'string' },
      rule: { type: 'string', multiple: true },
      quiet: { type: 'boolean', default: false },
      'max-warnings': { type: 'string', default: '-1' },
      format: { type: 'string', short: 'f', default: 'stylish' },
      'output-file': { type: 'string', short: 'o' },
    },
  });

  const fixDryRun = values['fix-dry-run'];
  const shouldFix = values.fix || fixDryRun;

  const eslintOptions: Partial<ESLint.Options> = {};

  if (shouldFix) {
    eslintOptions.fix = true;
  }

  if (values['fix-type']) {
    eslintOptions.fixTypes = values['fix-type'].map(toFixType);
  }

  if (values['ignore-pattern']) {
    eslintOptions.ignorePatterns = values['ignore-pattern'];
  }

  if (values.ignore !== undefined) {
    eslintOptions.ignore = values.ignore;
  }

  if (values['error-on-unmatched-pattern'] !== undefined) {
    eslintOptions.errorOnUnmatchedPattern = values['error-on-unmatched-pattern'];
  }

  if (values['pass-on-no-patterns']) {
    eslintOptions.passOnNoPatterns = true;
  }

  if (values['inline-config'] !== undefined) {
    eslintOptions.allowInlineConfig = values['inline-config'];
  }

  if (values.cache) {
    eslintOptions.cache = true;
  }

  if (values['cache-location'] !== undefined) {
    eslintOptions.cacheLocation = values['cache-location'];
  }

  if (values['cache-strategy'] !== undefined) {
    eslintOptions.cacheStrategy = toCacheStrategy(values['cache-strategy']);
  }

  if (values['warn-ignored'] !== undefined) {
    eslintOptions.warnIgnored = values['warn-ignored'];
  }

  if (values.stats) {
    eslintOptions.stats = true;
  }

  if (values.flag) {
    eslintOptions.flags = values.flag;
  }

  if (values.concurrency !== undefined) {
    eslintOptions.concurrency = parseConcurrency(values.concurrency);
  }

  const ruleOverrides: Record<string, string> = {};
  if (values.rule) {
    for (const entry of values.rule) {
      const colonIndex = entry.indexOf(':');
      if (colonIndex === -1) {
        throw new Error(`Invalid --rule value "${entry}". Expected format: "rule-name: severity"`);
      }
      const ruleName = entry.slice(0, colonIndex);
      const severity = entry.slice(colonIndex + 1).trim();
      if (severity === '') {
        throw new Error(`Invalid --rule value "${entry}". Missing severity after colon.`);
      }
      ruleOverrides[ruleName] = severity;
    }
  }

  return {
    patterns: positionals,
    eslintOptions,
    ruleOverrides,
    fixDryRun,
    format: values.format,
    quiet: values.quiet,
    maxWarnings: parseMaxWarnings(values['max-warnings']),
    outputFile: values['output-file'],
    configPath: values.config,
  };
}

/** Parse and validate the `--max-warnings` string value as an integer. */
function parseMaxWarnings(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || String(parsed) !== value) {
    throw new Error(`Invalid --max-warnings value "${value}". Expected an integer.`);
  }
  return parsed;
}

const FIX_TYPES: Record<string, ESLint.FixType> = {
  directive: 'directive',
  problem: 'problem',
  suggestion: 'suggestion',
  layout: 'layout',
};

/** Validate a --fix-type value against ESLint's accepted fix types. */
function toFixType(value: string): ESLint.FixType {
  const fixType = FIX_TYPES[value];
  if (fixType === undefined) {
    throw new Error(`Invalid --fix-type value "${value}". Expected "directive", "problem", "suggestion", or "layout".`);
  }
  return fixType;
}

const CACHE_STRATEGIES: Record<string, ESLint.CacheStrategy> = {
  content: 'content',
  metadata: 'metadata',
};

/** Validate a --cache-strategy value against ESLint's accepted strategies. */
function toCacheStrategy(value: string): ESLint.CacheStrategy {
  const strategy = CACHE_STRATEGIES[value];
  if (strategy === undefined) {
    throw new Error(`Invalid --cache-strategy value "${value}". Expected "content" or "metadata".`);
  }
  return strategy;
}

/** Convert a concurrency string to the appropriate typed value. */
function parseConcurrency(value: string): number | 'auto' | 'off' {
  if (value === 'auto' || value === 'off') {
    return value;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || String(parsed) !== value) {
    throw new Error(`Invalid --concurrency value "${value}". Expected an integer, "auto", or "off".`);
  }
  return parsed;
}
