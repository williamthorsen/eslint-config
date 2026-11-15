import { describe, expect, it } from 'vitest';

import { readConfigRules } from '../readConfigRules.ts';

describe(readConfigRules, () => {
  it('returns the rules of the named config', () => {
    const rules = { 'demo/rule': 'error', 'demo/other': ['warn', { option: true }] };
    const plugin = { configs: { recommended: { rules } } };

    expect(readConfigRules(plugin, 'recommended')).toBe(rules);
  });

  it('throws naming the config when the config is missing', () => {
    const plugin = { configs: { other: { rules: {} } } };

    expect(() => readConfigRules(plugin, 'recommended')).toThrow(/"recommended"/);
  });

  it('throws naming the config when the plugin is not an object', () => {
    expect(() => readConfigRules(undefined, 'recommended')).toThrow(/"recommended"/);
  });

  it('throws naming the config when the config has no rules', () => {
    const plugin = { configs: { recommended: { plugins: ['demo'] } } };

    expect(() => readConfigRules(plugin, 'recommended')).toThrow(/"recommended" does not contain a rules object/);
  });

  it('throws when the rules are an array', () => {
    const plugin = { configs: { recommended: { rules: ['error'] } } };

    expect(() => readConfigRules(plugin, 'recommended')).toThrow(/"recommended" does not contain a rules object/);
  });

  it('throws when a rule entry has no valid severity', () => {
    const plugin = { configs: { recommended: { rules: { 'demo/rule': 'loud' } } } };

    expect(() => readConfigRules(plugin, 'recommended')).toThrow(/"recommended" does not contain a rules object/);
  });
});
