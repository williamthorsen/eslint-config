import { afterEach, describe, expect, it } from 'vitest';

import { importConfigModule, wrapNativeTsSyntaxError } from '../importConfigModule.ts';

describe(importConfigModule, () => {
  const original = Object.getOwnPropertyDescriptor(process.features, 'typescript');

  afterEach(() => {
    if (original) Object.defineProperty(process.features, 'typescript', original);
  });

  function disableNativeTypeScript(): void {
    Object.defineProperty(process.features, 'typescript', { value: false, configurable: true, enumerable: true });
  }

  it('rejects a TypeScript config with a Node >=24 message when native TS support is absent', async () => {
    disableNativeTypeScript();

    await expect(importConfigModule('/proj/eslint.config.ts')).rejects.toThrow(/Node >=24/);
  });

  it('does not apply the TS guard to a JavaScript config', async () => {
    disableNativeTypeScript();

    let error: unknown;
    try {
      await importConfigModule('/proj/does-not-exist.js');
    } catch (error_: unknown) {
      error = error_;
    }

    // A `.js` import is not gated on native TS support; it fails on the missing file instead.
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).not.toContain('Node >=24');
    }
  });
});

describe(wrapNativeTsSyntaxError, () => {
  it('wraps ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX with an actionable, path-named message', () => {
    const native = Object.assign(new Error('boom'), { code: 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX' });

    const wrapped = wrapNativeTsSyntaxError(native, '/proj/eslint.config.ts');

    expect(wrapped).toBeInstanceOf(Error);
    expect(wrapped?.message).toContain('/proj/eslint.config.ts');
    expect(wrapped?.message).toMatch(/erasable|enum|namespace/i);
    expect(wrapped?.cause).toBe(native);
  });

  it('returns undefined for an unrelated error so the caller rethrows it as-is', () => {
    const uncoded = new Error('nope');
    const otherCode = Object.assign(new Error('not found'), { code: 'ERR_MODULE_NOT_FOUND' });

    expect(wrapNativeTsSyntaxError(uncoded, '/proj/eslint.config.ts')).toBeUndefined();
    expect(wrapNativeTsSyntaxError(otherCode, '/p/x.ts')).toBeUndefined();
  });
});
