import { parseArgs, type ParseArgsConfig } from 'node:util';

import { captureError } from '@williamthorsen/toolbelt.testing';
import { describe, expect, it } from 'vitest';

import { toUsageError, UsageError } from '../cliErrors.ts';

const CONFIG = {
  allowPositionals: true,
  allowNegative: true,
  options: {
    cache: { type: 'boolean' },
    'cache-location': { type: 'string' },
    fix: { type: 'boolean', short: 'f' },
  },
} as const satisfies ParseArgsConfig;

describe(toUsageError, () => {
  it('suggests the nearest long option', async () => {
    expect(toUsageError(await rejectArgs(['--fxi']), CONFIG).message).toBe(
      "Unknown option '--fxi'. Did you mean '--fix'?",
    );
  });

  it('suggests the nearest negated option under allowNegative', async () => {
    expect(toUsageError(await rejectArgs(['--no-cahce']), CONFIG).message).toBe(
      "Unknown option '--no-cahce'. Did you mean '--no-cache'?",
    );
  });

  it('does not suggest a negated option without allowNegative', async () => {
    const config = { ...CONFIG, allowNegative: false };

    expect(toUsageError(await rejectArgs(['--no-fix'], config), config).message).not.toContain('Did you mean');
  });

  it('keeps the parser message when no option is close', async () => {
    const error = await rejectArgs(['--bogus']);

    expect(toUsageError(error, CONFIG).message).toBe(error.message);
  });

  it('does not suggest for a short option', async () => {
    const error = await rejectArgs(['-x']);

    expect(toUsageError(error, CONFIG).message).toBe(error.message);
  });

  it('keeps the message of an error other than an unknown option', async () => {
    const error = await rejectArgs(['--cache-location']);

    expect(toUsageError(error, CONFIG).message).toBe(error.message);
  });

  it('wraps the rejection as a usage error with the original as its cause', async () => {
    const error = await rejectArgs(['--fxi']);
    const usageError = toUsageError(error, CONFIG);

    expect(usageError).toBeInstanceOf(UsageError);
    expect(usageError.cause).toBe(error);
  });

  it('wraps a non-Error rejection by its string form', () => {
    expect(toUsageError('bad input', CONFIG).message).toBe('bad input');
  });
});

// region | Helpers

/** Returns the error that `parseArgs` throws for `args` under `config`. */
function rejectArgs(args: string[], config: ParseArgsConfig = CONFIG): Promise<Error> {
  return captureError(() => parseArgs({ ...config, args }));
}

// endregion | Helpers
