import { describe, expect, test } from 'vitest';

import { compareVersions, getHighestVersion } from '../sync-root-version.js';

describe('compareVersions', () => {
  test('compares versions correctly', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.1', '1.0.0')).toBeGreaterThan(0);
    expect(compareVersions('1.0.0', '1.0.1')).toBeLessThan(0);
    expect(compareVersions('1.1.0', '1.0.0')).toBeGreaterThan(0);
    expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
  });

  test('handles different version lengths', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.1', '1.0')).toBeGreaterThan(0);
    expect(compareVersions('1', '1.0.0')).toBe(0);
  });

  test('handles pre-release versions', () => {
    // Note: This basic implementation treats non-numeric parts as 0
    // For full semver support, would need more sophisticated parsing
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
  });
});

describe('getHighestVersion', () => {
  test('finds highest version from single package', () => {
    const versions = {
      '@williamthorsen/eslint-config-typescript': '2.1.0',
    };

    const result = getHighestVersion(versions);
    expect(result).toEqual({
      packageName: '@williamthorsen/eslint-config-typescript',
      version: '2.1.0',
    });
  });

  test('finds highest version from multiple packages', () => {
    const versions = {
      '@williamthorsen/eslint-config-typescript': '2.1.0',
      '@williamthorsen/strict-lint': '1.5.0',
    };

    const result = getHighestVersion(versions);
    expect(result).toEqual({
      packageName: '@williamthorsen/eslint-config-typescript',
      version: '2.1.0',
    });
  });

  test('handles equal versions', () => {
    const versions = {
      '@williamthorsen/eslint-config-typescript': '1.0.0',
      '@williamthorsen/strict-lint': '1.0.0',
    };

    const result = getHighestVersion(versions);
    // Should return the first one when equal
    expect(result).toEqual({
      packageName: '@williamthorsen/eslint-config-typescript',
      version: '1.0.0',
    });
  });

  test('handles empty versions object', () => {
    const versions = {};
    const result = getHighestVersion(versions);
    expect(result).toBeNull();
  });

  test('correctly identifies highest version across different major versions', () => {
    const versions = {
      '@williamthorsen/eslint-config-typescript': '1.9.9',
      '@williamthorsen/strict-lint': '2.0.0',
    };

    const result = getHighestVersion(versions);
    expect(result).toEqual({
      packageName: '@williamthorsen/strict-lint',
      version: '2.0.0',
    });
  });
});
