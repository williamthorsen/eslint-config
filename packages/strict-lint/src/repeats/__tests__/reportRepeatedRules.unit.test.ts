import { afterEach, describe, expect, it, vi } from 'vitest';

import { reportRepeatedRules } from '../reportRepeatedRules.ts';

describe(reportRepeatedRules, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('names the config, the rules it repeats, and how many files each covers', () => {
    const lines = capture({
      repeatedRules: [
        { fileCount: 5, ruleId: 'n/no-extraneous-import' },
        { fileCount: 1, ruleId: 'no-eval' },
      ],
      unsortableLabels: [],
    });

    expect(lines).toStrictEqual([
      'strict-lint: eslint.config.ts repeats the shared config for 2 rules:',
      'strict-lint:   n/no-extraneous-import (5 files)',
      'strict-lint:   no-eval (1 file)',
    ]);
  });

  it('writes nothing when the comparison found no repeat', () => {
    expect(capture({ repeatedRules: [], unsortableLabels: [] })).toStrictEqual([]);
  });

  it('names what it could not sort and says how to resolve it', () => {
    const lines = capture({ repeatedRules: [], unsortableLabels: ['UserConfig[0] > vitest/all'] });

    expect(lines).toStrictEqual([
      'strict-lint: shared-config check skipped: 1 config element could not be sorted',
      'strict-lint:   UserConfig[0] > vitest/all',
      'strict-lint: name the config each extends in sharedConfigs',
    ]);
  });
});

// region | Helpers

/** The stderr lines a report writes. */
function capture(report: Parameters<typeof reportRepeatedRules>[0]): string[] {
  const lines: string[] = [];
  vi.spyOn(console, 'error').mockImplementation((line: unknown) => {
    lines.push(String(line));
  });
  reportRepeatedRules(report, 'eslint.config.ts');
  return lines;
}

// endregion | Helpers
