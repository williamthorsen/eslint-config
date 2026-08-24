import { disposeOnTestFinished, listConsoleLines, silenceConsole } from '@williamthorsen/toolbelt.vitest/candidate';
import { describe, expect, it } from 'vitest';

import { showInitUsage, showUsage } from '../usage.ts';

describe(showUsage, () => {
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
  it.each([['--dry-run'], ['--force'], ['-h, --help']])('documents %s', (flag) => {
    const reported = captureInfo();

    showInitUsage();

    expect(reported()).toContain(flag);
  });
});

// region | Helpers

/** Silences `console.info` and returns an accessor for everything written to it since. */
function captureInfo(): () => string {
  const silenced = disposeOnTestFinished(silenceConsole(['info']));
  return () => listConsoleLines(silenced.info).join('\n');
}

// endregion | Helpers
