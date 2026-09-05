import { describe, expect, it } from 'vitest';

import { codeExtensions } from '../../patterns.ts';
import importConfig from '../import.ts';

// The setting spells the same list as `patterns.codeExtensions` in another form, and nothing reports a
// divergence: an extension the patterns lint but the setting omits leaves `import-x/no-cycle` walking a
// graph it will not open, which reports nothing rather than failing.

describe('the extensions the import config settings name', () => {
  it('match the extensions its file patterns cover', () => {
    const covered = codeExtensions.flatMap(expandBraceGroup).toSorted();

    expect(listConfiguredExtensions().toSorted()).toStrictEqual(covered);
  });
});

// region | Helpers

/** Expands a glob brace group such as `{js,cjs}` into the dotted extensions it covers. */
function expandBraceGroup(group: string): string[] {
  return group
    .replaceAll(/^\{|\}$/g, '')
    .split(',')
    .map((extension) => `.${extension}`);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((element) => typeof element === 'string');
}

/** Collects the extensions the config's `import-x/extensions` setting names, empty where no block sets it. */
function listConfiguredExtensions(): string[] {
  for (const block of importConfig) {
    const configured = block.settings?.['import-x/extensions'];

    if (isStringArray(configured)) {
      return configured;
    }
  }

  return [];
}

// endregion | Helpers
