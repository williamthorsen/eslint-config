import { parseArgs } from 'node:util';

/** Result of parsing the arguments of `strict-lint init`. */
export interface ParsedInitArgs {
  isDryRun: boolean;
  shouldOverwrite: boolean;
  shouldShowHelp: boolean;
}

/** Parses the flags of `strict-lint init`, rejecting any positional argument. */
export function parseInitArgs(argv: string[]): ParsedInitArgs {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      'dry-run': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  if (positionals.length > 0) {
    throw new Error(`strict-lint init takes no positional arguments, got "${positionals.join('", "')}"`);
  }

  return {
    isDryRun: values['dry-run'],
    shouldOverwrite: values.force,
    shouldShowHelp: values.help,
  };
}
