import { afterEach, describe, expect, it } from 'vitest';

import { wrapNativeTsError } from '../wrapNativeTsError.ts';

const original = Object.getOwnPropertyDescriptor(process.features, 'typescript');

describe(wrapNativeTsError, () => {
  afterEach(() => {
    if (original) Object.defineProperty(process.features, 'typescript', original);
  });

  it('wraps ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX with an actionable, path-named message', () => {
    const native = Object.assign(new Error('boom'), { code: 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX' });

    const wrapped = wrapNativeTsError(native, '/proj/eslint.config.ts');

    expect(wrapped).toBeInstanceOf(Error);
    expect(wrapped?.message).toContain('/proj/eslint.config.ts');
    expect(wrapped?.message).toMatch(/erasable|enum|namespace/i);
    expect(wrapped?.cause).toBe(native);
  });

  it('wraps ERR_UNKNOWN_FILE_EXTENSION with the Node >=24 message when type stripping is off', () => {
    disableNativeTypeScript();
    const native = Object.assign(new Error('Unknown file extension ".ts"'), { code: 'ERR_UNKNOWN_FILE_EXTENSION' });

    const wrapped = wrapNativeTsError(native, '/proj/.config/strict-lint.config.ts');

    expect(wrapped?.message).toContain('/proj/.config/strict-lint.config.ts');
    expect(wrapped?.message).toMatch(/Node >=24/);
    expect(wrapped?.cause).toBe(native);
  });

  it('returns undefined for ERR_UNKNOWN_FILE_EXTENSION when type stripping is available', () => {
    const native = Object.assign(new Error('Unknown file extension ".coffee"'), {
      code: 'ERR_UNKNOWN_FILE_EXTENSION',
    });

    expect(wrapNativeTsError(native, '/proj/eslint.config.coffee')).toBeUndefined();
  });

  it('returns undefined for an unrelated error so the caller rethrows it as-is', () => {
    const uncoded = new Error('nope');
    const otherCode = Object.assign(new Error('not found'), { code: 'ERR_MODULE_NOT_FOUND' });

    expect(wrapNativeTsError(uncoded, '/proj/eslint.config.ts')).toBeUndefined();
    expect(wrapNativeTsError(otherCode, '/p/x.ts')).toBeUndefined();
  });
});

// region | Helpers

function disableNativeTypeScript(): void {
  Object.defineProperty(process.features, 'typescript', { value: false, configurable: true, enumerable: true });
}

// endregion | Helpers
