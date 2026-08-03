import type { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { convertWarnToError } from '../convertWarnToError.ts';

type Config = Linter.Config;

describe(convertWarnToError, () => {
  it('if the config has no rules, returns the config', () => {
    const config = {};
    const expected = config;

    const actual = convertWarnToError(config);

    expect(actual).toStrictEqual(expected);
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

    expect(actual).toStrictEqual(expected);
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

    expect(actual).toStrictEqual(expected);
  });

  it('if a rule has a bare numeric severity of 1, replaces it with "error"', () => {
    const config = {
      rules: {
        'other-rule': 'off',
        'warn-rule': 1,
      },
    } satisfies Config;
    const expected = {
      rules: {
        'other-rule': 'off',
        'warn-rule': 'error',
      },
    };

    const actual = convertWarnToError(config);

    expect(actual).toStrictEqual(expected);
  });

  it('if a rule has an array-form numeric severity of 1, replaces it with "error" and preserves options', () => {
    const config = {
      rules: {
        'other-rule': 'off',
        'warn-rule': [1, { option: 'value' }],
      },
    } satisfies Config;
    const expected = {
      rules: {
        'other-rule': 'off',
        'warn-rule': ['error', { option: 'value' }],
      },
    };

    const actual = convertWarnToError(config);

    expect(actual).toStrictEqual(expected);
  });

  it('if a rule has a bare numeric severity of 2, leaves it unchanged', () => {
    const config = {
      rules: {
        'error-rule': 2,
      },
    } satisfies Config;
    const expected = {
      rules: {
        'error-rule': 2,
      },
    };

    const actual = convertWarnToError(config);

    expect(actual).toStrictEqual(expected);
  });

  it('if a rule has an array-form numeric severity of 2, leaves it unchanged', () => {
    const config = {
      rules: {
        'error-rule': [2, { option: 'value' }],
      },
    } satisfies Config;
    const expected = {
      rules: {
        'error-rule': [2, { option: 'value' }],
      },
    };

    const actual = convertWarnToError(config);

    expect(actual).toStrictEqual(expected);
  });

  it('if maxSeverity maps a rule to "warn", skips escalation for numeric 1', () => {
    const config = {
      rules: {
        'keep-warn': 1,
        'escalate-rule': 1,
      },
    } satisfies Config;
    const maxSeverity = { 'keep-warn': 'warn' } as const;
    const expected = {
      rules: {
        'keep-warn': 1,
        'escalate-rule': 'error',
      },
    };

    const actual = convertWarnToError(config, maxSeverity);

    expect(actual).toStrictEqual(expected);
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

    expect(actual).toStrictEqual(expected);
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

    expect(actual).toStrictEqual(expected);
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

    expect(actual).toStrictEqual(expected);
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

    expect(actual).toStrictEqual(expected);
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

    expect(actual).toStrictEqual(expected);
  });

  describe('the full severity vocabulary as a ceiling', () => {
    const warnForms: Array<{ form: string; ruleValue: Linter.RuleEntry; promoted: Linter.RuleEntry }> = [
      { form: 'string-form', ruleValue: 'warn', promoted: 'error' },
      { form: 'numeric-form', ruleValue: 1, promoted: 'error' },
      { form: 'array-form', ruleValue: ['warn', { option: 'value' }], promoted: ['error', { option: 'value' }] },
    ];
    const blockingCeilings: Array<Linter.RuleSeverity> = ['off', 0, 'warn', 1];
    const promotingCeilings: Array<Linter.RuleSeverity | undefined> = ['error', 2, undefined];

    const withEachForm = <T>(ceilings: T[]): Array<{ ceiling: T } & (typeof warnForms)[number]> =>
      ceilings.flatMap((ceiling) => warnForms.map((warnForm) => ({ ceiling, ...warnForm })));

    it.each(withEachForm(blockingCeilings))(
      'if the ceiling is $ceiling, leaves a $form warn rule unchanged',
      ({ ceiling, ruleValue }) => {
        const config: Config = { rules: { 'some-rule': ruleValue } };

        const actual = convertWarnToError(config, { 'some-rule': ceiling });

        expect(actual.rules).toStrictEqual({ 'some-rule': ruleValue });
      },
    );

    it.each(withEachForm(promotingCeilings))(
      'if the ceiling is $ceiling, escalates a $form warn rule',
      ({ ceiling, promoted, ruleValue }) => {
        const config: Config = { rules: { 'some-rule': ruleValue } };

        const actual = convertWarnToError(config, { 'some-rule': ceiling });

        expect(actual.rules).toStrictEqual({ 'some-rule': promoted });
      },
    );

    it.each([...blockingCeilings, ...promotingCeilings])(
      'if the ceiling is %o, leaves an error-configured rule at error',
      (ceiling) => {
        const config: Config = { rules: { 'some-rule': 'error' } };

        const actual = convertWarnToError(config, { 'some-rule': ceiling });

        expect(actual.rules).toStrictEqual({ 'some-rule': 'error' });
      },
    );
  });
});
