import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { convertWarnToError } from '../convertWarnToError.js';
import FlatConfig = Linter.FlatConfig;

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
    } satisfies FlatConfig;
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
    } satisfies FlatConfig;
    const expected = {
      rules: {
        'other-rule': 'off',
        'warn-rule': ['error', { option: 'value' }],
      },
    };

    const actual = convertWarnToError(config);

    expect(actual).toEqual(expected);
  });
});
