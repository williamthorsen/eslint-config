import { describe, expect, it } from 'vitest';

import * as configsEntry from '../configs/index.ts';
import * as rootEntry from '../index.ts';

// Both entry points are barrels, so nothing inside the package imports through them and a dropped or
// renamed re-export would break only a consumer. These assertions stand in for the consumer.

describe('root entry point', () => {
  it('exports the documented surface', () => {
    expect(Object.keys(rootEntry).toSorted()).toStrictEqual([
      'advisoryRuleSeverities',
      'configs',
      'createConfig',
      'default',
      'patterns',
    ]);
  });

  it('exports the base config as an array of config blocks', () => {
    expect(rootEntry.default.length).toBeGreaterThan(0);
  });
});

describe('configs entry point', () => {
  it('exports the documented surface', () => {
    expect(Object.keys(configsEntry).toSorted()).toStrictEqual(['configs', 'createConfig', 'default']);
  });

  // A type export is erased at runtime, so naming it here is what keeps it reachable from the barrel.
  it('exports the config-name union alongside the map it keys', () => {
    const name: configsEntry.ConfigName = 'typeScript';

    expect(Object.keys(configsEntry.configs)).toContain(name);
  });

  it('exports the same config map as both a named and the default export', () => {
    expect(configsEntry.default).toBe(configsEntry.configs);
  });

  it('exports the same config map and factories as the root entry point', () => {
    expect(configsEntry.configs).toBe(rootEntry.configs);
    expect(configsEntry.createConfig).toBe(rootEntry.createConfig);
  });
});

// A factory dropped from the map takes its config off the published surface without failing anything else,
// because each one is reached by key rather than by import.
describe('createConfig factories', () => {
  it('exposes one factory per opt-in config', () => {
    expect(Object.keys(rootEntry.createConfig).toSorted()).toStrictEqual([
      'jsxA11y',
      'next',
      'react',
      'reactTestingLibrary',
      'vitest',
    ]);
  });
});
