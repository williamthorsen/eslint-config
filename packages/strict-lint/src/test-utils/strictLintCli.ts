import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI_PATH = fileURLToPath(new URL('../bin/strict-lint.ts', import.meta.url));

/** The outcome of one CLI run. */
export interface CliRun {
  status: number | null;
  stderr: string;
  stdout: string;
}

/** The shape that the JSON formatter emits, narrowed to the fields that the tests read. */
export interface ReportedResult {
  filePath: string;
  messages: Array<{ ruleId: string | null; severity: number }>;
}

/** Parses the JSON report of a run made with `--format json`, keeping only the fields of `ReportedResult`. */
export function readJsonReport(run: CliRun): ReportedResult[] {
  const output = run.stdout || run.stderr;
  const parsed: unknown = JSON.parse(output);
  if (!Array.isArray(parsed)) {
    throw new TypeError(`Expected a JSON report, got: ${output}`);
  }
  return parsed.map((result: ReportedResult) => ({
    filePath: result.filePath,
    messages: result.messages.map((message) => ({ ruleId: message.ruleId, severity: message.severity })),
  }));
}

/** Runs the CLI source under a plain `node` subprocess, as consumers run it, from `cwd`. */
export function runCli(cwd: string, args: string[]): CliRun {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], { cwd, encoding: 'utf8' });
  return { status: result.status, stderr: result.stderr, stdout: result.stdout };
}
