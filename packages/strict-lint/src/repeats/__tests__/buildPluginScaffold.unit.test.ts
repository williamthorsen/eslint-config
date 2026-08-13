import type { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { buildPluginScaffold } from '../buildPluginScaffold.ts';

describe(buildPluginScaffold, () => {
  it('strips the rules and keeps every other key', () => {
    const plugin = { rules: {} };
    const element: Linter.Config = {
      files: ['**/*.ts'],
      ignores: ['dist/**'],
      languageOptions: { ecmaVersion: 'latest' },
      linterOptions: { reportUnusedDisableDirectives: 'error' },
      name: 'some-config',
      plugins: { some: plugin },
      rules: { 'some/rule': 'error' },
      settings: { some: { key: 'value' } },
    };

    expect(buildPluginScaffold([element])).toStrictEqual([
      {
        files: ['**/*.ts'],
        ignores: ['dist/**'],
        languageOptions: { ecmaVersion: 'latest' },
        linterOptions: { reportUnusedDisableDirectives: 'error' },
        name: 'some-config',
        plugins: { some: plugin },
        settings: { some: { key: 'value' } },
      },
    ]);
  });

  it('drops an element left with no keys', () => {
    expect(buildPluginScaffold([{ rules: { 'some/rule': 'error' } }])).toStrictEqual([]);
  });

  it('preserves the plugin object by reference, so registering it twice does not conflict', () => {
    const plugin = { rules: {} };

    const [scaffolded] = buildPluginScaffold([{ plugins: { some: plugin }, rules: { 'some/rule': 'error' } }]);

    expect(scaffolded?.plugins?.['some']).toBe(plugin);
  });
});
