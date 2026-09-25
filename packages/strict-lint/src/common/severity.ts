import type { Linter } from 'eslint';

/**
 * Every severity that ESLint accepts, in the order in which diagnostics list them. The type guard and the diagnostic
 * text both read this list, so a message never lists a value that the guard rejects.
 */
const RULE_SEVERITIES: readonly Linter.RuleSeverity[] = ['off', 'warn', 'error', 0, 1, 2];

const RULE_SEVERITY_SET: ReadonlySet<unknown> = new Set(RULE_SEVERITIES);

/** Checks whether a value is a severity that ESLint accepts. */
export function isRuleSeverity(value: unknown): value is Linter.RuleSeverity {
  return RULE_SEVERITY_SET.has(value);
}

/** The ceilings that permit promotion to `error`; every other severity caps its rule below `error`. */
const PROMOTING_CEILINGS: ReadonlySet<Linter.RuleSeverity> = new Set<Linter.RuleSeverity>(['error', 2]);

/**
 * Checks whether a `maxSeverity` ceiling lets strict-lint promote its rule to an error. An absent ceiling and an
 * `error` ceiling give the same answer, so callers never have to distinguish "unlisted" from "listed at the top
 * severity".
 */
export function allowsPromotion(ceiling: Linter.RuleSeverity | undefined): boolean {
  return ceiling === undefined || PROMOTING_CEILINGS.has(ceiling);
}

const SEVERITY_NUMBERS: Record<'error' | 'off' | 'warn', 0 | 1 | 2> = { error: 2, off: 0, warn: 1 };

/** Converts a severity to its numeric form, so that `'error'` and `2` compare as one value. */
export function toSeverityNumber(severity: Linter.RuleSeverity): 0 | 1 | 2 {
  return typeof severity === 'number' ? severity : SEVERITY_NUMBERS[severity];
}

/** Renders the accepted vocabulary for a diagnostic, as `"off", "warn", "error", 0, 1, or 2`. */
export function formatRuleSeverities(): string {
  const rendered = RULE_SEVERITIES.map((severity) => (typeof severity === 'string' ? `"${severity}"` : severity));
  return `${rendered.slice(0, -1).join(', ')}, or ${String(rendered.at(-1))}`;
}
