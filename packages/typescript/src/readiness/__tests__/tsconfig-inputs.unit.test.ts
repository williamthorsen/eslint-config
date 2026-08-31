import { describe, expect, it } from 'vitest';

import { buildChainEntry } from '../test-utils/buildChainEntry.ts';
import { judgeInputCoverage } from '../tsconfig-inputs.ts';

const ESLINT_CONFIG = 'eslint.config.ts';

describe(judgeInputCoverage, () => {
  it('is covered when include names the file outright', () => {
    const entries = [buildChainEntry({ config: { include: ['src', 'eslint.config.ts'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'covered' });
  });

  it('is covered by a wildcard matching within the directory', () => {
    const entries = [buildChainEntry({ config: { include: ['src/**/*.ts', '*.ts'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'covered' });
  });

  it('is covered by a recursive wildcard spanning directories', () => {
    const entries = [buildChainEntry({ config: { include: ['**/*'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'covered' });
  });

  it('is covered by a single-character wildcard within the segment', () => {
    const entries = [buildChainEntry({ config: { include: ['eslint.config.?s'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'covered' });
  });

  it('is not covered where a single-character wildcard is one character short', () => {
    const entries = [buildChainEntry({ config: { include: ['eslint.config.?'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'not-enumerated' });
  });

  // An entry naming the config's own directory gathers everything under it.
  it('is covered by an entry naming the judged directory itself', () => {
    const entries = [buildChainEntry({ config: { include: ['.'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'covered' });
  });

  it('is covered when a directory entry contains the file', () => {
    const entries = [buildChainEntry({ config: { include: ['tooling'] } })];

    expect(judgeInputCoverage(entries, 'tooling/eslint.config.ts')).toStrictEqual({ kind: 'covered' });
  });

  it('is covered when files names the file', () => {
    const entries = [buildChainEntry({ config: { files: ['vitest.config.ts', 'eslint.config.ts'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'covered' });
  });

  it('names the enumerating field when the enumeration omits the file', () => {
    const entries = [buildChainEntry({ config: { include: ['src', 'vite.config.ts', 'vitest.config.ts'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({
      kind: 'enumerated-without',
      sites: [{ declaredIn: 'tsconfig.json', field: 'include' }],
    });
  });

  it('names both fields when each enumerates around the file', () => {
    const entries = [buildChainEntry({ config: { files: ['vite.config.ts'], include: ['vitest.config.ts'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({
      kind: 'enumerated-without',
      sites: [
        { declaredIn: 'tsconfig.json', field: 'files' },
        { declaredIn: 'tsconfig.json', field: 'include' },
      ],
    });
  });

  it('names the base config where the base declared the enumeration', () => {
    const entries = [
      buildChainEntry({ config: { compilerOptions: {} } }),
      buildChainEntry({ config: { include: ['vite.config.ts'] }, path: 'tsconfig.base.json' }),
    ];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({
      kind: 'enumerated-without',
      sites: [{ declaredIn: 'tsconfig.base.json', field: 'include' }],
    });
  });

  // TypeScript resolves an inherited path against the config that declared it, not the consumer.
  it('resolves an inherited enumeration against the declaring config directory', () => {
    const entries = [
      buildChainEntry({ path: 'packages/web/tsconfig.json' }),
      buildChainEntry({ config: { include: ['packages/web/vite.config.ts'] }, path: 'tsconfig.json' }),
    ];

    expect(judgeInputCoverage(entries, 'packages/web/eslint.config.ts')).toStrictEqual({
      kind: 'enumerated-without',
      sites: [{ declaredIn: 'tsconfig.json', field: 'include' }],
    });
  });

  // TypeScript rebases a relative inherited path but leaves a rooted one as it stands.
  it('leaves a rooted declared path unrebased', () => {
    const entries = [
      buildChainEntry({ path: 'packages/web/tsconfig.json' }),
      buildChainEntry({ config: { include: ['/srv/generated/vite.config.ts'] }, path: 'tsconfig.base.json' }),
    ];

    expect(judgeInputCoverage(entries, 'packages/web/eslint.config.ts')).toStrictEqual({ kind: 'not-enumerated' });
  });

  it('resolves a configDir-anchored path against the consuming config directory', () => {
    const entries = [
      buildChainEntry({ path: 'packages/web/tsconfig.json' }),
      buildChainEntry({ config: { include: ['${configDir}/*.ts'] }, path: 'tsconfig.base.json' }),
    ];

    expect(judgeInputCoverage(entries, 'packages/web/eslint.config.ts')).toStrictEqual({ kind: 'covered' });
  });

  it('is enumerated-without when exclude withdraws an include match', () => {
    const entries = [
      buildChainEntry({ config: { exclude: ['eslint.config.ts'], include: ['*.ts', 'vite.config.ts'] } }),
    ];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({
      kind: 'enumerated-without',
      sites: [{ declaredIn: 'tsconfig.json', field: 'include' }],
    });
  });

  // `exclude` filters what `include` gathers and never touches what `files` names outright.
  it('is covered when exclude names a file that files also names', () => {
    const entries = [buildChainEntry({ config: { exclude: ['eslint.config.ts'], files: ['eslint.config.ts'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'covered' });
  });

  it('is not enumerated when the chain declares neither field', () => {
    const entries = [buildChainEntry({ config: { compilerOptions: { strict: true } } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'not-enumerated' });
  });

  it('is not enumerated for a solution-style root declaring no inputs', () => {
    const entries = [buildChainEntry({ config: { files: [], references: [{ path: './packages/web' }] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'not-enumerated' });
  });

  it('is not enumerated when the inputs miss the file by directory rather than by name', () => {
    const entries = [buildChainEntry({ config: { include: ['src'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'not-enumerated' });
  });

  // A file enumerated in another directory says nothing about the one holding the eslint config.
  it('is not enumerated when the named TypeScript files are not siblings', () => {
    const entries = [buildChainEntry({ config: { include: ['scripts/build.ts'] } })];

    expect(judgeInputCoverage(entries, ESLINT_CONFIG)).toStrictEqual({ kind: 'not-enumerated' });
  });

  it('is not enumerated for an empty chain', () => {
    expect(judgeInputCoverage([], ESLINT_CONFIG)).toStrictEqual({ kind: 'not-enumerated' });
  });
});
