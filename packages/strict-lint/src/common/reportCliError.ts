import { StrictLintError } from './cliErrors.ts';

/**
 * Reports a value thrown out of a CLI command on stderr, under `prefix`, and returns the exit code. An anticipated
 * error prints as one line; anything else prints as an internal error, with its stack frames.
 */
export function reportCliError(error: unknown, prefix: string): 1 | 2 {
  if (error instanceof StrictLintError) {
    console.error(`${prefix}: ${error.message}`);
    return error.exitCode;
  }

  if (isEslintTemplatedError(error)) {
    console.error(`${prefix}: ${error.message}`);
    return 1;
  }

  if (error instanceof Error) {
    const frames = extractStackFrames(error.stack);
    console.error(`${prefix}: internal error: ${error.message}${frames ? `\n${frames}` : ''}`);
    return 1;
  }

  console.error(`${prefix}: internal error: ${String(error)}`);
  return 1;
}

// region | Helpers

/** Returns the frame lines of a stack, dropping the header, which repeats the message. */
function extractStackFrames(stack: string | undefined): string {
  if (stack === undefined) {
    return '';
  }
  const lines = stack.split('\n');
  const firstFrame = lines.findIndex((line) => /^\s+at /.test(line));
  return firstFrame === -1 ? '' : lines.slice(firstFrame).join('\n');
}

/** Checks for the `messageTemplate` property with which ESLint marks the errors that its own CLI reports as handled. */
function isEslintTemplatedError(error: unknown): error is Error & { messageTemplate: string } {
  return error instanceof Error && 'messageTemplate' in error && typeof error.messageTemplate === 'string';
}

// endregion | Helpers
