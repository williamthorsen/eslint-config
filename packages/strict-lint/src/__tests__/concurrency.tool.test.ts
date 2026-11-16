import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createTempTree, type TempTree } from '@williamthorsen/toolbelt.testing/candidate';
import { describe, expect, it } from 'vitest';

// Concurrency runs the lint in worker threads, which receive the ESLint options through `structuredClone`. Only a
// subprocess exercises that: The threads are real, and a plugin object anywhere in the options fails the clone.

const CLI_PATH = fileURLToPath(new URL('../bin/strict-lint.ts', import.meta.url));
const ROOT_MARKER = 'pnpm-workspace.yaml';
const FILE_COUNT = 6;

describe('concurrency (subprocess)', () => {
  it('reports what a single-threaded run reports', () => {
    using tree = makeFixture();

    expect(reportOf(tree.dir, '2')).toStrictEqual(reportOf(tree.dir, 'off'));
  }, 30_000);

  it('accepts an automatic worker count', () => {
    using tree = makeFixture();

    expect(reportOf(tree.dir, 'auto')).toStrictEqual(reportOf(tree.dir, 'off'));
  }, 30_000);

  it('promotes warnings in a worker exactly as it does in the main thread', () => {
    using tree = makeFixture();

    const severities = reportOf(tree.dir, '2').flatMap((result) => result.severities);

    expect(severities).toStrictEqual(Array.from({ length: FILE_COUNT }, () => 2));
  }, 30_000);

  it('honours a ceiling in a worker, leaving the capped rule a warning', () => {
    using tree = makeFixture({
      '.config/strict-lint.config.ts': "export default { maxSeverity: { 'no-unused-vars': 'warn' } };\n",
    });

    const severities = reportOf(tree.dir, '2').flatMap((result) => result.severities);

    expect(severities).toStrictEqual(Array.from({ length: FILE_COUNT }, () => 1));
  }, 30_000);

  it('runs without the clone error that a plugin-bearing config once caused', () => {
    // The config declares a plugin, whose rule functions cannot cross a worker thread.
    using tree = makeFixture({
      'eslint.config.ts':
        "export default [{ plugins: { demo: { rules: { noop: { create: () => ({}) } } } }, rules: { 'no-unused-vars': 'warn' } }];\n",
    });

    const { status, stderr } = runCli(tree.dir, ['--concurrency', '2', '--format', 'json', '.']);

    expect(stderr).not.toContain('cannot be cloned');
    expect(status).toBe(1);
  }, 30_000);
});

// region | Helpers

/** Writes a flat project with enough files that a worker count above one engages. */
function makeFixture(extraFiles: Record<string, string> = {}): TempTree {
  const sources = Object.fromEntries(
    Array.from({ length: FILE_COUNT }, (_, index) => [`f${String(index)}.js`, `const unused${String(index)} = 1;\n`]),
  );
  return writeFixture({
    'eslint.config.ts': "export default [{ rules: { 'no-unused-vars': 'warn' } }];\n",
    ...sources,
    ...extraFiles,
  });
}

/** Runs the CLI and returns its report, reduced to what a worker could get wrong and sorted for comparison. */
function reportOf(cwd: string, concurrency: string): ComparableResult[] {
  const { stdout, stderr } = runCli(cwd, ['--concurrency', concurrency, '--format', 'json', '.']);
  const output = stdout || stderr;
  const parsed: unknown = JSON.parse(output);
  if (!Array.isArray(parsed)) {
    throw new TypeError(`Expected a JSON report, got: ${output}`);
  }
  return parsed
    .map((result: ReportedResult) => ({
      file: path.basename(result.filePath),
      ruleIds: result.messages.map((message) => message.ruleId),
      severities: result.messages.map((message) => message.severity),
    }))
    .filter((result) => result.ruleIds.length > 0)
    .toSorted((a, b) => a.file.localeCompare(b.file));
}

/** Runs the CLI source under a plain `node` subprocess against the fixture directory. */
function runCli(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], { cwd, encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** Writes the given files into a fresh temp tree with a project-root marker. */
function writeFixture(files: Record<string, string>): TempTree {
  return createTempTree({ [ROOT_MARKER]: '', ...files }, { prefix: 'strict-lint-conc-' });
}

/** One result, reduced to the fields on which a concurrency comparison depends. */
interface ComparableResult {
  file: string;
  ruleIds: Array<string | null>;
  severities: number[];
}

/** The shape that the JSON formatter emits, narrowed to the fields that these tests read. */
interface ReportedResult {
  filePath: string;
  messages: Array<{ ruleId: string | null; severity: number }>;
}

// endregion | Helpers
