import { describe, expect, it } from 'vitest';

import { skipBelowTypeScriptConfigSupport } from '../skipBelowTypeScriptConfigSupport.ts';

describe(skipBelowTypeScriptConfigSupport, () => {
  it('does not skip at or above eslint 10', () => {
    expect(skipBelowTypeScriptConfigSupport('10.0.0')).toBe(false);
    expect(skipBelowTypeScriptConfigSupport('10.3.1')).toBe(false);
  });

  it('skips below eslint 10', () => {
    expect(skipBelowTypeScriptConfigSupport('9.39.1')).toBe(
      'eslint is below 10, which cannot load a TypeScript eslint config',
    );
  });

  it('skips when eslint is not installed', () => {
    expect(skipBelowTypeScriptConfigSupport(undefined)).toBe('eslint is not installed');
  });
});
