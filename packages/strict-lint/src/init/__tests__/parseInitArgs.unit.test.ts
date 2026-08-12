import { describe, expect, it } from 'vitest';

import { parseInitArgs } from '../parseInitArgs.ts';

describe(parseInitArgs, () => {
  it('returns defaults when no arguments are provided', () => {
    expect(parseInitArgs([])).toStrictEqual({ isDryRun: false, shouldOverwrite: false, shouldShowHelp: false });
  });

  it('sets isDryRun for --dry-run', () => {
    expect(parseInitArgs(['--dry-run']).isDryRun).toBe(true);
  });

  it('sets shouldOverwrite for --force', () => {
    expect(parseInitArgs(['--force']).shouldOverwrite).toBe(true);
  });

  it.each([['--help'], ['-h']])('sets shouldShowHelp for %s', (flag) => {
    expect(parseInitArgs([flag]).shouldShowHelp).toBe(true);
  });

  it('rejects a positional argument', () => {
    expect(() => parseInitArgs(['packages/pkg'])).toThrow('takes no positional arguments');
  });

  it('rejects an unknown option', () => {
    expect(() => parseInitArgs(['--overwrite'])).toThrow('Unknown option');
  });
});
