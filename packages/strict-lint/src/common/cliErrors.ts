/** An anticipated failure, which the CLI reports as one line without a stack and exits with `exitCode`. */
export class StrictLintError extends Error {
  readonly exitCode: 1 | 2 = 1;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'StrictLintError';
  }
}

/** Rewraps an argument parser's rejection, such as `parseArgs`'s unknown-option error, as a usage error. */
export function toUsageError(error: unknown): UsageError {
  return error instanceof Error ? new UsageError(error.message, { cause: error }) : new UsageError(String(error));
}

/** A mistake in the invocation, such as an unknown option or an invalid value, which exits 2. */
export class UsageError extends StrictLintError {
  override readonly exitCode = 2;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UsageError';
  }
}
