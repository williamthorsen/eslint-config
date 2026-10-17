import { describe, expect, it } from 'vitest';

import { judgeOffenders } from '../judgeOffenders.ts';

describe(judgeOffenders, () => {
  it('passes when there are no offenders', () => {
    expect(judgeOffenders([], 'found:')).toBe(true);
  });

  it('fails with the label followed by every offender', () => {
    expect(judgeOffenders(['a.js', 'b.js'], 'found:')).toStrictEqual({ ok: false, detail: 'found: a.js, b.js' });
  });

  it('joins the offenders with the given separator', () => {
    expect(judgeOffenders(['a (x)', 'b (y)'], 'omitted:', '; ')).toStrictEqual({
      ok: false,
      detail: 'omitted: a (x); b (y)',
    });
  });
});
