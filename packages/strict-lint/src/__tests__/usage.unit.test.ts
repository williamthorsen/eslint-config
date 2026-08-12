import { afterEach, describe, expect, it, vi } from 'vitest';

import { showInitUsage, showUsage } from '../usage.ts';

describe(showUsage, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([['strict-lint [options] [file|dir|glob...]'], ['strict-lint init [options]']])(
    'names the `%s` mode',
    (invocation) => {
      const reported = captureInfo();

      showUsage();

      expect(reported()).toContain(invocation);
    },
  );

  it('points at the README rather than restating the eslint flags', () => {
    const reported = captureInfo();

    showUsage();

    expect(reported()).toContain('#cli-reference');
  });
});

describe(showInitUsage, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([['--dry-run'], ['--force'], ['-h, --help']])('documents %s', (flag) => {
    const reported = captureInfo();

    showInitUsage();

    expect(reported()).toContain(flag);
  });
});

// region | Helpers

/** Silences `console.info` and returns an accessor for everything written to it since. */
function captureInfo(): () => string {
  const lines: string[] = [];
  vi.spyOn(console, 'info').mockImplementation((...args: unknown[]) => void lines.push(args.map(String).join(' ')));
  return () => lines.join('\n');
}

// endregion | Helpers
