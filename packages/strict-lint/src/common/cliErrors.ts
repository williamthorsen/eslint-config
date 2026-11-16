import type { ParseArgsConfig } from 'node:util';

import { findCloseMatch } from '@williamthorsen/toolbelt.strings/candidate';

/** An anticipated failure, which the CLI reports as one line without a stack and exits with `exitCode`. */
export class StrictLintError extends Error {
  readonly exitCode: 1 | 2 = 1;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'StrictLintError';
  }
}

/**
 * Rewraps an argument parser's rejection, such as `parseArgs`'s unknown-option error, as a usage error. An unknown
 * long option close to one that `config` declares is reported with that option as a suggestion.
 */
export function toUsageError(error: unknown, config: Pick<ParseArgsConfig, 'allowNegative' | 'options'>): UsageError {
  if (!(error instanceof Error)) {
    return new UsageError(String(error));
  }
  const suggestion = suggestOption(error, config);
  const message = suggestion === undefined ? error.message : suggestion;
  return new UsageError(message, { cause: error });
}

/** A mistake in the invocation, such as an unknown option or an invalid value, which exits 2. */
export class UsageError extends StrictLintError {
  override readonly exitCode = 2;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UsageError';
  }
}

// Node exposes the rejected token only in the message.
const UNKNOWN_OPTION_PATTERN = /^Unknown option '([^']+)'/;

// region | Helpers

/** Lists the long option names that `config` accepts, including the negated forms of booleans under `allowNegative`. */
function listLongOptionNames(config: Pick<ParseArgsConfig, 'allowNegative' | 'options'>): string[] {
  const entries = Object.entries(config.options ?? {});
  const names = entries.map(([name]) => name);
  if (config.allowNegative !== true) {
    return names;
  }
  const negatedNames = entries.filter(([, option]) => option.type === 'boolean').map(([name]) => `no-${name}`);
  return [...names, ...negatedNames];
}

/** Composes an unknown-option message that names the nearest declared long option, or returns `undefined`. */
function suggestOption(error: Error, config: Pick<ParseArgsConfig, 'allowNegative' | 'options'>): string | undefined {
  if (!('code' in error) || error.code !== 'ERR_PARSE_ARGS_UNKNOWN_OPTION') {
    return undefined;
  }
  const token = UNKNOWN_OPTION_PATTERN.exec(error.message)?.[1];
  // Short options are excluded: every single-letter typo is within one edit of every short option.
  if (token === undefined || !token.startsWith('--')) {
    return undefined;
  }
  const match = findCloseMatch(token.slice(2), listLongOptionNames(config));
  return match === undefined ? undefined : `Unknown option '${token}'. Did you mean '--${match}'?`;
}

// endregion | Helpers
