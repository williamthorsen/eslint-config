import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import { describe, expect, it } from 'vitest';

import { findRepeatedRules } from '../findRepeatedRules.ts';

// Both sides are built in memory and the paths need not exist: `calculateConfigForFile` matches a path against the
// config's globs rather than reading the file, so the comparison runs without a fixture config on disk.
const FILE_PATHS = ['src/example.ts'];

// The second rule keeps each shared element's `rules` distinct from a consumer's one-rule repeat, since the sorter
// compares `rules` by value.
const SHARED_CORE: Linter.Config[] = [{ files: ['**/*.ts'], rules: { 'no-alert': 'error', 'no-eval': 'error' } }];

describe(findRepeatedRules, () => {
  it('reports a rule that the consumer sets to the value already resolved by the shared config', async () => {
    const report = await compare(SHARED_CORE, [...SHARED_CORE, { files: ['**/*.ts'], rules: { 'no-eval': 'error' } }]);

    expect(report.repeatedRules).toStrictEqual([{ fileCount: 1, ruleId: 'no-eval' }]);
  });

  it('reports a repeat written in a different severity form', async () => {
    const report = await compare(SHARED_CORE, [...SHARED_CORE, { files: ['**/*.ts'], rules: { 'no-eval': 2 } }]);

    expect(report.repeatedRules).toStrictEqual([{ fileCount: 1, ruleId: 'no-eval' }]);
  });

  it('passes over an override that lowers the severity', async () => {
    const report = await compare(SHARED_CORE, [...SHARED_CORE, { files: ['**/*.ts'], rules: { 'no-eval': 'warn' } }]);

    expect(report.repeatedRules).toStrictEqual([]);
  });

  it('passes over an override that changes only the options', async () => {
    const shared: Linter.Config[] = [
      { files: ['**/*.ts'], rules: { 'no-alert': 'error', 'no-console': ['error', { allow: ['warn'] }] } },
    ];
    const consumer: Linter.Config[] = [
      ...shared,
      { files: ['**/*.ts'], rules: { 'no-console': ['error', { allow: ['error'] }] } },
    ];

    const report = await compare(shared, consumer);

    expect(report.repeatedRules).toStrictEqual([]);
  });

  it('passes over a rule that the shared config never sets', async () => {
    const report = await compare(SHARED_CORE, [
      ...SHARED_CORE,
      { files: ['**/*.ts'], rules: { 'no-debugger': 'error' } },
    ]);

    expect(report.repeatedRules).toStrictEqual([]);
  });

  it('passes over a rule that the shared config sets only for other files', async () => {
    const shared: Linter.Config[] = [{ files: ['**/*.js'], rules: { 'no-alert': 'error', 'no-eval': 'error' } }];
    const consumer: Linter.Config[] = [...shared, { files: ['**/*.ts'], rules: { 'no-eval': 'error' } }];

    const report = await compare(shared, consumer);

    expect(report.repeatedRules).toStrictEqual([]);
  });

  it('resolves a rule whose plugin only the shared side registers', async () => {
    const plugin = { rules: { 'no-widgets': { create: () => ({}) } } };
    const shared: Linter.Config[] = [
      { files: ['**/*.ts'], plugins: { some: plugin }, rules: { 'no-alert': 'error', 'some/no-widgets': 'error' } },
    ];
    const consumer: Linter.Config[] = [...shared, { files: ['**/*.ts'], rules: { 'some/no-widgets': 'error' } }];

    const report = await compare(shared, consumer);

    expect(report.repeatedRules).toStrictEqual([{ fileCount: 1, ruleId: 'some/no-widgets' }]);
  });

  it('passes over a rule that repeats on only some of the files for which the consumer sets it', async () => {
    // The narrow entry restores what the broad one turned off, so it matches the shared value on `src/bin/cli.ts`
    // alone. Neither entry is removable, and reporting the rule would name a necessary one.
    const shared: Linter.Config[] = [{ files: ['**/*.ts'], rules: { 'no-alert': 'error', 'no-console': 'error' } }];
    const consumer: Linter.Config[] = [
      ...shared,
      { files: ['**/*.ts'], rules: { 'no-console': 'off' } },
      { files: ['src/bin/**/*.ts'], rules: { 'no-console': 'error' } },
    ];

    const report = await findRepeatedRules({
      consumerElements: consumer,
      cwd: process.cwd(),
      filePaths: ['src/app.ts', 'src/lib.ts', 'src/bin/cli.ts'],
      sharedElements: shared,
    });

    expect(report.repeatedRules).toStrictEqual([]);
  });

  it('passes over a rule that the consumer gives two values, even when the run lints one scope alone', async () => {
    // Because linting only `src/bin` makes the narrow entry the only one that the run sees, the file counts agree; the
    // broad entry still governs everything else, and both stay necessary.
    const shared: Linter.Config[] = [{ files: ['**/*.ts'], rules: { 'no-alert': 'error', 'no-console': 'error' } }];
    const consumer: Linter.Config[] = [
      ...shared,
      { files: ['**/*.ts'], rules: { 'no-console': 'off' } },
      { files: ['src/bin/**/*.ts'], rules: { 'no-console': 'error' } },
    ];

    const report = await findRepeatedRules({
      consumerElements: consumer,
      cwd: process.cwd(),
      filePaths: ['src/bin/cli.ts'],
      sharedElements: shared,
    });

    expect(report.repeatedRules).toStrictEqual([]);
  });

  it('reports a rule set by the consumer at two disjoint scopes to one value', async () => {
    const shared: Linter.Config[] = [{ files: ['**/*.ts'], rules: { 'no-alert': 'error', 'no-eval': 'error' } }];
    const consumer: Linter.Config[] = [
      ...shared,
      { files: ['src/**/*.ts'], rules: { 'no-eval': 'error' } },
      { files: ['test/**/*.ts'], rules: { 'no-eval': 'error' } },
    ];

    const report = await findRepeatedRules({
      consumerElements: consumer,
      cwd: process.cwd(),
      filePaths: ['src/app.ts', 'test/app.ts'],
      sharedElements: shared,
    });

    expect(report.repeatedRules).toStrictEqual([{ fileCount: 2, ruleId: 'no-eval' }]);
  });

  it('reports a rule set by the consumer at two disjoint scopes in two severity forms', async () => {
    const shared: Linter.Config[] = [{ files: ['**/*.ts'], rules: { 'no-alert': 'error', 'no-eval': 'error' } }];
    const consumer: Linter.Config[] = [
      ...shared,
      { files: ['src/**/*.ts'], rules: { 'no-eval': 'error' } },
      { files: ['test/**/*.ts'], rules: { 'no-eval': ['error'] } },
    ];

    const report = await findRepeatedRules({
      consumerElements: consumer,
      cwd: process.cwd(),
      filePaths: ['src/app.ts', 'test/app.ts'],
      sharedElements: shared,
    });

    expect(report.repeatedRules).toStrictEqual([{ fileCount: 2, ruleId: 'no-eval' }]);
  });

  it('reports a rule that repeats on every file for which the consumer sets it', async () => {
    const shared: Linter.Config[] = [{ files: ['**/*.ts'], rules: { 'no-alert': 'error', 'no-console': 'error' } }];
    const consumer: Linter.Config[] = [...shared, { files: ['src/bin/**/*.ts'], rules: { 'no-console': 'error' } }];

    const report = await findRepeatedRules({
      consumerElements: consumer,
      cwd: process.cwd(),
      filePaths: ['src/app.ts', 'src/lib.ts', 'src/bin/cli.ts'],
      sharedElements: shared,
    });

    expect(report.repeatedRules).toStrictEqual([{ fileCount: 1, ruleId: 'no-console' }]);
  });

  it('reports a repeat that a consumer literal narrows to a subset of the shared scope', async () => {
    const shared: Linter.Config[] = [{ files: ['**/*.ts'], rules: { 'no-eval': 'error' } }];
    const consumer: Linter.Config[] = [...shared, { files: ['src/**/*.ts'], rules: { 'no-eval': 'error' } }];

    const report = await compare(shared, consumer);

    expect(report.repeatedRules).toStrictEqual([{ fileCount: 1, ruleId: 'no-eval' }]);
  });

  describe('an extends expansion', () => {
    // `defineConfig` rebuilds what it reaches through `extends`, so these cases run against a real expansion rather
    // than a hand-written label: A change to the format upstream fails this suite instead of silently degrading the
    // sort.
    const extended: Linter.Config[] = [{ rules: { 'no-alert': 'error', 'no-eval': 'error' } }];
    const consumer = defineConfig([{ files: ['**/*.ts'], extends: [extended] }, { rules: { 'no-eval': 'error' } }]);

    it('is attributed to the shared config when the consumer declares what it extends', async () => {
      const report = await compare(extended, consumer);

      expect(report).toStrictEqual({ repeatedRules: [{ fileCount: 1, ruleId: 'no-eval' }], unsortableLabels: [] });
    });

    it('stops the comparison when the consumer declares nothing it could match', async () => {
      const report = await compare([], consumer);

      expect(report.repeatedRules).toStrictEqual([]);
      expect(report.unsortableLabels).not.toStrictEqual([]);
    });
  });
});

// region | Helpers

/** Runs one comparison over a single TypeScript path, to which every case above scopes its config. */
async function compare(sharedElements: Linter.Config[], consumerElements: Linter.Config[]) {
  return findRepeatedRules({ consumerElements, cwd: process.cwd(), filePaths: FILE_PATHS, sharedElements });
}

// endregion | Helpers
