import { silenceConsole } from '@williamthorsen/toolbelt.vitest';
import { listConsoleLines } from '@williamthorsen/toolbelt.vitest/candidate';
import { describe, expect, it } from 'vitest';

import { StrictLintError, UsageError } from '../cliErrors.ts';
import { reportCliError } from '../reportCliError.ts';

describe(reportCliError, () => {
  it('reports a usage error as one prefixed line and returns 2', () => {
    using silenced = silenceConsole(['error']);

    const code = reportCliError(new UsageError('Invalid --format value'), 'strict-lint');

    expect(listConsoleLines(silenced.error)).toStrictEqual(['strict-lint: Invalid --format value']);
    expect(code).toBe(2);
  });

  it('reports an anticipated runtime error as one prefixed line and returns 1', () => {
    using silenced = silenceConsole(['error']);

    const code = reportCliError(new StrictLintError('bad config'), 'strict-lint init');

    expect(listConsoleLines(silenced.error)).toStrictEqual(['strict-lint init: bad config']);
    expect(code).toBe(1);
  });

  it('reports an ESLint error carrying a messageTemplate as an anticipated error', () => {
    using silenced = silenceConsole(['error']);
    const error = Object.assign(new Error('No files matching the pattern "x" were found.'), {
      messageTemplate: 'file-not-found',
    });

    const code = reportCliError(error, 'strict-lint');

    expect(listConsoleLines(silenced.error)).toStrictEqual([
      'strict-lint: No files matching the pattern "x" were found.',
    ]);
    expect(code).toBe(1);
  });

  it('reports any other error as an internal error followed by its stack frames, once each', () => {
    using silenced = silenceConsole(['error']);
    const error = new Error('first line\nsecond line');

    const code = reportCliError(error, 'strict-lint');

    const lines = listConsoleLines(silenced.error).join('\n').split('\n');
    expect(lines.slice(0, 2)).toStrictEqual(['strict-lint: internal error: first line', 'second line']);
    expect(lines[2]).toMatch(/^\s+at /);
    expect(lines.filter((line) => line.includes('second line'))).toHaveLength(1);
    expect(code).toBe(1);
  });

  it('reports a thrown non-Error by its string form without a stack', () => {
    using silenced = silenceConsole(['error']);

    const code = reportCliError('plain string', 'strict-lint');

    expect(listConsoleLines(silenced.error)).toStrictEqual(['strict-lint: internal error: plain string']);
    expect(code).toBe(1);
  });
});
