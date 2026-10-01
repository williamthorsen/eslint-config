import { runInit } from '#src/init/initCommand.ts';

// `init` is a command only in first position, so `strict-lint ./init` still lints a path of that name.
if (process.argv[2] === 'init') {
  try {
    process.exit(runInit(process.argv.slice(3), process.cwd()));
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
}

// Import the lint entry point only after the dispatch: It imports `eslint` for value, and `init` runs without it.
const { strictLint } = await import('#src/index.ts');
await strictLint();
