import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCeilingResolver } from '../createCeilingResolver.ts';
import type { StrictLintConfig } from '../types.ts';

const { mockedLoadStrictLintConfigs } = vi.hoisted(() => ({
  mockedLoadStrictLintConfigs: vi.fn(),
}));

vi.mock('../loadStrictLintConfigs.ts', () => ({
  loadStrictLintConfigs: mockedLoadStrictLintConfigs,
}));

describe(createCeilingResolver, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withCascade();
  });

  it('walks from the directory of the linted file, not the working directory', async () => {
    const resolver = createCeilingResolver();

    await resolver.resolveFor('/project/packages/pkg/src/a.ts');

    expect(mockedLoadStrictLintConfigs).toHaveBeenCalledWith('/project/packages/pkg/src');
  });

  it('applies no ceilings when the cascade collected no config', async () => {
    const resolver = createCeilingResolver();

    await expect(resolver.resolveFor('/project/a.ts')).resolves.toStrictEqual({});
  });

  it('applies the ceilings of the only config in the cascade', async () => {
    withCascade({ maxSeverity: { 'some-rule': 'warn' } });
    const resolver = createCeilingResolver();

    await expect(resolver.resolveFor('/project/a.ts')).resolves.toStrictEqual({ 'some-rule': 'warn' });
  });

  it('keeps an entry of a farther config that the nearer one does not mention', async () => {
    withCascade({ maxSeverity: { 'nearer-rule': 'warn' } }, { maxSeverity: { 'farther-rule': 'warn' } });
    const resolver = createCeilingResolver();

    await expect(resolver.resolveFor('/project/a.ts')).resolves.toStrictEqual({
      'farther-rule': 'warn',
      'nearer-rule': 'warn',
    });
  });

  it('lets a nearer config drop an inherited ceiling by promoting it to error', async () => {
    withCascade({ maxSeverity: { 'shared-rule': 'error' } }, { maxSeverity: { 'shared-rule': 'warn' } });
    const resolver = createCeilingResolver();

    await expect(resolver.resolveFor('/project/a.ts')).resolves.toStrictEqual({ 'shared-rule': 'error' });
  });

  it('lets programmatic overrides outrank every config in the cascade', async () => {
    withCascade({ maxSeverity: { 'some-rule': 'error' } }, { maxSeverity: { 'some-rule': 'warn' } });
    const resolver = createCeilingResolver({ 'some-rule': 'warn' });

    await expect(resolver.resolveFor('/project/a.ts')).resolves.toStrictEqual({ 'some-rule': 'warn' });
  });

  it('walks once for two files sharing a directory', async () => {
    const resolver = createCeilingResolver();

    await resolver.resolveFor('/project/src/a.ts');
    await resolver.resolveFor('/project/src/b.ts');

    expect(mockedLoadStrictLintConfigs).toHaveBeenCalledTimes(1);
  });

  it('walks once per directory for files in sibling directories', async () => {
    const resolver = createCeilingResolver();

    await resolver.resolveFor('/project/one/a.ts');
    await resolver.resolveFor('/project/two/a.ts');

    expect(mockedLoadStrictLintConfigs).toHaveBeenCalledTimes(2);
  });

  it('shares one walk between lookups that overlap in flight', async () => {
    const resolver = createCeilingResolver();

    // Both lookups start before either resolves, which is the case a result-keyed memo would miss.
    await Promise.all([resolver.resolveFor('/project/src/a.ts'), resolver.resolveFor('/project/src/b.ts')]);

    expect(mockedLoadStrictLintConfigs).toHaveBeenCalledTimes(1);
  });

  it('resolves ceilings independently for files under different configs', async () => {
    mockedLoadStrictLintConfigs.mockImplementation((dir: string) =>
      Promise.resolve(
        cascadeOf([{ maxSeverity: dir === '/project/one' ? { 'rule-one': 'warn' } : { 'rule-two': 'warn' } }]),
      ),
    );
    const resolver = createCeilingResolver();

    await expect(resolver.resolveFor('/project/one/a.ts')).resolves.toStrictEqual({ 'rule-one': 'warn' });
    await expect(resolver.resolveFor('/project/two/a.ts')).resolves.toStrictEqual({ 'rule-two': 'warn' });
  });

  it('retains each walked cascade, keyed by the directory that produced it', async () => {
    const resolver = createCeilingResolver();

    await resolver.resolveFor('/project/one/a.ts');
    await resolver.resolveFor('/project/two/a.ts');

    expect(resolver.getCascades().keys().toArray()).toStrictEqual(['/project/one', '/project/two']);
  });
});

// region | Helpers

/** Make the mocked loader resolve with one cascade entry per config, given nearest first. */
function withCascade(...configs: StrictLintConfig[]): void {
  mockedLoadStrictLintConfigs.mockResolvedValue(cascadeOf(configs));
}

/** A cascade carrying one entry per config, nearest first, bounded by a marker-identified project root. */
function cascadeOf(configs: StrictLintConfig[]) {
  return {
    entries: configs.map((config, index) => ({
      config,
      dir: `/project/level-${String(index)}`,
      filePath: `/project/level-${String(index)}/.config/strict-lint.config.ts`,
    })),
    projectRoot: { marker: 'pnpm-workspace.yaml', rootDir: '/project', source: 'marker' },
    stopReason: 'project-root',
  };
}

// endregion | Helpers
