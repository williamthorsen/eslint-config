import { describe, expect, it } from 'vitest';

import { isRecord } from '../isRecord.ts';

describe(isRecord, () => {
  it.each([{ value: {} }, { value: { rules: {} } }, { value: new Date() }])('accepts $value', ({ value }) => {
    expect(isRecord(value)).toBe(true);
  });

  it.each([{ value: null }, { value: undefined }, { value: [] }, { value: 'text' }, { value: 1 }, { value: () => {} }])(
    'rejects $value',
    ({ value }) => {
      expect(isRecord(value)).toBe(false);
    },
  );
});
