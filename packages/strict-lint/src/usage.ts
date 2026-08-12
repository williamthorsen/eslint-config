const README_URL = 'https://github.com/williamthorsen/eslint-config/tree/main/packages/strict-lint#cli-reference';

/** Reports how to invoke strict-lint in either of its two modes. */
export function showUsage(): void {
  console.info(`Usage: strict-lint [options] [file|dir|glob...]
       strict-lint init [options]

Runs ESLint with every warning promoted to an error, except for the rules capped below
\`error\` in a .config/strict-lint.config.ts.

Commands:
  init          Scaffold .config/strict-lint.config.ts in the current directory.
                Run \`strict-lint init --help\` for its options.

Options:
  -h, --help    Show this help.

Every other option strict-lint accepts is one eslint accepts, forwarded through. The full
list is in the README: ${README_URL}`);
}

/** Reports how to invoke the init command. */
export function showInitUsage(): void {
  console.info(`Usage: strict-lint init [options]

Scaffolds .config/strict-lint.config.ts in the current directory. Run it from the directory
whose files the ceilings should govern: configs merge from the project root down, so a config
in a package applies to that package alone.

Options:
      --dry-run   Report what would be written, without writing it.
      --force     Overwrite an existing config.
  -h, --help      Show this help.`);
}
