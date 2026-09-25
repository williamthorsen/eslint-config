import { runInit } from '../init/initCommand.ts';

// `init` is a command only in first position, so a path of that name still lints as `strict-lint ./init`.
if (process.argv[2] === 'init') {
  try {
    process.exit(runInit(process.argv.slice(3), process.cwd()));
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
}

// Import the lint entry point only past the dispatch: it imports `eslint` for value, and `init` runs without it.
const { strictLint } = await import('../index.ts');
await strictLint();
