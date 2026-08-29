import { describe, expect, it } from 'vitest';

import { findEscapingPaths } from '../findEscapingPaths.ts';
import { buildChainEntry } from '../test-utils/buildChainEntry.ts';

const API_CONFIG = 'packages/api/tsconfig.json';
const ROOT_CONFIG = 'tsconfig.json';

describe(findEscapingPaths, () => {
  it('reports an inherited path resolved outside the consumer, naming the config that declared it', () => {
    const entries = [
      buildChainEntry({ path: API_CONFIG }),
      buildChainEntry({ config: { exclude: ['node_modules'] }, path: ROOT_CONFIG, specifier: '../../tsconfig.json' }),
    ];

    expect(findEscapingPaths(entries)).toStrictEqual([
      { declaredIn: ROOT_CONFIG, field: 'exclude', path: '../../node_modules' },
    ]);
  });

  it("reports a config's own declaration naming a path outside its directory", () => {
    const entries = [buildChainEntry({ config: { include: ['src/', '../shared/src'] }, path: API_CONFIG })];

    expect(findEscapingPaths(entries)).toStrictEqual([
      { declaredIn: API_CONFIG, field: 'include', path: '../shared/src' },
    ]);
  });

  it('reports an absolute path, which TypeScript leaves un-rebased', () => {
    const entries = [buildChainEntry({ config: { files: ['/opt/shared/globals.d.ts'] }, path: API_CONFIG })];

    expect(findEscapingPaths(entries)).toStrictEqual([
      { declaredIn: API_CONFIG, field: 'files', path: '/opt/shared/globals.d.ts' },
    ]);
  });

  it('reports a Windows-rooted path with its separators normalized', () => {
    const entries = [buildChainEntry({ config: { files: [String.raw`C:\shared\globals.d.ts`] }, path: API_CONFIG })];

    expect(findEscapingPaths(entries)).toStrictEqual([
      { declaredIn: API_CONFIG, field: 'files', path: 'C:/shared/globals.d.ts' },
    ]);
  });

  it('reads a backslash as a separator, as TypeScript does on every platform', () => {
    const entries = [buildChainEntry({ config: { include: [String.raw`..\shared\src`] }, path: API_CONFIG })];

    expect(findEscapingPaths(entries)).toStrictEqual([
      { declaredIn: API_CONFIG, field: 'include', path: '../shared/src' },
    ]);
  });

  it('resolves against a declaring config several hops up the chain', () => {
    const entries = [
      buildChainEntry({ path: API_CONFIG }),
      buildChainEntry({ path: 'packages/tsconfig.shared.json', specifier: '../tsconfig.shared.json' }),
      buildChainEntry({ config: { exclude: ['node_modules'] }, path: ROOT_CONFIG, specifier: '../tsconfig.json' }),
    ];

    expect(findEscapingPaths(entries)).toStrictEqual([
      { declaredIn: ROOT_CONFIG, field: 'exclude', path: '../../node_modules' },
    ]);
  });

  it('reports every offending field, ordered exclude, files, include', () => {
    const entries = [
      buildChainEntry({ path: API_CONFIG }),
      buildChainEntry({
        config: { exclude: ['node_modules'], files: ['globals.d.ts'], include: ['src/'] },
        path: ROOT_CONFIG,
        specifier: '../../tsconfig.json',
      }),
    ];

    expect(findEscapingPaths(entries).map((escaping) => escaping.field)).toStrictEqual(['exclude', 'files', 'include']);
  });

  it('leaves a self-directed declaration alone, including one that other configs extend', () => {
    const entries = [buildChainEntry({ config: { include: ['packages/*/types/', 'scripts/'] }, path: ROOT_CONFIG })];

    expect(findEscapingPaths(entries)).toStrictEqual([]);
  });

  it('leaves a path alone that normalizes back inside the directory', () => {
    const entries = [buildChainEntry({ config: { include: ['../api/src'] }, path: API_CONFIG })];

    expect(findEscapingPaths(entries)).toStrictEqual([]);
  });

  it('leaves an inherited path alone where the declaring config uses ${configDir}', () => {
    const entries = [
      buildChainEntry({ path: API_CONFIG }),
      buildChainEntry({
        config: { exclude: ['${configDir}/node_modules'], include: ['${configDir}/src'] },
        path: 'node_modules/astro/tsconfigs/base.json',
        specifier: 'astro/tsconfigs/base',
      }),
    ];

    expect(findEscapingPaths(entries)).toStrictEqual([]);
  });

  it('matches the ${configDir} prefix without regard to case, as TypeScript does', () => {
    const entries = [
      buildChainEntry({ path: API_CONFIG }),
      buildChainEntry({
        config: { include: ['${ConfigDir}/src'] },
        path: 'node_modules/astro/tsconfigs/base.json',
        specifier: 'astro/tsconfigs/base',
      }),
    ];

    expect(findEscapingPaths(entries)).toStrictEqual([]);
  });

  it('reports a ${configDir} path that leaves the consumer directory anyway', () => {
    const entries = [
      buildChainEntry({ path: API_CONFIG }),
      buildChainEntry({
        config: { include: ['${configDir}/../shared'] },
        path: ROOT_CONFIG,
        specifier: '../../tsconfig.json',
      }),
    ];

    expect(findEscapingPaths(entries)).toStrictEqual([
      { declaredIn: ROOT_CONFIG, field: 'include', path: '../shared' },
    ]);
  });

  it('leaves the base alone for a field the consumer declares itself', () => {
    const entries = [
      buildChainEntry({ config: { exclude: ['dist/'] }, path: API_CONFIG }),
      buildChainEntry({ config: { exclude: ['node_modules'] }, path: ROOT_CONFIG, specifier: '../../tsconfig.json' }),
    ];

    expect(findEscapingPaths(entries)).toStrictEqual([]);
  });

  // An empty array is truthy, which is how TypeScript reads it too.
  it('treats an empty declaration as a declaration, so the field inherits nothing', () => {
    const entries = [
      buildChainEntry({ config: { files: [] }, path: API_CONFIG }),
      buildChainEntry({ config: { files: ['globals.d.ts'] }, path: ROOT_CONFIG, specifier: '../../tsconfig.json' }),
    ];

    expect(findEscapingPaths(entries)).toStrictEqual([]);
  });

  // A string is truthy, so it declares the field as an empty array does, and carries no paths to judge.
  it('treats a malformed declaration as a declaration, so the field inherits nothing', () => {
    const entries = [
      buildChainEntry({ config: { include: 'src/' }, path: API_CONFIG }),
      buildChainEntry({
        config: { include: ['../shared/src'] },
        path: ROOT_CONFIG,
        specifier: '../../tsconfig.json',
      }),
    ];

    expect(findEscapingPaths(entries)).toStrictEqual([]);
  });

  it('returns nothing for a chain with no entries', () => {
    expect(findEscapingPaths([])).toStrictEqual([]);
  });
});
