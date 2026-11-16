import type { ESLint } from 'eslint';

/** Builds a lint result whose counts default to zero, so that a test states only the fields that it asserts against. */
export function buildResult(overrides: Partial<ESLint.LintResult> = {}): ESLint.LintResult {
  return {
    errorCount: 0,
    fatalErrorCount: 0,
    filePath: '/project/a.ts',
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    messages: [],
    suppressedMessages: [],
    usedDeprecatedRules: [],
    warningCount: 0,
    ...overrides,
  };
}
