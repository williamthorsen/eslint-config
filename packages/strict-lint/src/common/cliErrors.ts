/** An anticipated failure, which the CLI reports as one line without a stack and exits with `exitCode`. */
export class StrictLintError extends Error {
  readonly exitCode: 1 | 2 = 1;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'StrictLintError';
  }
}

/** A mistake in the invocation, such as an unknown option or an invalid value, which exits 2. */
export class UsageError extends StrictLintError {
  override readonly exitCode = 2;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UsageError';
  }
}
