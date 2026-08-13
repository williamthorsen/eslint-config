import type { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { sortConfigElements } from '../sortConfigElements.ts';

describe(sortConfigElements, () => {
  it('drops an element the shared config contributed by reference', () => {
    const sharedElement: Linter.Config = { files: ['**/*.ts'], rules: { 'no-eval': 'error' } };

    const sorted = sortConfigElements([sharedElement], [sharedElement]);

    expect(sorted).toStrictEqual({ own: [], unsortable: [] });
  });

  it('drops an expansion whose rules match a shared element by value', () => {
    const rules: Linter.RulesRecord = { 'no-eval': ['error'] };
    const expansion: Linter.Config = { name: 'UserConfig[0] > ExtendedConfig[0][1]', rules: { 'no-eval': ['error'] } };

    const sorted = sortConfigElements([expansion], [{ rules }]);

    expect(sorted).toStrictEqual({ own: [], unsortable: [] });
  });

  it('keeps a consumer literal as the consumer own', () => {
    const literal: Linter.Config = { files: ['**/*.ts'], rules: { 'no-eval': 'error' } };

    const sorted = sortConfigElements([literal], [{ rules: { 'no-alert': 'error' } }]);

    expect(sorted).toStrictEqual({ own: [literal], unsortable: [] });
  });

  it('marks an unmatched expansion unsortable rather than treating it as the consumer own', () => {
    const expansion: Linter.Config = {
      name: 'UserConfig[0] > vitest/all',
      rules: { 'vitest/no-focused-tests': 'off' },
    };

    const sorted = sortConfigElements([expansion], []);

    expect(sorted).toStrictEqual({ own: [], unsortable: [expansion] });
  });

  it('treats a consumer-chosen name carrying no expansion separator as the consumer own', () => {
    const named: Linter.Config = { name: 'my-overrides', rules: { 'no-eval': 'error' } };

    const sorted = sortConfigElements([named], []);

    expect(sorted).toStrictEqual({ own: [named], unsortable: [] });
  });

  it('drops an element that sets no rule, whichever side it came from', () => {
    const ignores: Linter.Config = { ignores: ['dist/**'] };
    const languageOnly: Linter.Config = { files: ['**/*.ts'], languageOptions: { ecmaVersion: 'latest' } };

    const sorted = sortConfigElements([ignores, languageOnly], []);

    expect(sorted).toStrictEqual({ own: [], unsortable: [] });
  });

  it('preserves the consumer order, which decides which setting wins on the consumer side', () => {
    const first: Linter.Config = { rules: { 'no-eval': 'off' } };
    const second: Linter.Config = { rules: { 'no-eval': 'error' } };

    const sorted = sortConfigElements([first, second], []);

    expect(sorted.own).toStrictEqual([first, second]);
  });
});
