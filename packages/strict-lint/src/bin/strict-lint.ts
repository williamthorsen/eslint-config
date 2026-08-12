#!/usr/bin/env node
import { strictLint } from '../index.ts';
import { runInit } from '../init/initCommand.ts';

// `init` is a command only in first position, so a path of that name still lints as `strict-lint ./init`.
if (process.argv[2] === 'init') {
  try {
    process.exit(runInit(process.argv.slice(3)));
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
}

await strictLint();
