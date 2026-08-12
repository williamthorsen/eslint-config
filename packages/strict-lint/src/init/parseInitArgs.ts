import { parseArgs } from 'node:util';

/** Result of parsing the arguments `strict-lint init` accepts. */
export interface ParsedInitArgs {
  isDryRun: boolean;
  shouldOverwrite: boolean;
  shouldShowHelp: boolean;
}

/** Parses the flags `strict-lint init` accepts, rejecting positional arguments it has no use for. */
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
