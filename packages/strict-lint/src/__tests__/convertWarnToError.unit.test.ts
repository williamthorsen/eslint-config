import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { convertWarnToError } from '../convertWarnToError.ts';
import Config = Linter.Config;

describe('convertWarnToError()', () => {
  it('if the config has no rules, returns the config', () => {
    const config = {};
    const expected = config;

    const actual = convertWarnToError(config);

    expect(actual).toEqual(expected);
  });

  it('if a rule has a rule level of "warn", replaces "warn" with "error"', () => {
    const config = {
      rules: {
        'other-rule': 'off',
        'warn-rule': 'warn',
      },
    } satisfies Config;
    const expected = {
      rules: {
        'other-rule': 'off',
        'warn-rule': 'error',
      },
    };

    const actual = convertWarnToError(config);

    expect(actual).toEqual(expected);
  });

  it('if a rule has a rule level and options with a level of "warn", replaces "warn" with "error" and preserves the options', () => {
    const config = {
      rules: {
        'other-rule': 'off',
        'warn-rule': ['warn', { option: 'value' }],
      },
    } satisfies Config;
    const expected = {
      rules: {
        'other-rule': 'off',
        'warn-rule': ['error', { option: 'value' }],
      },
    };

    const actual = convertWarnToError(config);

    expect(actual).toEqual(expected);
  });

  it('if maxSeverity maps a rule to "warn", skips escalation for string-form warn', () => {
    const config = {
      rules: {
        'keep-warn': 'warn',
        'escalate-rule': 'warn',
      },
    } satisfies Config;
    const maxSeverity = { 'keep-warn': 'warn' } as const;
    const expected = {
      rules: {
        'keep-warn': 'warn',
        'escalate-rule': 'error',
      },
    };

    const actual = convertWarnToError(config, maxSeverity);

    expect(actual).toEqual(expected);
  });

  it('if maxSeverity maps a rule to "warn", skips escalation for array-form warn', () => {
    const config = {
      rules: {
        'keep-warn': ['warn', { option: 'value' }],
      },
    } satisfies Config;
    const maxSeverity = { 'keep-warn': 'warn' } as const;
    const expected = {
      rules: {
        'keep-warn': ['warn', { option: 'value' }],
      },
    };

    const actual = convertWarnToError(config, maxSeverity);

    expect(actual).toEqual(expected);
  });

  it('if maxSeverity maps a rule to "error", escalation proceeds normally', () => {
    const config = {
      rules: {
        'escalate-rule': 'warn',
      },
    } satisfies Config;
    const maxSeverity = { 'escalate-rule': 'error' } as const;
    const expected = {
      rules: {
        'escalate-rule': 'error',
      },
    };

    const actual = convertWarnToError(config, maxSeverity);

    expect(actual).toEqual(expected);
  });

  it('if maxSeverity maps a rule to "warn" and the rule is already "error", keeps it as "error"', () => {
    const config = {
      rules: {
        'already-error': 'error',
      },
    } satisfies Config;
    const maxSeverity = { 'already-error': 'warn' } as const;
    const expected = {
      rules: {
        'already-error': 'error',
      },
    };

    const actual = convertWarnToError(config, maxSeverity);

    expect(actual).toEqual(expected);
  });

  it('if maxSeverity is not provided, all warn rules are escalated', () => {
    const config = {
      rules: {
        'warn-rule': 'warn',
      },
    } satisfies Config;
    const expected = {
      rules: {
        'warn-rule': 'error',
      },
    };

    const actual = convertWarnToError(config);

    expect(actual).toEqual(expected);
  });
});
