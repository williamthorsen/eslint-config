import type { ESLint, Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import type { CeilingResolver } from '../createCeilingResolver.ts';
import { promoteSeverities } from '../promoteSeverities.ts';
import type { MaxSeverityMap } from '../types.ts';

describe(promoteSeverities, () => {
  it('promotes a warning no ceiling caps', async () => {
    const results = [buildResult({ messages: [buildMessage({ ruleId: 'some-rule', severity: 1 })] })];

    const [promoted] = await promoteSeverities(results, resolverOf({}));

    expect(promoted?.messages[0]?.severity).toBe(2);
  });

  it('leaves a warning whose ceiling sits below error', async () => {
    const results = [buildResult({ messages: [buildMessage({ ruleId: 'some-rule', severity: 1 })] })];

    const [promoted] = await promoteSeverities(results, resolverOf({ 'some-rule': 'warn' }));

    expect(promoted?.messages[0]?.severity).toBe(1);
  });

  it('leaves a severity the config already set to error', async () => {
    const results = [buildResult({ messages: [buildMessage({ ruleId: 'some-rule', severity: 2 })] })];

    const [promoted] = await promoteSeverities(results, resolverOf({ 'some-rule': 'warn' }));

    expect(promoted?.messages[0]?.severity).toBe(2);
  });

  it('promotes a warning reporting no rule, which no ceiling can name', async () => {
    // An unused-directive report carries `ruleId: null`, so there is no key a ceiling could match.
    const results = [buildResult({ messages: [buildMessage({ ruleId: null, severity: 1 })] })];

    const [promoted] = await promoteSeverities(results, resolverOf({ 'some-rule': 'warn' }));

    expect(promoted?.messages[0]?.severity).toBe(2);
  });

  it('restates the error and warning counts from the promoted messages', async () => {
    const results = [
      buildResult({
        errorCount: 0,
        warningCount: 2,
        messages: [
          buildMessage({ ruleId: 'promoted-rule', severity: 1 }),
          buildMessage({ ruleId: 'capped-rule', severity: 1 }),
        ],
      }),
    ];

    const [promoted] = await promoteSeverities(results, resolverOf({ 'capped-rule': 'warn' }));

    expect(promoted).toMatchObject({ errorCount: 1, warningCount: 1 });
  });

  it('restates the fixable counts, so a promoted fixable warning counts as a fixable error', async () => {
    const results = [
      buildResult({
        fixableErrorCount: 0,
        fixableWarningCount: 1,
        warningCount: 1,
        messages: [buildMessage({ ruleId: 'some-rule', severity: 1, fix: { range: [0, 1], text: '' } })],
      }),
    ];

    const [promoted] = await promoteSeverities(results, resolverOf({}));

    expect(promoted).toMatchObject({ fixableErrorCount: 1, fixableWarningCount: 0 });
  });

  it('leaves the fatal error count alone, since promotion creates no fatal error', async () => {
    const results = [
      buildResult({ fatalErrorCount: 1, messages: [buildMessage({ ruleId: null, severity: 2, fatal: true })] }),
    ];

    const [promoted] = await promoteSeverities(results, resolverOf({}));

    expect(promoted?.fatalErrorCount).toBe(1);
  });

  it('promotes suppressed messages, so a formatter reporting them agrees with the rest', async () => {
    const results = [
      buildResult({
        suppressedMessages: [
          {
            ...buildMessage({ ruleId: 'some-rule', severity: 1 }),
            suppressions: [{ kind: 'directive', justification: '' }],
          },
        ],
      }),
    ];

    const [promoted] = await promoteSeverities(results, resolverOf({}));

    expect(promoted?.suppressedMessages[0]?.severity).toBe(2);
  });

  it('leaves the fix output untouched, which ESLint.outputFixes writes to disk', async () => {
    const results = [buildResult({ output: 'fixed source' })];

    const [promoted] = await promoteSeverities(results, resolverOf({}));

    expect(promoted?.output).toBe('fixed source');
  });

  it('applies the ceilings that govern each result file', async () => {
    const results = [
      buildResult({ filePath: '/project/one/a.ts', messages: [buildMessage({ ruleId: 'some-rule', severity: 1 })] }),
      buildResult({ filePath: '/project/two/a.ts', messages: [buildMessage({ ruleId: 'some-rule', severity: 1 })] }),
    ];
    const resolver = buildResolver((filePath) => (filePath === '/project/one/a.ts' ? { 'some-rule': 'warn' } : {}));

    const [first, second] = await promoteSeverities(results, resolver);

    expect(first?.messages[0]?.severity).toBe(1);
    expect(second?.messages[0]?.severity).toBe(2);
  });
});

// region | Helpers

/** A lint message carrying the fields promotion reads, with the rest filled in to satisfy ESLint's shape. */
function buildMessage(overrides: Partial<Linter.LintMessage> = {}): Linter.LintMessage {
  return { column: 1, line: 1, message: 'a problem', ruleId: null, severity: 1, ...overrides };
}

/** A lint result whose counts default to zero, so a test states only the fields it asserts against. */
function buildResult(overrides: Partial<ESLint.LintResult> = {}): ESLint.LintResult {
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

/** A resolver deriving each file's ceilings from its path. */
function buildResolver(ceilingsFor: (filePath: string) => MaxSeverityMap): CeilingResolver {
  return {
    getCascades: () => new Map(),
    resolveFor: (filePath) => Promise.resolve(ceilingsFor(filePath)),
  };
}

/** A resolver returning one set of ceilings for every file. */
function resolverOf(ceilings: MaxSeverityMap): CeilingResolver {
  return buildResolver(() => ceilings);
}

// endregion | Helpers
