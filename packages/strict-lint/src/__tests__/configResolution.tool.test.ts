import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { afterAll, describe, expect, it } from 'vitest';

// The defect covered here is a divergence between `strict-lint` and `eslint` over which config governs a file, so
// each case runs both against one fixture and compares what they report. strict-lint runs as a subprocess, the way it
// ships; ESLint runs in process, where its own resolution is the reference the CLI has to match.

const CLI_PATH = fileURLToPath(new URL('../bin/strict-lint.ts', import.meta.url));
const ROOT_MARKER = 'pnpm-workspace.yaml';
const TARGET = 'packages/pkg/a.js';

const createdDirs: string[] = [];

describe('config resolution (subprocess)', () => {
  afterAll(() => {
    for (const dir of createdDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports the rules eslint reports for a package carrying its own config', async () => {
    const dir = makeMonorepoFixture();

    const [reported, reference] = [ruleIdsFromStrictLint(dir), await ruleIdsFromEslint(dir)];

    expect(reported).toStrictEqual(reference);
  }, 30_000);

  it('applies the package config rather than the root config, run from the repo root', () => {
    const dir = makeMonorepoFixture();

    // The package turns `no-unused-vars` off and `no-console` on; the root config does neither.
    expect(ruleIdsFromStrictLint(dir)).toStrictEqual(['no-console']);
  }, 30_000);

  it('promotes the package config warning to an error', () => {
    const dir = makeMonorepoFixture();

    const [result] = reportFromStrictLint(dir);

    expect(result?.messages[0]?.severity).toBe(2);
  }, 30_000);

  it('falls back to the root config for a file no nearer config governs', () => {
    const dir = makeMonorepoFixture({ 'a.js': "const unused = 1;\nconsole.log('hi');\n" });

    const results = reportFromStrictLint(dir, 'a.js');

    // No config sits beside this file, so the root's `no-unused-vars` governs and `no-console` stays unset.
    expect(results[0]?.messages.map((message) => message.ruleId)).toStrictEqual(['no-unused-vars']);
  }, 30_000);
});

// region | Helpers

/** A monorepo whose package config contradicts the root config, which is what makes the divergence observable. */
function makeMonorepoFixture(extraFiles: Record<string, string> = {}): string {
  return makeFixture({
    'eslint.config.ts': "export default [{ rules: { 'no-unused-vars': 'warn' } }];\n",
    'packages/pkg/eslint.config.ts': "export default [{ rules: { 'no-unused-vars': 'off', 'no-console': 'warn' } }];\n",
    [TARGET]: "const unused = 1;\nconsole.log('hi');\n",
    ...extraFiles,
  });
}

/** Write the given files into a fresh temp directory carrying a project-root marker, and return its path. */
function makeFixture(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strict-lint-cfg-'));
  createdDirs.push(dir);
  const entries = Object.entries({ [ROOT_MARKER]: '', ...files });
  for (const [name, content] of entries) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return dir;
}

/** The results strict-lint reports, read from its JSON formatter output. */
function reportFromStrictLint(cwd: string, target: string = TARGET): ReportedResult[] {
  const { stdout, stderr } = spawnSync(process.execPath, [CLI_PATH, '--format', 'json', target], {
    cwd,
    encoding: 'utf8',
  });
  const output = stdout || stderr;
  const parsed: unknown = JSON.parse(output);
  if (!Array.isArray(parsed)) {
    throw new TypeError(`Expected a JSON report, got: ${output}`);
  }
  return parsed.map((result: ReportedResult) => ({
    filePath: result.filePath,
    messages: result.messages.map((message) => ({ ruleId: message.ruleId, severity: message.severity })),
  }));
}

/** The shape the JSON formatter emits, narrowed to the fields these tests read. */
interface ReportedResult {
  filePath: string;
  messages: Array<{ ruleId: string | null; severity: number }>;
}

/** The rules ESLint itself reports, which is the reference strict-lint has to match. */
async function ruleIdsFromEslint(cwd: string): Promise<Array<string | null>> {
  const results = await new ESLint({ cwd }).lintFiles([TARGET]);
  return results.flatMap((result) => result.messages.map((message) => message.ruleId));
}

/** The rules strict-lint reports, in the same shape the ESLint reference produces. */
function ruleIdsFromStrictLint(cwd: string): Array<string | null> {
  return reportFromStrictLint(cwd).flatMap((result) => result.messages.map((message) => message.ruleId));
}

// endregion | Helpers
