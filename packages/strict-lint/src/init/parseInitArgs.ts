import { parseArgs, type ParseArgsConfig } from 'node:util';

import { toUsageError, UsageError } from '#src/common/cliErrors.ts';

/** Result of parsing the arguments of `strict-lint init`. */
export interface ParsedInitArgs {
  isDryRun: boolean;
  shouldOverwrite: boolean;
  shouldShowHelp: boolean;
}

/** Parses the flags of `strict-lint init`, rejecting any positional argument. */
export function parseInitArgs(argv: string[]): ParsedInitArgs {
  const { values, positionals } = parseOptions(argv);

  if (positionals.length > 0) {
    throw new UsageError(`takes no positional arguments, got "${positionals.join('", "')}"`);
  }

  return {
    isDryRun: values['dry-run'],
    shouldOverwrite: values.force,
    shouldShowHelp: values.help,
  };
}

const PARSE_CONFIG = {
  allowPositionals: true,
  options: {
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
} as const satisfies ParseArgsConfig;

// region | Helpers

/** Runs `parseArgs` over the init command's options, reporting a rejected argument as a usage error. */
function parseOptions(argv: string[]) {
  try {
    return parseArgs({ ...PARSE_CONFIG, args: argv });
  } catch (error: unknown) {
    throw toUsageError(error, PARSE_CONFIG);
  }
}

// endregion | Helpers
