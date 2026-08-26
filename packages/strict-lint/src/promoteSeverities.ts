import type { ESLint, Linter } from 'eslint';

import { allowsPromotion } from './common/severity.ts';
import type { CeilingResolver } from './createCeilingResolver.ts';
import type { MaxSeverityMap } from './types.ts';

/** The severities a reported problem can carry. A rule that is off reports nothing, so `0` never reaches a message. */
type ReportedSeverity = Linter.LintMessage['severity'];

const WARNING = 1;
const ERROR = 2;

/**
 * Rewrites every warning into an error where the linted file's ceilings allow it, recomputing the counts ESLint
 * derived from the pre-promotion severities. This runs across the whole array `lintFiles` returns rather than per
 * freshly linted file, so a result served from `--cache` is promoted exactly like one linted just now.
 */
export async function promoteSeverities(
  results: ESLint.LintResult[],
  resolver: CeilingResolver,
): Promise<ESLint.LintResult[]> {
  return Promise.all(results.map(async (result) => promoteResult(result, await resolver.resolveFor(result.filePath))));
}

// region | Helpers

function countBySeverity(messages: ReadonlyArray<Linter.LintMessage>, severity: ReportedSeverity): number {
  return messages.filter((message) => message.severity === severity).length;
}

function countFixableBySeverity(messages: ReadonlyArray<Linter.LintMessage>, severity: ReportedSeverity): number {
  return messages.filter((message) => message.severity === severity && message.fix !== undefined).length;
}

/**
 * Promotes one result's messages and restates its counts. `output` is left alone: a fix is independent of the
 * severity that reported it, and `ESLint.outputFixes` reads that field to write files.
 */
function promoteResult(result: ESLint.LintResult, ceilings: MaxSeverityMap): ESLint.LintResult {
  const messages = result.messages.map((message) => ({
    ...message,
    severity: resolvePromotedSeverity(message, ceilings),
  }));
  const suppressedMessages = result.suppressedMessages.map((message) => ({
    ...message,
    severity: resolvePromotedSeverity(message, ceilings),
  }));

  return {
    ...result,
    messages,
    suppressedMessages,
    errorCount: countBySeverity(messages, ERROR),
    warningCount: countBySeverity(messages, WARNING),
    fixableErrorCount: countFixableBySeverity(messages, ERROR),
    fixableWarningCount: countFixableBySeverity(messages, WARNING),
  };
}

/**
 * The severity a message carries once promotion has run: `error` where it is a warning no ceiling caps, and its
 * original severity otherwise. A message naming no rule keeps its severity, because `maxSeverity` is keyed by rule
 * name and promoting one would raise an error no ceiling could ever exempt. ESLint reports both the ignored-file
 * notice and the unused `eslint-disable` directive that way.
 */
function resolvePromotedSeverity(
  message: Pick<Linter.LintMessage, 'ruleId' | 'severity'>,
  ceilings: MaxSeverityMap,
): ReportedSeverity {
  if (message.severity !== WARNING || message.ruleId === null) {
    return message.severity;
  }
  return allowsPromotion(ceilings[message.ruleId]) ? ERROR : WARNING;
}

// endregion | Helpers
